# Kindling

## An Open Protocol for Human Connection

*A TranquilTech framework. Version 0.3, April 2026.*

---

## Summary

Kindling is an open protocol for finding people. It is published as a public specification on GitHub and maintained as a community project. The protocol describes how anyone can publish a freeform profile, how curators can collect those profiles into Pools, how a consent handshake brings a profile into a Pool with the owner's permission, and how any UI a developer wants to build can sit on top.

The first reference implementation lives inside Mycelial, where Pools serve the connection needs of rooted Grove inhabitants. Other implementations are encouraged.

## Why this exists

Two of the most important categories of human connection have been broken by the same business model.

Dating apps charge people for hope. The product is the wait, and the revenue depends on the wait continuing. Friendship discovery has been worse. No one has built a category-defining product for it because friendship is hard to monetize the way dating is. Both problems have the same shape: the incentives of a centralized operator pull against the outcome the person actually wants.

People are working around this in public. Google Docs of single friends. Notion pages listing who is open to coffee. Carrd sites that read like personal ads. Group chats that double as introduction networks. The behavior already exists. What is missing is a way to search, scale, and connect across these self-hosted profiles without rebuilding the trap.

Kindling is the layer that lets those scattered, self-hosted lists work together.

## The protocol in one paragraph

A person hosts a profile wherever they already trust (Notion, Google Doc, personal site, Carrd, GitHub README, plain HTML). A Pool curator submits that profile URL to a Pool. The Pool sends the profile owner a handshake message. If the owner accepts, the Pool parses the page, caches the structured profile, and lists the profile in the Pool. Askers query Pools through any compliant UI. AI agents read the cached profiles and surface matches. Two people who decide to talk exchange messages through Kindling's native messaging contract, which is delivered as email under the hood. Implementations can render any of this however they like.

That is the whole protocol. Everything below is the detail required to build it.

## The two layers

Kindling is built as two stacked open standards:

**Layer 1, Profile standard.** A freeform self-hosted page becomes a structured profile. The standard borrows IndieWeb microformats (`h-card`) as the explicit baseline schema, then uses AI parsing to fill in whatever the page does not mark up. The output is a JSON document that any implementation can read.

**Layer 2, Pool standard.** A Pool is a manifest that lists structured profiles, declares its curator, intent, visibility, and consent rules, and exposes a discovery contract any AI agent can query.

A developer can build any UI on top: a Tinder-style swipe deck, a Reddit-style browse view, a Craigslist-style list, a chat-driven search box, a printed zine. The UI is implementation-defined. The two layers underneath are the protocol.

## Profiles

A profile is whatever the owner publishes at a URL, with no required format. The protocol parses what is there.

**Baseline schema: IndieWeb h-card.** A profile owner who wants the most predictable parsing adds h-card markup to their page. This is a small set of HTML class names that signal "this is a name," "this is a photo," "this is a location." The format is a decade old, well-documented, and works with any platform that lets you write HTML or include a `<div>`.

**AI extraction fills the rest.** When a profile is added to a Pool (after the handshake completes), the Pool host runs an AI parser over the page. The parser reads h-card if present, and otherwise infers fields from prose, layout, and embedded media. Extracted fields include:

- Display name
- Pronouns (if stated)
- Location (city / region / "remote" / "anywhere")
- Photos (URLs to images on the source page)
- What the person is open to (intent tags: friendship, dating, networking, hiking buddies, co-founders, and so on)
- Free-text "about me" (the page in compressed form)
- Declared contact methods (email, social handles, scheduling links)
- Declared verification level (see Identity below)
- Per-profile messaging preferences (see Spam filtering below)

The parsed profile is cached as a JSON sidecar on the Pool. Re-parsing is triggered by the profile owner pushing an update; there is no time-based default cadence. To prevent thrashing on small edits, a Pool will re-parse a given profile at most once per 24 hours, even if the owner pushes multiple updates within that window. The profile owner can also force a hard re-parse on demand through the messaging channel.

Photos are referenced by URL only, never copied. The parsed profile carries a `photo_hints` field listing image URLs found on the source page. Caching of photos for performance is the responsibility of the implementation that displays them: a swipe-style UI may cache locally, a list-style UI may render fresh from the source URL on each load. Kindling itself stores no images, and Pools do not store images.

