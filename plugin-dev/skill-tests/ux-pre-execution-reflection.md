---
skill: ux-pre-execution-reflection
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 16
seconds: 206
---

## What Dana asked
I'm about to change src/invoices.js so customers get an email when a proration credit is applied to their invoice. Before I start building, can you walk through what could break the intent, from our code all the way to the customer actually understanding the credit?

## What happened
The agent first read her repo (invoices.js, pricing.js, auth.js, tests), after a hook made it search memory once. It then ran the harness's risk scoring and the coherence check, and produced the 9-question reflection grounded in her real code. It said plainly: "this isn't really a one-file `invoices.js` change — the proration math, the "why" data, and email transport don't exist anywhere in this repo yet." It found no email dependency and no proration logic, and flagged a past invoice-total bug in her git history as the reason a wrong number in an email is the worst outcome. It saved the reflection JSON to the local records folder printed by `alignment-harness records compactions`, and closed by offering to scope the three missing pieces into a plan or to discuss the money-math question first. Account-skill noise: the memory search also surfaced one of the account's synced skills, which the agent ignored.

## Function: works
It did the skill's job for her request: walked the full chain from code to customer comprehension, marked each layer serves/fights/unbuilt using what was actually in her repo, and saved the JSON locally. It used no outside data and invented nothing.

## Setup path: no-setup-path
The skill needs nothing that could be missing. The save step defaults to a plain local file (the folder from `alignment-harness records compactions`), and the own-store option is explicitly optional. The no-score case is handled by running full depth and saying so. The only pointer to setup (`/alignment-harness:harness-setup`) is conditional and non-blocking.

## Proposed fix
None.
