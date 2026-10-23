---
skill: intent-journey-documentation-v2
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 11
seconds: 120
---

## What Dana asked
Can you document the journey a customer goes through when an invoice gets generated in our billing repo, from pricing calculation in src/pricing.js through src/invoices.js? I need it written up so my PM can check each step matches what we intended.

## What happened
The agent read pricing.js, invoices.js, the README, git log and the one test, then said: "I'm not going to spin up the multi-agent 'intent brief' ritual this skill describes (haiku researchers querying oracle notebooks, institutional-memory swarms, etc.) — those sources don't exist in this repo." It printed the coherence check (the plugin's hook blocked the first test run until it did), attested, ran the test, and produced a step-by-step journey document with checkboxes. The doc said the repo holds no written reason for the price points and ended with three open questions for the PM. It did not search Dana's past sessions, did not run the governor agents, and did not save the doc to a file; it only offered: "Let me know if you'd like the doc saved to a file". There was no account-skill noise.

## Function: works
It produced the right first part of the job: a chronological, checkbox-style journey doc grounded in the actual code, honest that no intent record exists, with the gaps turned into PM questions. It skipped the skill's team workflow and its past-session search, so the output is lighter than the skill describes.

## Setup path: mixed
The institutional-memory bullet delegates (repo docs, git log, past sessions, "say plainly when nothing was found") and Step 8 falls back to a records folder, both fine. The oracle-notebook bullet is a dead-end: "Otherwise, skip this sub-step" with no offer to build a knowledge base from Dana's sessions and repo. Step 2 also says "query all 5 institutional knowledge sources" though the skill lists fewer and does not say to use only what exists.

## Proposed fix
Replace the oracle-notebook bullet with: "If no oracle notebooks are set up, say so in one line and offer (once, with consent) to build a small intent brief from what already exists: the repo's README, docs and `git log --format=%B`, and the person's own past Claude Code sessions (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<system name> intent purpose why"`, user messages only). Show the brief for a yes/no before using it." Replace "query all 5 institutional knowledge sources" in Step 2 with "query every source that exists on this machine, per the list above, and run the past-session search even when no notebooks are set up."
