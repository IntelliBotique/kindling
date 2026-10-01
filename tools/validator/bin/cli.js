#!/usr/bin/env node
/**
 * kindling-validate
 *
 * Validates a Kindling Pool manifest, profile, handshake, message, well-known
 * file, or block list against the v0.1 JSON schemas.
 *
 * It also warns, without failing, where the spec says SHOULD: a Pool entry
 * without parsed_profile or parsed_at once parsed (SPEC §3.4), and a
 * well-known entry without curator_contact (SPEC §10.2).
 *
 * Usage:
 *   kindling-validate <url-or-file> [--type pool|profile|handshake|message|wellknown|blocklist]
 */

import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = resolvePath(__dirname, '../../../schemas');

const SCHEMA_FILES = {
  pool: 'pool_manifest.schema.json',
  profile: 'parsed_profile.schema.json',
  handshake: 'handshake_message.schema.json',
  message: 'kindling_message.schema.json',
  wellknown: 'well_known_pool.schema.json',
  blocklist: 'block_list.schema.json',
};

function loadSchema(type) {
  const file = SCHEMA_FILES[type];
  if (!file) throw new Error(`Unknown schema type: ${type}`);
  return JSON.parse(readFileSync(resolvePath(SCHEMAS_DIR, file), 'utf8'));
}

function loadAllSchemas(ajv) {
  for (const file of Object.values(SCHEMA_FILES)) {
    const schema = JSON.parse(readFileSync(resolvePath(SCHEMAS_DIR, file), 'utf8'));
    ajv.addSchema(schema);
  }
}

async function loadDocument(source) {
  if (existsSync(source)) {
    return JSON.parse(readFileSync(source, 'utf8'));
  }
  const res = await fetch(source);
  if (!res.ok) throw new Error(`Failed to fetch ${source}: ${res.status}`);
  return res.json();
}

/** SHOULD-level findings: reported as warnings, never as failures. */
export function warningsFor(doc, type) {
  const out = [];
  if (type === 'pool') {
    (doc.entries || []).forEach((entry, i) => {
      for (const field of ['parsed_profile', 'parsed_at']) {
        if (!(field in entry)) {
          out.push(
            `/entries/${i} has no ${field} (SPEC §3.4: SHOULD be present once the profile is parsed)`,
          );
        }
      }
    });
  }
  if (type === 'wellknown') {
    (doc.pools || []).forEach((pool, i) => {
      if (!pool.curator_contact)
        out.push(`/pools/${i} has no curator_contact (SPEC §10.2: SHOULD)`);
    });
  }
  return out;
}

/** A plain-language line for a schema error. */
export function describeError(err) {
  if (err.keyword === 'not' && /^\/entries\/\d+$/.test(err.instancePath)) {
    return `${err.instancePath} holds a parsed profile with kindling_noindex: true, which a Pool entry may not (SPEC §2.7)`;
  }
  return `${err.instancePath || '/'} ${err.message}`;
}

/** Validate a document of a known type. Returns { valid, errors, warnings }. */
export function validateDocument(doc, type) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  loadAllSchemas(ajv);
  const validate = ajv.getSchema(loadSchema(type).$id);
  if (!validate) throw new Error(`schema for ${type} failed to register`);
  const valid = validate(doc);
  return {
    valid,
    errors: valid ? [] : (validate.errors || []).map(describeError),
    warnings: valid ? warningsFor(doc, type) : [],
  };
}

export function inferType(doc) {
  if (doc?.entries && doc?.curator) return 'pool';
  if (doc?.profile_url && doc?.display_name) return 'profile';
  if (doc?.type === 'handshake-request' || doc?.type === 'handshake-response') return 'handshake';
  if (doc?.message_id && doc?.sender && doc?.recipient) return 'message';
  if (doc?.pools && Array.isArray(doc.pools)) return 'wellknown';
  if (doc?.list_id && doc?.entries) return 'blocklist';
  return null;
}

const program = new Command();
program
  .name('kindling-validate')
  .description('Validate Kindling documents against the v0.1 JSON schemas')
  .argument('<source>', 'URL or local file path to validate')
  .option('-t, --type <type>', 'Document type (auto-inferred if omitted)')
  .action(async (source, options) => {
    try {
      const doc = await loadDocument(source);
      const type = options.type || inferType(doc);
      if (!type) {
        console.error('Could not infer document type. Pass --type explicitly.');
        process.exit(2);
      }
      if (!SCHEMA_FILES[type]) {
        console.error(`Unknown type: ${type}. Valid: ${Object.keys(SCHEMA_FILES).join(', ')}`);
        process.exit(2);
      }

      const { valid, errors, warnings } = validateDocument(doc, type);
      if (valid) {
        console.log(`OK: ${source} is a valid ${type} document.`);
        for (const w of warnings) console.warn(`  warning: ${w}`);
        process.exit(0);
      } else {
        console.error(`INVALID: ${source} failed ${type} validation.`);
        for (const e of errors) console.error(`  - ${e}`);
        process.exit(1);
      }
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(2);
    }
  });

function isMain() {
  try {
    return realpathSync(process.argv[1] || '') === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMain()) program.parse();
