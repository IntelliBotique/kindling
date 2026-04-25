# The Category Nobody Has Fixed, and the Protocol That Might

*Published April 2026 by Josh Kessler, founder of TranquilTech.*
*Reading time: about 14 minutes.*

---

## The dating doc

Open Reddit on a Sunday afternoon and search for "dating doc." You will find them everywhere. A 26-year-old in Brooklyn has put twelve hundred words into a Google Doc about who she is and what she's looking for, with three photos, a Spotify link, and her email address at the bottom. A polyamorous couple in Oakland has built a Notion page that reads like a dating profile crossed with a CV. An autistic engineer in Berlin has a Carrd site listing the nineteen things he wants you to know before he agrees to coffee.

These documents are not novelties. They are the way a generation of people who have given up on dating apps are actually finding each other now. The friendship versions are even more revealing. There are spreadsheets of women in Los Angeles open to platonic walks, group chats of new parents in Toronto trading babysitter contacts and hangout invitations, Notion pages titled "people I think you should meet" that get passed quietly from one trusted friend to the next.

The behavior already exists. It exists at scale. It exists because the tools that were supposed to do this work are no longer doing the work. And it exists in a form that is so close to a real protocol that you can almost see the shape of what it could be.

This essay is about why dating and friendship discovery are both broken in the same way, why the workaround people have invented is the right starting point, and what it would take to turn that workaround into actual public infrastructure. The thing being proposed is called Kindling. It is an open protocol, published today on GitHub. It is one of those rare cases where the right move is to publish a specification before publishing a product.

I'll explain what that means, why it matters, and what comes next.

## The two categories that are broken in the same way

Dating apps and friendship discovery look like different problems. They are the same problem.

Both are categories where two people benefit when they find each other. Both are categories where the value of the introduction is unambiguous. And both are categories where, if you put a centralized operator between the two people and charge for the connection, you end up with software whose business model points in the opposite direction of what the people using it want.

Dating apps are the loud version of this. The product is the wait. Hinge, Bumble, Tinder, and the dozen apps that share their owner all monetize the chance of a meeting, not the meeting itself. Premium tiers boost your visibility. Top picks gate the people you would actually want to talk to. Every interface choice nudges you to swipe more, message more, never quite get there. The famous internal Hinge motto used to be "designed to be deleted," and the deletion they were optimizing for was the kind that takes eighteen months and four hundred dollars. The economics require it. The shareholders demand it.

Friendship discovery is the quiet version of the same problem. There is no Tinder for friendship. There has been no Tinder for friendship for fifteen years of trying. Bumble BFF was the most serious attempt and is now essentially defunct as a discovery mechanism. Meetup, the OG of finding people, has been optimized into something that mostly serves to remind you it exists. There is no category-defining product for finding friends as an adult, in part because friendship cannot be monetized the way dating can. You can't sell premium because nobody is desperate. You can't sell hope because the stakes are lower. The same incentive structure that broke dating apps simply prevented friendship apps from ever getting funded in the first place.

Both problems have the same root. The middle of any centralized matchmaking system is a place where the operator's interests and the user's interests diverge. In dating, the operator wants the wait to continue. In friendship, the operator can't make money at all, so the operator never builds the thing. Both end states are bad. Both are produced by the same architecture.

The workaround people have invented routes around the architecture. A dating doc has no operator in the middle. A friendship Notion page has no monetization layer slipping in between you and the people you want to meet. These artifacts work because they are honest. They are honest because there is no business model leaning on them.

The catch is that a Google Doc is a terrible search tool. It works only when someone you trust shares it with you. It does not scale. It cannot connect across cities, across scenes, across communities. The behavior is correct. The infrastructure is missing.

## What is missing, exactly

Imagine a city. There are five hundred people in it who have written a dating doc, scattered across Google, Notion, Carrd, personal sites, and a Reddit thread someone is intermittently maintaining. There is no way for those five hundred people to find each other.

