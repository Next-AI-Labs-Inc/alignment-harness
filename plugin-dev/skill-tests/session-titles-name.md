---
skill: session-titles-name
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 14
seconds: 186
---

## What Dana asked
My /resume list for acme-billing is a wall of unnamed sessions and I cannot tell which one was the invoice rounding work versus the auth token refactor. Can you give my old sessions proper descriptive titles?

## What happened
The agent loaded the skill, found Dana's acme-billing session folder under ~/.claude/projects, and counted 7 session files. It decided the haiku batch pipeline was overkill for that few and read each session's first messages itself. The harness's coherence gate blocked its first write-capable command until it printed its understanding; it did, then continued. The skill's python snippet failed ("python3: command not found"), so it switched to node and listed the six past sessions (the seventh was the live run). It backed the six files up to /tmp/session-backups, appended custom-title and agent-name entries to each, and checked every line was valid JSON. It finished with "Done. All 6 completed sessions in acme-billing now have titles appended (validated as well-formed JSON), with backups saved to `/tmp/session-backups/`" and a table of short id to title. Titles came from Dana's own messages, for example "Fix annual plan charging 12 months instead of 10", "Add new team pricing plan at $60 per seat", and each ended with the C{n}*L{n} score. Nothing from outside Dana's machine was used. No account-skill noise.

## Function: works
It did the skill's real job for Dana's own sessions: found the unnamed ones, derived specific intent-based titles from their content, wrote both entry types, and kept backups. It departed from the written pipeline (no haiku batching) sensibly for a small set, and did not ask consent before writing, which the skill does not ask for either.

## Setup path: no-setup-path
The skill needs only the person's own session files, so nothing author-specific can be missing. The project slug is a placeholder with "find yours with: ls ~/.claude/projects/", which the agent resolved itself. Minor rough edges that did not block: the Step 1 snippet assumes python3 (missing in the sandbox, agent fell back to node), and the skill has no "backup first" or "show titles before writing" step, so the agent added backups on its own.

## Proposed fix
None.
