---
skill: insight
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 25
seconds: 124
---

## What Dana asked
Before I touch the proration logic in src/pricing.js, can you check what we already know about how billing decisions were made here? Look at whatever institutional knowledge or notes exist for acme-billing and tell me what I should be aware of.

## What happened
The agent checked `alignment-harness config show` and `alignment-harness doctor` for an oracle list and found none. It then searched the README, `git log` (one squashed commit), the past-session folder for the repo and the harness memory search (`agent_find`). It read all six small past session logs and the code and tests. Its final message opened with "No knowledge oracles are set up for this project (checked `alignment-harness doctor` ... run `/alignment-harness:harness-setup` if you want them)." It then listed four dated corrections from her own past sessions (fix the code not the test, run tests before saying fixed, ask before touching auth, don't rename unasked) and flagged that "`src/pricing.js` currently has *no proration logic at all*". Along the way two hooks blocked it (a memory-search-first nudge and a coherence-check gate); it complied and continued. It hit the 25-turn cap right after writing the answer. No account-skill noise was seen.

## Function: works
It said plainly that no oracle exists, fell back to her repo, git and past sessions as the skill instructs, reported where it looked, quoted her real past corrections, and caught that the file has no proration code. It did not offer to build an oracle, but the fallback itself answered her request.

## Setup path: mixed
The fallback (step 3) is good: it names three local sources to mine and says to report honestly. Step 1 hands off to `/alignment-harness:harness-setup`, which covers oracles as an optional checkpoint, and NotebookLM accounts are an unavoidable external ask. But after a fallback the skill never offers to build a lasting local stand-in from those same sources. The "build your own version of this table" and "Keeping Oracles Fresh" sections tell the person to write their own scripts and notes, which is asks-for-material.

## Proposed fix
In "Is this set up?", after step 3, add: "After reporting what the fallback found, offer once: 'I can save these corrections and decisions as a short local notes file for this project (mined from your past Claude Code sessions via `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js"`, plus `git log --format=%B` and your README) so next time I start from it. Want that?' On yes, build it, show it, and save only after approval. Connecting a NotebookLM notebook is optional and needs their own Google account; mention it only if they ask." Also replace "write the equivalent for your own data sources" and "build your own version of this table" with "offer to draft it from their past sessions and docs and show it for approval."