Now imagine you could ask a simple question and have it search across all five hundred. "Who in this city is open to dating, has compatible politics, lives within a mile of the train, and is not allergic to cats." You would get a small ranked list. The list would point to the people's own pages. You would read the page. You would decide whether to reach out. Two people would meet.

The protocol you would need to do that has only three moving parts. You need a way to describe a profile that any AI agent can read regardless of where the profile is hosted. You need a way to organize profiles into pools so that the question "who in this city" has a meaningful answer. And you need a way to connect with someone you found, with their consent, without putting any company in the middle of the conversation.

That is Kindling.

## What Kindling is

Kindling is an open protocol. The word "protocol" is doing real work in that sentence and I want to be precise about it.

A protocol is a set of public agreements about how data is structured and how messages are exchanged. SMTP is a protocol. The web is built on protocols. Email is a protocol. None of them is owned by a single company. None of them tells you how to build the user interface. They tell you how the underlying data and messages have to behave so that anyone, anywhere, can build a client that interoperates with everyone else.

Kindling is a protocol in exactly that sense. It does not include a dating app. It does not have a brand consumer interface. It is a specification that anyone can read, fork, implement, and build on top of. The specification was published today on GitHub. Anyone can build a Tinder-style client, a Reddit-style browse view, a Craigslist-style list, a printed zine, or a chat-driven search box on top of the same Kindling data. They will all interoperate. None of them owns the protocol.

There are two parts to the specification.

The first part is a profile standard. Anyone can publish a profile of themselves wherever they already trust. A Notion page. A Google Doc. A Carrd site. A personal website. A GitHub README. A plain HTML file. The profile lives where the person hosts it. Kindling does not store profiles. The protocol uses a small set of HTML conventions called IndieWeb microformats (specifically `h-card`) as the baseline schema, and an AI parser fills in whatever the page does not mark up. The output is a structured JSON document that any developer can consume.

