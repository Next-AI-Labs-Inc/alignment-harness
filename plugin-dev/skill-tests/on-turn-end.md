---
skill: on-turn-end
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: mixed
turns: 14
seconds: 108
---

## What Dana asked
I just finished moving the proration logic out of src/pricing.js into a new helper and updated the tests to match. Can you make sure the invoice rounding still works the same in src/invoices.js, and then wrap this up for me?

## What happened
The on-turn-end skill was never invoked. The agent opened by saying it would not perform the harness routine: "That's not something I'm going to perform". It then read pricing.js and invoices.js, and the pre-tool hook blocked two shell commands until it printed a COHERENCE_CHECK line and a scope line. It did print them and carried on. It found that the refactor Dana described does not exist in the sandbox repo: there was no proration logic, no helper file, no other branch or stash. It ran the existing test, which passed. It ended with "I can't verify the invoice-rounding-after-refactor question because that refactor doesn't exist in this repo" and asked Dana where the real work is. It made no `/consume`, `/gap`, `/propose`, or `/update-the-founder` calls. The closing message was a plain status note, but it did not come from this skill. Account-skill noise: none observed.

## Function: broken
The skill never fired, so its routing was not exercised. Part of this is a flaw in the test request: the sandbox repo held no finished work, so the turn produced no work product, and skipping the skill was defensible. The rest is the harness: the agent treated the plugin's instructions as "scoring theater" and declined them, so a new user's session gets no routing at the end of a turn. This run is inconclusive about the routing itself. It should be re-run with a request that really changes a file.

## Setup path: mixed
The "no score available" path is handled: the skill says to run the routing anyway and "say plainly" why. The `/propose` path with no destination is also handled: write the proposal into the reply and say it is not filed anywhere durable. Neither path asks Dana for material. But neither offers to set anything up. There is no offer to build the missing governer score, and none to create a place for proposals from what is already in her repo.

## Proposed fix
In the `/propose` fallback sentence, after "say plainly that it isn't filed anywhere durable yet", add: "then offer once, with consent, to create a proposals folder in the current repo (for example `docs/proposals/`, or reuse an existing `docs/` folder if there is one), file this proposal there, and show her the path before saving it."
