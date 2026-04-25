#!/usr/bin/env node
/**
 * kindling-validate
 *
 * Validates a Kindling Pool manifest, profile, handshake, message, well-known
 * file, or block list against the v0.1 JSON schemas.
 *
 * Usage:
 *   kindling-validate <url-or-file> [--type pool|profile|handshake|message|wellknown|blocklist]
 */

import { readFileSync, existsSync } from 'node:fs';
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

function inferType(doc) {
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

      const ajv = new Ajv({ allErrors: true, strict: false });
      addFormats(ajv);
      loadAllSchemas(ajv);

      const schema = loadSchema(type);
      const validate = ajv.getSchema(schema.$id);
      if (!validate) {
        console.error(`Error: schema ${schema.$id} failed to register.`);
        process.exit(2);
      }
      const valid = validate(doc);

      if (valid) {
        console.log(`OK: ${source} is a valid ${type} document.`);
        process.exit(0);
      } else {
        console.error(`INVALID: ${source} failed ${type} validation.`);
        for (const err of validate.errors || []) {
          console.error(`  - ${err.instancePath || '/'} ${err.message}`);
        }
        process.exit(1);
      }
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(2);
    }
  });

program.parse();
