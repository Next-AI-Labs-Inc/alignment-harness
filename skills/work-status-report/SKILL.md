---
name: work-status-report
description: The second report — after the substantive report or answer, show every piece of work grouped by how far it has actually got (proposed / work in progress / done not committed / done, committed, merged to staging), each item written as one conversational paragraph carrying what it is, the intent read back for the user to validate or reject, what happens next, and what the user will then have. Use whenever reporting status, what is left, or what is actionable.
---

# Work status report

This is a **second** report, not a replacement for the first. The first report answers the question or delivers the work. This one follows it and says, of everything in flight, how far each piece has actually got and what the user has to decide.

The user approved this format on 2026-09-17 after reading one item written this way: *"this report format was perfect."* What follows is that format, plus the two things the user said were missing.

## Group everything by status, in this order

Four sections, always in this order, always with these names. Omit a section only when it holds nothing.

```
## Proposed

## Work in progress

## Done, not committed

## Done, committed, merged to staging
```

The user's words: *"you want to sort by the following categories: proposed / work in progress / done not committed / done, committed, merged to staging."*

**Status is a fact, never a courtesy.** If the user refers to something as done and committed when it is done and uncommitted, it goes under "Done, not committed" and the item says so in its first sentence. Agreeing with a wrong status to avoid friction is how work gets shipped that nobody reviewed. Where a piece is committed on a working branch but has not reached staging, say that inside the item rather than promoting it a section.

## What each item contains

One numbered item per piece of work. Each is a short paragraph carrying four things, **woven together as speech, never labelled**:

1. **What it is and where it actually stands** — led by what is true or not yet true for a person, not by the code.
2. **The intent read back, so the user can validate or reject it** — "I read that as you wanting…", written so the user can answer "4 is false" and correct the understanding rather than the work. This is the part that makes the format worth reading: it exposes what the agent believes the user wants while there is still time to fix it.
3. **What happens next** — the specific next move, named concretely enough that the user can veto it.
4. **What the user will have when it lands** — the observable result, in terms the user can check themselves.

Never write these as fields. `*Intent I'm reading:* … *Plan:* … *Result:*` is a data structure wearing prose and the user has rejected it explicitly — see `/how-to-talk-like-the-founder`. The four things live inside the sentences, in that order, because that is the order a person says them.

## White space — a blank line between sentences

The user's correction, verbatim: *"only thing missing is that you failed to use new lines generously so it's hard to read, each sentence should have a full space between them."*

So inside every item, each sentence sits on its own line with a blank line between it and the next. This is not a paragraph of prose. It is a column of sentences the user can scan at speed and stop on one.

## The gold example — the item the user approved, reformatted with the white space

> **5. Your outage alerts still don't arrive.**
>
> When the app is unreachable for a real person, you want to hear it from the system within a minute rather than from a customer — and more than that, you want the way that happens to become the single way anything reaches you, so the next agent can't invent its own.
>
> The Opus agent is building that one canonical alarm path on the sender every other email already uses, registered where our canonical utilities live so it's findable rather than folklore.
>
> It has to settle two things first: whether the email-governance check could quietly suppress an alarm to a flagged address, which would re-break this for a new reason, and what happens when a real outage makes a hundred browsers report at once — one message per incident, not one per reporter.
>
> Then the next unreachable-app moment puts an email in your inbox naming which endpoints failed and from which page, and the record that has collected 1,688 failures stops growing.

Read what that item does. It opens with what is still true for the user rather than with a component name. It states the intent back so the user can correct the understanding. It names what is being built and the two open questions inside it, so a decision the user disagrees with is visible before it is made. It closes on the thing the user will be able to check with the user's own eyes — an email in the user's inbox, and a number that stops growing.

## Rules

- Every number, count and date is read fresh, not carried from earlier in the session. A stale figure in a status report is worse than no figure, because it looks current.
- One item per number. If an item holds two separately-falsifiable claims, split it, so "7 is false" means something.
- Never use a term the user has not been given. Say what it means instead of naming it.
- Anything blocked on the user gets said as a question the user can answer in a sentence, not as a request for review.
- Anything unverified is named as unverified, with what would settle it.
- This skill governs shape and grouping. The voice rules in `/how-to-talk-like-the-founder` govern every sentence inside it and always win.

## When this fires

After any substantive report or answer, when the user asks what is left, what is actionable, or for the status of work — and at the end of a session where work sits in more than one state. It is reusable anywhere a set of work items needs its standing made legible, not only for the morning health check.