A profile can carry a `kindling-noindex` directive to declare "do not include me in any Pool." Compliant Pools and crawlers respect this signal.

## Pools

A Pool is a manifest plus a list of profile entries. It is hosted as a JSON document, either in a public Git repository or behind a Pool API endpoint that returns the same shape.

**Required fields in a Pool manifest:**

- `name`: human-readable Pool name
- `curator`: one or more verified Kindling identities, with verification level visible
- `intent_tags`: what the Pool is for (e.g., `friendship`, `dating`, `professional`, `hiking`, `polyamorous-dating-la`)
- `visibility`: `public`, `unlisted`, or `invite-only`
- `consent_model`: defaults to `universal-opt-in` (handshake required); a Pool can declare stricter variants such as `vouching-required` or `curator-only-adds`
- `curator_contact`: how a profile owner can reach the curator about removal, complaints, disputes
- `charter`: free-text description of what the Pool is for and what it is not

**Optional fields:**

- `geographic_scope`: used when a Pool is location-specific
- `governance_rules`: how curators are added, how disputes are handled (defaults to a sensible boilerplate when not specified)
- `created_at`, `updated_at`
- Pool-level messaging preferences and block list subscriptions

**Pool entries** are an array of structured profiles, each containing:

- `profile_url`: the canonical source URL
- `parsed_profile`: the cached JSON sidecar
- `parsed_at`: last parse timestamp
- `consent_proof`: reference to the handshake response that authorized inclusion
- `verification_level`: what kind of identity proof the profile owner has

A profile can appear in many Pools. A Pool can list many profiles. Pools and profiles are loosely coupled by URL.

## Pool continuity

Pools are valuable infrastructure for the people in them, and the protocol has to handle the case where a curator goes silent without putting the Pool's members at the mercy of one person's calendar.

**Curator inactivity.** A curator is considered inactive if they have taken no curation action (handshake review, manifest edit, removal request response) for 90 days. When this threshold is hit, the Pool enters `dormant` status. Pool members see a notice. The well-known discovery file flips to indicate dormancy so registries and crawlers can show the same signal.

**Curator transition.** A dormant Pool opens a curator-transition process. Any active member can nominate themselves or another active member as the new curator. Active members vote within a 14-day participation window. The transition succeeds if at least two-thirds of responding members support the nominee (equivalently, fewer than one-third block). If a Pool has co-curators already listed in the manifest, they are first in line to assume primary curation and the broader transition only opens if no co-curator steps up.

**Active member.** Defined as any inhabitant who has accepted a handshake into the Pool, posted to the Pool, or sent a Kindling message through the Pool, in the last 60 days.

**No takeover.** If the participation window closes without a successful transition, or if no one nominates themselves, the Pool is archived. Archived Pools remain readable, profiles remain listed, but no new submissions or messages are processed. Archived Pools can be revived if a former member returns and re-opens the transition process.

This entire flow is described in the spec, and the well-known discovery file format includes the necessary status fields so registries and implementations can render the right state without polling the Pool's curator directly.

## Identity

A profile owner needs a way to prove they actually control the URL they published. Kindling supports a layered identity model. Any one of these establishes a Kindling identity, and the verification level is always visible to askers.

**(1) Email verification.** The baseline. The profile lists a contact email. The first time the profile is brought into any Pool, Kindling sends a verification link to that email. The verified email becomes the owner's Kindling identity. Lowest friction, broadest reach.

**(2) OAuth via existing platforms.** The owner authenticates with Google, Apple, or another supported identity provider. That identity is bound to the profile URL. Familiar to most people. Useful for owners who would rather not manage a separate verification flow.

**(3) Curator vouching.** A Pool curator vouches for the profile owner inside their Pool. The identity is local to that Pool. Useful for tight, trust-based Pools where running someone through email verification is overkill (a friend group, a small healing community, an alumni network). A profile carrying only curator-vouched identity in one Pool does not automatically inherit identity in another Pool.

Implementations are required to surface the verification level next to a profile so askers can judge for themselves.

## Consent and the handshake

A profile is added to a Pool only after the owner accepts. There is no silent inclusion.

**The handshake flow:**

