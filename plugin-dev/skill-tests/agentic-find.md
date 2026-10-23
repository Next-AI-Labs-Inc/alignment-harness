---
skill: agentic-find
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 8
seconds: 81
---

## What Dana asked
I am about to change how proration works in src/pricing.js. Before I do, can you check whether we already decided anything about proration or rounding, in my past Claude sessions, the docs, or git history?

## What happened
The agent loaded the plugin's agent_find tool, then ran grep over past session transcripts, the repo markdown files and git history (log messages and -S diff search). A pre-tool hook stopped its first grep and told it to search memory first, so it called agent_find with "proration rounding decision pricing billing". That returned 8 keyword-mode hits, none relevant (mostly the skill text and the agent's own current session). It then read the README, the git log and pricing.js, and answered: "No prior decisions found — this is a genuinely fresh area, not one I'm missing context on". It listed what it checked (one session file, a 3-line README, one commit, no proration code in pricing.js) and said she was starting from a blank slate. It did not invent any history. One oddity: it saw only the current session's transcript, not Dana's 6 past sessions, and reported that honestly as "only this conversation exists".

## Function: works
It did the skill's job for her request: searched sessions, docs and git history before she changes pricing code, and stated plainly that nothing turned up. The MCP path and the grep fallback both ran, and no author-world data leaked. No account-skill noise.

## Setup path: mixed
The "isn't set up" fallback (grep sessions, docs, git, say plainly when nothing turns up) is a good delegates-style path and never dead-ends. The "set up" side is weaker: the source table says memory log "a JSONL log you or a hook write to", tasks "your own integration", intent records "a database", and it only points to /alignment-harness:harness-setup without saying the agent itself offers to build any of it. That leaves the person to do the wiring. Also the fallback greps raw jsonl files rather than using the plugin's own memory-search.js, which filters to the person's own messages.

## Proposed fix
In "If it isn't set up", after step 4, add: "If the search found little because nothing is indexed, offer once (ask consent): 'I can build a searchable memory from what is already on this machine: your past Claude Code conversations (~/.claude/projects/*/*.jsonl, your own messages only, via `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`), this repo's docs and commit messages, and your ~/.claude/CLAUDE.md. Want me to set that up?' If yes, run it, show the top few hits for a sample query, and ask only whether they look right." Also change the source-table "Needs" cells for memory log and tasks from "you or a hook write to"/"your own integration" to "the agent can build this from past sessions and commits on request; no hand-written log needed".
