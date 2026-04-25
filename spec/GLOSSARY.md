# Kindling Glossary

Defined terms used in the Kindling specification and reference tooling. Capitalized usage of any of these terms in `SPEC.md` or in RFCs refers to the definition here.

---

**Active member.** An inhabitant who has accepted a handshake into a Pool, posted to it, or sent a Kindling message through it within the last 60 days. Used in Pool continuity (§9).

**Archived Pool.** A Pool that failed curator transition. Readable but inert — no new submissions or messages are processed. May be revived.

**Asker.** A person using a Kindling UI to query one or more Pools. Not a protocol actor in itself; the term is used to describe user intent in UX writing.

**Auto-accept rule.** A Profile-owner preference that authorizes automatic inclusion in Pools matching specified criteria (intent tags, curator verification level, visibility). Default off. Cap of five active rules per Profile. Every auto-accept event produces a notification; silent acceptance is forbidden.

**Block list.** A signed JSON document listing Kindling identities that a consumer should filter out of messaging, handshakes, or discovery. The Kindling project publishes a default list; third parties may publish their own. Schema: `block_list.schema.json`.

**Charter.** A Pool's free-text description of what it is for and what it is not. Required.

**Consent model.** The consent regime a Pool operates under. One of: `universal-opt-in` (default, handshake required), `vouching-required`, `curator-only-adds`. Stricter models add pre-handshake steps but never remove the owner's ability to decline or withdraw.

**Consent proof.** A reference, stored in a Pool entry, pointing to the handshake response that authorized the Profile's inclusion. Every entry MUST have one. Silent inclusion is forbidden.

**Curator.** The person (or small group) responsible for a Pool's charter, membership decisions, and conduct. Identity and verification level are visible in the manifest.

**Curator transition.** The 14-day process that opens when a Pool is dormant (§9). Active members nominate and vote; two-thirds support installs a new Curator.

**Curator vouching.** An identity verification method where a Curator attests to a Profile owner's identity, scoped to the Curator's own Pool. Does not automatically confer identity in other Pools.

**Discovery agent.** A program that reads one or more Pool manifests and answers natural-language queries against the cached profiles. Reference implementation: `tools/discovery-agent/`.

**Dormant Pool.** A Pool whose curator has been inactive for 90+ days. Triggers the curator transition process (§9).

**Envelope.** The structured outer layer of a Kindling message, carrying sender and recipient identity, message type, Pool reference, and the body. Schema: `kindling_message.schema.json`.

**Extraction source.** Per-field provenance on a parsed Profile indicating whether a value was derived from h-card markup or inferred by AI parsing. Required so downstream UIs can distinguish author-declared from inferred data.

**Grove.** (Mycelial-only term.) A rooted community inside Mycelial. Not a Kindling protocol concept. Referenced only in the Mycelial reference implementation.

**Handshake.** The consent exchange that precedes a Profile's inclusion in a Pool (§5). A handshake message is sent to the Profile's declared contact and records an explicit accept or decline. Schema: `handshake_message.schema.json`.

**h-card.** The IndieWeb microformat used as Kindling's baseline Profile schema. Parsers read h-card fields preferentially before any AI-assisted extraction.

**Identity (Kindling identity).** An owner's verified handle within the protocol. Established via email, OAuth, or curator vouching (§4). Verification level is always visible to Askers.

**Inhabitant.** (Mycelial-only term.) A member of a Grove. Used in the Mycelial reference implementation; not part of the core protocol.

**Intent tag.** A keyword describing what a Profile owner is open to or what a Pool is for. Free-form, lowercase, hyphenated. Examples: `friendship`, `dating`, `polyamorous-dating-la`, `hiking-buddies`, `co-founders`.

**Kindling message.** Any protocol-level communication between two Kindling identities (handshake-request, handshake-response, intro, reply). Transport in v0.1 is email under the hood.

**Kindling-noindex.** A Profile-level directive declaring "do not include me in any Pool." Compliant Pools, registries, and crawlers respect it.

**Manifest.** The Pool-level JSON document declaring name, curator, charter, intent tags, visibility, consent model, and the list of entries. Schema: `pool_manifest.schema.json`.

**Messaging preferences.** A Profile owner's per-profile rules for who can message them and under what conditions. Supports identity-based gating, Pool-based filtering, and cold-message controls.

**Parsed profile.** The JSON document produced by parsing a Profile source page. Cached as a sidecar inside the Pool. Schema: `parsed_profile.schema.json`.

**Photo hint.** A URL referencing an image on the Profile's source page. Photos are never cached at the Pool level; implementations that display them handle their own caching.

**Pool.** A curated collection of Profiles grouped by context (city, scene, interest, relationship orientation). A Pool has a manifest, a Curator, intent tags, visibility, and a consent model.

**Profile.** A self-hosted page published by its owner, at a URL the owner controls. Parsed on handshake accept into a structured JSON document. The Profile source is the source of truth; the parsed version is a cached projection.

**Profile owner.** The person who published and controls the Profile URL. The only party who can consent to inclusion in a Pool.

**Registry.** A directory of opt-in Pools. Kindling runs one (registry.kindling.dev); third parties may run their own.

**Submission.** A Curator's act of proposing a Profile URL for inclusion in a Pool. A submission becomes an entry only after handshake accept.

**Verification level.** One of `email-verified`, `oauth-verified`, `curator-vouched`, or `unverified`. Always visible alongside a Profile in any v1-conforming UI.

**Visibility.** A Pool's discoverability setting. One of `public`, `unlisted`, `invite-only`. Does not alter the consent model — an invite-only Pool still requires handshake consent.

**Well-known file.** The `/.well-known/kindling-pool` JSON document a domain publishes to announce the Pools it hosts. Consumed by crawlers and registries. Schema: `well_known_pool.schema.json`.

**Withdrawal.** A Profile owner's removal of consent, processed within 60 seconds and available through the messaging channel at any time. Removes the Profile from the Pool.

**Working Group.** The group that will take over Kindling governance by v1.0. One Mycelial seat, two rotating independent-implementer seats, one IndieWeb seat, and a small advisory rotation. Transition begins at v0.2.
