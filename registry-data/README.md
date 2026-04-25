# registry-data/

This directory is the file-based data store that the reference registry server (`registry/server.js`) reads from and writes to.

## Structure

Each registered Pool is stored as a single JSON file named `<slug>.json`. The slug is derived from the Pool's `id` (or `name`) and is stable once assigned. Example:

```
registry-data/
  neurodivergent-friendships.json
  polyam-dating-bay-area.json
  queer-creatives-la.json
  local/            # ignored by git (see .gitignore)
```

The `local/` subdirectory is reserved for development-only entries and is gitignored. Production deployments should back this directory with a real database rather than a filesystem.

## Seeding

At v0.1 launch, the directory ships empty. The first seed Pools are submitted by the founding curators recruited during the pre-launch window (see `03_Kindling_GTM_Launch_Plan.md` in the launch source).

## Schema

Every stored Pool is validated against `schemas/pool_manifest.schema.json` before it is written, with an added `_registry` metadata block recording `registered_at`, `manifest_url`, and `curator_contact`. The metadata is stripped from public API responses.

## Operations

- **Add a Pool:** `POST /submit` on the running registry server. See `registry/README.md`.
- **Remove a Pool:** delete the file (or route through `registry@kindling.dev` for curator-initiated removal in the hosted registry).
- **Re-validate all Pools:** run the `validator` CLI against every file (script TBD; see issue tracker).
