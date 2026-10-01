#!/usr/bin/env node
/**
 * kindling-handshake
 *
 * A minimal reference handshake server (SPEC §5.2). Exposes:
 *   POST /handshake/initiate   { profile_url, pool_manifest_url }
 *   GET  /handshake/accept?id=...&token=...    a confirmation page; records nothing
 *   GET  /handshake/decline?id=...&token=...   a confirmation page; records nothing
 *   POST /handshake/accept     id, token       records an acceptance
 *   POST /handshake/decline    id, token       records a decline
 *   GET  /handshake/:id                        the handshake's public state
 *
 * The links in the email only open a confirmation page. A decision is recorded only when the owner presses a
 * button there, which sends a POST (SPEC §5.2, step 3). Email security scanners open every link in a message;
 * if a GET recorded a decision, a scanner could accept a handshake for someone, which §5.1 forbids.
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
 *
 * HANDSHAKE_TTL_DAYS (default 14) is the window for a Pool whose manifest sets no handshake_window_days.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import express from 'express';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DAY_MS = 86400000;
const ID_RE = /^[0-9a-f-]{36}$/;

export function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

function tokensEqual(a, b) {
  const x = Buffer.from(String(a ?? ''));
  const y = Buffer.from(String(b ?? ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

/** The window for a Pool: its manifest's handshake_window_days, or the server default (SPEC §5.2, step 6). */
export function windowDays(pool, fallbackDays = 14) {
  const days = Number(pool?.handshake_window_days);
  return Number.isInteger(days) && days >= 1 ? days : fallbackDays;
}

