---
skill: predict-required-skills
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 5
seconds: 74
---

## What Dana asked
I'm about to add proration support to src/pricing.js and have src/invoices.js use it for mid-cycle plan changes. What skills should I run and in what order for this, and can you set up the task list for it?

## What happened
The agent never invoked the predict-required-skills skill (no Skill call in the transcript). It searched for a task-list tool, found nothing, read src/pricing.js and src/invoices.js, then answered on its own. It said: "There's no oracle configured, and most of the harness's fallback skill list (jonathan-check2, founder-knowledge-store, coaching/forecasting skills, etc.) belongs to an unrelated coaching product". It declined to run a skill chain, asked four proration design questions, and listed a six-step plain engineering plan (rules, helper in pricing.js, wire invoices.js, tests, run suite, one small PR). It ended with "Want to answer the 4 questions above so I can start on step 2?" It did not create real tasks and did not offer to set up an oracle or a skill-history source.

## Function: needs-setup-no-offer
The agent saw that no oracle exists and said so plainly, then fell back to its own plan instead of the skill's fallback table, and never offered to build the missing oracle or mine Dana's own past sessions for skill patterns. The skill did not look like it was triggered by a "what skills should I run" request. Account-skill noise: none observed.

## Setup path: mixed
Step 1 says the oracle is optional and to see /alignment-harness:harness-setup, with a fallback table. That is a pointer, not an offer: nothing tells the agent to offer to build a skill-history source from the person's past Claude Code sessions (~/.claude/projects/*/*.jsonl, which record which skills were invoked on which work). The fallback table names skills ("/consume", "/governer", "/jonathan-check2" in the example) without telling the agent to check what is actually installed first, and the "NotebookLM" route assumes an external notebook the person would have to build by hand.

## Proposed fix
Replace "What to do if the oracle isn't yet created" with:

"1. Tell the person plainly there is no skill-pattern oracle yet, and offer once: 'I can build a local skill-history table from your past Claude Code sessions. OK to scan them?' On a yes, read `~/.claude/projects/*/*.jsonl`, count which `Skill` tool calls (and slash commands) appear in sessions touching similar files or topics, and show the resulting table for approval before saving it.
2. Until then, list the skills actually installed (your available-skills list plus `~/.claude/skills/`) and build the sequence only from those, using the fallback table as a shape guide. Drop any row whose skill isn't installed; never name a skill the person doesn't have.
3. Mark the task-list items '(estimated, not history-grounded)' and create them with TaskCreate, or with whatever task tool exists; if none exists, print the list as a checklist and say so."

Also change the Step 3 example so it only shows skills that ship with the plugin, not `/jonathan-check2`.