1. A curator submits a profile URL to a Pool.
2. The Pool's parser does a lightweight pre-fetch of the URL to find a contact method (h-card email, declared contact, OAuth identifier).
3. The Pool sends a handshake message to that contact, containing: the Pool's name, charter, curator identity, intent tags, visibility, and a one-click accept link plus a one-click decline link.
4. If the owner accepts, the Pool parses the page in full, caches the structured profile, and lists it.
5. If the owner declines, the URL is recorded as declined for that Pool and cannot be re-submitted by the same curator without owner permission.
6. If the owner does not respond within a configurable window (default 14 days), the submission expires.

A profile owner can withdraw consent and remove themselves from a Pool at any time, through the same messaging channel.

Pools that declare `consent_model: vouching-required` or `consent_model: curator-only-adds` add additional steps, but never remove the owner's ability to decline or withdraw.

**Auto-accept (optional).** A profile owner can declare a small set of auto-accept rules in their messaging preferences. An auto-accept rule consists of: matching intent tags, a minimum curator verification level, and a Pool visibility constraint. Auto-accept defaults to off; opting in is explicit. Each auto-accept event still produces a notification to the owner (silent acceptance is forbidden), and any auto-accept can be revoked retroactively, removing the profile from any Pool it was auto-accepted into. A profile can declare at most five active auto-accept rules.

## Native messaging

The handshake is a message. The first contact between two people who discover each other is also a message. Kindling defines a minimal native messaging contract so both work the same way and can be rendered by any compliant UI.

**Transport: email under the hood.** A Kindling message is a structured email envelope sent over standard email infrastructure. Identities map to verified email addresses (or to OAuth-bound addresses). Messaging UIs render the conversation natively, with Kindling metadata in custom headers. End users may never see the underlying email at all.

**Why email:**

- Spam filtering inherits decades of work by Gmail, Fastmail, Proton, and others
- No one has to host an inbox; everyone already has email
- The protocol can ship without standing up a federation
- Implementations remain free to render conversations as chat threads, message inboxes, or anything else

The message envelope contains: sender Kindling identity, recipient Kindling identity, message type (`handshake-request`, `handshake-response`, `intro`, `reply`), the message body, and references to the Pool the message was triggered through.

Implementations are free to upgrade to a more native chat experience (federated rooms, real-time delivery) in later versions of the spec. Email is the v1 baseline because it ships now.

## Spam filtering

Spam protection is a stated requirement. Kindling specifies a three-layer model that any compliant implementation should support.

**Layer 1, identity-based gating.** Messages from senders with stronger verification (OAuth-bound or email-verified) pass through. Messages from unverified senders are quarantined or rejected per the recipient's preference. Curator-vouched senders pass within the Pool that vouched for them.

**Layer 2, per-profile preferences.** A profile can declare its own messaging rules: "only accept messages from people in a Pool I am also in," "only accept handshakes from curators with at least X verification," "no cold messages, only intros from confirmed mutual interest," "open to all." Implementations honor the declared rules.

**Layer 3, shared block lists.** The Kindling project publishes a public block list of known abusers, identified by Kindling identity. Third-party registries can publish their own block lists. Implementations subscribe to one or more lists and filter accordingly. Modeled after how email blocklist services work today.

These three layers compound. A v1-conforming UI implements all three.

## Discovery

Pools are findable through four surfaces. A spec-compliant Pool is reachable by any of them.

**(1) Social sharing.** Pool URLs travel through Reddit, Twitter, newsletters, group chats, and word of mouth. Always primary. Kindling has no opinion about how a Pool URL is shared, only that the URL resolves to a valid Pool manifest.

**(2) Well-known URI convention.** Any domain hosting a Pool publishes a `.well-known/kindling-pool` discovery file. Crawlers, search engines, and registries can find Pools without a central authority knowing about them in advance.

**(3) The Kindling public registry.** The project itself runs a public registry of opt-in Pools, listed by category, geography, and intent. Curators can self-register their Pool. The registry is one consumer of the well-known convention, never the only one.

**(4) Third-party registries.** Anyone (a city, a community, a publisher, a network) can run their own registry of Pools they curate or trust. The protocol treats third-party registries as first-class.

## Reference implementation: Pools inside Mycelial

The first implementation of Kindling ships inside Mycelial, the rooted layer of the TranquilTech Village Network. Inside Mycelial, Pools become the way Grove inhabitants find each other within and across Groves.

