# RFC 0003: Identity

| Field | Value |
|---|---|
| **RFC number** | 0003 |
| **Author(s)** | TranquilTech (initial maintainer) |
| **Created** | 2026-04-23 |
| **Status** | Accepted (landed in v0.1) |
| **Targets spec version** | v0.1 |
| **Related RFCs** | 0001 (Profile), 0004 (Handshake), 0006 (Spam filtering) |

---

## Summary

Defines a layered identity model: email verification (baseline), OAuth via existing providers (familiar shortcut), and curator vouching (Pool-local). Verification level is always surfaced to Askers. Cryptographic identity and cross-Pool portability are explicitly deferred to v0.2.

---

## Motivation

Identity on Kindling serves two needs that don't align perfectly:

1. **Prove ownership of the Profile URL.** Otherwise anyone can submit anyone's page and the consent handshake is meaningless.
2. **Be usable by a non-technical person.** A protocol that requires keypair management excludes most of the people the protocol is for.

A layered model solves both. Email verification is the universal floor — anyone with an email address can reach it. OAuth is a familiar shortcut for the 80% of users who already have Google or Apple. Curator vouching handles the tight-knit-community case where asking a friend to click a verification link is silly.

---

## Detailed design

See `spec/SPEC.md` §4. Four verification levels are defined: `email-verified`, `oauth-verified`, `curator-vouched`, `unverified`.

Key points:

- **Email verification** is the baseline. On first inclusion in any Pool, the verification link is sent to the declared contact email. Successful verification binds that email as the Kindling identity.
- **OAuth** identifiers are bound to the Profile URL at authentication time. Supported providers in v0.1: Google and Apple. Implementations MAY add others.
- **Curator vouching** is local to the Pool where the vouching happened. It does not automatically grant identity in other Pools.
- **Verification level is always surfaced.** A v1-conforming UI MUST render the level alongside every Profile. Hiding it is non-conforming.

---

## Drawbacks

- **Email is a weak proof.** Someone who compromises an email account can impersonate the owner's Kindling identity. Mitigation: stronger identity (OAuth, future cryptographic) is available as an upgrade path; the verification level is visible so an Asker can weight messages accordingly.
- **OAuth ties Kindling's accessibility to third-party platforms.** If Google deprecates a flow, implementations have to track and adapt.
- **Curator vouching is trust-on-first-use, local.** If a curator vouches poorly, the Pool has a bad identity in it. The curator is the recourse, not the protocol.

---

## Alternatives

- **Require cryptographic identity from v0.1.** Rejected. UX burden excludes non-technical users; the protocol would launch with the wrong user base.
- **Use only OAuth.** Rejected. Excludes people who don't use supported providers (enterprise users, privacy-conscious users, users outside the US / EU tech bubble).
- **Self-attestation (no verification).** Rejected. Breaks the handshake's consent guarantee — anyone could add anyone.

---

## Unresolved questions

- **Identity continuity on email change.** If a Profile owner's declared contact email changes, how do they transition their Kindling identity? Current v0.1 guidance: re-verify at the new address, then claim the old identity via the messaging channel. Formal mechanism pending a future RFC.
- **OAuth provider list governance.** Who decides which providers are "supported"? v0.1 ships with Google and Apple as a pragmatic minimum; the list should probably be managed by the Working Group starting at v0.2.

---

## Future possibilities

Planned for v0.2 (see framework Future Revisions):

- **Cryptographic identity.** Keypair-based, owner publishes public key on their Profile and signs handshake responses.
- **Cross-Pool identity portability.** Once verified, skip re-verification on each Pool join.

---

## Adoption strategy

v0.1 launch. All three verification methods are supported at launch. The reference handshake server (`tools/handshake/`) implements email verification end-to-end.

---

## Reference implementations

- `tools/handshake/` — reference handshake server, includes email verification.
- Mycelial v1 (T+120) will be the first large-scale exercise of all three verification levels.

---

## How we'll know this worked

- v1-conforming UIs actually surface verification levels in visible, legible UI (not buried in a profile detail page).
- Implementations report zero confirmed identity-spoofing incidents tied to the protocol (as opposed to email-account compromise).
- Cryptographic identity lands in v0.2 on schedule, with a clean migration path for existing email-verified identities.

---

## Security and abuse considerations

- **Email compromise.** If an attacker controls a Profile owner's email, they can impersonate the owner. The protocol cannot prevent this; it mitigates by making verification level visible and by supporting stronger identity paths as upgrades.
- **Account recovery.** Kindling itself operates no central account system, so there is no "forgot password" flow to attack. Identity recovery runs through the owner's email provider or OAuth provider, not through Kindling.
- **Vouching abuse.** A curator could vouch for sockpuppet identities to pack a Pool. Mitigation: vouched identity is Pool-local, visible as such, and does not bootstrap reputation anywhere else. Shared block-list workflow (RFC 0006) is the cross-Pool defense.
- **Phishing via handshake emails.** Mitigation addressed in RFC 0004 (Handshake).

---

## Appendix: Notes for reviewers

Identity protocol veterans especially welcome to push on this RFC. The layered model is explicitly pragmatic rather than cryptographically rigorous; the design intent is to make v0.1 usable while leaving room for v0.2 to add rigor.
