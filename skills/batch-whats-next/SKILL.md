---
name: batch-whats-next
description: Present finished, already-verified work — a batch ready to commit, a delegated fix that came back, a re-proposal after a gap was closed — as a set of per-item cards the user can say yes/no/hold to, each one framed as the intent that must be true if the work is aligned, never as a description of what the code now does.
---

# Greenlight report

This is the format for the specific moment `/batch`, `/sanity-check`, or any delegated-fix workflow all eventually produce: something is DONE and VERIFIED, and a human needs to decide, per item, whether it ships. It is not a research report, not a plan, not a status update on work still in flight — those have their own shapes (`/work-status-report` for the four-bucket proposed/WIP/done-not-committed/done-committed view; this skill for the moment a specific set of finished items needs a specific yes/no per item).

This skill is a standalone consumer of `/sanity-check` and `/how-to-talk-like-the-founder` — it does not modify either, and it should not be merged into them. `/sanity-check` is a general-purpose "does this match intent" tool used across many situations; this skill is the narrower, specific shape a greenlight moment takes once sanity-checking is done. Treat the two as separate files with a shared ancestor idea, not one skill with two names.

## Before the report: clean other agents' leftovers silently (user ruling, 2026-10-16)

Shared checkouts collect copies of work that has already landed. An agent copies a file in from
staging, or an older version of finished work stays behind after it merges. These are messes, not
items. The user, on seeing one presented as an item: *"if this is a mess an agent left over that's
already in staging, you should clean it when doing this skill without asking me about it or
mentioning it."*

So before writing any item, sort every uncommitted file. A file is a leftover only when its content
on disk exactly equals that path on the remote staging branch (`git hash-object` against
`git rev-parse <remote>/staging:<path>`), or exactly equals a version of that path in staging's own
history. Clean leftovers without asking and without listing them:

1. Back them up to a tarball in `.claude/coordinator/leftover-backups/`. If the `.claude/coordinator/leftover-backups/` folder does not exist, create it.
2. Unstage them, then revert or remove them by exact path.
3. Fast-forward the checkout to staging, but only if no real-work file is among the files a
   fast-forward would change.

Never stash, `reset --hard` or `git clean`. Anything not proven to be a leftover is someone's real
work: leave it, and route it to its owner if it needs a decision. Use a Haiku agent for the cleanup.

## What belongs in this report, and what does not (user correction, 2026-09-17)

**Only work that still needs something from the user.** The user's words: *"update that skill to
specifically name things that are not committed yet or not merged, remaining work, not
report on completed work."*

So an item qualifies when it is sitting at one of these edges:

- finished but not committed, and the user has to see it before it lands;
- committed on a working branch but not merged to staging, so it has reached nobody;
- built and waiting on an action only the user can take — a key rotated, a setting changed in
  somebody else's dashboard, a migration run against production;
- a decision that blocks otherwise-finished work from moving.

Work that is already committed AND already merged is **not** an item here. It is done, it
needs no yes from the user, and listing it turns a decision surface into a progress report the user
has to read past. Mention it only if it is genuinely load-bearing context for an item that
does need a decision, and then in one clause inside that item, never as its own entry.

Work still actively being built is not an item either — nothing can be greenlit while it
moves. That belongs in `/work-status-report`'s work-in-progress bucket.

The test before writing any item: **what, specifically, is this asking the user for?** If the
answer is "nothing, I am telling you it went well", cut it.

## Why this exists (user correction, 2026-09-17)

An agent reported a delegated fix like this:

> "The fix now checks for your real site name specifically — 'Your App,' 'Your App Research,' 'Your App Resource Center' — after the divider, instead of accepting any pipe as good enough, so an old broken title can no longer disguise itself as a fixed one."

The user's correction: *"wait you're assuming that whatever the code does is what I want, instead of stating the intended ux that must be my intent if the code is right. that's a gap. I can't greenlight with[out] that info for things user facing."*

The failure: describing what the code now does is not the same claim as stating the intent that must be true for the user to agree it's right. A fix that has been tested is still a fix whose PURPOSE has not been offered back for validation. This applies with zero exemption to fixes, follow-ups, and re-proposals, not just first-time batch proposals — a rationalization like "I already proved it passes" or "I already explained the technical change" does not substitute for stating intent.

