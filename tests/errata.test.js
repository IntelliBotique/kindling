// v0.1.1 errata: the optional fields and rules added so the text and the schemas agree.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import * as cheerio from 'cheerio';
import { validateDocument, warningsFor } from '../tools/validator/bin/cli.js';
import { buildParsedProfile, hasNoindex, provenance } from '../tools/parser/bin/cli.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SCHEMAS_DIR = join(ROOT, 'schemas');
const BASE = 'https://protocol.kindling.foundation/schemas/';

let ajv;
const check = (name, data) => ajv.getSchema(`${BASE}${name}.schema.json`)(data);
const example = (rel) => JSON.parse(readFileSync(join(ROOT, 'examples', rel), 'utf8'));

const PROFILE = {
  schema_version: '0.1',
  profile_url: 'https://noor.example/about',
  display_name: 'Noor',
  parsed_at: '2026-10-01T09:00:00Z',
};

beforeAll(() => {
  ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  for (const f of readdirSync(SCHEMAS_DIR).filter((x) => x.endsWith('.json'))) {
    ajv.addSchema(JSON.parse(readFileSync(join(SCHEMAS_DIR, f), 'utf8')));
  }
});

describe('extraction_source (SPEC §2.3, erratum 2)', () => {
  it('accepts h-card, inferred and owner-declared', () => {
    const data = {
      ...PROFILE,
      about: 'Illustrator.',
      extraction_source: { display_name: 'h-card', about: 'inferred', pronouns: 'owner-declared' },
    };
    expect(check('parsed_profile', data)).toBe(true);
  });
  it('rejects any other value', () => {
    expect(check('parsed_profile', { ...PROFILE, extraction_source: { about: 'guessed' } })).toBe(
      false,
    );
  });
  it('rejects a key that is not a field name', () => {
    expect(
      check('parsed_profile', { ...PROFILE, extraction_source: { 'About Me': 'inferred' } }),
    ).toBe(false);
  });
});

describe('handshake_window_days (SPEC §5.2, erratum 3)', () => {
  it('is optional and must be a whole number of days, at least 1', () => {
    const pool = example('pools/queer-creatives-la.json');
    expect(check('pool_manifest', { ...pool, handshake_window_days: 30 })).toBe(true);
    expect(check('pool_manifest', { ...pool, handshake_window_days: 0 })).toBe(false);
    expect(check('pool_manifest', { ...pool, handshake_window_days: 2.5 })).toBe(false);
  });
});

describe('noindex in a Pool entry (SPEC §2.7, erratum 5)', () => {
  const withNoindex = (value) => {
    const pool = example('pools/queer-creatives-la.json');
    pool.entries[0].parsed_profile.kindling_noindex = value;
    return pool;
  };
  it('rejects an entry whose parsed profile sets kindling_noindex', () => {
    expect(check('pool_manifest', withNoindex(true))).toBe(false);
    const result = validateDocument(withNoindex(true), 'pool');
    expect(result.errors.join(' ')).toContain('kindling_noindex');
  });
  it('accepts kindling_noindex: false', () => {
    expect(check('pool_manifest', withNoindex(false))).toBe(true);
  });
  it('a parsed profile on its own may still carry it, so a Pool can refuse', () => {
    expect(check('parsed_profile', { ...PROFILE, kindling_noindex: true })).toBe(true);
  });
});

describe('curator_contact in the well-known file (SPEC §10.2, erratum 8)', () => {
  it('is accepted, and its absence is a warning, not a failure', () => {
    const wk = example('well-known-example.json');
    expect(check('well_known_pool', wk)).toBe(true);
    delete wk.pools[0].curator_contact;
    const result = validateDocument(wk, 'wellknown');
    expect(result.valid).toBe(true);
    expect(result.warnings[0]).toContain('curator_contact');
  });
});

describe('Pool entries without a parse (SPEC §3.4, erratum 10)', () => {
  it('validate, with a warning per missing field', () => {
    const pool = example('pools/neurodivergent-friendships.json');
    const result = validateDocument(pool, 'pool');
    expect(result.valid).toBe(true);
    expect(warningsFor(pool, 'pool')).toHaveLength(4);
  });
  it('a fully parsed Pool has no warnings', () => {
    expect(validateDocument(example('pools/queer-creatives-la.json'), 'pool').warnings).toEqual([]);
  });
});

describe('kindling-parse (SPEC §2.3 and §2.7)', () => {
  it('records where each present field came from', () => {
    const fields = { display_name: 'Noor', about: 'Illustrator.', photo_hints: [] };
    expect(provenance(fields, 'inferred')).toEqual({ display_name: 'inferred', about: 'inferred' });
    const profile = buildParsedProfile('https://noor.example', fields, { source: 'inferred' });
    expect(profile.extraction_source).toEqual({ display_name: 'inferred', about: 'inferred' });
    expect(check('parsed_profile', profile)).toBe(true);
  });
  it('finds a noindex directive and records it', () => {
    expect(hasNoindex(cheerio.load('<div class="h-card kindling-noindex"></div>'))).toBe(true);
    expect(hasNoindex(cheerio.load('<meta name="kindling" content="noindex">'))).toBe(true);
    expect(hasNoindex(cheerio.load('<meta name="robots" content="kindling-noindex">'))).toBe(true);
    expect(hasNoindex(cheerio.load('<meta name="robots" content="noindex">'))).toBe(false);
    const profile = buildParsedProfile(
      'https://noor.example',
      { display_name: 'Noor' },
      { noindex: true },
    );
    expect(profile.kindling_noindex).toBe(true);
    expect(check('parsed_profile', profile)).toBe(true);
  });
});

describe('Every example still validates', () => {
  for (const rel of [
    'pools/queer-creatives-la.json',
    'pools/neurodivergent-friendships.json',
    'pools/polyam-dating-bay-area.json',
  ]) {
    it(rel, () => expect(validateDocument(example(rel), 'pool').valid).toBe(true));
  }
});
