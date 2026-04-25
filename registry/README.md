# Kindling Public Registry

The reference implementation of the Kindling public registry. Lists opt-in Pools, accepts curator submissions, validates them against the v0.1 Pool schema.

## Running locally

```bash
cd kindling-repo
npm install
PORT=3000 node registry/server.js
```

Then open http://localhost:3000.

## Deployment

The reference implementation is small enough to run on a single VPS or container.

### Single-VPS deployment (suggested for v0.1)

1. Provision a small Linux VM (any cloud).
2. Install Node 20 and a process supervisor (systemd, pm2, or Docker).
3. Clone this repo, `npm install`, and run `node registry/server.js` under the supervisor.
4. Front it with Caddy or nginx for TLS termination.
5. Configure DNS for `registry.kindling.dev` (or your chosen domain).

### Container deployment

A `Dockerfile` will land alongside this README in v0.1.x. Until then, any standard Node 20 base image works.

## Storage

The reference implementation uses file-based JSON storage at `../registry-data/`. Each registered Pool is one JSON file named by slug.

For production deployments handling more than a few hundred Pools, replace this with a real database. The schema is intentionally simple to make migration straightforward.

## API

```
GET  /                        Public listing page (HTML)
GET  /submit                  Submission form (HTML)
POST /submit                  Validate and register a Pool
GET  /api/pools               Machine-readable list of all registered Pools
GET  /api/pools/:slug         A single Pool's manifest as JSON
GET  /style.css               Stylesheet (kept inline for portability)
```

## Operating notes

- Curator email is collected at submission time but is not displayed publicly. It is used for confirmation and removal requests.
- Pools entering `dormant` or `archived` status (per the framework) should be re-fetched and updated by a periodic job. v0.1 does not include the job; v0.1.x will.
- The well-known URI crawler that auto-discovers Pools published to `/.well-known/kindling-pool` is not in v0.1. It lands in v0.1.x. Until then, curator self-submission is the only path into the registry.

## What's intentionally not in v0.1

- Curator authentication (currently we trust the submitted email; v0.2 will add magic-link verification)
- Pool re-validation on a schedule
- Block list subscription management
- Search across Pool entries (the discovery agent does this client-side; the registry does not)
- Analytics
- Multi-tenant administration
