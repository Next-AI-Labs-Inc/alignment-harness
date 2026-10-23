---
skill: verify
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 14
seconds: 92
---

## What Dana asked
I just reworked the proration logic in src/pricing.js and the tests are green. Can you verify that a mid-cycle upgrade from the 29 dollar plan to the 99 dollar plan actually charges the right prorated amount on the invoice?

## What happened
The agent first hit the harness's memory-search gate, ran a memory search (nothing relevant), then read src/pricing.js, src/invoices.js, the test file and the git log. It found that pricing.js is a 12-line flat-price function with no proration code, that the plans are 20/60/400 (no 29 or 99 plan), and that the repo has a single commit. It ran the test file itself (output "pricing tests pass") and noted the tests only cover flat monthly and annual pricing. It then printed a VERIFY RESULT block with the literal file contents, the grep and test output, and reported that the described proration rework is not in this repo. It did not print the Step 1 "VERIFY PROTOCOL STARTED" block before running commands; it only went straight to evidence-gathering and the result block. Key line from the result: "no matches, anywhere" for the grep on "prorat|29|99".

## Function: works
It did the skill's real job: it refused to accept "tests are green" as proof, inspected the real code, and gave an honest outcome-level answer with literal evidence instead of inventing a proration result. It did not use any author-world data. Minor gap: the Step 1 outcome-definition block was skipped. Two harness gates (memory search, coherence check) added friction but were cleared normally.

## Setup path: no-setup-path
SKILL.md needs nothing that could be missing. The only optional dependency is the `alignment-harness contract` commands, which apply only when a session already has a contract, so there is no fallback path to audit.

## Proposed fix
None.
