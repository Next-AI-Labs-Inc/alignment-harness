---
skill: incomplete-tasks-get-from-session
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 21
seconds: 376
---

## What Dana asked
I was going back and forth on acme-billing for a while in my last few Claude sessions and I am sure I left stuff unfinished, especially around the proration logic in pricing.js. Can you go through my recent sessions and pull together what is still open?

## What happened
The agent first tangled with the plugin's memory-search and coherence-check hooks, then found her six past acme-billing sessions and read each one's user messages and the assistant's replies. It discovered that `python3` is not installed in the sandbox, so the skill's own `run_extract.sh` could not run, and it wrote a small node script to pull the same data instead. It checked the repo (`pricing.js`, `invoices.js`, tests, git log) against what the sessions claimed. It printed `## INCOMPLETE_TASKS` and a priority-sorted list with "Done means:" lines in Dana's voice, quoting her words (for example "you said it was fixed but you never ran the tests. run them first next time"). It told her plainly: "none of your last six sessions on this project mention proration or prorating anywhere", rather than inventing a proration task. It did not persist anything: "this session doesn't have a task-tracking tool or a working compaction store available, so I haven't filed these anywhere persistent", and it offered to write a `TODO.md` if she says where.

## Function: works
It did the core job for her request: real open items from her real transcripts, grounded against the code, lived-outcome wording, and honest about the proration premise not being in the record. The persist step was skipped, and it asked where to save instead of using the skill's own local-file default. Account-skill noise: the memory search also surfaced the account's synced skills, but the agent did not use them.

## Setup path: mixed
Step 1 hard-depends on `python3` (`run_extract.sh` calls `python3 extract_transcript.py`) with no fallback, so on a machine without Python the prescribed step fails and the agent had to improvise (a dead-end for the script path). Step 3 does name a fallback ("follow `agentic-session-compactions`' own local-file default" and read back via `alignment-harness records compactions`), which is good, but it never says to create or offer that local file with consent and show the path, and the agent in the run did not use it. The sessions, task list and repo are all reachable sources, so the skill never asks Dana for material.

## Proposed fix
In Step 1, replace the bare `bash "$SCRIPT"` instruction with: "If `python3` is not installed (`command -v python3` fails), do not stop and do not ask the person to install it. Extract the same fields with node instead: read `~/.claude/projects/<project-dir>/<SESSION_UUID>.jsonl` line by line, keep entries with `type === 'user'` and not `isSidechain` whose `message.content` is a string or `text` blocks (skip `tool_result` blocks and text starting with `<`), and produce the same JSON shape. Better: ship `extract_transcript.js` next to `extract_transcript.py` and have `run_extract.sh` use node when python3 is missing." In Step 3, add: "If `/compact-agentic-session` is not available, say so in one line, write the compaction to `$(alignment-harness records compactions)/{SESSION_UUID}.md` in the `agentic-session-compactions` format, print the path, and ask the person only to confirm or edit the items. Do not ask where to store it."
