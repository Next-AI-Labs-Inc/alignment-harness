---
skill: close
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: no-setup-path
turns: 6
seconds: 134
---

## What Dana asked
We just spent the morning reworking proration in src/pricing.js, adding invoice tests, and fixing the token expiry bug in src/auth.js. Can you close this session properly so I can hand it off to my teammate tomorrow?

## What happened
The close skill was listed in the session (as alignment-harness:close) but the agent never loaded it. The "Session_Close_Orchestrator" banner never printed, no team or stage ran, and no Skill call was made. Instead the agent checked git status, git log and the source files by hand. It found a clean tree with one commit and none of the described work, then hit the coherence gate, attested 40% certainty, and stopped with a question. Its key line: "The repo doesn't contain the work you described... can you confirm this is the right repo/branch". No scope scan, reflection, nested intent, incomplete-task capture or compaction happened. Account-skill noise: none seen.

## Function: broken
Dana's wording ("close this session properly") is almost word-for-word one of the skill's own trigger phrases, yet the skill was never invoked, so none of its close pipeline ran. The agent's own behavior was sensible (it would not invent work it could not find), but the skill under test did not do its job. Part of this is the sandbox: a fresh session has no prior conversation for the skill to scan, and the repo holds only the starting commit.

## Setup path: no-setup-path
The skill needs no material from Dana. Its one environment gap, no TeamCreate/SendMessage, has an explicit sequential fallback that runs the stages in the same session. A missing reaction-check oracle falls back to a general rubric and says so. Every skill it calls (reflect, align, nested-intent, incomplete-tasks-get-from-session, compact-agentic-session, jonathan-check2) ships in the plugin.

## Proposed fix
None for the setup path. Separate note: the skill was not auto-invoked despite matching triggers. Consider making the description's first sentence name the phrases ("close this session", "hand this off", "wrap up the session") so the model picks it, and adding a line for the case where the session has little to close, such as offering to run /compact-agentic-session directly.