A Grove can host its own Pools (a "looking for a coffee buddy" Pool, a "dating-open in this Grove" Pool, an "available to mentor on integration work" Pool). Pools can also span Groves through the Mycelial Network, so a person rooted in a Trauma-Informed Grove in Austin can be found by someone in a Psychedelic Integration Grove in Berlin who is asking the right question.

Inside Mycelial, profiles can live on a Grove inhabitant's existing site or be generated from the inhabitant's Mycelial presence. Pool curation falls to facilitators and garden tenders, who already steward the safety and texture of their Groves. Discovery happens through Blossom, the intelligence layer that already understands the inhabitant's context. The native messaging spec is rendered as Mycelial's existing message thread UI, so a Grove inhabitant never sees that the underlying transport is email.

The Mycelial implementation is the first real test of the protocol. It is also the proof that Kindling is buildable and useful.

## Why open source first

The product is the protocol, and the protocol earns trust by being inspectable. A closed dating app asking people to trust it has no leverage. A published specification that anyone can audit, fork, and re-implement has a different kind of leverage — and a permissive license that prevents any single company, including TranquilTech, from owning the standard.

Publishing the protocol first also makes the work durable. If TranquilTech disappears tomorrow, Pools keep working. Profiles keep being readable. Other implementations keep running. That property is the whole point.

## Sustainability without extraction

Kindling itself takes no money from people looking for connection. The protocol is free. The reference implementation inside Mycelial is free at the connection layer.

Future versions of the framework will introduce optional, post-result revenue surfaces for implementations that want to fund themselves (see the Future Revisions section at the end of this document for the planned design). The principle that holds across every version: any economic relationship in Kindling happens after a connection has succeeded, never before, and the connection layer itself stays free.

## What is in the v0.1 GitHub repository at launch

- The protocol specification (this document, expanded into per-section RFCs)
- The Pool manifest JSON schema with examples
- The parsed-profile JSON schema with examples
- A reference Pool manifest validator (command-line tool)
- A starter discovery agent that reads any Pool URL and answers natural-language queries locally
- A reference handshake implementation
- A reference messaging envelope implementation
- The well-known URI specification
- The Kindling public registry's source code
- A reference shared block list with publishing tooling
- Contribution guidelines, governance notes, and the project license
- A short reading list explaining the design choices and the IndieWeb h-card lineage

What is not in the first release: a hosted dating app, a brand consumer experience, a commercial product. Those belong to implementations.

## Roadmap

**Phase 1, framework publication.** The repository goes public. The specification, schemas, validator, starter agent, registry source, and block list tooling are all available. Outreach focuses on the open-source community, builders working on adjacent problems, IndieWeb regulars, and the small number of writers who already understand why this category has been broken.

**Phase 2, Mycelial reference implementation.** Pools ship inside Mycelial, used first by a small number of facilitator-led Groves. Real connections happen. Patterns get documented and fed back into the specification. The reference implementation becomes the working proof that the protocol is buildable and useful.

**Phase 3, ecosystem.** Independent implementations appear. Pool curators run their own city, scene, or interest-specific Pools. Third-party registries appear. The protocol gets refined through real usage by people who do not work for TranquilTech.

**Governance transition.** TranquilTech is the initial maintainer for v0.1 and the early point releases. Beginning at v0.2, additional maintainers from independent implementations and IndieWeb are invited to share commit responsibility. By v1.0, governance fully transitions to the Kindling Working Group: one Mycelial maintainer seat, two independent-implementer seats (rotating, elected by registered implementations), one IndieWeb representative seat, and a small advisory rotation. Decisions move through a lightweight RFC process modeled on the Rust RFC repo. The transition is gradual on purpose; the goal is for the working group to take over a project that is already in motion, not one that has stalled waiting for the handoff.

## A note on what this is

Kindling is one promise: a protocol where the introduction is the product, where the introduction does its job and disappears, and where no one in the middle has a financial reason to keep two people apart.

The fire starts here.

---

## For contributors and early collaborators

The first version of the specification is open for review and pull requests at the Kindling GitHub repository (link to be published with launch). Three categories of help are wanted right away:

