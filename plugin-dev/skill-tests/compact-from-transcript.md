---
skill: compact-from-transcript
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 14
seconds: 124
---

## What Dana asked
I had a long Claude Code session last week in acme-billing where we were reworking the proration logic in src/pricing.js, and it ended without me ever wrapping it up. Can you compact that session so I don't lose what we decided and what's still open?

## What happened
The agent went straight to Dana's own transcript folder (`~/.claude/projects/-home-dev-work-acme-billing/`) and opened the six short past sessions, since the skill says to read the raw transcript by hand when there is no extraction script. Two of its commands were blocked by the plugin's coherence and search-memory hooks, and it worked around them (ran the memory search, then the code search). It then read `src/pricing.js`. None of the six sessions mentioned proration, none was long, and the file has no proration logic at all. It reported: "I looked for that session and it isn't there" and "there's nothing to compact — I'd be manufacturing a record of decisions that were never made, which the skill itself says not to do". It asked Dana for the right project path or a rough date, and offered to start the proration work fresh. It wrote no record. Account-skill noise: none observed; the agent did not reach for any of the account's synced skills.

## Function: works
Dana's request named a session that does not exist in the sandbox. The skill did the right first part of its job: it found and read her real transcripts, checked them against her claim, and followed the skill's "say so rather than manufacturing a record" rule with no invented content and no leakage of anyone else's data. It did not offer to compact one of the six sessions that do exist, which would have been a slightly friendlier next step.

## Setup path: delegates
Every thing the skill might lack has a self-serve fallback. With no extraction script, Step 0 says to skip it and read `~/.claude/projects/<project-slug>/<session-id>.jsonl` by hand. With no compaction store, Step 4 says to get the folder from `alignment-harness records compactions` and write the JSON locally. The batch section tells the agent to say what it will read before reading private history. Nothing asks Dana to write, paste or collect material. The only ask is the session itself when the agent cannot tell which one is meant, and that is a minimal judgment.

## Proposed fix
None.
