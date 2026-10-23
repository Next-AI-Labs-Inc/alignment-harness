---
skill: how-to-create-or-update-skill-files-2
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 6
seconds: 126
---

## What Dana asked
"I want to make a skill that writes the risk note I attach to every PR touching src/pricing.js or src/invoices.js in acme-billing. It needs to sound like me and capture the judgment calls, not just list the diff. Can you help me build it?"

## What happened
The agent never invoked `how-to-create-or-update-skill-files-2` or the pre-check skill it names; it worked from the request directly. It restated the goal, listed the repo (one commit, no PR history, no prior risk notes), read pricing.js and invoices.js, and checked for memory files. It then concluded "There's no existing material to learn from here" and asked: "Can you paste 1-3 actual risk notes you've written before (from past PRs here or elsewhere)?", plus how she wants to trigger it and where the output should land. It did not look at her past Claude Code sessions or offer to. The plugin's stop hook then asked for a task to be created; the agent searched for a TaskCreate tool, found none, and stopped. Account-skill noise: the session listed many synced account skills, but the agent did not use any.

## Function: needs-setup-no-offer
The skill did not visibly load, so nothing in its instructions drove the run. The agent correctly saw that it lacked voice samples and said so, but asked Dana to paste them instead of offering to pull her own wording from her past sessions.

## Setup path: mixed
Moves 2 and 4 degrade to local fallbacks ("search institutional memory (or the repo's own docs/notes/past sessions if no memory search is set up)"), which delegates. But Move 4's voice path ("run the `how-to-talk-like-the-founder` skill's calibration step and read at least two before writing") never says where samples come from when the person has none, and the skill never names past Claude Code sessions as a mining source or asks for consent and a show-before-saving step. That leaves an implicit ask-for-material path, which is what the agent fell into.

## Proposed fix
Add to Move 4 of SKILL.md, replacing the voice-samples sentence: "When the skill needs samples of the person's voice or judgment and none are on hand, do not ask them to paste any. Offer once: 'I can pull examples of how you write from your past Claude Code conversations and this repo's commit messages and docs. OK?' On yes, read the person's own text messages from `~/.claude/projects/*/*.jsonl` (entries with `type: "user"` whose content is text, not tool results; search with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`), plus `git log --format=%B` and the repo's README and docs. Pick the 3-5 most representative passages, show them, and save only what the person approves. Ask the person only to confirm or correct the picks."
