---
skill: enrich-all-compactions
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 24
seconds: 2040
---

## What Dana asked
I've got six past Claude Code sessions from working on acme-billing (pricing, invoices, auth) and I want them all deeply enriched so I can see which work mattered most. Can you run the enrichment sweep over all of them?

## What happened
The agent first checked the plugin's compaction store and found it empty ("total 0", zero .md files). It then looked in Dana's project session folder for acme-billing, found six small session transcripts, and read all six raw. It printed its coherence check, ran the governer gate, confirmed the store's schema from the CLI, and dispatched six background subagents, one per session. Each one ran /reflect, /align, /compact-agentic-session and /incomplete-tasks-get-from-session via the Skill tool and wrote to its record after each step. Its dispatch message said "Six background agents are now running the full pipeline ... writing incrementally so nothing's lost if one runs low on context". When they finished it audited the store (6 total, 6 leverage, 6 reflection) and ranked the sessions by leverage score (top was the annual pricing bug at 96, lowest the team-plan session at 35), then offered to check whether the top bug was really fixed. The run took roughly 34 minutes wall clock because the parent waited on the background agents. No API key or outside service was used, and everything referred to Dana's own repo and sessions. Account-skill noise: none observed.

## Function: works
It did the real job for Dana's request: it turned her six sessions into fully enriched compaction records and gave her the "which work mattered most" ranking she asked for. It handled the empty store by creating records from her raw transcripts rather than reporting "nothing to enrich" or inventing data.

## Setup path: mixed
Step 1 only handles "compactions exist but lack leverageScore". A new user's store is empty, and on an empty store the grep in Step 1 prints nothing, which reads the same as "nothing to enrich". The only guidance for that case is the late section "Compacting sessions that were never compacted at all", which never names where the sessions live or says to offer the build and ask consent. The agent got there by judgment, not by instruction, and it went ahead without asking first. The "ask what cadence they want" line is a fine minimal ask (a judgment, not material).

## Proposed fix
In Step 1, after the local-store command, add this text:

"If the store has zero files, say so plainly (do not report 'nothing to enrich'). Then offer, once, to build the records from the person's own past Claude Code sessions: list `~/.claude/projects/*/*.jsonl` (start with the current repo's folder, `~/.claude/projects/<cwd with / replaced by ->/`), show the session count and the first user message of each, and ask 'Want me to compact and enrich these N sessions?' On a yes, create one record per session with `alignment-harness store add compactions --json '{...}'` from the raw transcript (see 'Compacting sessions that were never compacted at all'), then continue with Step 2. The person's only job is yes/no or pick which sessions."
