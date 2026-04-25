# RFC 0004: Consent and the handshake

| Field | Value |
|---|---|
| **RFC number** | 0004 |
| **Author(s)** | TranquilTech (initial maintainer) |
| **Created** | 2026-04-23 |
| **Status** | Accepted (landed in v0.1) |
| **Targets spec version** | v0.1 |
| **Related RFCs** | 0002 (Pool), 0003 (Identity), 0005 (Messaging) |

---

## Summary

Defines the consent exchange that precedes any Profile's inclusion in a Pool. A Curator submits a URL; the Pool pre-fetches a contact; the Pool sends a handshake message with accept/decline links; inclusion only happens on accept. Withdrawal is always available. Auto-accept rules are opt-in, capped at five per Profile, always notified, and revocable retroactively.

---

## Motivation

Silent inclusion — the operator adding you to a directory without asking — is the single most common trust failure of existing matchmaking software. If Kindling's consent model has any ambiguity, the protocol's legitimacy collapses. The handshake has to be unambiguous, auditable, and withdrawable.

Auto-accept exists because active members in multiple Pools hit friction if every handshake requires manual action. The design constraints are: explicit opt-in, notification on every event (no silent acceptance), retroactive revocation, and a hard cap so auto-accept doesn't become a spam vector.

---

## Detailed design

See `spec/SPEC.md` §5. Normative schema: `schemas/handshake_message.schema.json`.

Key points:

- **Flow** (§5.2): submit → pre-fetch contact → send handshake → one-click accept or decline → inclusion on accept; expiry at 14 days (configurable).
- **Decline is sticky.** A declined URL cannot be re-submitted by the same Curator without owner permission.
- **Withdrawal** (§5.3): always available through the messaging channel; processed within 60 seconds.
- **Stricter consent models** (§5.4): Pools may add pre-handshake steps but MUST NOT remove decline or withdrawal.
- **Auto-accept** (§5.5): opt-in, 5-rule cap, notification per event required, retroactive revocation.

The `consent_proof` embedded in each Pool entry is the audit artifact. It references the specific handshake response (by ID, timestamp, and signature if applicable) that authorized the inclusion.

---

## Drawbacks

- **Pre-fetching a contact method leaks signal to the Profile's host.** Any submission generates a GET to the source URL. Mitigation: pre-fetch is a normal HTTP request, indistinguishable from a regular visitor.
- **Handshake emails could be caught by spam filters at scale.** Mitigated by using a deliverability-focused transactional email service for the reference implementation and by warming the sending domain before launch.
- **Auto-accept, even with caps, is a potential abuse vector.** A coordinated Curator group could craft Pool submissions designed to match an owner's auto-accept rules and pull them into unintended contexts. Mitigation: the notification-per-event requirement and retroactive revocation make such abuse visible and reversible.
- **Decline-is-sticky is asymmetric.** A Curator who declines a submission can't be forced to re-consider, which is intentional but occasionally frustrating for genuine misunderstandings.

---

## Alternatives

- **Silent inclusion with opt-out.** Rejected on principle. The whole protocol premise is consent-first.
- **Require identity verification before handshake.** Considered. Rejected because it prevents auto-accept for unverified new users and raises friction unnecessarily. Identity verification happens at first handshake acceptance (RFC 0003).
- **No auto-accept, ever.** Considered. Rejected because friction at this volume (a dozen Pool invites per month for an active user) degrades participation.

---

## Unresolved questions

- **Pre-fetch contact discovery for Profiles that deliberately obscure their contact.** If a Profile doesn't declare an email or OAuth identifier, the Curator has no channel for the handshake. v0.1 guidance: Curator asks the owner out-of-band. Protocol-level support for anonymous handshake bootstrap is open.
- **Consent proof signature format.** v0.1 schema includes a `signature` field but doesn't constrain the scheme. Future RFC will define.

---

## Future possibilities

- Cross-implementation consent portability (a handshake acceptance on one implementation counts toward another, with cryptographic proof).
- Time-bounded consent (inclusion expires after N months, requiring renewal).
- Consent bundling (accept to a family of related Pools in one action).

---

## Adoption strategy

v0.1 launch. The reference handshake server ships with email verification and signed consent proofs. Implementations are expected to verify proof references before trusting a Pool entry.

---

## Reference implementations

- `tools/handshake/` — reference handshake server implementing the full flow.
- Mycelial v1 — first production-scale exercise of the handshake against real Grove inhabitants.

---

## How we'll know this worked

- Zero silent inclusions across all v0.1-conforming Pools (automated audit before Mycelial v1 launch, continuous monitoring after).
- Withdrawal median latency under 30 seconds measured across the reference implementation.
- Fewer than 5% of handshake emails land in spam folders at major providers after the first 90 days.
- Auto-accept revocations outnumber auto-accept regrets by at least 3:1 (captured via garden tender feedback in Mycelial).

---

## Security and abuse considerations

- **Phishing.** Handshake emails look transactional and could be spoofed. Mitigation: DKIM / SPF / DMARC on the sending domain, a verification link that routes through the Pool's canonical domain, and UX copy that tells users to verify the Pool URL before accepting.
- **Handshake-as-spam.** A bad Curator could submit arbitrary URLs to send nuisance handshake emails. Mitigation: rate limits on the handshake sender, block-list inclusion for repeat offenders, and curator identity verification requirements for publishing to the public registry.
- **Proof forgery.** A Pool could fabricate `consent_proof` references. Mitigation: signatures are supported at the schema level; conforming validators verify signatures where present.
- **Decline leakage.** A Curator learning that a person declined a Pool could use that signal adversarially. Mitigation: decline is recorded locally to the Pool; it is not broadcast to third parties.

---

## Appendix: Notes for reviewers

Consent is the load-bearing guarantee of the entire protocol. Reviewers with background in identity, GDPR / CCPA compliance, or dating-app consent failure modes are especially welcome to push on edge cases.
