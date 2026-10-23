---
skill: agentic-actionable-tasks
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 8
seconds: 109
---

## What Dana asked
I left a few things unfinished in acme-billing over the last couple weeks. Which of them have I already approved to be picked up, and what should I start with?

## What happened
The agent ran the skill's local fallback (`alignment-harness records compactions`, then the node query for `approved` items). The first call was blocked by the coherence-check hook, which it cleared by printing its understanding and attesting. The query returned `[]`. It then checked the compactions folder (zero files), the maintenance-intents folder (empty), looked for a configured service or config (none), and read the repo's git log (one commit, one branch, clean). Its final answer: "There's no data to answer this from — and I'd rather tell you that plainly than guess." and "nothing has gone through the approve workflow yet". It closed by asking "is there a set of session transcripts I should compact first, or should I just grep the repo for TODOs/WIP markers directly?" It never looked at Dana's 6 past sessions, never proposed a concrete way to build the missing records, and did no work toward building them. Account-skill noise: none seen.

## Function: needs-setup-no-offer
It was honest about the empty store and invented nothing, but the closing is a question back to Dana ("do you know where those unfinished items actually live"), not an offer to extract unfinished items from her past sessions with consent. The compact-first mention is a half-offer with no named source or plan.

## Setup path: mixed
The skill says the local fallback "always works, with no setup", but it only reads records that something else must have written; on a new machine it returns nothing, and the SKILL.md has no instruction for that case (no "if the folder is empty, say so and offer to build compactions from past sessions"). The pointer to /alignment-harness:harness-setup and the compactions skill is a delegation by reference only, and the approval step is left to Dana editing JSON by hand. Also minor: frontmatter `name` is `agent-actionable-tasks`, while the folder is `agentic-actionable-tasks`.

## Proposed fix
Add after the "Get Approved Tasks" local fallback block:

"If the query returns nothing and the compactions folder is empty, say so plainly, then offer once (ask consent): 'I can build your task queue from your past Claude Code sessions. I'd read the session files in ~/.claude/projects/*/*.jsonl for this repo, pull out work that was started but not finished, and save each as a compaction record with status pending. I'll show you the list before saving anything.' On yes, extract with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js"` or by reading the user's own messages and the last assistant turns of each session, draft `incompleteItems` (title, content, priority guess, parentRepo), show them, and save with `alignment-harness store update compactions <id> --json '...'`. Then ask Dana only to judge the list: mark each approve / dismiss. Never tell her to go write the items down herself."

Also rename the frontmatter `name` to match the folder (`agentic-actionable-tasks`).
