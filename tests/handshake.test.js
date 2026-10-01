import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { createApp, windowDays } from '../tools/handshake/bin/cli.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = resolve(__dirname, '..', 'schemas');

function handshakeValidator() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  for (const file of readdirSync(SCHEMAS_DIR).filter((f) => f.endsWith('.json'))) {
    ajv.addSchema(JSON.parse(readFileSync(join(SCHEMAS_DIR, file), 'utf8')));
  }
  return ajv.getSchema('https://kindling.dev/schemas/handshake_message.schema.json');
}

const POOL = {
  schema_version: '0.1',
  name: 'Tuesday <b>Walkers</b>',
  curator: [{ identity: 'curator@library.example', verification_level: 'email', primary: true }],
  intent_tags: ['walking', 'friendship'],
  visibility: 'public',
  consent_model: 'universal-opt-in',
  curator_contact: 'curator@library.example',
  charter: 'A slow walk around the reservoir every Tuesday morning, for anyone in town.',
  handshake_window_days: 7,
  entries: [],
};
const PROFILE_HTML =
  '<div class="h-card"><a class="u-email" href="mailto:owner@mail.example">mail</a></div>';

function fakeFetch(pool) {
  return async (url) => ({
    ok: true,
    status: 200,
    json: async () => pool,
    text: async () => (url.includes('profile') ? PROFILE_HTML : ''),
  });
}

describe('kindling-handshake: links open a confirmation step (SPEC §5.2, step 3)', () => {
  let server, base, stateDir, clock, sent, validate;

  async function start(pool = POOL) {
    stateDir = mkdtempSync(join(tmpdir(), 'kindling-hs-'));
    clock = new Date('2026-10-01T12:00:00Z');
    sent = [];
    const app = createApp({
      stateDir,
      baseUrl: 'http://handshake.test',
      fetch: fakeFetch(pool),
      sendMail: async (mail) => sent.push(mail),
      now: () => clock,
    });
    await new Promise((ok) => {
      server = app.listen(0, '127.0.0.1', ok);
    });
    base = `http://127.0.0.1:${server.address().port}`;
  }

  async function initiate() {
    const res = await fetch(`${base}/handshake/initiate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        profile_url: 'https://owner.example/profile',
        pool_manifest_url: 'https://library.example/walkers.json',
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    const record = JSON.parse(readFileSync(join(stateDir, `${body.handshake_id}.json`), 'utf8'));
    return { body, record };
  }

  const status = async (id) => (await (await fetch(`${base}/handshake/${id}`)).json()).status;
  const post = (path, form) =>
    fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: new URLSearchParams(form).toString(),
    });

  beforeEach(async () => {
    validate = handshakeValidator();
    await start();
  });
  afterEach(() => {
    server?.close();
    rmSync(stateDir, { recursive: true, force: true });
  });

  it('sends a schema-valid request whose expires_at is sent_at plus the Pool window', async () => {
    const { body } = await initiate();
    expect(validate(body.request)).toBe(true);
    const span = Date.parse(body.request.expires_at) - Date.parse(body.request.sent_at);
    expect(span).toBe(7 * 86400000);
    expect(sent).toHaveLength(1);
    expect(sent[0].text).toContain('Opening a link changes nothing');
  });

  it('a GET to the accept link shows a confirmation page and records nothing', async () => {
    const { record } = await initiate();
    const url = `${base}/handshake/accept?id=${record.handshake_id}&token=${record.accept_token}`;
    const res = await fetch(url);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-robots-tag')).toContain('noindex');
    const html = await res.text();
    expect(html).toContain('method="post"');
    expect(html).toContain('Yes, list me');
    expect(html).toContain('No, thank you');
    expect(html).not.toContain('<b>Walkers</b>');
    expect(html).toContain('&lt;b&gt;Walkers&lt;/b&gt;');
    await fetch(url, { method: 'HEAD' });
    await fetch(url);
    expect(await status(record.handshake_id)).toBe('pending');
  });

  it('a GET to the decline link records nothing either', async () => {
    const { record } = await initiate();
    const res = await fetch(
      `${base}/handshake/decline?id=${record.handshake_id}&token=${record.decline_token}`,
    );
    expect(res.status).toBe(200);
    expect(await status(record.handshake_id)).toBe('pending');
  });

  it('a wrong token gets nothing, by GET or by POST', async () => {
    const { record } = await initiate();
    const res = await fetch(`${base}/handshake/accept?id=${record.handshake_id}&token=nope`);
    expect(res.status).toBe(404);
    const crossed = await post('/handshake/accept', {
      id: record.handshake_id,
      token: record.decline_token,
    });
    expect(crossed.status).toBe(404);
    expect(await status(record.handshake_id)).toBe('pending');
  });

  it('only a POST from the confirmation page records the decision', async () => {
    const { record } = await initiate();
    const res = await post('/handshake/accept', {
      id: record.handshake_id,
      token: record.accept_token,
    });
    expect(res.status).toBe(200);
    const response = await res.json();
    expect(response.decision).toBe('accept');
    expect(validate(response)).toBe(true);
    expect(await status(record.handshake_id)).toBe('accepted');
    const again = await post('/handshake/decline', {
      id: record.handshake_id,
      token: record.decline_token,
    });
    expect(again.status).toBe(409);
  });

  it('a decline is recorded the same way', async () => {
    const { record } = await initiate();
    const res = await post('/handshake/decline', {
      id: record.handshake_id,
      token: record.decline_token,
    });
    expect((await res.json()).decision).toBe('decline');
    expect(await status(record.handshake_id)).toBe('declined');
  });

  it('after the window, the page says so and a POST records nothing', async () => {
    const { record } = await initiate();
    clock = new Date(Date.parse(record.expires_at) + 1000);
    const html = await (
      await fetch(`${base}/handshake/accept?id=${record.handshake_id}&token=${record.accept_token}`)
    ).text();
    expect(html).toContain('expired');
    const res = await post('/handshake/accept', {
      id: record.handshake_id,
      token: record.accept_token,
    });
    expect(res.status).toBe(409);
    expect(await status(record.handshake_id)).toBe('expired');
  });
});

describe('windowDays', () => {
  it('uses the manifest window, or the default of 14 days', () => {
    expect(windowDays({ handshake_window_days: 30 })).toBe(30);
    expect(windowDays({})).toBe(14);
    expect(windowDays({ handshake_window_days: 0 })).toBe(14);
  });
});
