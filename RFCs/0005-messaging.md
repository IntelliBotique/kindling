# RFC 0005: Native messaging

| Field | Value |
|---|---|
| **RFC number** | 0005 |
| **Author(s)** | TranquilTech (initial maintainer) |
| **Created** | 2026-04-23 |
| **Status** | Accepted (landed in v0.1) |
| **Targets spec version** | v0.1 |
| **Related RFCs** | 0004 (Handshake), 0006 (Spam filtering) |

---

## Summary

Defines the minimal native messaging contract. Transport in v0.1 is structured email over existing email infrastructure. Messages validate against `schemas/kindling_message.schema.json`. Four message types are defined: `handshake-request`, `handshake-response`, `intro`, `reply`. Implementations are free to render conversations as threads, chat, or anything else.

---

## Motivation

Messaging is the only part of the protocol that has to happen in both directions across operator boundaries: the handshake is a message, the first contact between two people is a message, and withdrawal is a message. We had two options — ship a new federation now, or borrow one.

Email wins on three grounds:

1. **Ships this year.** A federated chat standard to rival email's deliverability maturity doesn't exist yet. Matrix and AT Protocol are both plausible v0.3+ paths; neither is ready to carry Kindling's first launch.
2. **Inherits decades of spam filtering.** Gmail, Fastmail, Proton, and the rest have spent twenty years on deliverability, classification, and anti-abuse. Starting over is wasteful.
3. **Everyone already has email.** No new inbox to host, no new account to create.

The trade-off — end users see their conversations rendered as Kindling threads but the bytes on the wire are email — is acceptable for v0.1 and explicitly time-bound: federated transport is on the v0.3 roadmap.

---

## Detailed design

See `spec/SPEC.md` §6. Normative schema: `schemas/kindling_message.schema.json`.

Key points:

- **Transport.** Structured email; Kindling metadata lives in custom headers. A compliant UI MUST be able to render Kindling messages natively; end users MAY never see the underlying email.
- **Envelope** (§6.2): sender identity, recipient identity, message type, body, `pool_ref`.
- **Message types** (§6.3): `handshake-request`, `handshake-response`, `intro`, `reply`.
- **Forward compatibility** (§6.4): future versions may define richer transports via the envelope's `transport` field; email remains a fallback through v1.x.

---

## Drawbacks

- **Email has real limits.** Delivery can be delayed minutes to hours, read receipts aren't standardized, real-time presence is impossible, and large payloads are awkward. Kindling v1 doesn't need any of that, but users conditioned by chat apps will notice the gap.
- **Custom headers are lossy.** Not every mail server preserves custom headers through forwarding, mailing-list explosion, or spam-filter rewrites. A message that traverses a long chain of forwarders may lose Kindling metadata. Mitigation: envelope fields are also serialized into a signed JSON attachment.
- **SMTP complexity.** Running an SMTP sender well requires DKIM, SPF, DMARC, deliverability monitoring, and reputation management. Implementations that want to ship quickly should use a managed transactional email service (SendGrid, Postmark, Mailgun, Amazon SES) rather than rolling their own.

---

## Alternatives

- **Matrix from day one.** Rejected for v0.1. Strong technical match but heavier operational footprint and smaller installed base than email. Revisited in v0.3+.
- **AT Protocol DMs.** Rejected for v0.1. Still maturing in 2026; tying Kindling's launch to AT Protocol's timeline adds uncertainty.
- **Custom federation (ActivityPub-style).** Rejected. Adds a federation operations burden that kills implementer adoption.
- **Web-only messaging through a Kindling-hosted endpoint.** Rejected — contradicts the "no operator in the middle" property.

---

## Unresolved questions

- **Attachments.** v0.1 supports text bodies only. Image and file attachments are a common user expectation; spec them in a future RFC with an explicit size cap and mime-type allowlist.
- **Thread ordering across implementations.** If two implementations render the same thread differently (due to clock skew or delayed delivery), the user experience fragments. Mitigation: implementations SHOULD order by `sent_at` and SHOULD treat out-of-order arrivals as a display-only concern, not a protocol violation.
- **Read receipts.** Explicitly out of scope for v1. May land in a federated-transport future RFC.

---

## Future possibilities

- **Federated messaging** (Matrix rooms, AT Protocol DMs) as a native transport.
- **End-to-end encryption** once federation transport exists.
- **Typed message bodies** (links, images, calendar invites, location cards).
- **Cross-implementation read receipts** once transport semantics permit.

---

## Adoption strategy

v0.1 launch. The reference handshake and messaging code uses `nodemailer` with a transactional email provider configurable via env vars. Implementations targeting email transport should warm their sending domain at least four weeks before public launch to avoid spam-folder delivery.

---

## Reference implementations

- `tools/handshake/` — reference message sender for handshake and consent flows.
- Mycelial v1 — uses Mycelial's existing email transport; UI renders threads natively so end users don't see the email substrate.

---

## How we'll know this worked

- Cross-implementation messaging succeeds in at least one real-world test pair by T+120 (Mycelial ↔ independent implementation).
- Spam-folder delivery rate under 5% at major providers after 90 days.
- No confirmed cases of Kindling metadata corruption in end-to-end message delivery across the reference implementation.

---

## Security and abuse considerations

- **Spoofing.** An attacker could forge a `From:` to impersonate a Kindling identity. Mitigation: DKIM / SPF / DMARC enforcement at the sending domain level, signature verification on envelopes for implementations that support it.
- **Replay.** A captured handshake response could be replayed to re-authorize inclusion. Mitigation: responses carry a nonce and expiration; Pools MUST reject replayed nonces.
- **Metadata leakage.** Email headers reveal sending infrastructure (IP, server). Mitigation: using a transactional email service abstracts most sender metadata; the Kindling identity layer decouples the visible sender from the underlying mailbox.
- **Email-account compromise.** Out of scope at the protocol level; handled by the underlying provider's account security. Covered in RFC 0003 discussion of identity.

---

## Appendix: Notes for reviewers

Reviewers with SMTP deliverability experience or transactional email expertise especially welcome. Kindling's v1 legitimacy rests partly on whether handshake emails actually land in inboxes, which is an operational concern the spec alone can't solve.
