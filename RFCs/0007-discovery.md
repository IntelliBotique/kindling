# RFC 0007: Discovery

| Field | Value |
|---|---|
| **RFC number** | 0007 |
| **Author(s)** | TranquilTech (initial maintainer) |
| **Created** | 2026-04-23 |
| **Status** | Accepted (landed in v0.1) |
| **Targets spec version** | v0.1 |
| **Related RFCs** | 0002 (Pool standard) |

---

## Summary

Defines four discovery surfaces for Pools: social sharing, a `.well-known/kindling-pool` convention, the Kindling public registry, and third-party registries. A spec-compliant Pool MUST be reachable through at least one surface and SHOULD publish a well-known file. No surface is privileged — the public registry is one consumer of the well-known convention, never the only one.

---

## Motivation

The protocol can't centralize discovery without recreating the operator-in-the-middle problem. It also can't rely exclusively on social virality without becoming unusable for anyone outside the founder's network. The four-surface design lets Pools travel however they travel — a Reddit link, a Twitter post, a city-specific directory, a public registry, a federated index — while making every Pool mechanically findable by any crawler that knows the well-known convention.

The well-known file is the single most important design decision in this section. It is the contract that makes third-party registries first-class: anyone can index Pools without asking permission, which means no registry (including Kindling's own) can become a bottleneck.

---

## Detailed design

See `spec/SPEC.md` §8 and §10. Normative schema: `schemas/well_known_pool.schema.json`.

Key points:

- **Social sharing** (§8.2) is primary and unregulated. The protocol has no opinion.
- **Well-known file** (§8.3, §10): `/.well-known/kindling-pool` on any domain hosting one or more Pools. Lists each Pool's name, URL, visibility, intent tags, status, and curator contact. Crawlers MUST respect `Cache-Control`, back off on 429/5xx, and identify themselves via User-Agent.
- **Kindling public registry** (§8.4): curator self-submission. One consumer of the well-known convention. MUST NOT be the only discovery surface.
- **Third-party registries** (§8.5): first-class. Anyone may run one.

---

## Drawbacks

- **Well-known file does not itself prove authority.** Anyone can publish a file listing Pools they don't actually host. Mitigation: crawlers MUST verify that each listed Pool URL resolves to a valid manifest signed by a plausible curator identity before surfacing it.
- **Registry fragmentation.** If fifty registries exist, users may not know which to use. Mitigation: expect this; the Kindling default registry remains a neutral starting point, and third-party registries can federate (see Future Revisions in the framework essay).
- **Discovery takes longer than a centralized index would.** A decentralized discovery graph doesn't propagate as quickly as a central database. Acceptable trade-off.

---

## Alternatives

- **Central registry only.** Rejected. Single point of failure and recreates the operator-in-the-middle problem.
- **No discovery convention.** Rejected. Pools become unfindable except through social posts; the protocol fragments into private bubbles.
- **DHT-based peer discovery.** Considered. Rejected for v0.1 on complexity grounds; well-known file achieves 80% of the benefit at 5% of the cost. Revisit if Pool count grows beyond what registries can index.
- **Require DNS TXT records.** Considered. Rejected because requiring DNS control adds a barrier for Pool curators hosting on platforms where they control a path but not the domain.

---

## Unresolved questions

- **Registry-to-registry propagation.** Third-party registries could subscribe to Kindling's registry and vice versa; a protocol convention for federated registry sync is future work.
- **Stale well-known files.** If a Pool archives but the well-known file still lists it as active, crawlers get stale data. v0.1 mitigation: the file's `status` field reflects dormancy and archive. Enforcement on curators who don't update is informal.
- **Rate limiting for crawlers.** No normative rate-limit is specified. Implementations use common-sense defaults.

---

## Future possibilities

- **Federated registries** (independent registries subscribing to each other, propagating discovery without any bottleneck).
- **Discovery via DNS TXT records** as an additional surface for Pools whose curators own a domain.
- **Cross-Pool search** — a standard query interface that a discovery agent can hit against any registry.

---

## Adoption strategy

v0.1 launch. The public registry is deployed at registry.kindling.dev and accepts curator submissions. The reference discovery agent (`tools/discovery-agent/`) can query any Pool URL directly and does not require going through a registry.

---

## Reference implementations

- `registry/` — source code for the Kindling public registry, deployable to a single VPS.
- `tools/discovery-agent/` — starter discovery agent that reads one or more Pool URLs and answers natural-language queries locally.
- `examples/well-known-example.json` — canonical example of the well-known file format.

---

## How we'll know this worked

- At least one third-party registry exists within 12 months of launch.
- At least 80% of registered Pools publish a well-known file (measured by crawling the hosting domains of registered Pools).
- Discovery agent implementations appear in stacks other than Node.js (Python, Go, Rust) within 12 months, confirming the spec is clear enough to re-implement.

---

## Security and abuse considerations

- **Fake registry entries.** A bad actor could submit fabricated Pool URLs to a registry. Mitigation: registry self-submission includes a curator-identity verification step (see `registry/` implementation), and the registry periodically re-validates that listed Pools still resolve to valid manifests.
- **Crawler abuse.** An aggressive crawler could hammer small Pool hosts. Mitigation: the spec requires User-Agent identification with a contact URL and respect for `Cache-Control` and 429/5xx responses. Pool hosts can escalate by blocking misbehaving crawlers.
- **Discovery-layer surveillance.** A centralized registry sees who is looking for what. Mitigation: multi-registry ecosystem, well-known convention that works without any registry, and a local-first discovery agent that doesn't require a central server for queries.
- **Status-field tampering.** A curator could misreport their Pool's status (e.g., claim active when dormant). Mitigation: crawlers and registries can independently verify activity signals from the manifest and flag mismatches.

---

## Appendix: Notes for reviewers

Reviewers with experience running decentralized discovery systems (IndieWeb, Webfinger, DNS-based directories) are especially welcome. The four-surface design is informed by those prior arts; improvements that make the well-known convention more robust are high-value contributions.
