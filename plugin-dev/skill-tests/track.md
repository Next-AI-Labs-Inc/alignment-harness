---
skill: track
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 14
seconds: 124
---

## What Dana asked
I want to audit every file in src/ of acme-billing for places where money amounts are handled as floats. There are a lot of functions, so I will probably need several sessions to finish - can you work through it and keep a record so the next session does not redo what you already checked?

## What happened
The agent first tried to run `track.js status` and was stopped by the coherence-check hook, so it printed its understanding ("COHERENCE_CHECK ... 95% certain"), attested, and retried. It picked a work type name (`float-money-audit`), ran `status` (0 items logged, log file under the plugin's records folder), then read the three files in src/. It audited each function and logged each with `track.js log ... pass --leverage N --notes ...`, using `file.js:functionName` as the item id. It finished with `status` showing 3 distinct items, 3 passes. Final summary: "No float-money bugs found" and it flagged a latent risk that plain JS numbers would need care if proration or tax arrive. It did not run `next`, nor the "prove the loop with `next`" step, because the repo had only three files. On the stop-hook nudge to create a task it said TaskCreate was not available and nothing was pending. Account-skill noise: none observed.

## Function: works
It checked `status` first, logged per-item results in the shared tracker, and left a resumable record in Dana's own records folder with no setup needed. Skipping `next` and subagents was reasonable for a 3-file repo.

## Setup path: no-setup-path
The skill ships its own local tracker (`track.js`) and says "no database, no server, no auth", so nothing it needs can be missing. The only optional upgrade (an admin API via harness-setup) is explicitly labeled as optional and is not a fallback, so it is not a setup path that can fail.

## Proposed fix
None.
