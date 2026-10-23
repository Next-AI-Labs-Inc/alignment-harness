---
skill: intent-validation-engine
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 3
seconds: 45
---

## What Dana asked
I've been writing down product intents for acme-billing, like 'invoices over 10k need a second approver' and 'expired sessions redirect to login'. Can you validate those intents against what src/invoices.js and src/auth.js actually do now?

## What happened
The agent opened with a short coherence check restating what Dana wanted, then read `src/invoices.js` and `src/auth.js` directly. It did not call the intent-db store or load the skill by name; it did the skill's "uncategorized, check one at a time" pass by hand, since Dana gave the intents inline. It reported both intents as mismatches: "`buildInvoice()` computes a price and returns an invoice object — no threshold check, no approval field, no second-approver concept anywhere" and `auth.js` holds only a role check with "no session, no expiry, no redirect logic here at all." It separated "code drifted" from "intent never built", and offered: "want me to search the rest of the repo ... to rule out #1 before we call these confirmed gaps?" It did not touch the intents, file a proposal, or state a last-checked date (there was no store to report on).

## Function: works
It did the real job: compared each stated intent to the code it names, cited what it found, and was careful not to call a mismatch a code bug until it had ruled out the behavior living elsewhere. It used no author-world material. Skipping the record-keeping steps (touch, finding file) is reasonable because Dana's intents were never in a store. No account-skill noise seen.

## Setup path: mixed
Most paths pass: no end-to-end tests means "skip this pass and say so", journeys "start empty", and the staleness section says to state the true "never checked" state plainly. The failing path is the last line of SKILL.md: "If you don't have any intents in your store yet, or none are `approved`, there's nothing to validate yet". That is a dead-end: a new user with no store, but with intents in their head, CLAUDE.md, repo docs or past sessions, is told to come back later rather than offered a build of the store from those sources.

## Proposed fix
Replace the final paragraph's "there's nothing to validate yet" sentence with:

"If the intent store is empty, do not stop. Offer once, plainly: 'I can build a starting set of intents from what's already here — your CLAUDE.md, the repo README and recent commit messages (`git log --format=%B`), and your own messages in past Claude Code sessions (`~/.claude/projects/*/*.jsonl`, user text only, searched with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`). OK to do that?' On a yes, pull out statements shaped like a promise about user-facing behavior, show the shortlist, and save only the ones the person confirms via `/alignment-harness:intent-db`. If the person already named intents in their request, validate those directly without waiting for the store."
