# Audit: when something is missing, the agent offers to do the setup work

## The principle

When a skill finds it needs something it doesn't have yet (writing samples, a history notebook, a benchmark, a config value, a list of priorities), it doesn't ask the person to produce it. It offers to build it from what already exists on their machine and asks for consent once. Then it does the work and shows the result for approval.

Asking the person to write, paste or collect material is the last resort. It's only acceptable when nothing the agent can reach could stand in for it, and then the ask is as small as possible: a judgment (yes/no, pick one, correct this), not raw material.

The example that set this: the voice skills told a new user's agent to "ask for 3-5 sentences of their own writing." The person's past Claude Code conversations already hold hundreds of examples of how they think and talk. The right move is to offer to pull those out, pick the most representative ones, and show them before saving.

## Sources an agent can offer to mine (with consent)

- **Past Claude Code conversations:** `~/.claude/projects/*/*.jsonl`. Keep only the person's own messages (`type: "user"` entries whose content is text, not tool results). Search them with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`.
- **The current repo:** README, docs, commit messages (`git log --format=%B`), code comments.
- **The person's own Claude setup:** `~/.claude/CLAUDE.md`, their own skills in `~/.claude/skills/`.
- **Harness records already captured:** `alignment-harness records <kind>`, such as confirmed intents, corrections and compactions.

## What the auditor checks in each skill

1. **Find every setup or fallback path:** any place the skill says what to do when something it needs is missing, not configured, empty or not built yet.
2. **Classify each one:**
   - **delegates**: offers to build the missing thing itself from a named source, with consent, and shows the result. This passes.
   - **asks-for-material**: tells the agent to ask the person to write, paste, list, describe, dictate or collect something the agent could have gathered. This fails.
   - **dead-end**: says the thing is missing and stops, or quietly works without it and doesn't say so. This fails.
   - **unavoidable-ask**: asks for something no reachable source could provide (a decision, a preference with no trace in history, an external account). This passes if the ask is minimal.
   - **no-setup-path**: the skill needs nothing that could be missing. Not applicable.
3. **Fix what fails** with the smallest edit that works. Name the source, say how to extract from it, ask consent once, show before saving, and keep the person's ask to a judgment. Don't restructure the skill, rename anything, or change what it's for.
