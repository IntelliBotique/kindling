# The Category Nobody Has Fixed, and the Protocol That Might

*By Josh Wolf, founder of TranquilTech.*
*Reading time: about 13 minutes.*

---

## A protocol first

Cross Napster with RSS, have the result born the way Bitcoin was, as a published paper instead of a hosted service, and give it one job: make the dating-app business model beside the point. That is roughly what Kindling is.

Kindling is an open protocol for finding people across self-hosted profiles. The specification is published under permissive licenses, and the source lives on GitHub. What you get is a spec, the JSON schemas underneath it, and a small set of reference tools: a validator, a profile parser, a reference handshake server, a starter discovery agent, a block-list publisher, and the source for a Pool registry. Anyone can run all of it. Nobody has to ask.

I'm publishing a specification before any product because the dating and friendship-discovery categories are broken by the same business model. The workaround people have already invented in public is the right starting point, and what it lacks is a layer of public infrastructure that turns the workaround into something durable. That layer has to be a protocol, owned by nobody, TranquilTech included.

If you've read the Bitcoin paper, the original RSS spec, or the IndieWeb h-card recommendation, you know the genre. The rest of this essay explains what I'm proposing and why.

## The dating doc

Search Reddit for "date me doc" and you'll find the genre everywhere. A few thousand words in a Google Doc about who someone is and what they want, three photos, a Spotify link, an email address at the bottom. A Notion page that reads like a dating profile crossed with a CV. A Carrd site listing the nineteen things someone wants you to know before coffee.

These documents are how a lot of people who gave up on dating apps are finding each other now. The friendship versions are more revealing still: spreadsheets of people open to platonic walks in one city, group chats of new parents trading hangout invitations, Notion pages titled "people I think you should meet" passed quietly from one trusted friend to the next.

The behavior exists, it's widespread, and it exists because the tools built for this work stopped doing it. It also sits remarkably close to a real protocol. You can almost see the shape.

## Two categories, one failure

Dating and friendship discovery look like separate problems. They share a root.

In both, two people benefit when they find each other, and the value of the introduction is plain. Put a centralized operator between them, charge for the connection, and you get software whose business model pulls against what its users want.

Dating apps are the loud version. The product is the wait. Tinder, Hinge and the other apps Match Group owns, along with Bumble and the rest of the category, make their money on the chance of a meeting. Premium tiers boost your visibility. Paid picks gate the people you'd most want to talk to. Hinge still markets itself as "designed to be deleted," and the company's revenue depends on how long that takes.

Friendship discovery is the quiet version. Every few years someone tries to build the app for making friends as an adult, and none of them has become the default way people do it. Friendship is hard to charge for. Nobody is desperate enough to pay for premium, and the hope a dating app sells has no friendship equivalent. The incentive structure that bent dating apps kept friendship apps small.

Same root, both times. At the center of any centralized matchmaking system, the operator's interests and the user's interests split. In dating, the operator profits from the wait. In friendship, the operator struggles to profit at all, so the thing rarely gets built well.

The workaround routes around that center. A dating doc has no operator. A friendship Notion page has no monetization layer between you and the people you want to meet. These pages are honest because no business model leans on them.

The catch is that a Google Doc is a terrible search tool. It works when someone you trust shares it with you, and it stops there. It can't connect across cities, scenes or communities. The behavior is right; the infrastructure is missing.

## What's missing, exactly

Picture a city with five hundred people who have each written a dating doc, scattered across Google, Notion, Carrd, personal sites and a Reddit thread somebody maintains when they remember to. Those five hundred people have no way to find each other.

Now picture asking one plain question across all of them: who in this city is open to dating, shares my politics, lives near the train, and is fine with cats. You get a short ranked list pointing to people's own pages. You read one. You decide whether to write. Two people meet.

The protocol that makes that possible has three moving parts. A way to describe a profile that any AI agent can read wherever the profile is hosted. A way to gather profiles into Pools, so "who in this city" has a meaningful answer. And a way to reach someone you found, with their consent, with no company sitting in the conversation.

That is Kindling.

## What Kindling is

A protocol is a set of public agreements about how data is structured and how messages are exchanged. Email runs on protocols, and so does the web. Nobody owns them, and they leave the interface to whoever builds one. They define how the underlying data and messages behave so anyone, anywhere, can build a client that works with everyone else's.

Kindling is a protocol in that sense. It's a specification anyone can read, fork, implement and build on. Someone can put a swipe interface on Kindling data, someone else a browsable list, a printed zine, or a chat-driven search box, and all of them interoperate. The protocol belongs to none of them.

The specification has two layers.