export function createApp(options = {}) {
  const stateDir = options.stateDir || resolvePath(__dirname, '../state');
  const baseUrl = options.baseUrl || 'http://localhost:3001';
  const fromEmail = options.fromEmail || 'handshake@kindling.dev';
  const defaultWindowDays = Number(options.defaultWindowDays || 14);
  const fetchImpl = options.fetch || fetch;
  const sendMail = options.sendMail || (async () => {});
  const now = options.now || (() => new Date());
  mkdirSync(stateDir, { recursive: true });

  const statePath = (handshakeId) => resolvePath(stateDir, `${handshakeId}.json`);
  const saveHandshake = (record) =>
    writeFileSync(statePath(record.handshake_id), JSON.stringify(record, null, 2));
  const loadHandshake = (handshakeId) => {
    if (!ID_RE.test(String(handshakeId || ''))) return null;
    const path = statePath(handshakeId);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf8'));
  };
  const isExpired = (record) => new Date(record.expires_at) <= now();

  async function fetchPoolManifest(url) {
    const res = await fetchImpl(url);
    if (!res.ok) throw new Error(`Failed to fetch pool manifest: ${res.status}`);
    return res.json();
  }

  async function fetchProfileForContact(url) {
    // Minimal pre-fetch: look for an h-card email on the page.
    const res = await fetchImpl(url);
    if (!res.ok) throw new Error(`Failed to fetch profile page: ${res.status}`);
    const html = await res.text();
    const match =
      html.match(/class="[^"]*u-email[^"]*"\s+href="mailto:([^"]+)"/i) ||
      html.match(/mailto:([^"'>\s]+)/i);
    if (!match) throw new Error('No email contact found on profile page.');
    return match[1];
  }

  function links(record) {
    const q = (token) => `id=${record.handshake_id}&token=${token}`;
    return {
      accept: `${baseUrl}/handshake/accept?${q(record.accept_token)}`,
      decline: `${baseUrl}/handshake/decline?${q(record.decline_token)}`,
    };
  }

  function buildHandshakeEmail(record) {
    const { accept, decline } = links(record);
    const subject = `[Kindling] You've been invited to the Pool: ${record.pool.name}`;
    const text = `Hello,

You're being invited to the Kindling Pool "${record.pool.name}".

Charter: ${record.pool.charter}
Curator: ${record.pool.curator_identity} (verification: ${record.pool.curator_verification})
Visibility: ${record.pool.visibility}
Intent tags: ${(record.pool.intent_tags || []).join(', ')}

If you accept, your profile (${record.profile_url}) will be parsed and listed in this Pool.
If you decline, no record beyond a 'declined' marker is kept.

Each link opens a page where you confirm your answer. Opening a link changes nothing.

Review and accept:  ${accept}
Review and decline: ${decline}

This invitation expires on ${record.expires_at}.

About Kindling: an open protocol for human connection. https://kindling.dev
`;
    return { to: record.recipient_email, from: fromEmail, subject, text };
  }

  /** The handshake-request document (schemas/handshake_message.schema.json) for a stored record. */
  function requestDocument(record) {
    const { accept, decline } = links(record);
    return {
      schema_version: '0.1',
      type: 'handshake-request',
      handshake_id: record.handshake_id,
      pool: { url: record.pool_manifest_url, ...record.pool },
      profile_url: record.profile_url,
      sent_at: record.sent_at,
      expires_at: record.expires_at,
      accept_url: accept,
      decline_url: decline,
    };
  }

  function page(res, status, title, body) {
    res.status(status).set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy':
        "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    }).send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${escapeHtml(title)}</title>
<style>
body{font:17px/1.5 system-ui,sans-serif;max-width:40rem;margin:0 auto;padding:24px 16px;color:#1b1b1f;background:#fafaf7}
dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 16px}dt{font-weight:600}dd{margin:0}
.yn{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}.yn form{margin:0}
button{min-height:48px;min-width:12rem;padding:0 20px;font:inherit;font-weight:600;border:2px solid #1b1b1f;border-radius:8px;cursor:pointer}
.yes{background:#1b1b1f;color:#fafaf7}.no{background:transparent;color:#1b1b1f}
button:focus-visible{outline:3px solid #2f6fed;outline-offset:3px}
@media (prefers-color-scheme:dark){body{background:#151518;color:#ececef}button{border-color:#ececef}.yes{background:#ececef;color:#151518}.no{color:#ececef}}
</style></head><body><main>${body}</main></body></html>`);
  }

  function confirmationPage(res, record, asked) {
    const p = record.pool;
    const field = (name, token) =>
      `<input type="hidden" name="id" value="${escapeHtml(record.handshake_id)}"><input type="hidden" name="token" value="${escapeHtml(token)}">${name}`;
    const heading =
      asked === 'accept' ? `Join ${escapeHtml(p.name)}?` : `Say no to ${escapeHtml(p.name)}?`;
    page(
      res,
      200,
      `Kindling invitation: ${p.name}`,
      `<h1>${heading}</h1>
<p>${escapeHtml(p.curator_identity)} would like to list your page (${escapeHtml(record.profile_url)}) in this Kindling Pool. Nothing has been recorded yet: your answer counts only when you press a button below.</p>
<dl><dt>Pool</dt><dd>${escapeHtml(p.name)}</dd><dt>Charter</dt><dd>${escapeHtml(p.charter)}</dd>
<dt>Curator</dt><dd>${escapeHtml(p.curator_identity)} (verification: ${escapeHtml(p.curator_verification)})</dd>
<dt>Visibility</dt><dd>${escapeHtml(p.visibility)}</dd><dt>Intent tags</dt><dd>${escapeHtml((p.intent_tags || []).join(', '))}</dd>
<dt>Expires</dt><dd>${escapeHtml(record.expires_at)}</dd></dl>
<div class="yn">
<form method="post" action="accept">${field('<button class="yes" type="submit">Yes, list me</button>', record.accept_token)}</form>
<form method="post" action="decline">${field('<button class="no" type="submit">No, thank you</button>', record.decline_token)}</form>
</div>
<p>If you say yes, you can leave the Pool at any time, and leaving takes effect within sixty seconds. If you say no, this curator cannot submit you again without your permission.</p>`,
    );
  }

  function statusPage(res, record, status = 200) {
    const name = escapeHtml(record.pool.name);
    const text = {
      accepted: `You said yes. Your profile will be listed in ${name}.`,
      declined: `You said no. ${name} will not list your profile.`,
      expired: `This invitation to ${name} expired, and nothing was recorded.`,
    }[isExpired(record) && record.status === 'pending' ? 'expired' : record.status];
    page(res, status, `Kindling invitation: ${record.pool.name}`, `<h1>${name}</h1><p>${text}</p>`);
  }

  // A GET to either link opens the confirmation page and changes nothing (SPEC §5.2, step 3).
  function showConfirmation(asked) {
    return (req, res) => {
      const record = loadHandshake(req.query.id);
      const token = asked === 'accept' ? record?.accept_token : record?.decline_token;
      if (!record || !tokensEqual(token, req.query.token)) {
        return page(res, 404, 'Not found', '<h1>Handshake not found</h1>');
      }
      if (record.status !== 'pending' || isExpired(record)) return statusPage(res, record);
      return confirmationPage(res, record, asked);
    };
  }

  // Only a POST from the confirmation page records a decision.
  function recordDecision(decision) {
    return (req, res) => {
      const { id, token } = { ...req.query, ...(req.body || {}) };
      const record = loadHandshake(id);
      const expected = decision === 'accept' ? record?.accept_token : record?.decline_token;
      const wantsJson = (req.get('accept') || '').includes('application/json');
      if (!record || !tokensEqual(expected, token)) {
        return wantsJson
          ? res.status(404).json({ error: 'handshake not found' })
          : page(res, 404, 'Not found', '<h1>Handshake not found</h1>');
      }
      if (record.status === 'pending' && isExpired(record)) {
        record.status = 'expired';
        saveHandshake(record);
      }
      if (record.status !== 'pending') {
        return wantsJson
          ? res.status(409).json({ error: `already ${record.status}` })
          : statusPage(res, record, 409);
      }
      record.status = decision === 'accept' ? 'accepted' : 'declined';
      record.responded_at = now().toISOString();
      saveHandshake(record);
      const response = {
        schema_version: '0.1',
        type: 'handshake-response',
        handshake_id: record.handshake_id,
        decision,
        responded_at: record.responded_at.replace(/\.\d{3}Z$/, 'Z'),
      };
      return wantsJson ? res.json(response) : statusPage(res, record);
    };
  }

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.post('/handshake/initiate', async (req, res) => {
    try {
      const { profile_url, pool_manifest_url } = req.body || {};
      if (!profile_url || !pool_manifest_url) {
        return res.status(400).json({ error: 'profile_url and pool_manifest_url required' });
      }
      const pool = await fetchPoolManifest(pool_manifest_url);
      if (!pool.curator?.[0]?.identity || !pool.curator?.[0]?.verification_level) {
        return res.status(422).json({ error: 'the Pool manifest names no verified curator' });
      }
      const recipientEmail = await fetchProfileForContact(profile_url);

      const sentAt = new Date(Math.floor(now().getTime() / 1000) * 1000);
      const record = {
        handshake_id: crypto.randomUUID(),
        profile_url,
        pool_manifest_url,
        pool: {
          name: pool.name,
          charter: pool.charter,
          curator_identity: pool.curator?.[0]?.identity || 'unknown',
          curator_verification: pool.curator?.[0]?.verification_level,
          intent_tags: pool.intent_tags || [],
          visibility: pool.visibility,
        },
        recipient_email: recipientEmail,
        accept_token: crypto.randomBytes(24).toString('hex'),
        decline_token: crypto.randomBytes(24).toString('hex'),
        // expires_at is sent_at plus the Pool's window (SPEC §5.2, step 6)
        sent_at: sentAt.toISOString().replace(/\.\d{3}Z$/, 'Z'),
        expires_at: new Date(sentAt.getTime() + windowDays(pool, defaultWindowDays) * DAY_MS)
          .toISOString()
          .replace(/\.\d{3}Z$/, 'Z'),
        status: 'pending',
      };
      saveHandshake(record);
      await sendMail(buildHandshakeEmail(record));

      res.json({
        handshake_id: record.handshake_id,
        status: 'pending',
        expires_at: record.expires_at,
        request: requestDocument(record),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/handshake/accept', showConfirmation('accept'));
  app.get('/handshake/decline', showConfirmation('decline'));
  app.post('/handshake/accept', recordDecision('accept'));
  app.post('/handshake/decline', recordDecision('decline'));

  app.get('/handshake/:id', (req, res) => {
    const record = loadHandshake(req.params.id);
    if (!record) return res.status(404).json({ error: 'not found' });
    const { accept_token: _a, decline_token: _d, recipient_email: _r, ...safe } = record;
    res.json(safe);
  });

  app.locals.buildHandshakeEmail = buildHandshakeEmail;
  return app;
}

function isMain() {
  try {
    return realpathSync(process.argv[1] || '') === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMain()) {
  const PORT = process.env.PORT || 3001;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  const app = createApp({
    baseUrl: process.env.BASE_URL || `http://localhost:${PORT}`,
    fromEmail: process.env.FROM_EMAIL || 'handshake@kindling.dev',
    defaultWindowDays: Number(process.env.HANDSHAKE_TTL_DAYS || 14),
    sendMail: (mail) => transporter.sendMail(mail),
  });
  app.listen(PORT, () => {
    console.log(`kindling-handshake reference server listening on port ${PORT}`);
  });
}
