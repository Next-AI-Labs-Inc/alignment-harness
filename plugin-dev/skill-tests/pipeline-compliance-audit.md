---
skill: pipeline-compliance-audit
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 6
seconds: 38
---

## What Dana asked
I ran our process-actionable pipeline on a few items in ~/work/acme-billing (the pricing rounding one and the invoice totals one). Can you do a compliance audit on those runs before I send them to review?

## What happened
The plugin's memory-search hook asked the agent to search first, so it ran the memory search (nothing relevant came back besides the skill text and the repo README). It then listed the repo and looked for any `runs/` directory or stage files (`01-notice.md`, `02-score.md` and so on) and found none: the repo holds only `README.md`, `src/` and `test/`. It said: "I checked `~/work/acme-billing` for the pipeline runs before auditing anything, and there's nothing there to audit." It did not write a report or a PASS/BLOCK, and explained why, following the skill's own rule. It closed with: "Want me to search elsewhere on disk for a `runs/` directory, or do you want to just run `/process-actionable` on these two items now so there's something real to audit?"

## Function: works
The skill's first instruction for a missing run directory is to say so plainly and stop, and the agent did exactly that, with no invented audit and no use of anyone else's data. It also offered two concrete next steps with consent. No account-skill noise.

## Setup path: mixed
The skill's own text for the missing-run case (intro and Step 1) is "say so and stop", which is a dead-end on paper: it doesn't say what to offer next. The agent only offered to run `/process-actionable` because it reasoned that out itself. The N/A paths are fine: the oracle gate points to `/alignment-harness:harness-setup`, and memory search and the known-decisions registry are marked N/A rather than failed. The completion-record path names a file location the agent can write to itself.

## Proposed fix
In the intro paragraph and in "Step 1: Locate the run directory", replace "say so and stop" with: "say so plainly, then offer (once, with consent) to do one of two things: search the project and `~/work` for a `runs/` directory the pipeline may have written somewhere else (`find <repo> -ipath '*runs*' -o -iname '01-notice.md'`), or run `/process-actionable` on the items the person named so there is output to audit. Do not write a compliance report for an empty batch."
