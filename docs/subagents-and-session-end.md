# Subagents, memory-first search, and session end

## Subagent alignment
**What it's for:** a subagent starts with none of the conversation. When the agent hands work to one, the harness gives the subagent a risk hint derived from its real task text (plus the session's own governer score), and asks it to state the exact result a person will experience, the conventions it will follow, and the assumptions it will check — before it builds. (The author's own version scored every subagent a flat 50 because Claude Code's subagent-start event carries no task text; this one takes the text from the hand-off itself.)
**Switch:** `subagents.injectAlignmentAtStart`. **Is it working:** `state/subagents/<session>.jsonl` in the data folder records each start with `taskTextFound` and the hint.

## Search memory before searching code
**What it's for:** the first code search of a session (Grep, Glob, grep/rg/find) waits once until the agent has searched what is already known with the built-in `agent_find` — so it starts from past decisions, not a cold guess. It asks once per session whether or not the agent follows it.
**Switch:** `intentSearchGate.strength` (`block-once` / `remind` / `off`). **Is it working:** local log event `IntentSearchGate`.

## Session end
**What it's for:** if the agent never wrote a record of the session, an automatic one is saved (marked automatic, built from this session's own messages, score, edited files and unchecked contract items); an agent-written record is never overwritten. Likely corrections in the person's messages are saved as candidates to review. The session's temporary gate files are removed.
**Switches:** `sessionEnd.autoCompaction`, `sessionEnd.collectCorrectionCandidates`, `sessionEnd.cleanUp`. **Is it working:** `alignment-harness compaction list` shows `(auto)` records; log event `SessionEndAutoCompaction`.