The first is a profile standard. You publish a profile wherever you already keep things: a Notion page, a Google Doc, a Carrd site, a personal website, a GitHub README, a plain HTML file. The profile stays where you host it; Kindling stores no profile data. The baseline schema is a small set of IndieWeb HTML conventions called microformats, specifically h-card. Where a page has no markup, an AI parser may infer the rest, and it has to record which fields were marked up and which were inferred. The output is a structured JSON document any developer can consume. (This is the RSS gene: subscribe to what people already publish, on infrastructure they already trust, in a format any reader can render its own way.)

The second is a Pool standard. A Pool is a curated list of profiles, organized by context: a city, a scene, a relationship orientation, a shared interest, an invite-only friend group, a community. Anyone can create one. A Pool is a manifest file naming its curator, its purpose, its visibility (public, unlisted or invite-only) and its consent model. Every consent model requires the owner's yes; silent inclusion is forbidden, with no exception. The Pool is what separates Kindling from pure peer-to-peer: an accountable human curator with a charter, where other systems put an algorithm.

Profiles live anywhere. Pools organize them. AI agents read across Pools to answer real questions. Connections happen through a consent handshake. After the introduction, two people talk however they like, and the protocol steps out of the way.

## How a connection happens

Sarah keeps a profile on a Notion page. She's open to dating in Los Angeles and to new friends. The page says who she is, has a few photos and a contact email, and carries h-card markup that tells any reader where her name and location are.

Her friend Mira runs a Pool called "Queer creatives in LA." Mira submits Sarah's URL to the Pool, and Sarah gets a handshake: a structured email with the Pool's name, its charter, its curator, what it's for, and one-click accept or decline. Sarah accepts. Her structured profile is now in Mira's Pool. Had she declined, the decline would be remembered, and Mira couldn't submit her again without her permission.

Three weeks later Reza, in Echo Park, asks a Kindling client, "Who in queer creatives LA is up for a hike this weekend?" The client reads the profiles in Mira's Pool, ranks the matches, and shows three people, Sarah among them. Reza opens her Notion page, reads it, and decides to write.

His message travels through Kindling's messaging contract, which in v0.1 is structured email underneath. Sarah's email provider handles spam the way it always has. Whatever client each of them uses shows the conversation as an ordinary thread. They figure out a hike.

Between them there's no central app, no swipe screen and no premium tier. Mira runs the Pool because she cares about her community. The protocol runs on public agreements.

If Reza later wants a different interface, a list or a chat-driven search, he switches clients. Sarah's profile and Mira's Pool behave the same way in every one. That's what a protocol buys you.

## Why publish the spec first

The fair objection: if you're going to build a thing, build the thing. Why publish a specification before there's a product anyone can use?

Credibility, first. People are tired of being asked to trust dating companies, and the companies haven't earned that trust. A protocol anyone can audit, fork and reimplement stands differently in the conversation. The specification is the proof that the operator has no thumb on the scale.

Durability, second. If TranquilTech disappeared tomorrow, Pools would keep working, profiles would stay readable, and other implementations would keep running. The protocol survives any single company's solvency, including ours. That property can't be added later. Publishing the spec first commits to it in public.

Third, an ecosystem. The most useful thing Kindling can do in its first year is make room for other people's implementations. That needs a real spec, inspectable schemas and an open way to contribute. Ship a hosted product first and the spec second, and you get a single-vendor protocol.

This is also where the Bitcoin comparison holds and the Napster comparison ends. Napster was peer-to-peer. Kindling v0.1 sends its bytes over plain email, because email already has the federation, spam filtering and deliverability that a new network would spend a decade rebuilding. Borrowing a working federation is a deliberate choice.

The license is split on purpose. Code is Apache 2.0, so anyone can fork it, vendor it and embed it. The spec text is CC BY 4.0, so it can be quoted in books, articles, derivative specifications and academic work without a negotiation.

## Mycelial: the first planned implementation

A protocol earns credibility when something real runs on it. Nothing at TranquilTech does yet, and that's by design: the spec came first so that no product of ours could shape it to suit itself.

The first implementation is planned inside Mycelial, TranquilTech's online community platform, a network of Groves where people gather around shared interests with facilitators who keep the room. Mycelial is in early access now. Kindling inside it is planned for the first quarter of 2027. Mycelial fits because many of the people in its Groves, neurodivergent communities and trauma-informed circles among them, are the ones mainstream matchmaking has served worst.

The two get conflated, so to be exact: **Kindling is the protocol; Mycelial will be one implementation of it.** "Grove" and "garden tender" are Mycelial's words for Mycelial's concepts. Other implementations should bring their own vocabulary for their own communities.

