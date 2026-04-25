# RFC 0002: Pool standard

| Field | Value |
|---|---|
| **RFC number** | 0002 |
| **Author(s)** | TranquilTech (initial maintainer) |
| **Created** | 2026-04-23 |
| **Status** | Accepted (landed in v0.1) |
| **Targets spec version** | v0.1 |
| **Related RFCs** | 0001 (Profile), 0004 (Handshake), 0007 (Discovery) |

---

## Summary

Defines the Pool layer: a manifest plus a list of consented Profile entries, hosted as JSON either in a public Git repo or behind an API returning the same shape. Manifests declare curator, charter, intent, visibility, and consent model. Pool continuity handles curator inactivity via a 90-day dormancy threshold and a 14-day transition window.

---

## Motivation

Kindling is not a directory; it's a collection of context-specific directories (Pools) each run by someone accountable for what goes in and what doesn't. Making Pools loosely coupled to Profiles (by URL) rather than owning them lets Profiles appear in many Pools and gives Pool curation a practical unit of work that fits how small communities already operate.

The Pool continuity design (§9) was added because Pools accumulate value over time. A Pool whose curator goes silent shouldn't strand its members. The two-thirds transition threshold and the 14-day window are chosen to be slow enough to prevent a drive-by takeover and fast enough that a Pool doesn't languish for months.

---

## Detailed design

See `spec/SPEC.md` §3 (manifest shape) and §9 (continuity). Normative schema: `schemas/pool_manifest.schema.json`.

Key points:

- **Required fields** (§3.2) are the minimum that lets a UI render a Pool: name, curator, intent tags, visibility, consent model, curator contact, charter.
- **Consent model defaults** to `universal-opt-in`. Pools MAY declare stricter variants but MUST NOT remove the owner's ability to decline or withdraw.
- **Pool entries** (§3.4) carry `consent_proof` — a reference to the handshake response authorizing inclusion. This is the audit trail that makes silent inclusion detectable.
- **Continuity** (§9) uses a 90-day curator-inactivity threshold, a 14-day transition window, and a two-thirds threshold for successful nomination. Co-curators listed in the manifest have first refusal.

---

## Drawbacks

- **Two-thirds thresholds are sometimes gameable.** In very small Pools (say, five members), a 2-of-3 quorum is easier to swing. Mitigation: future RFC may introduce minimum-participation floors.
- **14-day transition is slow for urgent situations.** A Pool whose curator has been abusive rather than just absent needs a different path. Block-list workflow (RFC 0006) handles some of this; a formal curator-removal RFC is future work.
- **Universal-opt-in creates friction for closed groups.** A tight group where everyone already knows each other may find handshakes redundant. `vouching-required` and `curator-only-adds` offer pre-handshake workflows but never let the Curator skip consent entirely.

---

## Alternatives

- **No Pool layer at all.** Rejected. Without Pools, Kindling would just be a Profile format, and the coordination problem (finding the right people in the right context) goes unsolved.
- **Centrally-hosted Pools.** Rejected. Defeats the whole "no operator in the middle" design.
- **Federated Pools from day one.** Deferred. v0.1 Pools are independent; Pool-to-Pool federation is a framework Future Revisions item.
- **One-third blocking threshold instead of two-thirds support.** Rejected as primary framing but mathematically equivalent.

---

## Unresolved questions

- **Pool-level block lists.** A Pool may want to subscribe to its own block list. The schema supports `block_list_subscriptions`; guidance on when Pool-level vs Profile-level filtering applies is still loose.
- **Archived Pool revival.** Technically supported; UX for revival is undefined.

---

## Future possibilities

- Pool-to-Pool federation (sharing block lists, vouching standards, consent models across affiliated Pools).
- Multi-curator workflows beyond a simple list (review queues, rotation schedules, recusal).
- Pool-level analytics for curators.

---

## Adoption strategy

v0.1 launch. The five default Mycelial Pool templates (per category enum) are seeded at launch. Independent curators are recruited during T-30 to T-0 (see `03_Kindling_GTM_Launch_Plan.md`).

---

## Reference implementations

- `tools/validator/` — validates a Pool manifest URL against the schemas.
- `registry/` — source code for the public registry.
- `examples/pools/` — three hand-authored Pool manifests (neurodivergent-friendships, polyam-dating-bay-area, queer-creatives-la).

---

## How we'll know this worked

- 25+ Pools registered to the public registry from non-Mycelial curators within 60 days of launch.
- Zero confirmed cases of silent inclusion across all registered Pools (verified by automated audit against `consent_proof`).
- At least one Pool successfully completes a curator transition within the first 12 months.

---

## Security and abuse considerations

- **Consent proof forgery.** A malicious Pool host could fabricate `consent_proof` references. Mitigation: the handshake server (RFC 0004) signs responses; any implementation MAY verify signatures on proofs before trusting a Pool entry.
- **Takeover via nomination spam.** A coordinated group joining a dormant Pool to vote in a hostile curator. Mitigation: the active-member definition (§9.2) requires 60-day prior activity in the Pool, making ballot-stuffing impractical without advance planning.
- **Visibility abuse.** An `unlisted` Pool isn't secret — its URL is just not in the public registry. Curators should be told this plainly; the README and CONTRIBUTING.md say so.

---

## Appendix: Notes for reviewers

The Pool continuity design was the most-debated section during pre-launch review. Thresholds (90 / 14 / two-thirds / 60-day active window) were chosen as defensible defaults and are expected to be refined by RFC as real usage produces data.
