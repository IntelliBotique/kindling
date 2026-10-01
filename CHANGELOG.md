# Changelog

All notable changes to the Kindling protocol specification, schemas, and reference tooling are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Spec-level changes are governed by SPEC.md §12.

For a discussion of why a change landed, see the relevant RFC in `RFCs/`.

---

## [Unreleased]

Changes staged for the next release. Updated as PRs land on `main`.

---

## [0.1.1] — Unreleased

The first public release of Kindling. Begins the v0.1 stability window described in SPEC.md §12.

It also carries the errata found while the reference sites were built (1 October 2026): the text now agrees with the schemas, the schemas gain the three optional fields that agreement needs, and the handshake gains a confirmation step. Nothing is removed, and every v0.1 document that was valid before is still valid, except a Pool entry holding a parsed profile with `kindling_noindex: true`, which §2.7 already forbade.

### Security

- **The handshake links open a confirmation step (§5.2, step 3).** Opening an accept or decline link no longer records anything; only an explicit action on the page it opens (a POST) does. Email security scanners open every link in a message, so a decision recorded on GET could accept a handshake for someone, which §5.1 forbids. `kindling-handshake` now serves a confirmation page on GET (not cached, not indexed) and records decisions only on POST; it also escapes the Pool's text on its pages and compares tokens in constant time.

### Changed (errata)

1. **Verification levels (§4.5).** The wire values are the schemas': `email`, `oauth`, `curator-vouched`, `unverified`, with `cryptographic` reserved for v0.2. `email-verified` and the rest stay as display labels, with a table. A Pool entry's level is never `unverified` (§3.4).
2. **Extraction provenance (§2.3).** New optional `extraction_source` on `parsed_profile`: a field name mapped to `h-card`, `inferred` or `owner-declared`. Parsers MUST fill it when they infer anything.
3. **Handshake window (§5.2).** New optional `handshake_window_days` on the Pool manifest (default 14). A request's `expires_at` MUST equal `sent_at` plus the window.
4. **Message types (§6.3).** Lists `withdrawal` and `system`, which the schema already allowed, and defines `system` (dormancy, curator transition and auto-accept notices).
5. **Noindex (§2.7).** A parsed profile with `kindling_noindex: true` MUST NOT appear in a Pool entry; the schema now rejects one. Parsers keep the field so a Pool can refuse.
6. **Auto-accept and invite-only Pools (§5.5).** Auto-accept never applies to an invite-only Pool; the text now says so.
7. **The version field (§12.1).** The text uses `schema_version`, as every schema does; its value stays `"0.1"` through v0.1.x.
8. **The well-known file (§10.2).** The text uses the schema's `manifest_url` and required fields; new optional `curator_contact` per Pool, SHOULD in the text.
9. **The Pool reference in a message (§6.2).** The text uses `via_pool`, not `pool_ref`.
10. **What a Pool entry must hold (§3.4).** `parsed_profile` and `parsed_at` are SHOULD once parsed; `added_at` is required, as in the schema.
11. **Where a profile's level sits (§2.4).** `verification.level`.
12. **Messaging rules (§7.2).** The text uses the schema's `accept_from` values and `no_cold_messages`, with a table for the old names; `minimum_sender_verification` is a Pool-level default.
13. **Consent proof signatures (RFC 0004).** Corrected: v0.1 consent proofs carry no signature. One arrives with cryptographic identity in v0.2.

### Tooling

- `kindling-validate` warns, without failing, when a Pool entry lacks `parsed_profile` or `parsed_at`, or a well-known entry lacks `curator_contact`, and explains the noindex rule in plain words.
- `kindling-parse` fills `extraction_source` and records a `kindling-noindex` directive.
- `kindling-handshake` uses the manifest's `handshake_window_days`, and returns the schema-valid request it sent.
- Tests for each of the above (`tests/errata.test.js`, `tests/handshake.test.js`).

### Examples

- Example profile URLs now use reserved `.example` hosts, so no real person's page is pointed at.
- The examples exercise `extraction_source`, `handshake_window_days` and `curator_contact`.

### Editorial

- RFCs 0001 to 0007 and the glossary use the v0.1.1 names, and drop em dashes.

### Added

- **Specification.** `spec/SPEC.md` — the canonical, numbered protocol specification (12 sections, RFC 2119 language). `spec/GLOSSARY.md` — every defined protocol term.
- **Schemas.** Six JSON Schema 2020-12 documents defining the wire formats for parsed profiles, Pool manifests, handshake messages, native messages, well-known discovery files, and shared block lists.
- **Reference tooling.** Five Node.js CLIs:
  - `kindling-validate` — validate any Kindling document against its schema.
  - `kindling-parse` — parse a profile URL into a structured `parsed_profile` JSON.
  - `kindling-discover` — query one or more Pools in natural language.
  - `kindling-handshake` — minimal reference handshake server.
  - `kindling-blocklist` — manage and publish shared block lists.
- **Public registry.** `registry/server.js` — a deployable file-backed registry of opt-in Pools. Includes a curator self-submission flow that schema-validates manifests before listing.
- **RFCs.** Seven seed RFCs (`0001`–`0007`) anchoring the v0.1 design for each protocol section: Profile, Pool, Identity, Handshake, Messaging, Spam Filtering, Discovery. RFC template at `RFCs/0000-template.md`.
- **Examples.** Three hand-authored Pool manifests, three example profile pages (h-card, mixed, prose-only), one well-known file example, and a minimal block list example.
- **Tests.** A `vitest` suite validating every schema against its example fixtures and exercising negative cases (`tests/schemas.test.js`).
- **Project hygiene.** README, GOVERNANCE, CONTRIBUTING, CODE_OF_CONDUCT, MAINTAINERS, dual license (Apache 2.0 for code, CC BY 4.0 for spec text).

### Notes

- This is the first release; nothing is deprecated, nothing is removed.
- The v0.1 spec is stable per SPEC.md §12 from the moment 0.1.1 ships.

---

## [0.1.0] — Pre-release (private review)

Pre-public review milestone. Repo lived under private collaboration with invited reviewers. Not tagged on GitHub; tracked here for completeness.

### Added

- All artifacts subsequently shipped in 0.1.1 above (the public 0.1.1 cut differs from this pre-release only in the fixes filed during the review window).

---

[Unreleased]: https://github.com/IntelliBotique/kindling/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/IntelliBotique/kindling/releases/tag/v0.1.1
[0.1.0]: https://github.com/IntelliBotique/kindling
