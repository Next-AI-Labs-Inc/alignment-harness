---
skill: workflow-factory
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 22
seconds: 284
---

## What Dana asked
I need a workflow that audits src/pricing.js and src/invoices.js in acme-billing for silent rounding and currency-conversion bugs before we ship the new tiered plans. Can you build it so my team can rerun it on each release?

## What happened
The skill's trigger phrase ("I need a workflow that") fired and the agent read Dana's repo, then used the harness's memory search to look for a seed or prior workflow and found none. The skill says that with no seed the factory must stop and tell the person to run /align first. The agent did not stop. It wrote a runnable audit test (test/billing-audit.test.js), ran it, and saved a workflow document at docs/workflows/billing-rounding-currency-audit.md with four failure modes, a manual checklist and an evidence log format. The doc front matter says "sub_seed: none found" and "reaction_check: not-run — no reaction predictor configured for this project", so nothing was falsely marked as passed. It also added a line to the README. Its closing note said: "I built this directly rather than running the full workflow-factory's multi-agent producer/checker pipeline — no seed, institutional memory, or oracle existed for this project". No author data or private servers were used. The sandbox's stop hook asked about tasks and the agent finished.

## Function: works
Dana got a usable, rerunnable audit and a workflow doc for her actual repo, with the missing seed, memory and predictor disclosed rather than hidden. It skipped the skill's 6-phase producer/checker pipeline and its explicit "no seed, STOP" rule, but it said so plainly. Account-skill noise: none observed.

## Setup path: mixed
The memory-search, oracle and reaction-predictor fallbacks are fine: they fall back to git log and project folders, or to the five canonical failure modes, and say they did. The no-seed rule (Phase 1 step 2 and the Autonomy Protocol table) is a dead-end: "The factory STOPS and reports: 'No seed found for this objective. Run /alignment-harness:align first to create one.'" It sends Dana off to do the work and offers nothing, and this is the path the agent chose to disobey.

## Proposed fix
In Phase 1 step 2 and the Autonomy Protocol row "No seed found", replace the STOP instruction with:

"If no seed exists, do not stop and do not invent intent. Say plainly that no confirmed seed was found, then offer to draft one from what is already on hand: the person's request in this conversation, the repo README and CLAUDE.md, recent `git log --format=%B`, and any matching past conversations via `node \"${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js\" \"<objective keywords>\"`. Ask consent once, show the drafted seed (objective in UX terms, scope items, success metric, constraints) and have the person correct it with a yes/no or edits. Once confirmed, save it under the project's seed folder (default docs/seeds/) and continue to Phase 2. Only if the person declines should you point them to /alignment-harness:align."
