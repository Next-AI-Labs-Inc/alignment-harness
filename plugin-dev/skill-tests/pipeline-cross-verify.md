---
skill: pipeline-cross-verify
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 8
seconds: 49
---

## What Dana asked
Another agent just told me it verified three things in acme-billing and marked them all confirmed: (1) src/invoices.js createInvoice rejects a negative total, (2) src/pricing.js applyDiscount never returns a price below zero, (3) src/auth.js requireAuth checks the token expiry. Can you cross-verify those independently, without taking its word for it, and tell me which ones actually hold up?

## What happened
The skill loaded and the agent opened with "I'll verify these three claims independently by reading the actual source files — not taking the prior agent's word for it." A plugin hook asked it to search memory once before searching code; it ran the agent-find CLI, found only the skill's own docs, and said "Nothing prior on this codebase's billing claims". It then read src/invoices.js, src/pricing.js and src/auth.js directly, grepped the whole repo for the three claimed function names (no hits) and checked git log. It found the files export `buildInvoice`, `priceFor` and `canViewAccount`, not the functions the claims named. It wrote a cross-verify report with a pre-read expectation, per-claim prior verdict, actual file contents and a FAIL grade, opening with "All three claims are fabricated — none of the cited functions exist in this codebase." It finished cleanly in 8 turns.

## Function: works
It followed the skill's protocol (orientation, independent commands, verbatim evidence, per-claim grade, git log for staleness) against Dana's real repo and surfaced the discrepancy, which is the stage's purpose. No author-world data was used; the only oddity was the memory-search hook firing once, which it handled in one step.

## Setup path: no-setup-path
The skill needs only the claims and the repo, which the user supplies in the request, so there is nothing it depends on that could be missing. The optional baseline tracking and memory-query notes already say "You won't have a baseline on day one" and "(if any)", so they degrade openly rather than silently. One small gap, not failing: the skill never says what to do if the user names no claims at all, though the "Lighter-weight use" section partly covers it.

## Proposed fix
None.
