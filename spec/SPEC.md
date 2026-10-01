# Kindling Protocol Specification

**Version:** 0.1.1 (1 October 2026)
**Status:** Stable for v0.1. Changes before v0.2 will land as opt-in additions or clearly-marked deprecations. v0.1.1 is an errata release: it makes the text agree with the schemas, adds the optional fields that agreement needs, and adds a confirmation step to the handshake (§5.2). Sections changed in v0.1.1 end with a note saying what changed; CHANGELOG.md has the full list.
**License:** CC BY 4.0 (this document). Apache 2.0 (reference tooling).

This document is the canonical, numbered specification of the Kindling protocol. It is derived from the longer-form framework essay at [`docs/FRAMEWORK.md`](../docs/FRAMEWORK.md) and exists so implementers have a stable reference for each requirement. Section numbers are stable across v0.1.x point releases and will only change at a major version bump. RFCs reference sections by number.

Keywords "MUST", "SHOULD", "MAY", "MUST NOT", "SHOULD NOT", "REQUIRED", "RECOMMENDED", and "OPTIONAL" are interpreted as in RFC 2119.

---

## 1. Introduction

### 1.1 Purpose

Kindling is an open protocol for finding people. It describes how anyone can publish a freeform profile, how curators can collect those profiles into Pools, how a consent handshake brings a profile into a Pool with the owner's permission, and how any UI a developer wants to build can sit on top.

### 1.2 Layers

Kindling is two stacked open standards:

- **Layer 1, Profile standard** (§2). A freeform self-hosted page becomes a structured profile.
- **Layer 2, Pool standard** (§3). A Pool is a manifest of structured profiles with a declared curator, intent, visibility, and consent model.

UIs are implementation-defined. The two layers underneath are the protocol.

### 1.3 Non-goals

Kindling does not define a hosted consumer product, a single canonical UI, a federation transport (v0.1 uses email under the hood for messaging), or a chargeable surface at the connection layer.

### 1.4 Terminology

See `GLOSSARY.md` for defined terms. Defined terms are capitalized when used in a protocol sense (Pool, Profile, Curator, Asker, Handshake).

---

## 2. Profile Layer

### 2.1 Profile definition

A Profile is whatever the owner publishes at a URL. There is no required format. The protocol parses what is present.

### 2.2 Baseline schema: h-card

A Profile owner SHOULD include IndieWeb `h-card` microformat markup on the source page. Parsers MUST read h-card fields where present and MUST NOT infer values that contradict explicit h-card markup.

### 2.3 AI-assisted extraction

Where h-card markup is absent, a parser MAY infer fields from prose, layout, and embedded media. Implementations MUST record which fields were h-card-derived and which were inferred. The parsed profile's optional `extraction_source` object (see `schemas/parsed_profile.schema.json`) carries this provenance: it maps a field name to `h-card` (read from h-card markup), `inferred` (extracted from anything else) or `owner-declared` (stated by the owner directly to the Pool or parser). A parser MUST fill `extraction_source` whenever it infers any field.

_Changed in v0.1.1:_ `extraction_source` is now in the schema, with its three values.

### 2.4 Extracted fields

A parsed Profile MUST include, where discoverable:

- `display_name`
- `pronouns` (if stated on the source)
- `location` (city / region / "remote" / "anywhere")
- `photo_hints` (URLs to images on the source page; never cached content)
- `intent_tags` (what the person is open to)
- `about` (free-text "about me" in compressed form)
- `contact_methods` (declared email, social handles, scheduling links)
- `verification.level` (§4.5)
- `messaging_preferences` (§7.2)
- `extraction_source` (§2.3), whenever any field was inferred

_Changed in v0.1.1:_ the verification level sits at `verification.level`, as in the schema, not at `verification_level`.

### 2.5 Photo handling

Photos MUST be referenced by URL only. Kindling and Pools MUST NOT store photo bytes. Displaying implementations MAY cache locally for performance.

