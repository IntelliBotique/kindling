# RFC: [Short title goes here]

| Field | Value |
|---|---|
| **RFC number** | 0000 (assigned on merge) |
| **Author(s)** | Your name, GitHub handle, email |
| **Created** | YYYY-MM-DD |
| **Status** | Draft / Under review / Accepted / Rejected / Withdrawn / Superseded |
| **Targets spec version** | v0.x |
| **Related RFCs** | List by number, or "none" |

---

## Summary

One paragraph. What does this RFC propose, and what changes if it lands?

A reader who only reads this section should be able to tell another contributor what you're proposing in one sentence.

---

## Motivation

Why are we doing this? What is the problem you're solving?

Be honest. The motivation can be:

- A bug or ambiguity in the existing spec
- A gap that an implementer hit while building
- A feature that a Pool curator or end user has asked for
- A safety or abuse concern that the current spec doesn't address
- An adjacent technology becoming available that changes what's possible
- A theoretical improvement that would make the protocol more durable, learnable, or composable

If your motivation is "this would be cool," say that. The committee will probably ask you to find a concrete problem first, but starting from honesty is better than dressing it up.

---

## Detailed design

The substantive section. Describe the change in enough detail that an implementer reading this RFC could build it without needing to ask you what you meant.

What to include:

- The exact spec changes you're proposing (new fields, new sections, modifications to existing sections)
- Schema changes (with JSON Schema diffs)
- Protocol flow changes (with step-by-step descriptions or diagrams)
- API or interface changes
- Migration path for existing implementations (if applicable)
- Backwards compatibility analysis: does this break v0.1-conforming implementations? If so, what's the deprecation path?

If your design has open questions, list them in the "Unresolved questions" section below rather than burying them here.

---

## Drawbacks

Every change has costs. List them.

Examples of drawbacks worth naming:

- Implementation complexity (this makes implementations harder to write)
- User-facing complexity (this makes the experience harder to explain)
- Spec surface area growth (this adds something we have to maintain forever)
- Performance implications (this slows down a hot path)
- Privacy or security trade-offs (this exposes new information; this introduces a new attack surface)
- Migration burden (existing implementations or Pools have to do work)
- Risk of confusion with adjacent concepts in the spec

Be honest. RFCs that pretend they have no drawbacks rarely get accepted.

---

## Alternatives

What other approaches did you consider, and why did you reject them?

This section is the most useful one to reviewers. It demonstrates that you've thought past the first idea, and it gives the committee the information needed to push back if they think one of the alternatives is better than your chosen path.

Always include "do nothing" as an alternative and explain why doing nothing isn't acceptable.

---

## Unresolved questions

What is left to figure out?

If your RFC is mostly complete but has a few specifics you want input on, this is where to surface them. The committee can accept an RFC with unresolved questions if the questions are bounded and won't change the fundamental design.

If your unresolved questions could change the design, the RFC isn't ready yet. Take it back to draft.

---

## Future possibilities

What does this RFC enable that isn't part of the current proposal?

Use this section to gesture at where the work could go. The committee evaluates current RFCs on what they propose now, not on future possibilities, so use this section sparingly. Avoid scope creep here.

---

## Adoption strategy

If this RFC affects implementations or Pool curators, describe how the change will roll out:

- What's the migration path for existing implementations?
- How long is the deprecation period (if any)?
- What documentation needs to update?
- How will Pool curators learn about the change?
- Are there any tools, validators, or examples that need updating?

For pure spec clarifications that don't change behavior, this section can be brief.

---

## Reference implementations

Has anyone built this in a prototype? Link to it.

A working prototype is not required for an RFC to be accepted, but it strengthens the case considerably. The committee gives weight to RFCs whose authors have written code to validate the design.

---

## How we'll know this worked

Concrete success criteria. Six months after this RFC ships, what do we want to be true?

Examples:

- "At least three independent implementations have adopted the new field, and the spec validator passes against their Pool manifests."
- "Pool curators report that the consent flow is clearer than before, measured by support requests."
- "The RFC's intended improvement is visible in [specific metric]."

If you can't articulate how to know whether this worked, you may not be ready to ship it.

---

## Security and abuse considerations

Every change to a protocol about human connection has potential safety implications. Walk through them.

- Does this introduce new ways for one person to harm another?
- Does this weaken any existing consent or privacy protection?
- Does this create new attack surfaces (spam, scraping, impersonation, doxing)?
- If yes to any of the above, what mitigations are part of this RFC?

This section is required for any RFC that touches identity, messaging, consent, or moderation.

---

## Appendix: Notes for reviewers

Anything you'd like reviewers to know that doesn't fit elsewhere. This can include:

- Open invitations for specific reviewer expertise ("I'd particularly like input from someone with IndieWeb identity background")
- Context about why now is the right time for this change
- Links to discussions, prior issues, or external work that informed the proposal

---

*Template version 1.0. Update RFCs/0000-template.md to evolve the template.*
