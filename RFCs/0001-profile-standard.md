# RFC 0001: Profile standard

| Field | Value |
|---|---|
| **RFC number** | 0001 |
| **Author(s)** | TranquilTech (initial maintainer) |
| **Created** | 2026-04-23 |
| **Status** | Accepted (landed in v0.1) |
| **Targets spec version** | v0.1 |
| **Related RFCs** | 0002 (Pool standard), 0003 (Identity) |

---

## Summary

Defines the Profile layer of Kindling: a self-hosted page, parsed on consent into a structured JSON document. IndieWeb `h-card` is the baseline schema; AI-assisted extraction fills gaps. Photos are referenced by URL only, never cached at the protocol level. Re-parsing is trigger-based with a 24-hour debounce.

This RFC documents the design that shipped in v0.1. Future RFCs modifying any part of §2 of `SPEC.md` supersede the relevant subsection here.

---

## Motivation

Two constraints drove the design:

1. **People already publish profiles where they trust.** Building a Kindling-specific profile host would recreate the operator-in-the-middle problem Kindling is explicitly avoiding.
2. **Profiles are freeform in the wild.** A Google Doc, a Carrd page, and a Notion profile don't share a schema. The protocol has to read what's there rather than demand compliance.

h-card gives us a well-understood, decade-old baseline that a Profile owner can opt into with three HTML class names. AI extraction gives us coverage for the >90% of existing self-hosted profiles that don't have h-card markup. Photo-by-URL-only keeps the "Kindling stores nothing" property true, which is the trust guarantee the protocol rests on.

---

## Detailed design

See `spec/SPEC.md` §2. Normative schema: `schemas/parsed_profile.schema.json`.

Key points:

- **Baseline fields** (§2.4) are the required shape of a parsed Profile. All are optional on the source page; parsers emit what they find and mark missing fields explicitly rather than fabricating them.
- **Extraction provenance** (§2.3) is carried alongside each field. This is how an implementation can distinguish "this person said they live in Oakland" from "the parser guessed Oakland from three paragraphs of context."
- **Photo hints** (§2.5) are URLs only. The parsed Profile never contains image bytes. A displaying UI handles its own caching.
- **Re-parse cadence** (§2.6) is triggered by the owner pushing an update. Debouncing within 24 hours prevents edit-thrashing from causing repeated re-parses.
- **Noindex** (§2.7) is respected by every compliant parser, Pool, crawler, and registry.

---

## Drawbacks

- **AI parsing introduces non-determinism.** Two parsers may extract slightly different intent tags or location inferences from the same page. The `extraction_source` field lets UIs explain this, but it's real complexity.
- **h-card adoption is niche.** Most self-hosted profiles in the wild don't mark up h-card. AI extraction is the fallback 90%+ of the time, which means the protocol's correctness depends partly on parser quality. A bad parser produces bad Profiles.
- **Freeform input is a spam / scraping vector.** An adversarial page can try to mislead parsers. The consent handshake (RFC 0004) mitigates most abuse, but parser robustness is still a v0.1 gap worth watching.

---

## Alternatives

- **Require a Kindling-specific schema.** Rejected. Defeats the "publish where you trust" principle and recreates a platform.
- **Use schema.org `Person` as the baseline.** Considered. h-card won on decade-long stability, IndieWeb community alignment, and simpler markup.
- **Don't support AI extraction at all.** Rejected. Would require every Profile owner to hand-author h-card markup. Adoption dies.
- **Store photos.** Rejected on principle. "Kindling stores nothing" is a trust property we don't trade away.

---

## Unresolved questions

- **Parser disagreement.** If two Pools parse the same Profile and produce different `about` summaries or intent tags, which is canonical? Currently each Pool's cached version is authoritative for that Pool. A cross-Pool normalization layer may become desirable but is explicitly out of scope for v0.1.
- **Source-page rate limits.** Parsers MUST respect robots.txt and 429/5xx. No normative back-off algorithm is defined; implementations use common-sense defaults. Future RFC may standardize.

---

## Future possibilities

- Per-field signing by the Profile owner (so an implementation can verify that an intent tag was author-declared rather than parser-inferred).
- Cross-parser consensus (multiple parsers produce the sidecar; disagreement is surfaced).
- Schema.org compatibility layer for Profiles already marked up with `Person`.

---

## Adoption strategy

v0.1 launch. No migration needed — this is the inaugural spec.

---

## Reference implementations

- `tools/parser/` — reference CLI that reads a URL and emits a parsed Profile JSON using h-card detection plus an LLM fallback.
- `examples/profiles/` — three hand-authored example Profile pages exercising h-card, mixed markup, and prose-only layouts.

---

## How we'll know this worked

- Multiple independent Profile parsers ship (at least one non-Mycelial implementation by T+120).
- At least 100 Profiles parsed across the registry ecosystem within 90 days of launch, with <5% of owners requesting hard re-parses due to parser errors.
- IndieWeb community engages with at least one spec pull request.

---

## Security and abuse considerations

- **Adversarial pages.** A malicious page can attempt to mislead parsers. Because inclusion requires handshake consent (RFC 0004), a mis-parsed hostile Profile cannot appear in a Pool without the actual page owner accepting — so the harm surface is narrow.
- **Scraping.** The `kindling-noindex` directive is a polite signal, not an enforcement mechanism. Bad actors can ignore it. Block-list infrastructure (RFC 0006) is the backstop.
- **Doxing risk.** Parsers extract location. Implementations MUST surface the `location` field at the specificity the author declared and SHOULD NOT geocode to higher precision than the source stated.

---

## Appendix: Notes for reviewers

This RFC documents landed design rather than proposing new work. Open the relevant issues or a new RFC if you want to change the Profile layer; don't amend this file except to correct factual errors about what shipped.