### 2.6 Re-parse cadence

Re-parsing is trigger-based. A Pool MUST re-parse a Profile when the owner pushes an update. A Pool MUST collapse multiple update pushes within any 24-hour window into a single re-parse. A Profile owner MAY force a hard re-parse on demand through the messaging channel (§6).

### 2.7 Noindex directive

A Profile MAY include a `kindling-noindex` directive (as an h-card class, meta tag, or robots-style signal). Compliant Pools and crawlers MUST NOT include such a Profile in any Pool, registry, or discovery surface. A parsed profile with `kindling_noindex: true` MUST NOT appear in any Pool entry. Parsers MUST still record the field when they find the directive, so that a Pool can detect it and refuse the submission.

Noindex is not a privacy setting inside a Pool. Privacy inside a Pool comes from the Pool's `visibility` (§3.2), and, from v0.2, from profile visibility.

_Changed in v0.1.1:_ the rule holds for Pool entries too, and the schema enforces it.

---

## 3. Pool Layer

### 3.1 Pool definition

A Pool is a manifest plus a list of Profile entries. A Pool MUST be retrievable as a JSON document, either from a public Git repository or from a Pool API endpoint that returns the same shape. The document MUST validate against `schemas/pool_manifest.schema.json`.

### 3.2 Required manifest fields

- `name`
- `curator` (one or more verified Kindling identities; verification level visible)
- `intent_tags`
- `visibility`: one of `public`, `unlisted`, `invite-only`
- `consent_model`: defaults to `universal-opt-in`; other values: `vouching-required`, `curator-only-adds`
- `curator_contact`
- `charter` (free-text description)
- `entries` (§3.4)
- `schema_version` (§12.1)

### 3.3 Optional manifest fields

`id`, `geographic_scope`, `governance_rules`, `handshake_window_days` (§5.2), `status` (§9), `created_at`, `updated_at`, Pool-level messaging preferences (§7.2), and block-list subscriptions.

_Changed in v0.1.1:_ adds `handshake_window_days`, and lists `id` and `status`, which the schema already had.

### 3.4 Pool entries

Each entry MUST contain:

- `profile_url` (canonical source URL)
- `consent_proof` (reference to the handshake response authorizing inclusion)
- `verification_level` (§4.5)
- `added_at` (when the entry was added)

Once the Profile has been parsed, each entry SHOULD also contain:

- `parsed_profile` (cached JSON sidecar)
- `parsed_at` (last parse timestamp)

An entry's `verification_level` is never `unverified`: accepting a handshake verifies the owner's email at minimum (§4.2). An entry MUST NOT hold a parsed profile with `kindling_noindex: true` (§2.7).

_Changed in v0.1.1:_ the text now agrees with the schema. `parsed_profile` and `parsed_at` are SHOULD, not MUST, and `added_at` is required. Validators warn when an entry lacks the two parse fields.

### 3.5 Coupling

A Profile MAY appear in many Pools. A Pool MAY list many Profiles. Pools and Profiles are loosely coupled by URL.

---

## 4. Identity

### 4.1 Principle

A Profile owner MUST be able to prove they control the URL they published. Verification level MUST be visible to Askers.

### 4.2 Email verification

The baseline. The first time a Profile is brought into any Pool, Kindling MUST send a verification link to the declared contact email. The verified email becomes the owner's Kindling identity.

### 4.3 OAuth

A Profile owner MAY authenticate via a supported identity provider (Google, Apple, or others declared by the implementation). The OAuth-bound identifier becomes the owner's Kindling identity.

### 4.4 Curator vouching

A Curator MAY vouch for a Profile owner inside their own Pool. The identity is local to that Pool and MUST NOT automatically apply to other Pools.

### 4.5 Verification levels

Implementations MUST surface one of the following levels, and a v1-conforming UI MUST render it alongside every Profile. The wire values are the schemas'; the display labels are what earlier drafts of this text called the levels, and what a UI MAY show.