Inside Mycelial, Pools would become the way members find each other within and across Groves. A Grove could host a coffee-buddy Pool, a dating-open Pool, or a Pool of people available to mentor. Pools could also span Groves, so someone in a trauma-informed Grove in Austin could be found by someone in Berlin asking the right question.

Mycelial should be one of many. The point of publishing the spec on its own is to give people working in their own scenes a real chance to ship first, on their own timelines: a queer-creatives-in-LA implementation, a founders-finding-co-founders one, a new-parents one. None of them needs to wait for TranquilTech.

## Paying for it without recreating the trap

Kindling takes no money from people looking for connection. The protocol is free, and the specification defines no chargeable surface between two people who want to meet. That's a stated non-goal of the spec.

Two optional ways for an implementation to sustain itself are planned for later. Both happen only after a connection has worked, and both are voluntary, so neither can become a paywall.

The first is gratitude offerings. After a connection that mattered, someone can choose to leave a token of thanks, and an implementation might offer a small digital keepsake the two people share, designed by community contributors. Voluntary post-introduction gratitude is in the v0.2 draft.

The second is the Hall of Flame. People who find a partner through a Kindling implementation could choose to commemorate the story in a public archive, with a one-time contribution that funds its upkeep and the protocol's development. Paying once to celebrate a connection that already happened is a different economic relationship from paying for the chance of one.

Neither exists yet. I'm naming them in public before they exist on purpose, so nobody is surprised later by monetization that arrives under the cover of "the founders had to make money somehow." In Kindling, money moves after the result, voluntarily, from start to finish.

## What Kindling can't do

Kindling removes one obstacle: a centralized operator whose business model points away from the outcome you want. What people do once it's gone is theirs to decide. It makes no promise of more love, better matches or less loneliness.

Identity verification is layered (email, OAuth and curator vouching) and imperfect. Cryptographic identity, the Bitcoin gene I've been deferring, is in the v0.2 draft and absent from v0.1. Spam protection has three layers and will still miss things. Bad actors will try to abuse Kindling the way they try every public infrastructure. The spec gives people per-profile messaging rules, a public block list that any implementation can subscribe to, block lists from third parties, and an incident committee under the project's governance. Each of those is a starting point, and refining them is the work open governance exists to absorb.

Kindling also can't exist alone. It depends on Pool curators, real people doing real work in real communities. With no Pools, there's nothing to query. The curator is the most important and least understood role in the whole design, and the curators are still to be found. The first ones will decide what good curation looks like as a craft, and their decisions will shape the protocol.

If you already do this work informally, as the person in your friend group, Discord or group chat who introduces people, runs the local newsletter or keeps the spreadsheet, this is for you. Run a Pool.

## Where things stand

The v0.1 specification is published and stable. Changes before v0.2 land as opt-in additions or clearly marked deprecations, and section numbers stay put until a major version.

The repository holds the spec, the JSON schemas for profiles, Pools, handshakes and messages, and the reference tools. Anyone can clone it, validate a Pool manifest, parse a profile, run the starter discovery agent, stand up their own registry, and open pull requests against the spec.

Version 0.2 is in draft: cryptographic identity, portable identity across Pools, and voluntary post-introduction gratitude. What the first implementers run into will shape the rest.

Governance widens as the protocol matures. TranquilTech is the initial maintainer, because someone has to ship v0.1, and changes land through an RFC process modeled on Rust's. At v0.2, implementers and IndieWeb regulars are invited onto the maintainer roster. By v1.0 a Kindling Working Group governs: one Mycelial seat, two seats elected by independent implementers, one IndieWeb seat and a rotating advisory group. By then TranquilTech is one voice among several. That handoff is part of the design.

## The invitation

If you build software and have wondered why the dating-app market resists good ideas, this is the protocol to fork. Build a client and tell us about it.

If you write about social technology, the dating-app monoculture, the friendship recession or the revival of open protocols, there's a story here.

If you run a community, whether a city, a Discord, a scene or a network, and you already make introductions, run a Pool and help decide what good curation looks like before anyone writes the playbook.

And if you've tried the apps and given up, and thought about writing your own dating doc before remembering how hard it is to get anyone to read it, watch what happens here. The first Kindling clients will be rough and the second ones better. What holds it together is a spec that's durable, public, and owned by nobody who profits from keeping you swiping.

---

*Kindling is published by TranquilTech as a contribution to the public infrastructure of human connection. Read the specification and follow the project at [tranquiltech.solutions/kindling](https://tranquiltech.solutions/kindling). Mycelial, where the first implementation is planned, is at [mycelial.help](https://mycelial.help). Questions about the spec or about building on it: [josh@intellibotique.com](mailto:josh@intellibotique.com).*
