---
skill: next-priority-tasks
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 16
seconds: 149
---

## What Dana asked
I keep losing track of what to tackle next in acme-billing. Can you pull together a ranked list of what I should work on next, based on whatever open work you can find for that repo?

## What happened
The agent first grepped the repo for TODO/FIXME, looked for error logs, proposal folders and UX assignment records, checked git remotes and history, and ran `alignment-harness records` for the three local folders (all empty). It was briefly blocked by the plugin's coherence-check hook, printed the check, attested, then carried on. It read all three source files and the one test, ran the test suite, and answered with a "Sources checked" table: "none of the four formal tracked-work sources have anything in them yet." It then ranked four items from direct code inspection (no tests for `auth.js`, thin pricing tests, no tests for `invoices.js`, no test runner or CI), each in the skill's presentation format. It said it was using its own risk judgment instead of the score formula, and closed with "only 4 items, not 10, because there's genuinely nothing else tracked yet" and "Want me to start on #1 (auth tests), or pick a different one?"

## Function: works
It followed the skill's fallback path, said plainly which sources were checked and empty, did not invent data or use anyone else's world, and produced a concrete ranked list with proposed actions and the closing question. Account-skill noise: none seen.

## Setup path: mixed
The API path points to `/alignment-harness:harness-setup` and always has a local fallback, and the task-tracker source needs nothing, so those are fine. But for system logs the local fallback says "If none exists, skip this source and say so", and the UX and proposal fallbacks just read records folders that are empty for a new user. The skill never offers to seed them, and never names the sources an agent could mine (repo TODOs, git log, past sessions). The agent only got a useful list because it improvised the code inspection; the skill text alone leaves a dead end.

## Proposed fix
In "Workflow Steps", after step 1 (Fetch), add:

"If every source comes back empty or unconfigured, do not stop at saying so. Say which sources you checked, then offer once: 'Want me to build a starter list from what's already here?' On a yes, mine (a) TODO/FIXME/HACK comments and untested files in the current repo, (b) `git log --format=%B` and open branches for unfinished work, and (c) the person's own past Claude Code messages in `~/.claude/projects/*/*.jsonl` (their `user` text entries only, searched with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`) for things they said they would do later. Show the candidate items, and with their approval save the keepers as proposals via `/how-to-submit-and-track-proposals` so the next run has real data. Their ask is only yes/no and 'keep or drop' on each item."
