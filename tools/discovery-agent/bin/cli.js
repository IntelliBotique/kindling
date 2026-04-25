#!/usr/bin/env node
/**
 * kindling-discover
 *
 * A starter discovery agent. Given one or more Pool manifest URLs and a
 * natural-language query, returns ranked profile matches.
 *
 * The ranking in this reference implementation is a simple lexical relevance
 * score over parsed profile fields. Production implementations should
 * replace `rankProfiles` with an embedding-based or LLM-driven ranker.
 *
 * Usage:
 *   kindling-discover --pool <url> [--pool <url>...] --query "..."
 */

import { existsSync, readFileSync } from 'node:fs';
import { Command } from 'commander';
import fetch from 'node-fetch';

async function loadPool(source) {
  if (existsSync(source)) {
    return JSON.parse(readFileSync(source, 'utf8'));
  }
  const res = await fetch(source);
  if (!res.ok) throw new Error(`Failed to fetch ${source}: ${res.status}`);
  return res.json();
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function profileText(entry) {
  const p = entry.parsed_profile || {};
  return [
    p.display_name || '',
    p.about || '',
    (p.intent_tags || []).join(' '),
    p.location?.city || '',
    p.location?.region || '',
    p.pronouns || '',
  ].join(' ');
}

function rankProfiles(entries, query) {
  const queryTokens = new Set(tokenize(query));
  return entries
    .map((entry) => {
      const text = profileText(entry).toLowerCase();
      const tokens = tokenize(text);
      let score = 0;
      for (const token of tokens) {
        if (queryTokens.has(token)) score += 1;
      }
      const intentTags = entry.parsed_profile?.intent_tags || [];
      for (const tag of intentTags) {
        for (const qt of queryTokens) {
          if (tag.toLowerCase().includes(qt)) score += 2;
        }
      }
      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
}

const program = new Command();
program
  .name('kindling-discover')
  .description('Query one or more Kindling Pools in natural language')
  .requiredOption('-p, --pool <url>', 'Pool manifest URL or file (repeatable)', (v, acc) => [...acc, v], [])
  .requiredOption('-q, --query <text>', 'Natural-language query')
  .option('-n, --limit <n>', 'Max results to return', '10')
  .action(async (options) => {
    try {
      const pools = await Promise.all(options.pool.map(loadPool));
      const allEntries = pools.flatMap((pool) =>
        (pool.entries || []).map((e) => ({ ...e, _pool_name: pool.name }))
      );
      const ranked = rankProfiles(allEntries, options.query).slice(0, Number(options.limit));

      if (!ranked.length) {
        console.log('No matches.');
        return;
      }

      console.log(`Top ${ranked.length} match${ranked.length === 1 ? '' : 'es'} for: "${options.query}"`);
      console.log('');
      for (const { entry, score } of ranked) {
        const p = entry.parsed_profile || {};
        const loc = [p.location?.city, p.location?.region].filter(Boolean).join(', ');
        console.log(`  ${p.display_name || '(unnamed)'} ${loc ? `— ${loc}` : ''}  [score: ${score}, pool: ${entry._pool_name}]`);
        if (p.about) console.log(`    ${p.about.slice(0, 140)}${p.about.length > 140 ? '…' : ''}`);
        console.log(`    ${entry.profile_url}`);
        console.log('');
      }
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(2);
    }
  });

program.parse();
