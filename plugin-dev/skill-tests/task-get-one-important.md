---
skill: task-get-one-important
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 14
seconds: 81
---

## What Dana asked
I've been going back and forth all morning on acme-billing: proration in src/pricing.js keeps rounding wrong on mid-cycle upgrades, invoices.js is duplicating line items, and I'm sick of auth.js tokens expiring mid-request. What's the one thing that matters most right now?

## What happened
The agent ran its usual pre-reply check, named the three gaps she listed, and said "Let me actually verify the code before picking one — not going off your description alone." It searched memory once (the harness hook required it), then read pricing.js, invoices.js, auth.js, the test, the README and the git log. It found that none of the three bugs exist in the repo: no proration logic, one fresh line item per invoice, no token or expiry code, and a single commit. It scored the task with the governer (10/100, read-only) and then answered in plain conversation: "Here's the one thing that matters most right now: none of the three bugs you described actually exist in this code." It explained that her mental model does not match the repo, suggested she might be on the wrong checkout or branch, and asked whether to look for another checkout or scaffold the logic fresh. It did not file anything and made no edits.

## Function: works
It did the skill's core job: read the conversation, verified against real code before claiming anything, picked one thing, and presented it in colleague-style prose with a follow-up question. The gap it surfaced (her description does not match the repo) is the honest top item given the sandbox repo. It did not name `/propose` or `/align` in the closing question, and it did not show the full record, which is acceptable since the skill says the person reads conversation, not JSON. No account-skill noise and no author-world leakage seen.

## Setup path: no-setup-path
The skill works entirely from the current conversation and the repo it is pointed at. Its only fallback is "says the conversation is clear if it does not" find a gap, plus "unknown — requires: {what you'd need to find out}" for undeterminable fields, which is a plain statement, not a request for material. The optional `relatedIntentIds` and `relatedLogIds` fields say to omit them if the person has no such system, so nothing needed is missing for a new user.

## Proposed fix
None.
