---
skill: conversation-miner
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 13
seconds: 154
---

## What Dana asked
"I keep re-explaining the same stuff to Claude in my acme-billing repo, like how the proration rounding works in pricing.js. Can you go through my past sessions and tell me what patterns I should be turning into skills or notes?"

## What happened
The agent found the acme-billing project folder under ~/.claude/projects, listed the session files, and read the six completed sessions. It checked for an existing memory index (none), then read src/pricing.js to check Dana's proration example. It produced a "Conversation Mining Report" table of five one-off corrections, each with date, frequency and existing coverage (for example, "Full - already in your CLAUDE.md" for the run-the-tests rule). It said plainly: "Proration rounding doesn't actually exist in pricing.js right now", and "nothing repeats 3+ times, so per the mining rubric none of these qualify as a confirmed 'pattern' yet. I'm not going to inflate one occurrence into a trend." It ended by offering to draft three lines for her repo CLAUDE.md and asked where the proration code actually is. Along the way the plugin's pre-tool and stop hooks fired on unrelated matters; the agent pushed back on them in its text, worked around one with the Read tool, and they did not derail the task.

## Function: works
It located the real session logs, parsed them, scored them honestly against the skill's 3+ rule, reported sources by date, checked existing coverage against Dana's CLAUDE.md, and corrected her false premise about pricing.js instead of inventing a proration pattern. It used only Dana's data and offered a concrete next step (draft CLAUDE.md rules). It did not save a record itself but asked before writing, which is reasonable. No account-skill noise observed.

## Setup path: delegates
The SKILL.md tells the agent where the logs live (Step 1, with exact commands), says to report honestly when there are too few sessions, and for saving findings falls back from a memory skill or intent skill to `alignment-harness record mined-patterns` / `record intents`, and tells it to print the saved path. The agent builds everything itself from the person's own session history; nothing asks Dana to write, paste or collect material. Minor note, not a failure: the save step does not say to show the finding and ask before saving, but the agent did that anyway.

## Proposed fix
None.
