# RFC 0006: Spam filtering

| Field | Value |
|---|---|
| **RFC number** | 0006 |
| **Author(s)** | TranquilTech (initial maintainer) |
| **Created** | 2026-04-23 |
| **Status** | Accepted (landed in v0.1) |
| **Targets spec version** | v0.1 |
| **Related RFCs** | 0003 (Identity), 0004 (Handshake), 0005 (Messaging) |

---

## Summary

Defines a three-layer spam-filtering model that every v1-conforming implementation MUST support: (1) identity-based gating, (2) per-profile preferences, and (3) shared block lists. Layers compound. Block lists validate against `schemas/block_list.schema.json` and are modeled after how email blocklist services work today.

---

## Motivation

Any messaging protocol with zero spam defense gets abused within weeks. Kindling's consent handshake prevents silent inclusion, but it doesn't prevent someone who has been included (or who sends cold intros) from behaving badly. Spam filtering has to be a first-class concern and has to layer cleanly so implementations can dial it up for sensitive contexts.

The three-layer structure mirrors how email spam defense actually works in practice: sender reputation (identity gating), recipient preferences (per-profile rules), and shared reputation lists (block lists). Borrowing that structure means implementations can reuse familiar patterns rather than invent new ones.

---

## Detailed design

See `spec/SPEC.md` §7.

Key points:

- **Layer 1 — identity-based gating** (§7.1). Messages from senders with stronger verification pass through. Messages from unverified senders are quarantined or rejected per recipient preference. Curator-vouched senders pass within the Pool that vouched for them.
- **Layer 2 — per-profile preferences** (§7.2). A Profile declares its own messaging rules: `open-to-all`, `pool-mates-only`, `vouched-only`, `no-cold-messages`, `minimum-sender-verification`. Implementations MUST honor declared rules.
- **Layer 3 — shared block lists** (§7.3). The Kindling project publishes a public block list. Third parties MAY publish their own. Implementations subscribe to one or more lists and filter accordingly. Schema: `block_list.schema.json`.

The three layers compound. An implementation can't pick one and skip the others and still claim v1 conformance.

---

## Drawbacks

- **Layer 2 fragments user experience.** If every Profile picks a different rule set, senders can't tell what will get through. Mitigation: keep the rule vocabulary small (v0.1 defines five options) and surface the effective rule in the recipient's Profile UI.
- **Layer 3 requires trust in list publishers.** A badly-curated block list can cause false positives that silence legitimate users. Mitigation: implementations MAY subscribe to multiple lists and MAY require consensus across lists before honoring a block. Default Kindling list SHOULD err toward under-blocking early in the project's life.
- **Verification levels have coverage gaps.** A sophisticated attacker can get email-verified with a burner address. Identity gating alone doesn't stop determined bad actors.

---

## Alternatives

- **No spam filtering in the protocol.** Rejected. Implementations would roll their own incompatible defenses and the ecosystem fragments.
- **Central Kindling-run moderation.** Rejected. Violates the "no operator in the middle" property.
- **Only block lists.** Rejected. Block lists are reactive; per-profile preferences are proactive.
- **Only per-profile preferences.** Rejected. Shifts the full burden to end users, which fails the users least equipped to configure defenses.

---

## Unresolved questions

- **Cross-list reputation.** If three independent block lists add the same identity, does that count as stronger signal than one list alone? v0.1 leaves this to implementation policy; a future RFC may standardize consensus scoring.
- **Appeals process.** v0.1 does not specify how an identity on a block list can appeal. The Kindling default list's governance is described in GOVERNANCE.md; third-party lists set their own.
- **Block-list distribution format.** v0.1 uses a signed JSON document fetched over HTTPS. A pub/sub or incremental-update mechanism is future work.

---

## Future possibilities

- **Cryptographic provenance for block-list entries** (each addition signed by the list publisher, chain-of-custody inspectable).
- **Pool-federation-level moderation** (affiliated Pools share block lists automatically).
- **Cross-implementation reputation** — an identity's track record travels with them across implementations.
- **Automated abuse-report workflow** — a standardized way to move a Kindling identity from "reported" to "on the public list."

---

## Adoption strategy

v0.1 launch. The reference `tools/blocklist-publisher/` publishes a signed JSON list. Implementations choose which lists to subscribe to at deploy time. Mycelial v1 subscribes to the Kindling default list and publishes its own Mycelial-scoped list for Grove-specific moderation.

---

## Reference implementations

- `tools/blocklist-publisher/` — tool for publishing and signing block list files.
- `examples/blocklist-example.json` — canonical example of the block list format.

---

## How we'll know this worked

- At least one non-Kindling-run block list is published within 12 months of launch (indicating the ecosystem took ownership of moderation).
- No confirmed case of a v1-conforming UI shipping without all three layers (verified by implementation spot-checks).
- Abuse reports trend down rather than up as Pools scale to more members.

---

## Security and abuse considerations

- **List poisoning.** A malicious publisher could add innocent identities to a block list. Mitigation: signature verification, implementation-level multi-list consensus, appeals process in GOVERNANCE.md.
- **Rule-stacking for abuse.** A bad actor could set `open-to-all` on their Profile and then send aggressive messages once contacted. Mitigation: recipient-side block lists and reports move the bad actor onto shared lists; per-Profile preferences don't protect the sender.
- **Sybil resistance.** Verification levels (RFC 0003) provide the backbone; cryptographic identity (v0.2) will strengthen it further.
- **Silencing through over-blocking.** An over-eager default list could silence legitimate minority voices. Mitigation: Kindling default list's governance is designed for transparency and appeals, and implementations are encouraged to combine multiple lists rather than rely on one.

---

## Appendix: Notes for reviewers

Reviewers with trust-and-safety, community moderation, or email deliverability backgrounds especially welcome. The three-layer model is a starting point; future RFCs will refine it based on real abuse patterns observed in the first 12 months.