The second part is a Pool standard. A Pool is a curated list of profiles, organized by context. A Pool can be a city. A scene. A relationship orientation. A shared interest. An invite-only friend group. A healing community. Anyone can create a Pool. A Pool is published as a manifest file with the curator's identity, the Pool's intent, its visibility (public, unlisted, or invite-only), and its consent model (the default is universal opt-in: a profile cannot be added to a Pool without the owner's permission).

Together, the two layers describe a kind of infrastructure that has not existed before. Profiles live everywhere. Pools organize them. AI agents read across Pools to answer real questions. Connections happen through a consent handshake. After the introduction, two people talk however they want. The protocol disappears the moment its job is done.

## How a connection actually happens

Suppose Sarah hosts a profile on her Notion page. She is open to dating in Los Angeles and to making new friends. The page has a brief description of who she is, a few photos, a contact email, and the IndieWeb h-card markup that signals to any reader where her name and location are.

A friend of Sarah's, call her Mira, runs a Pool called "queer creatives in LA who want more friends in their thirties." Mira sends Sarah's profile URL to the Pool. The Pool sends Sarah a handshake message. Sarah taps accept. Her structured profile is now part of Mira's Pool.

Three weeks later, somebody named Reza in Echo Park asks an AI client (which could be one of many, built on the Kindling spec) "who in queer creatives LA is up for a hike this weekend?" The agent reads the cached profiles in Mira's Pool, ranks the matches, and surfaces three people, including Sarah. Reza taps Sarah's name. The client opens her Notion page. He reads it. He decides to send a first message.

That message goes through Kindling's native messaging contract. The transport, in v0.1, is structured email under the hood. Sarah's email provider does what it has always done about spam. The Kindling client renders the conversation as a normal thread, regardless of which client Sarah is using. The two of them figure out a hike.

That is the whole thing. There is no central app between them. There is no swipe screen. There is no premium tier. The Pool is run by Mira because Mira cares about her community, and the protocol is run by no one because protocols are not run by anyone.

If Reza later decides he wants a different interface (a list view, a swipe view, a chat-driven search), he can use a different Kindling client. Sarah's profile and Mira's Pool work the same way regardless. That is the point of a protocol.

## Why open source first

There is an obvious objection at this point: if you're going to build a thing, build the thing. Why publish a specification before there is a product anyone can use?

Three reasons.

The first is credibility. People are tired of being asked to trust dating companies. The companies have not earned it. A protocol that anyone can audit, fork, and re-implement has a different kind of standing in the conversation. The specification is the product because the specification is the thing that proves the operator does not have a foot on the scale. Closed-source matchmaking has had its chance. There is room now for something inspectable.

The second is durability. If TranquilTech (the company publishing Kindling) goes away tomorrow, Pools keep working. Profiles keep being readable. Other implementations keep running. The protocol does not depend on any single company's solvency. That property is hard to manufacture later. It has to be designed in from the beginning. Publishing the spec first is the simplest way to commit to that property in public.

The third is ecosystem. The most important thing Kindling can do in its first year is create the conditions for other people to build implementations. That happens only if the spec is real, the schemas are inspectable, and the contribution model is open. Building a hosted product first and a spec later is how you get a single-vendor protocol. That is not the goal here.

## Mycelial: the first implementation, on purpose not the only one

Kindling needs a working reference implementation to be credible. The reference implementation is Mycelial.

Mycelial is the rooted layer of TranquilTech's broader work, an interconnected network of healing communities (Groves) where people gather around shared intention and skilled facilitation. Mycelial is the right first home for Kindling because the people in Mycelial Groves are exactly the audience for whom centralized matchmaking has failed worst: neurodivergent communities, trauma-informed circles, psychedelic integration networks, somatic practice spaces. People for whom the ambient meat market of mainstream dating apps is the wrong room entirely.

Inside Mycelial, Pools become the way Grove inhabitants find each other within and across Groves. A Grove can host its own Pools (a "looking for a coffee buddy" Pool, a "dating-open in this Grove" Pool, an "available to mentor on integration work" Pool). Pools can also span Groves through the Mycelial Network, so someone rooted in a Trauma-Informed Grove in Austin can be found by someone in a Psychedelic Integration Grove in Berlin who is asking the right question.

The first version of Mycelial Pools ships about four months after the framework launch. It will not be the only Kindling implementation by then. The point of publishing the spec first is to give other people, working on their own scenes and communities, a real chance to ship implementations on their own timeline. A queer-creatives-in-LA implementation. A polyam-LA implementation. A founders-finding-co-founders implementation. A new-parents implementation. None of these need to wait for TranquilTech. The spec is the spec. Build it.

## Sustainability without extraction

The obvious next question is the only one any thoughtful reader is actually asking by this point: how does this fund itself, and how do you avoid recreating the trap?

Kindling itself takes no money from people looking for connection. The protocol is free. The reference implementation inside Mycelial is free at the connection layer.

Future versions of the framework will introduce two optional, post-result revenue surfaces. Both share a key property: they happen after a connection has already succeeded, never before, and they are voluntary. They cannot be turned into paywalls.

The first is gratitude offerings. After a meaningful connection, an inhabitant of any Kindling implementation can choose to leave a token of thanks. The implementation may offer a small digital keepsake the two new connections can share, designed by community contributors. The keepsake is the optional artifact. The token is the optional payment. Both are post-result.

The second is the Hall of Flame. People who find a life partner through a Kindling implementation can choose to commemorate the story in a public archive. A one-time contribution funds the archive's upkeep and the protocol's ongoing development. The framing is simple: the average dating app user spends well over $150 on premium features for the chance to meet someone. Contributing $100 to celebrate a connection once it is real is a meaningfully different economic relationship.

Neither of these surfaces is in v0.1. Both are explicitly described in the framework's Future Revisions section, planned for Mycelial's v1.1 and v1.2 releases. Naming them in public, before they exist, is part of the discipline. It signals that the long-term economic model is something we have thought about, that we are not winging it, and that no surprise monetization is going to appear later under the cover of "the founders had to make money somehow." The economic relationship in Kindling is post-result and voluntary, end to end. That is the commitment.

## What Kindling cannot do

It is worth being honest about what this protocol does not do.

Kindling does not promise that more people will find love. It does not promise better matches than the algorithms that came before. It does not solve loneliness, fix the friendship recession, or improve the dating market in any direct sense. What it does is remove a particular obstacle: the centralized operator whose business model points away from the outcome you actually want. What people do with that removal is up to them.

Kindling also does not solve every problem you could imagine attached to it. Identity verification is layered (email, OAuth, curator vouching) but not foolproof. Spam filtering exists in three layers but will not catch everything. Bad actors will try to abuse it, the way bad actors try to abuse every public infrastructure. The spec includes mechanisms (per-profile messaging preferences, shared block lists, cross-implementation block subscriptions, a curator-led incident response process), but every one of these is a starting point, and refining them is exactly the kind of work the protocol's open governance is designed to absorb over time.

The other thing Kindling cannot do is exist alone. The whole proposition rests on Pool curators being real people doing real work in real communities. If no one runs Pools, there are no Pools to query. The most important and least understood role in this network is the curator. We have recruited a small group of founding curators in advance of today's launch (in NYC, LA, SF, Berlin, and a handful of scene-specific Pools that span geographies), and the public registry launches today with their Pools listed. But the network needs many more, run by people who are not affiliated with TranquilTech and not waiting for permission.

If you are someone who already does this work informally (you are the one in your friend group or your Discord or your group chat who introduces people, who runs the local newsletter, who maintains the spreadsheet), this protocol is for you. Run a Pool. Curate it well. The early curators will shape how Pool curation works as a craft. Their decisions will live in the protocol's evolution.

## The roadmap, briefly

The framework v0.1 specification, schemas, reference tooling, and the public registry of opt-in Pools are all live today at the Kindling GitHub repository and at kindling.dev. Anyone can clone the repo, validate a Pool manifest, run the starter discovery agent, deploy the registry to their own infrastructure, and submit pull requests against the spec.

Mycelial's reference implementation ships in late summer. The build is paced deliberately, against a locked v0.1 spec, so that the protocol does not change underneath external implementers who are also building.

The first major spec revision (v0.2) lands later this year, informed by what the community discovers during the early-adoption period. It will include the cryptographic identity option, the spec-level addition of gratitude offerings, and whatever else the working group decides is ripe.

By v1.0, governance fully transitions to the Kindling Working Group: one Mycelial maintainer seat, two independent-implementer seats elected by registered implementations, one IndieWeb representative seat, and a small advisory rotation. TranquilTech is the initial maintainer because someone has to ship v0.1, and we are paying for the first year of the registry's hosting and the spec's development. By v1.0, the project belongs to the working group. That handoff is part of the design.

## The invitation

If you build software and you have ever looked at the dating-app market and wondered why it has been so resistant to good ideas, this is the protocol you want to fork. Build something. Ship a client. List it on the registry.

If you write about social technology, the dating-app monoculture, the friendship recession, or the open-protocol revival, there is something to write about here. The press list has been small and curated. There is more room.

If you run a community (a city, a Discord, a scene, a healing community, a network) and you already do introduction work informally, run a Pool. Be one of the people who decides what good Pool curation looks like before there is a playbook.

If you are a person who has tried to find connection and given up on the apps, who has thought about writing your own dating doc but then thought about the friction of getting anyone to actually read it, watch what happens here over the next year. The first generation of Kindling clients will be rough. The second will be better. The thing that makes any of this work is that the spec underneath is durable, public, and not owned by anyone trying to keep you swiping.

The fire starts here.

---

*Kindling is published by TranquilTech as a contribution to the public infrastructure of human connection. Read the framework specification, browse the public registry, and follow the project at [kindling.dev](https://kindling.dev). The reference implementation inside Mycelial launches later this year at [mycelial.help](https://mycelial.help).*

*If this resonated, share it with the person you know who would understand why it matters.*