## The shape, per item

Every item that asks for a yes/no gets this, woven as sentences — never as labeled fields, never as a JSON-shaped list of `Intent: / Plan: / Result:` (see `/how-to-talk-like-the-founder` — that ban applies here at full force):

1. **What it is and where it stands**, led by what's true or not yet true for a real person, not by a file name or function.
2. **The intent that must be true if this is aligned** — "if this is aligned, your intent must have been: when [real human condition], [the outcome] — because [why]." Never open with what the code does; the intent leads, the code rides inside as the precision anchor only after the meaning is stated.
3. **Any real decision or tradeoff surfaced as a decision** — what was chosen, what it was chosen over, why. Skip this only when the item genuinely has no fork in it (a pure data/content addition with no judgment call inside it).
4. **A real "see it yourself"** when a human could actually walk to a real page/screen and check it themselves — real starting state, real action, real place, what they'd see if it's right vs. wrong. Write `not human-observable: {one-line why}` when nothing surfaces (internal tooling, backend-only refactor) rather than inventing a mechanism-check (never "open devtools and inspect X" — that tests the agent's model of the mechanism, not the lived outcome).
5. **A closing sentence that says what you are asking for, where it would go, and why** — in prose, as a sentence a person would say. Never let an item end without it; a description that stops short of a recommendation hands the judgment back to the user, which is the exact labor this format exists to remove.

   **Always name the destination.** "Safe to merge: yes" is not an answer — merge to what? Staging, main, production, or nowhere yet are four different decisions with four different blast radii, and leaving it out makes the user ask. Say it: *"I'd merge this to staging now, because the page it feeds is already there and currently shows nothing without it."* Or: *"This one I'd hold on the working branch until the migration has run, because merging it first would put a uniqueness rule in front of records that still have duplicates."*

   **And say it as a sentence, not a label.** The user, 2026-09-17: *"also make sure in the skill file agents do not use JSON format like `safe to merge:` over and over, compose conversational sentences that address the things."* A column of `Safe to merge: yes` down the page is the data-structure shape banned in `/how-to-talk-like-the-founder`, wearing a verdict's clothes. The recommendation, the destination and the reason belong in one spoken sentence, and the reason is what makes it a recommendation rather than a rubber stamp.

   When the honest answer carries a condition, the sentence carries it too: *"Worth putting on staging today, though nothing proves it until a real outage fires, so the first genuine proof is the failure record going quiet."*

## White space — a full line of space between every sentence

Each sentence gets its own line, with a **full blank line** between it and the next, inside every item. Not most sentences. Not the long ones. Every one.

The user asked for this twice on 2026-09-17, the second time as a correction: *"also add to the skill file ( full line of space between each sentence on output )"*.

What that buys the user: a column the user can scan down and stop on a single line, rather than a paragraph the user has to read through to find the one clause that matters. The user is deciding on a dozen items at a time, and a wall of prose costs the user the ability to skim and land.

This applies to the item bodies, not just the headlines — a three-sentence explanation set as one block defeats the format even when every sentence in it is good.

## Depth still scales to risk

This skill governs the SHAPE of the report. How deep the verification behind each verdict needs to go — diff read vs. live render vs. full adversarial audit — is governed by `/batch`'s governer-scored depth table and its generated-content risk spectrum (2026-09-17 addition: internal bookkeeping data needs only a diff read; anything a real visitor reads or sees rendered needs the actual rendered result opened, regardless of how low the blast-radius score reads; anything on the coaching path itself needs the top tier regardless of how small the diff looks). This skill never lowers that bar — it only governs how the resulting verdict gets communicated once the depth-appropriate check is actually done.

## Numbering

Number items continuously across everything presented in one sweep (batch 1's items, then a fix's item, then a re-proposal's item, all in one running sequence) so the user can say "item 12 is wrong" and there is exactly one item 12 in the conversation. When an item was previously presented as "in progress" or "still running" and later completes, reuse its original number rather than assigning a new one — the user tracks items by number across a session, and a duplicate number is worse than a gap.
