import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SCHEMAS_DIR = resolve(ROOT, 'schemas');
const EXAMPLES_DIR = resolve(ROOT, 'examples');

const SCHEMA_FILES = [
  'parsed_profile.schema.json',
  'pool_manifest.schema.json',
  'handshake_message.schema.json',
  'kindling_message.schema.json',
  'well_known_pool.schema.json',
  'block_list.schema.json',
];

function loadSchema(name) {
  return JSON.parse(readFileSync(resolve(SCHEMAS_DIR, name), 'utf8'));
}

function loadExample(relative) {
  return JSON.parse(readFileSync(resolve(EXAMPLES_DIR, relative), 'utf8'));
}

function buildValidators() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  for (const file of readdirSync(SCHEMAS_DIR).filter((f) => f.endsWith('.json'))) {
    ajv.addSchema(loadSchema(file));
  }
  const byFile = {};
  for (const file of SCHEMA_FILES) {
    const schema = loadSchema(file);
    byFile[file] = ajv.getSchema(schema.$id);
    if (!byFile[file]) {
      throw new Error(`No compiled schema for ${file} (id: ${schema.$id})`);
    }
  }
  return byFile;
}

describe('JSON Schemas compile', () => {
  it('all schemas register and compile without errors', () => {
    expect(() => buildValidators()).not.toThrow();
  });

  for (const file of SCHEMA_FILES) {
    it(`${file} has a $id and $schema`, () => {
      const schema = loadSchema(file);
      expect(schema.$id).toBeTypeOf('string');
      expect(schema.$schema).toBeTypeOf('string');
    });
  }
});

describe('Example files validate against their schemas', () => {
  let v;
  beforeAll(() => {
    v = buildValidators();
  });

  function assertValid(validator, data) {
    const ok = validator(data);
    if (!ok) {
      // Surface errors on failure to make debugging easy.
      console.error(JSON.stringify(validator.errors, null, 2));
    }
    expect(ok).toBe(true);
  }

  it('pool_manifest: queer-creatives-la', () => {
    assertValid(v['pool_manifest.schema.json'], loadExample('pools/queer-creatives-la.json'));
  });

  it('pool_manifest: neurodivergent-friendships', () => {
    assertValid(
      v['pool_manifest.schema.json'],
      loadExample('pools/neurodivergent-friendships.json'),
    );
  });

  it('pool_manifest: polyam-dating-bay-area', () => {
    assertValid(v['pool_manifest.schema.json'], loadExample('pools/polyam-dating-bay-area.json'));
  });

  it('well_known_pool: well-known-example', () => {
    assertValid(v['well_known_pool.schema.json'], loadExample('well-known-example.json'));
  });

  it('block_list: blocklist-example', () => {
    assertValid(v['block_list.schema.json'], loadExample('blocklist-example.json'));
  });
});

