# Kindling

**An open protocol for human connection.**

Kindling is a published specification for finding people across self-hosted profiles. It lets anyone publish a profile (on Notion, Google Docs, Carrd, a personal site, anywhere on the open web), lets curators collect those profiles into Pools organized by context, and lets AI agents read across Pools to answer real questions about who fits what. There is no central app. There is no swipe interface unless someone builds one. There is no operator between two people who want to meet.

This repository contains the protocol specification, the JSON schemas, reference tooling, and the source code for the public Pool registry. It does not contain a consumer experience. Consumer experiences belong to implementations.

The first reference implementation lives inside [Mycelial](https://mycelial.help), launching later this year. Other implementations are encouraged.

If you have ten minutes, read the [launch essay](https://kindling.dev/launch). If you have ninety seconds, keep reading.

---

## Why this exists

Two of the most important categories of human connection (dating and friendship) have been broken by the same business model. Centralized matchmaking apps make money on the wait, not on the meeting. Friendship discovery has been worse: no category-defining product exists because friendship is harder to monetize the way dating is. Both problems share a root cause. The middle of any centralized matchmaking system is a place where the operator's interests and the user's interests diverge.

People are already routing around this in public. Dating docs on Google. Friendship spreadsheets on Notion. Personal pages on Carrd that read like dating profiles. The behavior is everywhere. What is missing is a way to search, scale, and connect across these self-hosted profiles without rebuilding the trap.

Kindling is the layer that lets the existing behavior work as infrastructure.

---

## What's in this repo

```
spec/                  The protocol specification
schemas/               JSON schemas for profiles, Pools, handshakes, messaging
tools/
  validator/           CLI: validate a Pool manifest URL
  parser/              CLI: parse a profile URL into structured JSON
  handshake/           Reference handshake server
  discovery-agent/     Starter agent: query Pools in natural language
  blocklist-publisher/ Tool to publish and sign shared block lists
registry/              Source code for the public Kindling registry
examples/              Hand-authored example Pool manifests and profiles
LICENSE                Apache 2.0 for code, CC BY 4.0 for the spec text
CONTRIBUTING.md        How to propose spec changes and submit implementations
GOVERNANCE.md          Maintainership, RFC process, working-group transition
CODE_OF_CONDUCT.md     Community standards
```

---

## Quick start (developers)

```bash
git clone https://github.com/IntelliBotique/kindling.git
cd kindling
npm install
```

**Validate a Pool manifest:**

```bash
npx kindling-validate https://example.com/pools/queer-creatives-la
```

**Parse a profile URL:**

```bash
npx kindling-parse https://sarah.example.com
```

**Run the starter discovery agent against a Pool:**

```bash
npx kindling-discover \
  --pool https://example.com/pools/queer-creatives-la \
  --query "who is up for a hike this weekend?"
```

**Deploy the registry to your own infrastructure:**

See `registry/README.md`. Designed to run on a single VPS or a small container.

If everything works, you can clone, install, validate a sample Pool, and run a discovery query in under ten minutes. If it takes longer, that is a bug. Open an issue.

---

## How it works (in 90 seconds)

Kindling is two stacked open standards.

**Layer 1: Profile standard.** A profile is whatever a person publishes at a URL. The protocol parses it. IndieWeb microformats (`h-card`) are the baseline schema; an AI parser fills in whatever the page does not mark up. The output is a JSON document any implementation can read. Kindling stores no profile data. Profiles live where their owners host them.

**Layer 2: Pool standard.** A Pool is a manifest of profile URLs grouped by context (a city, a scene, an interest, a relationship orientation). Pools are hosted as JSON in a public Git repository or behind a Pool API. A Pool declares its curator, charter, intent, visibility (public, unlisted, invite-only), and consent rules.

**Consent is opt-in via a handshake.** A profile cannot be added to a Pool without the owner accepting. The handshake uses Kindling's native messaging contract, which in v0.1 is delivered as structured email under the hood (so it inherits decades of mature spam filtering for free).

**Identity is layered.** Email verification is the baseline. OAuth via existing providers is a familiar shortcut. Curator vouching works inside tight Pools where universal verification is silly. Verification level is always visible to askers.

**Discovery is decentralized.** Pool URLs travel socially. Pools self-publish to a `.well-known/kindling-pool` discovery file so any crawler can find them. Kindling runs a public registry of opt-in Pools at [registry.kindling.dev](https://registry.kindling.dev). Anyone can run their own registry.

**Spam filtering is a three-layer model:** identity-based gating, per-profile preferences, and shared block lists.

The full spec is at [`spec/SPEC.md`](spec/SPEC.md). The framework essay (the longer narrative version) is at [kindling.dev/framework](https://kindling.dev/framework).

---

## Status

- **Framework v0.1** is in pre-launch review, targeting public release as **v0.1.1** in late spring 2026.
- **Mycelial reference implementation v1** ships late summer 2026.
- **Spec v0.2** is in draft, targeting a Q4 2026 release.
- **Working Group governance transition** completes by v1.0.

The spec is **frozen for v0.1.1**: changes during the review window land as patch-level fixes only, and everything published at v0.1.1 will be stable by the same definition that applies to all subsequent v0.1.x point releases. Substantive additions wait for v0.2.

Release notes for each version live in [`CHANGELOG.md`](CHANGELOG.md).

---

## How to contribute

Three categories of help wanted right now:

**1. Specification feedback.** Read the spec. Open issues for ambiguities, gaps, and overreach. Submit pull requests for fixes. Implementers, identity-protocol veterans, and IndieWeb regulars especially welcome.

**2. Reference implementations.** Build a Kindling client in your stack of choice. A swipe view, a list view, a search view, a printed zine, anything. Submit a link to your implementation and we will list it on the registry.

**3. Founding Pool curators.** Run a Pool. Curate it well. Document what worked and what didn't. The early curators are shaping how Pool curation works as a craft.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the RFC process and the pull-request workflow. Read [GOVERNANCE.md](GOVERNANCE.md) for who decides what.

---

## License

- **Code:** Apache 2.0 (see [LICENSE](LICENSE))
- **Spec text:** CC BY 4.0 (see [LICENSE-SPEC](LICENSE-SPEC))

The dual license is intentional. We want anyone to be able to fork, vendor, and embed Kindling code freely. We want the spec text to be reusable in books, articles, derivative specifications, and academic work without a separate negotiation. Both licenses are permissive.

---

## A note on what this is and isn't

Kindling is one promise: a protocol where the introduction is the product, where the introduction does its job and disappears, and where no one in the middle has a financial reason to keep two people apart.

This repo does not contain a consumer experience. It does not contain a hosted dating app. It does not contain anything you can install and use as an end user today. Those are jobs for implementations. The first one ships later this year. The protocol is the thing this project ships now, and the protocol is the thing this project will keep shipping.

If that resonates, the rest of the documentation is yours to read.

The fire starts here.

---

## Links

- **Site:** [kindling.dev](https://kindling.dev)
- **Public Pool registry:** [registry.kindling.dev](https://registry.kindling.dev)
- **Launch essay:** [kindling.dev/launch](https://kindling.dev/launch)
- **First reference implementation (Mycelial):** [mycelial.help](https://mycelial.help)
- **Maintainer contact:** maintainers@kindling.dev
- **Code of Conduct concerns:** conduct@kindling.dev