| Wire value        | Display label   | Meaning                                                         |
| ----------------- | --------------- | --------------------------------------------------------------- |
| `email`           | email-verified  | The owner proved control of an email address (§4.2).            |
| `oauth`           | oauth-verified  | The owner signed in with an identity provider (§4.3).           |
| `curator-vouched` | curator-vouched | A Curator vouched for the owner, inside that Pool only (§4.4).  |
| `unverified`      | unverified      | No verification yet.                                            |
| `cryptographic`   | cryptographic   | Reserved for v0.2 (§4.6). v0.1 implementations do not issue it. |

A Curator's level is one of `email`, `oauth` or `cryptographic`. A Pool entry's level is never `unverified` (§3.4).

_Changed in v0.1.1:_ the wire values are the schemas' (`email`, `oauth`), with the old names kept as display labels.

### 4.6 Future identity (non-normative)

Cryptographic identity and cross-Pool portability are planned for v0.2 (see framework Future Revisions).

---

## 5. Consent and the Handshake

### 5.1 Principle

A Profile MUST NOT be added to a Pool without the owner's explicit consent. Silent inclusion is forbidden. There is no exception.

### 5.2 Handshake flow

1. A Curator submits a Profile URL to a Pool.
2. The Pool's parser performs a lightweight pre-fetch to find a contact method.
3. The Pool sends a handshake message conforming to `schemas/handshake_message.schema.json`, containing: Pool name, charter, curator identity, intent tags, visibility, an accept link and a decline link. Each link MUST open a confirmation step that shows the Pool's name, charter, curator and visibility and asks the owner to confirm. Only an explicit action on that step, such as a button that sends a POST request, records a decision. A GET request to either link alone MUST NOT record a decision. The confirmation step SHOULD NOT be cached or indexed.
4. When the owner confirms acceptance, the Pool parses the page in full, caches the structured Profile, and lists it.
5. When the owner confirms a decline, the URL MUST be recorded as declined for that Pool and MUST NOT be re-submitted by the same Curator without owner permission.
6. No response within the handshake window causes the submission to expire. The window is the manifest's `handshake_window_days` (default 14). A request's `expires_at` MUST equal its `sent_at` plus the window.

Why the confirmation step: email security scanners open every link in a message. If opening a link recorded a decision, a scanner could accept a handshake on the owner's behalf, which §5.1 forbids.

_Changed in v0.1.1:_ the links open a confirmation step instead of deciding on their own, and the window has a manifest field.

### 5.3 Withdrawal

A Profile owner MAY withdraw consent and remove themselves from any Pool at any time through the messaging channel (§6). Implementations MUST process withdrawal within 60 seconds of receipt.

### 5.4 Stricter consent models

Pools declaring `consent_model: vouching-required` or `consent_model: curator-only-adds` MAY add pre-handshake steps but MUST NOT remove the owner's ability to decline or withdraw.

### 5.5 Auto-accept

A Profile owner MAY declare auto-accept rules in their messaging preferences. An auto-accept rule tests three things:

- `intent_tags`: every tag in the rule is among the Pool's intent tags
- `minimum_curator_verification`: the Curator's level is at least this
- `allowed_visibility`: the Pool's visibility is one of these

Auto-accept defaults to off. A Profile MUST NOT have more than five active auto-accept rules. Every auto-accept event MUST produce a notification to the owner; silent acceptance is forbidden. Any auto-accept MAY be revoked retroactively, removing the Profile from any Pool it was auto-accepted into.

Auto-accept never applies to an invite-only Pool. An invitation to an invite-only Pool is personal, so the owner always answers it; this is why `allowed_visibility` accepts only `public` and `unlisted`.

_Changed in v0.1.1:_ the rule fields carry their schema names, and the invite-only limit is stated.

---

## 6. Native Messaging

### 6.1 Transport

In v0.1, Kindling messaging is delivered as structured email over standard email infrastructure. Identities map to verified email addresses (or OAuth-bound addresses). UIs MAY render the conversation as a native thread; end users MAY never see the underlying email.

