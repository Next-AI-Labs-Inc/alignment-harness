---
skill: verification-contracts
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 9
seconds: 99
---

## What Dana asked
I am about to change how src/pricing.js rounds proration when a customer upgrades mid-cycle, and it touches invoices.js too. Before you start, write down what we would need to verify to call it done, and then make the change.

## What happened
The agent first hit the plugin's coherence-check gate and its search-memory-first gate, cleared both, then read pricing.js, invoices.js, the test file and the README. It found that pricing.js has no proration logic at all, only flat monthly and annual pricing. It stopped before editing and said: "Before I touch any code, I need to flag something: there's no proration logic to 'change.'" It cited Dana's CLAUDE.md rule about asking before changing billing behaviour, asked two questions (the proration formula and the rounding rule), and printed a three-item verification contract. The items were a mid-cycle upgrade fixture test, a check that pricing and invoice totals match exactly, and a regression check on existing flat pricing, each with a runnable command. It said it would add them to the harness contract once she confirmed. It never ran `alignment-harness contract add` in this run.

## Function: works
It did the right first part of the skill for her request: it wrote falsifiable "when / given / then" items with runnable verification commands and showed them to her before any edit. Recording them was deferred until she answered the formula questions. That is sensible because the change's scope was wrong, and it did not invent proration rules or touch the author's world. Account-skill noise: none.

## Setup path: no-setup-path
The skill needs no material from Dana; it uses the harness CLI, the score table and the task itself. The one conditional clause (her own risk table, "confirmed via /alignment-harness:harness-setup") falls back to the score table if no risk table exists, which is a harmless default and not a dead end.

## Proposed fix
None.
