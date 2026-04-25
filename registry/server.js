/**
 * Kindling Public Registry
 *
 * Lists registered Pools, accepts Pool manifest URL submissions, validates
 * them against the schema, displays them by category. File-based storage
 * for the v0.1 reference implementation.
 *
 * Production deployments should:
 *   - Replace file-based storage with a real database
 *   - Add curator authentication (email magic link or OAuth)
 *   - Run periodic re-validation of registered Pools
 *   - Implement the well-known crawler to auto-discover Pools
 *
 * Usage:
 *   PORT=3000 node registry/server.js
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolvePath(__dirname, '../registry-data');
mkdirSync(DATA_DIR, { recursive: true });

const SCHEMAS_DIR = resolvePath(__dirname, '../schemas');
const POOL_SCHEMA = JSON.parse(
  readFileSync(resolvePath(SCHEMAS_DIR, 'pool_manifest.schema.json'), 'utf8'),
);

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
for (const file of readdirSync(SCHEMAS_DIR).filter((f) => f.endsWith('.json'))) {
  ajv.addSchema(JSON.parse(readFileSync(resolvePath(SCHEMAS_DIR, file), 'utf8')));
}
const validatePool = ajv.getSchema(POOL_SCHEMA.$id);

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function poolPath(slug) {
  return resolvePath(DATA_DIR, `${slug}.json`);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function listPools() {
  return readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(resolvePath(DATA_DIR, f), 'utf8')));
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLayout(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — Kindling Registry</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header>
    <a href="/" class="brand">Kindling Registry</a>
    <nav>
      <a href="/">Pools</a>
      <a href="/submit">Submit</a>
      <a href="https://kindling.dev">About</a>
    </nav>
  </header>
  <main>${body}</main>
  <footer>
    <p>Kindling is an open protocol for human connection. <a href="https://github.com/IntelliBotique/kindling">GitHub</a> · <a href="https://kindling.dev">kindling.dev</a></p>
  </footer>
</body>
</html>`;
}

app.get('/style.css', (_req, res) => {
  res.type('text/css').send(`
    body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 820px; margin: 0 auto; padding: 1.5rem; color: #2a2a2a; line-height: 1.55; }
    header { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; padding-bottom:1rem; border-bottom:1px solid #d8d4cb; }
    .brand { font-weight:600; text-decoration:none; color:#3a5a3a; font-size:1.15rem; }
    nav a { margin-left:1rem; color:#3a5a3a; text-decoration:none; }
    nav a:hover { text-decoration:underline; }
    h1 { color:#3a5a3a; font-weight:600; }
    h2 { color:#3a5a3a; margin-top:2rem; font-weight:600; }
    .pool-card { border:1px solid #d8d4cb; border-radius:6px; padding:1rem 1.25rem; margin:1rem 0; background:#fbfaf6; }
    .pool-card h3 { margin:0 0 .25rem; }
    .pool-card .meta { color:#6b6b6b; font-size:.875rem; margin-bottom:.5rem; }
    .tag { display:inline-block; background:#eae5d8; color:#5a4a3a; padding:.15rem .5rem; border-radius:3px; font-size:.8rem; margin-right:.25rem; }
    .charter { margin-top:.5rem; }
    form { display:grid; gap:1rem; max-width:500px; }
    label { display:block; font-size:.9rem; }
    input, textarea { width:100%; padding:.5rem; border:1px solid #c8c4bb; border-radius:3px; font:inherit; }
    button { background:#3a5a3a; color:#fff; padding:.6rem 1.2rem; border:0; border-radius:3px; font:inherit; cursor:pointer; }
    button:hover { background:#2a4a2a; }
    .error { color:#a83a3a; background:#f8eeed; padding:.6rem 1rem; border-radius:3px; }
    .success { color:#2a6a2a; background:#eef6ed; padding:.6rem 1rem; border-radius:3px; }
    footer { margin-top:3rem; padding-top:1rem; border-top:1px solid #d8d4cb; color:#6b6b6b; font-size:.85rem; text-align:center; }
  `);
});

app.get('/', (_req, res) => {
  const pools = listPools();
  const byCategory = pools.reduce((acc, pool) => {
    for (const tag of pool.intent_tags || []) {
      if (!acc[tag]) acc[tag] = [];
      acc[tag].push(pool);
    }
    return acc;
  }, {});

  const cards = pools
    .map((pool) => {
      const tags = (pool.intent_tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');
      const loc = pool.geographic_scope?.city
        ? ` · ${escapeHtml(pool.geographic_scope.city)}`
        : '';
      return `<article class="pool-card">
        <h3>${escapeHtml(pool.name)}</h3>
        <div class="meta">${escapeHtml(pool.visibility)} · ${escapeHtml(pool.consent_model)}${loc} · curated by ${escapeHtml(pool.curator?.[0]?.display_name || pool.curator?.[0]?.identity || 'unknown')}</div>
        <div>${tags}</div>
        <div class="charter">${escapeHtml(pool.charter)}</div>
      </article>`;
    })
    .join('');

  const intro = `<h1>Kindling Public Registry</h1>
  <p>Pools listed below are publicly opt-in and curated by people working in their own communities. Anyone can submit a Pool. <a href="/submit">Submit yours</a>.</p>`;

  const body = `${intro}${cards || '<p>No Pools registered yet. <a href="/submit">Be the first.</a></p>'}`;
  res.send(renderLayout('Pools', body));
});

app.get('/submit', (_req, res) => {
  const body = `<h1>Submit a Pool</h1>
  <p>Provide a publicly-accessible URL pointing to your Pool's manifest JSON. The registry will validate it against the v0.1 Pool schema before listing.</p>
  <form method="POST" action="/submit">
    <label>
      Pool manifest URL
      <input type="url" name="manifest_url" required placeholder="https://example.com/pools/my-pool.json">
    </label>
    <label>
      Curator email (for confirmation; not displayed publicly)
      <input type="email" name="curator_email" required placeholder="you@example.com">
    </label>
    <button type="submit">Validate and submit</button>
  </form>
  <p style="margin-top:1.5rem;color:#6b6b6b;font-size:.9rem;">Submission triggers schema validation. If the manifest is valid and you're the curator, the Pool is listed publicly. Removal requests go to <a href="mailto:registry@kindling.dev">registry@kindling.dev</a>.</p>`;
  res.send(renderLayout('Submit', body));
});

app.post('/submit', async (req, res) => {
  const { manifest_url, curator_email } = req.body;
  if (!manifest_url || !curator_email) {
    return res.status(400).send(renderLayout('Submit', `<h1>Submission failed</h1><p class="error">Missing required fields.</p><p><a href="/submit">Try again</a>.</p>`));
  }
  try {
    const fetched = await fetch(manifest_url);
    if (!fetched.ok) {
      return res.status(400).send(renderLayout('Submit', `<h1>Submission failed</h1><p class="error">Could not fetch manifest URL: HTTP ${fetched.status}.</p>`));
    }
    const manifest = await fetched.json();
    if (!validatePool(manifest)) {
      const errors = (validatePool.errors || []).map((e) => `<li>${escapeHtml(e.instancePath || '/')}: ${escapeHtml(e.message)}</li>`).join('');
      return res.status(400).send(renderLayout('Submit', `<h1>Submission failed</h1><p class="error">Pool manifest is invalid against the v0.1 schema.</p><ul>${errors}</ul>`));
    }
    const slug = manifest.id ? slugify(manifest.id) : slugify(manifest.name);
    if (existsSync(poolPath(slug))) {
      return res.status(409).send(renderLayout('Submit', `<h1>Submission failed</h1><p class="error">A Pool with id "${slug}" is already registered. Contact registry@kindling.dev to update.</p>`));
    }
    const stored = {
      ...manifest,
      _registry: {
        registered_at: new Date().toISOString(),
        manifest_url,
        curator_contact: curator_email,
      },
    };
    writeFileSync(poolPath(slug), JSON.stringify(stored, null, 2));
    res.send(renderLayout('Submit', `<h1>Submitted</h1><p class="success">Pool "${escapeHtml(manifest.name)}" registered as <code>${escapeHtml(slug)}</code>. <a href="/">Back to listings</a>.</p>`));
  } catch (err) {
    res.status(500).send(renderLayout('Submit', `<h1>Submission failed</h1><p class="error">${escapeHtml(err.message)}</p>`));
  }
});

app.get('/api/pools', (_req, res) => {
  res.json(listPools().map(({ _registry, ...pool }) => pool));
});

app.get('/api/pools/:slug', (req, res) => {
  const path = poolPath(req.params.slug);
  if (!existsSync(path)) return res.status(404).json({ error: 'not found' });
  const { _registry, ...pool } = JSON.parse(readFileSync(path, 'utf8'));
  res.json(pool);
});

app.listen(PORT, () => {
  console.log(`Kindling Registry listening on http://localhost:${PORT}`);
});
