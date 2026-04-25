# Changelog

All notable changes to the Kindling protocol specification, schemas, and reference tooling are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Spec-level changes are governed by SPEC.md §12.

For a discussion of why a change landed, see the relevant RFC in `RFCs/`.

---

## [Unreleased]

Changes staged for the next release. Updated as PRs land on `main`.

---

## [0.1.1] — Unreleased (target: late spring 2026)

The first public release of Kindling. Begins the v0.1 stability window described in SPEC.md §12.

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
