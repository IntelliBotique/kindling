# Contributing to Kindling

Thanks for considering a contribution. This document describes how to participate in the Kindling project: how to file an issue, how to propose a spec change, how to send a pull request, and where to ask questions.

If you're brand new, the highest-leverage things you can do are:

1. **Read the spec** at `spec/SPEC.md` and tell us where it's confusing.
2. **Build a small implementation** of any part of it (a discovery agent, a Pool host, a profile parser) and link it from your fork.
3. **Run a Pool** and document what you learn.

None of these require permission.

---

## Ways to contribute

**File an issue.** Bugs in the reference tooling, ambiguities in the spec, missing examples, broken links. Small things welcome.

**Open a discussion.** Use GitHub Discussions for open-ended questions, ideas that aren't ready to be RFCs, and curator coordination.

**Submit a pull request.** Code fixes, schema clarifications, documentation improvements, examples. See "Pull request workflow" below.

**Write an RFC.** Substantive changes to the spec or the protocol go through the RFC process. See "RFC process" below.

**Build an implementation.** Ship a Kindling client, Pool host, or registry. Once the public registry is live (with v0.1.1), submit your implementation manifest there to be listed.

**Run a Pool.** Pool curation is the most important and least understood role in the network. The early curators are shaping how Pool curation works as a craft; a written curator playbook will be published alongside v0.1.1. In the meantime, if you want to run a Pool, read [`spec/SPEC.md`](spec/SPEC.md) §3 and §5 (Pool layer and consent), look at the manifests under [`examples/pools/`](examples/pools/), and email `maintainers@kindling.dev` — we want to hear from you.

---

## Pull request workflow

1. **Fork the repository** and create a branch for your change. Branch names should be short and descriptive (`fix-validator-error-on-null-curator`, not `patch-1`).

2. **Make the change.** Keep PRs small and focused. One concern per PR is the rule of thumb. Big PRs with many unrelated changes will be asked to split.

3. **Run the tests.** From the repo root, run `npm test`. Every PR has to pass the test suite before merge. If you add behavior, add a test for it.

4. **Update documentation.** If your change affects how something works, update the relevant docs in the same PR. Spec changes need a corresponding RFC; see below.

5. **Open the PR.** In the description, link any related issue or RFC. Describe what changed, why, and how to verify. If the change is visible to users of the protocol, include a one-line note suitable for the changelog.

6. **Respond to review.** Reviewers will leave comments. Engage with them. If you disagree, push back; we'd rather have the conversation in public than merge something we'll regret.

7. **Merge happens by a maintainer** once approval thresholds are met (see GOVERNANCE.md). PRs are typically merged with squash for tidiness; long-lived feature branches with many commits are an exception.

**Approval thresholds:**

- Editorial fixes, typos, formatting: one maintainer approval.
- Tooling, registry, examples: two reviewer approvals (one maintainer, one anyone with prior merged work in the affected area).
- Spec changes (must be tied to an RFC): two-thirds support among active Spec Reviewers per the RFC process.

---

## RFC process

Substantive changes to the protocol go through a lightweight RFC process modeled on the [Rust RFCs repo](https://github.com/rust-lang/rfcs).

**You write an RFC when:**

- You want to change normative behavior in the spec
- You want to add a new field, schema, or section
- You want to deprecate or remove existing functionality
- You're proposing a significant new capability

**You don't need an RFC for:**

- Editorial fixes (typos, formatting, wording clarifications)
- Adding examples
- Tooling improvements that don't change protocol behavior
- Documentation that explains existing behavior more clearly

**How to write one:**

1. Copy `RFCs/0000-template.md` to `RFCs/0000-your-short-title.md` (the number stays 0000 until merge, when a real number is assigned).
2. Fill in every section honestly. Sections you genuinely don't have an answer for can say "I don't know yet, looking for input."
3. Open a pull request adding your RFC.
4. The PR stays open for **at least 14 days** for substantive proposals. Use the time to engage with feedback and revise.
5. Acceptance requires **two-thirds support among active Spec Reviewers** (defined in GOVERNANCE.md). If no objection is raised in the comment period and at least two Spec Reviewers explicitly approve, the RFC is accepted.
6. On acceptance, the RFC is renamed with its assigned number and merged. The corresponding spec changes (if any) are landed in a separate PR that references the RFC.

**Withdrawing an RFC.** You can withdraw your own RFC at any time. Mark the PR closed with a brief note explaining the decision. A withdrawn RFC can be re-opened later with revisions.

---

## Code style

The reference tooling is written in Node.js (TypeScript where it earns its keep). The basics:

- **Format with Prettier.** Run `npm run format` before committing. The CI checks formatting.
- **Lint with ESLint.** Run `npm run lint`. Warnings are warnings; errors block CI.
- **Tests with Vitest.** Run `npm test`. Add tests for new behavior.
- **Avoid heavy dependencies.** Pulling in a thousand-line package for one helper function is a reason to write the helper function. The reference tooling stays light on purpose.
- **Comments explain why, not what.** The code says what it does; comments say why we made that choice.

Schema and example files live under `schemas/` and `examples/`. Schema changes that break compatibility need an RFC.

---

## Sign-off

All commits must include a [Developer Certificate of Origin](https://developercertificate.org/) sign-off. In practice, this means committing with `git commit -s`, which appends `Signed-off-by: Your Name <your.email@example.com>` to the commit message.

The DCO certifies that you have the right to contribute the code (you wrote it, or it's licensed compatibly). It is the standard mechanism used by the Linux kernel, GitLab, and many other open-source projects.

---

## Where to ask questions

- **GitHub Discussions** for protocol design, implementation questions, and open-ended thinking
- **GitHub Issues** for specific bugs and concrete proposals
- **`#kindling` channel on the IndieWeb chat** for casual conversation
- **`maintainers@kindling.dev`** for private questions about the project's direction

For Code of Conduct concerns, do not use the public channels above. Email `conduct@kindling.dev` directly. See `CODE_OF_CONDUCT.md`.

---

## What we're hoping to see

A short list of contributions we'd particularly love to receive in the first year:

- A reference implementation in Python or Rust (the v0.1 reference is Node)
- A browser extension that lets a profile owner publish to the well-known URI from any page they own
- A static-site generator integration (Eleventy, Hugo, Astro plugin) that emits valid h-card markup automatically
- A WordPress plugin that lets WordPress sites act as Kindling profiles
- Translations of the spec into other languages
- An accessibility audit of the registry's web UI
- Integration with existing community tooling (Discord, Telegram, Mastodon)
- Field reports from Pool curators, in any form (a blog post, a talk, a thread, a journal)

If you're working on any of these or something adjacent, open a discussion to coordinate.

---

## A note on tone

The protocol is about how people find each other. The community building it should reflect what we're trying to enable. Be patient with people new to the project. Assume good faith. Push back on ideas, not on people. If a discussion is going sideways, take a break and come back to it.

This isn't a moral position; it's an operational one. Communities that fight badly produce specs that get worse over time. We have a long road ahead and want to walk it with you for a while.

---

*Thanks for being here. The fire starts here.*
