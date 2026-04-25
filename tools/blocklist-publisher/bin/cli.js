#!/usr/bin/env node
/**
 * kindling-blocklist
 *
 * Manage and publish a Kindling shared block list.
 *
 * Subcommands:
 *   init          Create a new block list with metadata
 *   add           Add an entry to an existing block list
 *   remove        Remove an entry by target_identifier
 *   sign          Sign a block list (stub; cryptographic signing reserved for v0.2)
 *   validate      Validate the current block list against the schema
 *
 * Usage:
 *   kindling-blocklist init --file blocklist.json --name "..." --publisher "..." --publisher-url ...
 *   kindling-blocklist add --file blocklist.json --target-type identity --target-identifier ... --reason spam
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolvePath(__dirname, '../../../schemas/block_list.schema.json');

function loadList(file) {
  if (!existsSync(file)) throw new Error(`File not found: ${file}`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

function saveList(file, list) {
  list.published_at = new Date().toISOString();
  list.version = (list.version || 0) + 1;
  writeFileSync(file, JSON.stringify(list, null, 2));
}

const program = new Command();
program.name('kindling-blocklist').description('Manage and publish Kindling shared block lists');

program
  .command('init')
  .requiredOption('-f, --file <path>', 'Output file')
  .requiredOption('--name <name>', 'Block list display name')
  .requiredOption('--list-id <id>', 'Globally-unique list identifier (slug)')
  .requiredOption('--publisher <identity>', "Publisher's Kindling identity")
  .requiredOption('--publisher-url <url>', "Publisher's URL")
  .option('--description <text>', 'Optional human description')
  .action((opts) => {
    if (existsSync(opts.file)) {
      console.error(`Refusing to overwrite ${opts.file}.`);
      process.exit(1);
    }
    const list = {
      schema_version: '0.1',
      list_id: opts.listId,
      name: opts.name,
      ...(opts.description ? { description: opts.description } : {}),
      publisher: { identity: opts.publisher, url: opts.publisherUrl },
      version: 1,
      published_at: new Date().toISOString(),
      entries: [],
    };
    writeFileSync(opts.file, JSON.stringify(list, null, 2));
    console.log(`Initialized empty block list at ${opts.file}.`);
  });

program
  .command('add')
  .requiredOption('-f, --file <path>', 'Block list file')
  .requiredOption('--target-type <type>', 'identity | profile_url | pool_url | curator_identity | implementation')
  .requiredOption('--target-identifier <id>', 'The thing being blocked')
  .requiredOption('--reason <category>', 'spam | harassment | impersonation | consent_violation | scraping | other')
  .option('--detail <text>', 'Optional human-readable detail (avoid PII)')
  .option('--expires <iso>', 'Optional ISO-8601 expiration date')
  .action((opts) => {
    const list = loadList(opts.file);
    list.entries.push({
      target_type: opts.targetType,
      target_identifier: opts.targetIdentifier,
      reason_category: opts.reason,
      ...(opts.detail ? { reason_detail: opts.detail } : {}),
      added_at: new Date().toISOString(),
      ...(opts.expires ? { expires_at: opts.expires } : {}),
    });
    saveList(opts.file, list);
    console.log(`Added entry. Block list ${opts.file} now at version ${list.version}.`);
  });

program
  .command('remove')
  .requiredOption('-f, --file <path>', 'Block list file')
  .requiredOption('--target-identifier <id>', 'Identifier to remove')
  .action((opts) => {
    const list = loadList(opts.file);
    const before = list.entries.length;
    list.entries = list.entries.filter((e) => e.target_identifier !== opts.targetIdentifier);
    if (list.entries.length === before) {
      console.error('No matching entry.');
      process.exit(1);
    }
    saveList(opts.file, list);
    console.log(`Removed entry. Block list ${opts.file} now at version ${list.version}.`);
  });

program
  .command('sign')
  .requiredOption('-f, --file <path>', 'Block list file')
  .action((opts) => {
    // STUB. Cryptographic signing of block lists is reserved for v0.2.
    const list = loadList(opts.file);
    list.signature = {
      algorithm: 'placeholder',
      value: 'unsigned-v0.1',
      key_url: 'https://kindling.dev/keys/placeholder',
    };
    saveList(opts.file, list);
    console.log('Placeholder signature added. Real cryptographic signing lands in v0.2.');
  });

program
  .command('validate')
  .requiredOption('-f, --file <path>', 'Block list file')
  .action((opts) => {
    const list = loadList(opts.file);
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    if (validate(list)) {
      console.log('OK: block list is valid.');
    } else {
      console.error('INVALID:');
      for (const err of validate.errors || []) {
        console.error(`  - ${err.instancePath || '/'} ${err.message}`);
      }
      process.exit(1);
    }
  });

program.parse();
