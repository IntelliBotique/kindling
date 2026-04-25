# Governance

*Kindling project governance. Version 0.1, April 2026.*

This document describes how decisions get made in the Kindling project: who can merge what, how the spec evolves, how disputes get resolved, and how project stewardship transitions from TranquilTech to a community Working Group by v1.0.

The short version: TranquilTech is the initial maintainer because someone has to ship v0.1 and operate the public registry. By v1.0, the project belongs to the Kindling Working Group. The transition is gradual on purpose.

---

## Principles

Three principles guide every governance decision:

1. **The spec is the product.** Decisions optimize for spec clarity, durability, and implementability. Anything that makes the spec harder to read, harder to audit, or harder to fork is fought, regardless of who is proposing it.
2. **Consent moves the project.** Significant changes require visible support from the people building on the spec. No major decision is made by one person alone, including the initial maintainer.
3. **Single-vendor capture is the failure mode to avoid.** Every governance choice is evaluated through the question "does this make the protocol more or less ownable by any one entity?" The answer should always be "less."

---

## Roles

**Initial Maintainer.** TranquilTech, through the Mycelial team, holds the initial maintainer role. The Initial Maintainer has commit rights to the spec, the schemas, the reference tooling, and the public registry. The role is held by a small named group, not by the company as an abstraction; the current named maintainers are listed in `MAINTAINERS.md`.

**Spec Reviewers.** A small group of invited reviewers with merge rights on spec changes. The first cohort was recruited from the IndieWeb community, identity-protocol veterans, and dating-tech builders during the pre-launch period. New reviewers are invited by consensus of existing reviewers, plus the Initial Maintainer's sign-off until v0.3.

**Implementer Liaisons.** Maintainers of registered Kindling implementations (other than Mycelial) who have shipped a working implementation are eligible to become Implementer Liaisons. Liaisons can vote on RFCs and propose spec changes. They are not required to have commit rights.

**Working Group (post-v1.0).** The body that takes over governance at v1.0. See "The transition" below for composition and selection.

**Contributors.** Anyone who submits a pull request, opens an issue, files an RFC, or registers a Pool. Contributors do not need permission to participate.

---

## How the spec evolves

Kindling uses a lightweight RFC process modeled on the Rust RFC repository.

**Anyone can propose a change.** Open a pull request against `RFCs/` with a new RFC document following the template in `RFCs/0000-template.md`. The RFC describes the motivation, the design, alternatives considered, and known trade-offs.

**Discussion happens in the open.** RFC pull requests stay open for at least 14 days for substantive changes. Comments come from anyone. The RFC author is expected to engage with feedback and revise.

**Decisions are made by Spec Reviewers (and, post-v1.0, the Working Group).** Acceptance of an RFC requires support from at least two-thirds of active Spec Reviewers (Working Group members, post-v1.0). Active means a reviewer who has reviewed at least one RFC in the prior 90 days. If no objection is raised in the comment period and at least two reviewers have explicitly approved, the RFC is accepted.

**Editorial fixes do not need an RFC.** Typos, formatting, clarifications that change no normative behavior, and minor schema additions can be merged as ordinary pull requests by any maintainer.

**Breaking changes require special handling.** Any change that would cause a v0.1-conforming implementation to stop working must be accompanied by a deprecation notice with at least one minor-version's notice before removal. v0.1 will not silently break.

**Versioning.** The spec follows semantic versioning. v0.x is pre-stable; minor versions (v0.1 → v0.2) may include additions and clearly-marked deprecations but should not break v0.1 conformance silently. v1.0 is the first stable release; from v1.0 onward, breaking changes require a major version bump.

---

## How code changes work

Pull requests against the reference tooling and the registry follow normal open-source conventions:

- Open a PR. Describe the motivation. Link any related RFC.
- Maintainers and reviewers discuss in PR comments.
- Two reviewers' approval is required for merge. One can be a Spec Reviewer; the other can be any contributor with prior merged work in the affected area.
- Maintainers merge once approval thresholds are met.
- All PRs run the test suite. Breakages must be fixed before merge.

---

## Disputes

Most decisions are not contentious. For the cases that are:

**Step 1.** The author of the disputed change and the dissenting reviewer try to reach agreement in the PR or RFC discussion.

**Step 2.** If no agreement is reached, any party can request mediation by calling for a vote of all Spec Reviewers (Working Group members, post-v1.0). Vote happens in a clearly-titled GitHub discussion thread. The vote is open for 7 days. Acceptance requires two-thirds support among voters.

**Step 3.** A Spec Reviewer (or Working Group member) who is repeatedly out of step with consensus may have their reviewer status reconsidered by the rest of the cohort. Removal of a reviewer requires three-fourths support among the remaining reviewers and a written rationale published in the project's public records.

**Step 4.** Disputes about Code of Conduct violations follow the separate process in `CODE_OF_CONDUCT.md` and are not subject to the spec-vote process. Code of Conduct enforcement is delegated to a small committee that is not the same body as the maintainers, to avoid conflicts of interest.

