#!/usr/bin/env node
/**
 * kindling-handshake
 *
 * A minimal reference handshake server. Exposes:
 *   POST /handshake/initiate   { profile_url, pool_manifest_url }
 *   GET  /handshake/accept?id=...&token=...
 *   GET  /handshake/decline?id=...&token=...
 *
 * Sends handshake emails via SMTP (configure via environment variables).
 * Stores handshake state on local disk for the reference implementation.
 *
 * Production implementations should:
 *   - Store handshakes in a real database
 *   - Use deliverability-focused transactional email (Postmark, SES, etc.)
 *   - Sign accept/decline tokens cryptographically
 *
 * Usage:
 *   PORT=3001 SMTP_HOST=... SMTP_USER=... SMTP_PASS=... \
 *   FROM_EMAIL=handshake@kindling.dev BASE_URL=https://handshake.kindling.dev \
 *   kindling-handshake
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import express from 'express';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = resolvePath(__dirname, '../state');
mkdirSync(STATE_DIR, { recursive: true });

const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const FROM_EMAIL = process.env.FROM_EMAIL || 'handshake@kindling.dev';
const HANDSHAKE_TTL_DAYS = Number(process.env.HANDSHAKE_TTL_DAYS || 14);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

function statePath(handshakeId) {
  return resolvePath(STATE_DIR, `${handshakeId}.json`);
}

function saveHandshake(record) {
  writeFileSync(statePath(record.handshake_id), JSON.stringify(record, null, 2));
}

function loadHandshake(handshakeId) {
  const path = statePath(handshakeId);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function fetchPoolManifest(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch pool manifest: ${res.status}`);
  return res.json();
}

async function fetchProfileForContact(url) {
  // Minimal pre-fetch: look for an h-card email on the page.
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch profile page: ${res.status}`);
  const html = await res.text();
  const match =
    html.match(/class="[^"]*u-email[^"]*"\s+href="mailto:([^"]+)"/i) ||
    html.match(/mailto:([^"'>\s]+)/i);
  if (!match) throw new Error('No email contact found on profile page.');
  return match[1];
}

function buildHandshakeEmail(record) {
  const acceptUrl = `${BASE_URL}/handshake/accept?id=${record.handshake_id}&token=${record.accept_token}`;
  const declineUrl = `${BASE_URL}/handshake/decline?id=${record.handshake_id}&token=${record.decline_token}`;
  const subject = `[Kindling] You've been invited to the Pool: ${record.pool.name}`;
  const text = `Hello,

You're being invited to the Kindling Pool "${record.pool.name}".

Charter: ${record.pool.charter}
Curator: ${record.pool.curator_identity} (verification: ${record.pool.curator_verification})
Visibility: ${record.pool.visibility}
Intent tags: ${(record.pool.intent_tags || []).join(', ')}

If you accept, your profile (${record.profile_url}) will be parsed and listed in this Pool.
If you decline, no record beyond a 'declined' marker is kept.

Accept:  ${acceptUrl}
Decline: ${declineUrl}

This invitation expires on ${record.expires_at}.

About Kindling: an open protocol for human connection. https://kindling.dev
`;
  return { to: record.recipient_email, from: FROM_EMAIL, subject, text };
}

const app = express();
app.use(express.json());

app.post('/handshake/initiate', async (req, res) => {
  try {
    const { profile_url, pool_manifest_url } = req.body || {};
    if (!profile_url || !pool_manifest_url) {
      return res.status(400).json({ error: 'profile_url and pool_manifest_url required' });
    }
    const pool = await fetchPoolManifest(pool_manifest_url);
    const recipientEmail = await fetchProfileForContact(profile_url);

    const handshakeId = crypto.randomUUID();
    const record = {
      handshake_id: handshakeId,
      profile_url,
      pool_manifest_url,
      pool: {
        name: pool.name,
        charter: pool.charter,
        curator_identity: pool.curator?.[0]?.identity || 'unknown',
        curator_verification: pool.curator?.[0]?.verification_level || 'unverified',
        intent_tags: pool.intent_tags || [],
        visibility: pool.visibility,
      },
      recipient_email: recipientEmail,
      accept_token: crypto.randomBytes(24).toString('hex'),
      decline_token: crypto.randomBytes(24).toString('hex'),
      sent_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + HANDSHAKE_TTL_DAYS * 86400000).toISOString(),
      status: 'pending',
    };
    saveHandshake(record);

    const email = buildHandshakeEmail(record);
    await transporter.sendMail(email);

    res.json({ handshake_id: handshakeId, status: 'pending', expires_at: record.expires_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/handshake/accept', (req, res) => {
  const record = loadHandshake(req.query.id);
  if (!record || record.accept_token !== req.query.token) {
    return res.status(404).send('Handshake not found.');
  }
  if (record.status !== 'pending') {
    return res.status(409).send(`Already ${record.status}.`);
  }
  if (new Date(record.expires_at) < new Date()) {
    record.status = 'expired';
    saveHandshake(record);
    return res.status(410).send('Handshake expired.');
  }
  record.status = 'accepted';
  record.responded_at = new Date().toISOString();
  saveHandshake(record);
  res.send(`Accepted. Your profile will be added to ${record.pool.name}.`);
});

app.get('/handshake/decline', (req, res) => {
  const record = loadHandshake(req.query.id);
  if (!record || record.decline_token !== req.query.token) {
    return res.status(404).send('Handshake not found.');
  }
  if (record.status !== 'pending') {
    return res.status(409).send(`Already ${record.status}.`);
  }
  record.status = 'declined';
  record.responded_at = new Date().toISOString();
  saveHandshake(record);
  res.send(`Declined. ${record.pool.name} will not list your profile.`);
});

app.get('/handshake/:id', (req, res) => {
  const record = loadHandshake(req.params.id);
  if (!record) return res.status(404).json({ error: 'not found' });
  const { accept_token, decline_token, recipient_email, ...safe } = record;
  res.json(safe);
});

app.listen(PORT, () => {
  console.log(`kindling-handshake reference server listening on ${BASE_URL}`);
});