describe('Inline fixtures validate for schemas without example files', () => {
  let v;
  beforeAll(() => {
    v = buildValidators();
  });

  it('parsed_profile: minimal valid shape', () => {
    const data = {
      schema_version: '0.1',
      profile_url: 'https://sarah.example.com/about',
      display_name: 'Sarah',
      parsed_at: '2026-04-22T09:30:00Z',
      pronouns: 'she/her',
      location: { city: 'Oakland', region: 'California' },
      intent_tags: ['friendship', 'hiking'],
      about: 'Designer, hiker, reader. Looking for people who walk slowly.',
      contact_methods: [{ type: 'email', value: 'sarah@example.com' }],
      verification: { level: 'email', verified_at: '2026-04-22T09:00:00Z' },
      messaging_preferences: { accept_from: 'verified', no_cold_messages: false },
    };
    const ok = v['parsed_profile.schema.json'](data);
    if (!ok) console.error(v['parsed_profile.schema.json'].errors);
    expect(ok).toBe(true);
  });

  it('handshake_message: request shape', () => {
    const data = {
      schema_version: '0.1',
      type: 'handshake-request',
      handshake_id: 'f4c1b2d3-7e8a-4b5c-9d1e-2f3a4b5c6d7e',
      pool: {
        url: 'https://example.com/pools/queer-creatives-la.json',
        name: 'Queer Creatives in LA',
        charter: 'A Pool for queer creative folks in LA wanting more friends.',
        curator_identity: 'mira@example.com',
        curator_verification: 'email',
        intent_tags: ['friendship', 'queer'],
        visibility: 'public',
      },
      profile_url: 'https://sarah.example.com/about',
      sent_at: '2026-04-22T09:00:00Z',
      expires_at: '2026-05-06T09:00:00Z',
      accept_url: 'https://example.com/handshake/accept/abc',
      decline_url: 'https://example.com/handshake/decline/abc',
    };
    const ok = v['handshake_message.schema.json'](data);
    if (!ok) console.error(v['handshake_message.schema.json'].errors);
    expect(ok).toBe(true);
  });

  it('handshake_message: response shape', () => {
    const data = {
      schema_version: '0.1',
      type: 'handshake-response',
      handshake_id: 'f4c1b2d3-7e8a-4b5c-9d1e-2f3a4b5c6d7e',
      decision: 'accept',
      responded_at: '2026-04-22T10:05:00Z',
      responder_identity: 'sarah@example.com',
    };
    const ok = v['handshake_message.schema.json'](data);
    if (!ok) console.error(v['handshake_message.schema.json'].errors);
    expect(ok).toBe(true);
  });

  it('kindling_message: intro message', () => {
    const data = {
      schema_version: '0.1',
      message_id: 'msg-0001',
      type: 'intro',
      sender: {
        identity: 'sarah@example.com',
        display_name: 'Sarah',
        verification_level: 'email',
      },
      recipient: { identity: 'reza@example.com' },
      via_pool: {
        url: 'https://example.com/pools/queer-creatives-la.json',
        id: 'queer-creatives-la',
        name: 'Queer Creatives in LA',
      },
      sent_at: '2026-04-22T11:00:00Z',
      subject: 'Saw your profile in the Pool',
      body: {
        content_type: 'text/plain',
        content: 'Hi — I noticed we both like slow walks in Griffith Park.',
      },
      transport: { type: 'email' },
    };
    const ok = v['kindling_message.schema.json'](data);
    if (!ok) console.error(v['kindling_message.schema.json'].errors);
    expect(ok).toBe(true);
  });
});

describe('Negative tests reject invalid documents', () => {
  let v;
  beforeAll(() => {
    v = buildValidators();
  });

  it('pool_manifest rejects missing required fields', () => {
    const invalid = { schema_version: '0.1', name: 'Incomplete' };
    expect(v['pool_manifest.schema.json'](invalid)).toBe(false);
    expect(v['pool_manifest.schema.json'].errors).not.toBeNull();
  });

  it('pool_manifest rejects invalid visibility enum', () => {
    const base = loadExample('pools/queer-creatives-la.json');
    const invalid = { ...base, visibility: 'secret' };
    expect(v['pool_manifest.schema.json'](invalid)).toBe(false);
  });

  it('block_list rejects invalid reason_category enum', () => {
    const invalid = {
      schema_version: '0.1',
      list_id: 'test',
      name: 'Test',
      publisher: { identity: 'x@example.com', url: 'https://example.com' },
      version: 1,
      published_at: '2026-04-22T00:00:00Z',
      entries: [
        {
          target_type: 'identity',
          target_identifier: 'bad@example.com',
          reason_category: 'made-up',
          added_at: '2026-04-22T00:00:00Z',
        },
      ],
    };
    expect(v['block_list.schema.json'](invalid)).toBe(false);
  });

  it('parsed_profile rejects more than 5 auto_accept_rules', () => {
    const data = {
      schema_version: '0.1',
      profile_url: 'https://sarah.example.com/about',
      display_name: 'Sarah',
      parsed_at: '2026-04-22T09:30:00Z',
      messaging_preferences: {
        auto_accept_rules: Array(6).fill({ intent_tags: ['friendship'] }),
      },
    };
    expect(v['parsed_profile.schema.json'](data)).toBe(false);
  });
});
