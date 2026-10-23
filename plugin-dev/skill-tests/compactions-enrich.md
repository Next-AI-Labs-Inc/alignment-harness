---
skill: compactions-enrich
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 6
seconds: 119
---

## What Dana asked
I've got a few past Claude Code sessions on our acme-billing repo where I worked on the invoice rounding fix and the auth token refresh. Can you enrich those session compactions with intent alignment, a leverage score and any unfinished work?

## What happened
The agent first checked what storage existed: it ran `alignment-harness records compactions` (got an empty local folder), listed the repo, grepped for MongoDB/SessionCompaction code (none), and listed Dana's 6 past sessions. It passed the plugin's coherence check, then read the six session files and the git log. It concluded there was no database and said it would use local JSON files. It then reported: "none of them is literally 'invoice rounding fix' or 'auth token refresh'", named the three closest sessions (annual-price invoice total, annual price test edit, billing-admin auth change), and asked "did you mean these two pricing/invoice and auth sessions, or are there other sessions elsewhere". It also offered to save her repeated corrections (don't touch auth without asking, don't edit tests to match bugs) as standing feedback. It stopped before invoking /reflect, /align and the other sub-skills. Account-skill noise: none seen.

## Function: works
It correctly recognised the database-free setup, chose the local-JSON route the skill describes, grounded itself in Dana's real sessions, and paused on a genuine mismatch between her request and her history instead of inventing content. No author-world data was used. It did not get to the actual enrichment in 6 turns, but the right first part (Step 0 and scoping) was done sensibly.

## Setup path: mixed
The "no database" fallback delegates well: it points to `alignment-harness records compactions` and says to treat each compaction as a local JSON file. But Step 0 assumes a compaction record already exists ("load the full compaction record... `compactedSession`"). In Dana's case the records folder was empty, and the SKILL.md has no instruction for that. It never says to build the records from the person's past sessions in `~/.claude/projects/*/*.jsonl`. The agent only found its way by improvising. That is a dead-end for the empty-folder case.

## Proposed fix
Add to "Step 0", after the first paragraph:

"If no compaction record exists yet for the work the person named (the local records folder is empty, or no file matches), do not stop and do not ask them to paste anything. Offer once, in a sentence, to build the record from their past Claude Code sessions: list `~/.claude/projects/<this repo's folder>/*.jsonl` with date and first user message, pick the sessions that best match what they asked for, and show the list. On a yes, for each chosen session write `<records folder>/<shortId>.json` with `shortId` (first 8 characters of the session id), `title` (from the first user message), and `compactedSession` (the user and assistant text turns only, no tool results), leaving the enrichment fields empty. Then continue with Step 0 as normal. If none of the sessions match the topic they named, say so and ask which of the closest ones they meant (a pick, not new material)."