### 6.2 Message envelope

Messages MUST validate against `schemas/kindling_message.schema.json`. The envelope contains: sender identity, recipient identity, message type, body, and `via_pool` (the Pool the message was triggered through, where applicable).

_Changed in v0.1.1:_ the Pool reference is named `via_pool`, as in the schema, not `pool_ref`.

### 6.3 Message types

- `handshake-request` and `handshake-response` (§5.2)
- `intro` and `reply`
- `withdrawal`: an owner leaving a Pool (§5.3)
- `system`: a protocol notice from a Pool or an implementation, not from a person. System notices cover dormancy (§9.1), curator transition (§9.3) and auto-accept (§5.5).

_Changed in v0.1.1:_ lists `withdrawal` and `system`, which the schema already allowed.

### 6.4 Forward compatibility

Future versions MAY define richer transports (federated rooms, real-time delivery, end-to-end encryption). Such additions MUST be negotiated via the envelope's `transport` field and MUST preserve email as a fallback through v1.x.

---

## 7. Spam Filtering

Spam protection is a stated requirement. A v1-conforming implementation MUST support all three layers.

### 7.1 Layer 1: identity-based gating

Messages from senders with stronger verification MUST pass. Messages from unverified senders MUST be quarantined or rejected per the recipient's per-profile preference. Curator-vouched senders MUST pass within the Pool that vouched for them.

### 7.2 Layer 2: per-profile preferences

A Profile MAY declare messaging rules in its `messaging_preferences`:

- `accept_from`: who may write first. One of `anyone`, `verified` (the default), `shared-pool` (people in a Pool with the owner), `vouched` (people a Curator vouched for in that Pool) or `none`.
- `no_cold_messages`: when true, no first message until both people have confirmed mutual interest.

A Pool MAY set `minimum_sender_verification` in its manifest's `messaging_preferences`. It is a Pool-level default for messages sent through that Pool, and applies unless a member's own rules are stricter.

Implementations MUST honor the declared rules.

Earlier drafts named the rules differently:

| Earlier name                  | v0.1.1                                       |
| ----------------------------- | -------------------------------------------- |
| `open-to-all`                 | `accept_from: anyone`                        |
| `pool-mates-only`             | `accept_from: shared-pool`                   |
| `vouched-only`                | `accept_from: vouched`                       |
| `no-cold-messages`            | `no_cold_messages: true`                     |
| `minimum-sender-verification` | the manifest's `minimum_sender_verification` |

_Changed in v0.1.1:_ the rules carry the schema's names.

### 7.3 Layer 3: shared block lists

The Kindling project MUST publish a public block list of known abusers, identified by Kindling identity. Third parties MAY publish their own block lists. Implementations MUST be able to subscribe to one or more lists and filter accordingly. Block lists MUST validate against `schemas/block_list.schema.json`.

---

## 8. Discovery

### 8.1 Surfaces

A spec-compliant Pool MUST be findable through at least one of these surfaces, and SHOULD be findable through the well-known convention (§8.3):

### 8.2 Social sharing

Pool URLs travel through Reddit, Twitter, newsletters, group chats, and word of mouth. Kindling has no opinion about how a Pool URL is shared, only that the URL resolves to a valid Pool manifest.

### 8.3 Well-known discovery file

Any domain hosting a Pool SHOULD publish a `.well-known/kindling-pool` document validating against `schemas/well_known_pool.schema.json`. Crawlers and registries MUST be able to consume this file without prior authorization.

### 8.4 Kindling public registry

The project runs a public registry of opt-in Pools at registry.kindling.dev. Listing is by curator self-submission. The registry is one consumer of the well-known convention; it MUST NOT be the only way a Pool is discoverable.

### 8.5 Third-party registries

Anyone MAY run a registry of Pools they curate or trust. The protocol treats third-party registries as first-class; a Pool's inclusion in or exclusion from any registry is a curator decision, not a protocol requirement.