---

## The transition to the Working Group

TranquilTech, through the Initial Maintainer role, holds the project for v0.1 and the early point releases. By v1.0, the project belongs to the Kindling Working Group. Here is how the transition happens.

**v0.1 → v0.2.** The Initial Maintainer holds primary stewardship. Spec Reviewers gain expanded merge rights for accepted RFCs and editorial fixes. The first invited Implementer Liaisons are seated as Spec Reviewers if they want the role.

**v0.2 → v0.3.** The Initial Maintainer's sign-off requirement on new Spec Reviewer invitations is dropped. Existing Spec Reviewers vote on new invitations. The Initial Maintainer continues to operate the public registry and to provide infrastructure support.

**v0.3 → v0.5.** The Initial Maintainer steps back from RFC review except where TranquilTech (as the Mycelial implementation maintainer) has a direct stake. The Working Group is formally constituted with seats. Working Group elections happen for the first time.

**v0.5 → v1.0.** The Working Group operates with full authority over the spec, the schemas, and the reference tooling. The Initial Maintainer continues to operate registry infrastructure for one year past v1.0, after which infrastructure operation is transferred to a body chosen by the Working Group (a community foundation, a hosting partnership, or a similar entity).

**At v1.0.** TranquilTech retains one Working Group seat as the maintainer of Mycelial. All other governance authority sits with the Working Group. The transition is complete.

---

## Working Group composition

When fully constituted (by v0.5 at the latest, fully governing by v1.0), the Working Group has the following seats:

- **One Mycelial maintainer seat.** Held by the maintainer of the Mycelial reference implementation. Permanent.
- **Two independent-implementer seats.** Held by maintainers of registered Kindling implementations other than Mycelial. Elected by the maintainers of all registered implementations. Two-year terms, staggered, so one seat is up for election each year.
- **One IndieWeb representative seat.** Held by a member of the IndieWeb community recognized by the IndieWeb's own consensus processes. Two-year term.
- **One Pool curator seat.** Held by a curator of a registered Pool, elected by registered curators. One-year term.
- **One advisory rotation seat.** A six-month rotating seat that can be filled by anyone the Working Group invites for context on a specific topic (identity protocols, accessibility, abuse response, internationalization, etc.).

Total: six seats, with five voting members for ordinary RFC decisions and the advisory seat counted only on topics where its advisory expertise is specifically engaged.

**Quorum.** At least four of the five voting members must participate in any decision.

**Term limits.** A person may hold the same seat for at most two consecutive terms.

**Vacancies.** Filled by the same selection process as the original seat, within 60 days.

---

## Funding and infrastructure

TranquilTech funds the public registry's hosting, the project's domain (`kindling.dev`), the spec's documentation site, and the deliverability of the handshake email infrastructure for the first year after launch. After year one, funding for ongoing infrastructure transfers to whichever entity the Working Group chooses (a community foundation, a hosting partnership, or a sponsorship model).

The project does not accept payment for spec changes, RFC acceptance, registry placement, or any other governance outcome. Pool curators may not pay to be featured. Implementations may not pay for endorsement. The project's spec, registry, and documentation surfaces remain non-commercial in the sense that no editorial or governance decision is for sale.

If the project ever begins accepting sponsorships (for events, for documentation translation, for internationalization work, or similar), the sponsorship policy will be published before any sponsorship is accepted, and sponsor logos will be visually distinct from registered implementations and Pool curators.

---

## Code of Conduct enforcement

The project's Code of Conduct (`CODE_OF_CONDUCT.md`) applies to all participation: GitHub issues, pull requests, RFC discussions, the public registry, the project's chat channels (when established), and any in-person events held under the Kindling name.

**Enforcement is delegated to the Code of Conduct Committee.** The committee is composed of three people who are not maintainers of the spec or the reference implementation. The first committee was named at the v0.1 launch; the current members are listed in `CODE_OF_CONDUCT.md`. Reports go to `conduct@kindling.dev` and are reviewed by the committee independently of the maintainers and the Working Group.

**Committee decisions are final** for individual incidents. Patterns of incidents that suggest structural problems can be referred by the committee to the Working Group for spec-level or governance-level changes.

---

## Amending this document

Changes to this document follow the RFC process and require two-thirds support from active Spec Reviewers (Working Group members, post-v1.0). Major governance changes (changes to seat composition, transition timeline, or quorum requirements) require three-fourths support and a 30-day discussion period.

This document will evolve. Some of the specifics here (term lengths, quorum thresholds, the exact composition of the Code of Conduct Committee) are starting points, written before the project has had real experience operating at scale. They will be revisited as the project learns what actually works.

---

*Kindling is published by TranquilTech as a contribution to the public infrastructure of human connection. The protocol is licensed permissively. Governance is structured to make the project ungovernable by any single entity, including TranquilTech, by the time it reaches v1.0.*
