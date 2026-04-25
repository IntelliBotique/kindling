#!/usr/bin/env node
/**
 * kindling-parse
 *
 * Takes a profile URL and emits a parsed_profile JSON document.
 * Reads h-card markup if present; falls back to AI extraction otherwise.
 *
 * The AI extraction in this reference implementation is a stub that produces
 * a structurally-valid parsed_profile by extracting plain text and inferring
 * minimal fields. Production implementations should replace `aiExtract` with
 * a real LLM call.
 *
 * Usage:
 *   kindling-parse <profile-url>
 */

import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { Command } from 'commander';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const PARSER_VERSION = 'kindling-parser-reference/0.1.0';

async function fetchHtml(source) {
  if (existsSync(source)) {
    return { html: readFileSync(source, 'utf8'), url: pathToFileURL(source).toString() };
  }
  const res = await fetch(source, { headers: { 'User-Agent': PARSER_VERSION } });
  if (!res.ok) throw new Error(`Failed to fetch ${source}: ${res.status}`);
  return { html: await res.text(), url: source };
}

function extractHcard($, baseUrl) {
  const card = $('.h-card').first();
  if (!card.length) return null;

  const result = {};
  const name = card.find('.p-name').first().text().trim();
  if (name) result.display_name = name;
  const pronouns = card.find('.p-pronouns, .p-pronoun').first().text().trim();
  if (pronouns) result.pronouns = pronouns;
  const note = card.find('.p-note').first().text().trim();
  if (note) result.about = note;

  const location = {};
  const locality = card.find('.p-locality').first().text().trim();
  if (locality) location.city = locality;
  const region = card.find('.p-region').first().text().trim();
  if (region) location.region = region;
  const country = card.find('.p-country-name').first().text().trim();
  if (country) location.country = country;
  if (Object.keys(location).length) result.location = location;

  const photoHints = [];
  card.find('.u-photo').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('href');
    if (src) photoHints.push(new URL(src, baseUrl).toString());
  });
  if (photoHints.length) result.photo_hints = photoHints;

  const contact = [];
  const email = card.find('.u-email').first().attr('href') || card.find('.u-email').first().text().trim();
  if (email) {
    const value = email.replace(/^mailto:/, '');
    contact.push({ type: 'email', value });
  }
  card.find('.u-url').each((_, el) => {
    const href = $(el).attr('href');
    if (href) contact.push({ type: 'url', value: new URL(href, baseUrl).toString() });
  });
  if (contact.length) result.contact_methods = contact;

  return result;
}

function aiExtract($, baseUrl) {
  // STUB. A production implementation replaces this with an LLM call that
  // takes the page text and returns a structured parsed_profile. Here, we
  // produce a minimal valid skeleton by reading the <title> and meta tags.
  const result = {};
  const title = $('title').first().text().trim();
  const ogTitle = $('meta[property="og:title"]').attr('content');
  result.display_name = ogTitle || title || 'Unknown';

  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    $('p').first().text().trim();
  if (description) result.about = description.slice(0, 1000);

  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) result.photo_hints = [new URL(ogImage, baseUrl).toString()];

  return result;
}

function buildParsedProfile(url, fields) {
  return {
    schema_version: '0.1',
    profile_url: url,
    display_name: fields.display_name || 'Unknown',
    ...(fields.pronouns ? { pronouns: fields.pronouns } : {}),
    ...(fields.location ? { location: fields.location } : {}),
    ...(fields.photo_hints?.length ? { photo_hints: fields.photo_hints } : {}),
    ...(fields.about ? { about: fields.about } : {}),
    ...(fields.contact_methods?.length ? { contact_methods: fields.contact_methods } : {}),
    intent_tags: fields.intent_tags || [],
    verification: { level: 'unverified' },
    parsed_at: new Date().toISOString(),
    parser: PARSER_VERSION,
  };
}

const program = new Command();
program
  .name('kindling-parse')
  .description('Parse a profile URL into a Kindling parsed_profile JSON document')
  .argument('<source>', 'Profile URL or local file path to parse')
  .option('--no-ai', 'Skip AI fallback; require h-card markup')
  .action(async (source, options) => {
    try {
      const { html, url } = await fetchHtml(source);
      const $ = cheerio.load(html);

      const hcardFields = extractHcard($, url);
      let fields = hcardFields;

      if (!fields && options.ai !== false) {
        process.stderr.write('No h-card found; using AI fallback (stub).\n');
        fields = aiExtract($, url);
      }

      if (!fields) {
        console.error('No h-card found and AI fallback disabled. Cannot parse.');
        process.exit(1);
      }

      const profile = buildParsedProfile(url, fields);
      console.log(JSON.stringify(profile, null, 2));
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(2);
    }
  });

program.parse();