**Specification feedback.** Read the protocol spec. Tell us where it is ambiguous, where it overreaches, where it under-specifies, and where it should be split into smaller documents. Implementers, IndieWeb veterans, and identity / messaging protocol folks especially welcome.

**Reference implementations.** Build a discovery agent in your stack of choice. Build a Pool host. Build a profile generator. Build a UI that does swipe, browse, search, or anything else. Submit a link to your implementation and we will list it in the registry.

**Founding Pool curators.** Run a Pool. Curate it well. Document what worked and what did not. Pool curation is the most important and least understood role in the network, and the early curators will shape how it works.

If you want to build an implementation that is more than a research project, talk to us. The Mycelial team is documenting everything we learn from the first reference implementation in public and is actively looking for collaborators.

---

*Kindling is published by TranquilTech as a contribution to the public infrastructure of human connection. The protocol is licensed permissively. The reference implementation inside Mycelial is one of many possible homes for the protocol, and is intentionally not the only one.*

---

## Future Revisions

This section describes capabilities that are out of scope for v0.1 and v1 but that are part of Kindling's longer plan. Each is named here so contributors and implementers can see where the protocol is going, and so future Kindling versions land as advancements of a stated direction rather than surprise additions.

### Sustainability surfaces (planned for v0.2 and v1.1)

**Gratitude offerings.** After a meaningful connection, a person can choose to leave a token of thanks. The implementation may offer a small digital keepsake the two new connections can share, designed by community contributors. This is voluntary and post-result, never gated and never required. Planned for first appearance in Mycelial v1.1, with a corresponding spec addition in framework v0.2.

**The Hall of Flame.** People who find a life partner through a Kindling implementation can choose to commemorate the story in a public archive. A one-time contribution funds the archive's upkeep and the protocol's ongoing development. The framing is simple: the average dating app user spends well over $150 on premium features for the chance to meet someone. Contributing $100 to celebrate a connection once it is real is a different economic relationship. Planned for Mycelial v1.2 with the corresponding archive infrastructure as a public good shared across implementations.

Neither of these surfaces depends on keeping anyone single, lonely, or scrolling. Both are explicit components of the long-term economic model and are deferred from v0.1 and v1 only because the project priority is to first prove that the connection layer works.

### Identity upgrades (planned for v0.2)

**Cryptographic identity.** A keypair-based identity option, where the profile owner publishes a public key on their profile and signs handshake responses. Stronger than email or OAuth verification. Requires UX work to be usable by non-technical owners.

**Cross-Pool identity portability.** Once an owner has verified their identity, the verification can be re-used across Pools without repeating the email-verification ceremony every time. Reduces friction for active inhabitants who join many Pools.

### Messaging upgrades (planned for v0.3 or later)

**Federated messaging.** A move beyond email-under-the-hood to a real federation (Matrix-style rooms or AT Protocol DMs are the candidate models). Enables real-time delivery, richer conversation semantics, and reduces dependence on email infrastructure. Considered only after email transport has shipped and stabilized.

**End-to-end encryption.** Once federated transport exists, layer end-to-end encryption on the messaging contract. Particularly important for sensitive Pools (healing, dating, abuse-survivor networks).

### Discovery upgrades

**Cross-implementation reputation.** A protocol-level way to recognize a contributor's track record (curation quality, reliable handshake responses, no spam reports) across many Pools and implementations. Designed to give curators and active inhabitants social capital that travels with them.

**Federated registries.** Independent registries can subscribe to each other's Pool listings, propagating discovery without any single registry becoming a bottleneck.

### Cross-Pool moderation

**Shared incident response.** A protocol convention for reporting bad actors across Pools, with cryptographic provenance so a report's origin and chain of custody are inspectable. Pairs with the existing shared block list infrastructure but adds the workflow for getting a person onto a block list in the first place.

**Pool federations.** Pools can declare federation relationships with each other, sharing block lists, vouching standards, and consent models. Useful for affiliated communities (a network of city-specific friendship Pools, a federation of healing communities).

### Spec governance (planned through v1.0)

The transition to a Kindling Working Group described in the Roadmap completes by v1.0. Full details on seat selection, rotation cadence, and RFC process land in the GOVERNANCE.md file, which evolves alongside the protocol.

---

This section will grow as the working group identifies what the next versions need. It will shrink as items move from "future" to "shipped."
