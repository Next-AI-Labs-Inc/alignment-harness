---
skill: leverage-predictor
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 4
seconds: 58
---

## What Dana asked
I just finished refactoring the proration logic in src/pricing.js in acme-billing. What should I work on next that would have the most impact?

## What happened
The agent read the repo (git log, README, all three source files, the one test file) before answering. It noticed Dana's premise was off (no proration logic exists in pricing.js, only one commit) and said so. It found that auth.js and invoices.js have no tests and recommended adding tests for them first, as a small change with no behavior change, and asked "Want me to go ahead?" It never loaded the skill through the Skill tool and did not score anything or label scores "uncalibrated". It said: "I'm skipping the formal proposal-filing flow (certainty scores, artifact IDs, etc.) here — I don't have real usage/analytics data to back those claims, and fabricating them would be worse than just telling you directly what I found in the code." Nothing from the account's synced skills or any outside data was used.

## Function: works
It gave a grounded, honest "what next" answer from Dana's real code and invented no analytics, feedback or source IDs. It skipped the skill's scoring table, uncalibrated label and /propose filing step, but did the core job of identifying the next highest-leverage move and asking before acting.

## Setup path: mixed
The priority-table fallback ("use your best general judgment and mark the score 'uncalibrated'") is fine but only points at /alignment-harness:harness-setup, without offering to draft Dana's priorities from her CLAUDE.md or past sessions. Step 1 tells the agent to gather "Analytics on user drop-off" and "Recent user feedback/bugs" with no named source and no instruction for when they don't exist, so a new user with none of this is left to improvise (this run improvised well, but the text doesn't say to). The proposal template also demands certainty scores and a "Where this came from" table with no rule for the case where there are no artifacts to cite.

## Proposed fix
Replace the Step 1 bullet list with: "Gather context from what exists on this machine, and say plainly which of these you found and which you did not: `git log` and `git log --format=%B` for recent work; TODO/FIXME comments and untested files in the repo; the person's past Claude Code conversations via `node \"${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js\" \"<topic>\"` for stated pain points; `alignment-harness records <kind>` for captured intents and corrections. Analytics and user-feedback data usually do not exist for a new user. If they don't, do not invent them: cite only what you actually read, and mark affected certainty scores 🔴 and scores 'uncalibrated'."

Add after the "If no priority table is confirmed yet" paragraph: "Then offer once: 'I can draft what matters most for this product from your CLAUDE.md, README and past sessions, and show it to you before saving. Want that?' On yes, draft it, show it, and save only after the person confirms or corrects it (a yes/no or a correction, not new writing)."
