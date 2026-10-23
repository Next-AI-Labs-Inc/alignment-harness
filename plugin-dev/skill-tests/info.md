---
skill: info
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: no-setup-path
turns: 5
seconds: 126
---

## What Dana asked
We have been going back and forth on the proration bug in src/pricing.js for a while now. Can you give me the session info so I can tell where we are?

## What happened
The agent never produced the `## INFO_SUMMARY` block. It first tried to learn the session's history by reading git log, a memory index file that does not exist, and then `git status` / `git diff`. The harness pre-tool hook blocked the `git status` and `git diff` calls as "changes something" and demanded a coherence check first. The agent then stopped and said: "I don't think I can honestly give you what the `/info` skill wants me to produce here." It concluded the session had no prior turns and only one commit, and said it would not fabricate a summary. It closed by asking Dana to either "Point me at the other session/transcript where the proration discussion happened" or tell it the state of the bug. It did not write a record, did not print a Compaction Gains line, and did not say it was skipping the save step. The session list also showed the account's synced skills, but the agent did not reach for any (no account-skill noise in the actions).

## Function: needs-setup-no-offer
The agent saw it had little to summarize, said so plainly, and did not invent anything, but it handed the work back to Dana instead of doing the skill's job. The SKILL.md says to deduce the intent from "the user's words" and to rank compaction gains at 100% when no compaction has happened, so a one-sentence intent drawn from Dana's own message plus the saved record was possible. It also never offered to look at her past sessions for the proration thread. The read-only git commands being blocked by the coherence hook contributed, but that comes from the hook, not from this skill.

## Setup path: no-setup-path
The skill needs nothing that could be missing: it uses the session's own content and the plugin's own `alignment-harness session-id` and `records session-info` commands, with a local log as the default. It also already says to state it if the save step is skipped. The gap is not a setup path but a missing instruction for a thin or first-turn session, which led the agent to refuse instead of summarizing what it could see.

## Proposed fix
Not a setup-path failure, but the smallest edit that would have turned this run into a pass. Add this under section 1 of skills/info/SKILL.md:

"If the session is short or this is the first turn, do not stop. Deduce the intent from what the person has said so far (their request and any files or repo they named), state it in one sentence, and say in a few words that it is a first-turn estimate. Compaction Gains is 100% when nothing has been compacted yet. Still run the save step. If the person refers to earlier work that is not in this session, offer once to search their past sessions (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<topic>"`) and, on a yes, fold what it finds into the intent."
