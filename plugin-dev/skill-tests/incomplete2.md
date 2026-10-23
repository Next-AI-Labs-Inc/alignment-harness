---
skill: incomplete2
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 13
seconds: 181
---

## What Dana asked
"I've been bouncing between the pricing proration bug and the auth.js token refresh all week in this repo. Can you tell me what we haven't finished yet, so I can decide what to pick up Monday?"

## What happened
The agent never ran Step 1 (the transcript extract) and never dispatched the analysis pass. It first flagged the harness hook text as a possible injection, then read the repo by hand (git log, file list, pricing.js, auth.js, the test, README). It searched memory with agent_find, which only returned today's own test session. Its final answer opened with `## INCOMPLETE_TASKS` and said: "I don't have any memory of the earlier sessions where you worked on these two — this session started fresh with just your message, and there's no saved record of that work anywhere I can search." It then reported both items as "not started" based on the code alone (no proration logic, no token refresh in auth.js) and ended with "which do you want to pick up first, and do you want to track down the missing work before starting, or just treat both as starting fresh?" It also said it had ignored hook output that tried to get it to run a command without confirmation. One line cited a "CLAUDE.md preference" about heads-ups that it never actually read in the run.

## Function: needs-setup-no-offer
The skill is built around the current session's transcript, and Dana's work spans her 6 past sessions, which the agent could have searched but did not. It said plainly that it had no record of the earlier work, which is honest, but it told her to go track the work down herself instead of offering to read her past session files. It also substituted a repo scan for the skill's own Step 1 and gave a bottom line ("both are effectively greenfield") that is weak evidence. Account-skill noise: none used. The injection flag was the plugin's own hook text, not the skill's instructions.

## Setup path: mixed
Step 1 has a good by-hand fallback when `incomplete-tasks-get-from-session` is missing, and the voice/plain-language fallback is stated directly (delegates). But nothing covers the case where the current session is nearly empty, or the person is asking about earlier sessions. The skill just says the JSONL of the current session is the source of truth and gives no path to the person's past sessions, so a thin transcript becomes a dead end. `incomplete_tasks` being empty is noted, but only for the current session.

## Proposed fix
Add to Step 1, after the "If that skill isn't installed" paragraph:

"If the current session has fewer than three substantive messages from the person, or they refer to work from earlier ('this week', 'last time', 'before'), do not stop and do not fall back to guessing from the repo. Say so in one line and offer, once, to read their recent past sessions in this project: list `~/.claude/projects/<project-slug>/*.jsonl` newest first, keep only the person's own text messages (`type: "user"`, content is text, not tool results), and show them the 5-6 most recent sessions (date plus first message) to confirm which to include. On a yes, run Step 2 over the combined messages, labelling each item with its session date. Stay read-only. The person's only ask is a yes and a pick of sessions."