---

## 9. Pool Continuity

### 9.1 Inactivity

A Curator is considered inactive if they have taken no curation action (handshake review, manifest edit, removal response) for 90 days. When this threshold is hit, the Pool MUST enter `dormant` status. Pool members MUST see a notice. The well-known file MUST reflect dormancy.

### 9.2 Active member

Any inhabitant who has accepted a handshake into the Pool, posted to the Pool, or sent a Kindling message through the Pool in the last 60 days.

### 9.3 Curator transition

A dormant Pool opens a curator-transition process. Any active member MAY nominate themselves or another active member. The participation window is 14 days. Transition succeeds if at least two-thirds of responding active members support the nominee (equivalently, fewer than one-third block). Co-curators listed in the manifest are first in line.

### 9.4 Archive

If the participation window closes without a successful transition, the Pool MUST archive. Archived Pools remain readable, profiles remain listed, but no new submissions or messages are processed. Archived Pools MAY be revived if a returning member re-opens the transition process.

---

## 10. Well-known Discovery File

### 10.1 Location

`/.well-known/kindling-pool` on the domain hosting one or more Pools.

### 10.2 Shape

A JSON document validating against `schemas/well_known_pool.schema.json`. It MUST list, for each discoverable Pool on the domain, its `manifest_url`, `visibility` and `status` (`active`, `dormant`, `archived`). Each Pool SHOULD also carry `curator_contact`, and MAY carry `name`, `intent_tags`, `geographic_scope` and `last_updated`. The file MAY carry an `operator` object saying who runs it.

_Changed in v0.1.1:_ the text now agrees with the schema (`manifest_url`, not `pool_url`), and the schema gains an optional `curator_contact`.

### 10.3 Crawler conventions

Crawlers and registries MUST respect `Cache-Control` headers on the well-known file, MUST back off on 429/5xx responses, and MUST identify themselves via a `User-Agent` that identifies both the software and a contact URL.

---

## 11. Conformance

### 11.1 Compliant Pool host

Implements §3 (manifest), §5 (handshake), §9 (continuity), and publishes a §10 well-known file.

### 11.2 Compliant Pool UI

Renders §4.5 verification levels alongside every Profile, honors §7 spam-filtering layers, supports §5.3 withdrawal, and never performs silent inclusion.

### 11.3 Compliant parser

Reads §2.2 h-card fields preferentially, records extraction provenance, respects §2.7 noindex, and stores no photo bytes.

### 11.4 Compliant messaging client

Validates envelopes against §6.2 schema, surfaces verification level, and applies §7.1 gating.

---

## 12. Versioning

### 12.1 Version field

Every manifest, parsed Profile, handshake message, native message, well-known file and block list MUST carry a `schema_version` field. Throughout v0.1.x its value is `"0.1"`: a point release does not change it.

_Changed in v0.1.1:_ the field is named `schema_version`, as in every schema, not `kindling_version`.

### 12.2 Semver

Spec versions follow SemVer. A parser or Pool encountering a newer minor version SHOULD continue to operate on the fields it understands. A parser encountering a newer major version MUST refuse to consume the document and MUST surface a clear error.

### 12.3 Deprecation

Deprecations between minor versions MUST be marked in the relevant schema and listed in CHANGELOG.md at least one minor version before removal.

---

## Appendix A: Normative references

- `schemas/parsed_profile.schema.json`
- `schemas/pool_manifest.schema.json`
- `schemas/handshake_message.schema.json`
- `schemas/kindling_message.schema.json`
- `schemas/well_known_pool.schema.json`
- `schemas/block_list.schema.json`

## Appendix B: Informative references

- IndieWeb h-card specification: https://microformats.org/wiki/h-card
- RFC 2119: Key words for use in RFCs to Indicate Requirement Levels
- Framework essay (longer narrative form): [`docs/FRAMEWORK.md`](../docs/FRAMEWORK.md)
