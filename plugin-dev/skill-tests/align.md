---
skill: align
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: mixed
turns: 10
seconds: 111
---

## What Dana asked
I am about to start reworking how acme-billing calculates proration in src/pricing.js and I am not sure I can even say what I want out of it yet. Can you help me get clear on what I am actually trying to accomplish before we touch any code?

## What happened
The align skill was never invoked: there is no Skill call in the transcript and the required opening banner never appeared. The plugin's pre-tool hook did push the agent to search memory first, so it ran the plugin's agent-find CLI, which found nothing about proration and only surfaced other skill docs. It then read pricing.js, invoices.js, the README and the test by hand and found there is no proration logic at all. Its reply opened with "I'm going to skip most of that theater" (referring to the plugin's alignment ritual), then asked which proration scenario was driving the rework (seat changes, plan changes, cancellation, monthly/annual switch). It used no intent map, no numbered items with certainty dots, no reply-command menu, and no saved seed. A stop hook then fired about creating tasks, and the agent answered that no new requirements had come in. Account-skill noise: none observed.

## Function: broken
Dana's request is exactly what the skill is for (clarify intent before code), yet the skill did not engage and the agent explicitly dismissed the plugin's alignment format, so none of the skill's output (banner, intent map, ids, next-step commands) appeared. The agent's own reply was sensible and grounded in her repo, and nothing from the author's world leaked. The failure is that the skill did not trigger or get followed, not that its body errored.

## Setup path: mixed
The memory-search path is good: when agent_find is not set up, the skill says to grep project docs, git log and past sessions by hand and to say plainly when nothing turns up, which delegates the work to the agent without asking Dana for material. The principles-notebook path only says "skip this step openly", which is honest but never offers to build that notebook from her past sessions, so it stops at a dead-end-style skip. The "no context" opener asks Dana an open question, which is an unavoidable ask and is fine.

## Proposed fix
In the "If no principles notebook is configured" paragraph, replace the last two sentences with: "If no principles notebook is configured, say so in one line ('no principles notebook is set up yet') and offer once, with consent, to build one from the person's own history: their past Claude Code sessions (`~/.claude/projects/*/*.jsonl`, their own messages only), `~/.claude/CLAUDE.md` and the repo's commit messages, via `/alignment-harness:harness-setup`; show what it would contain before saving. If they decline, continue without it and reason from their past sessions and this conversation."

Separate from setup, the skill did not fire on a plain "help me get clear on what I'm trying to accomplish" request. Consider adding that phrasing ("help me figure out what I want", "before we touch any code") to the description or triggers so it loads for new users who do not type /align.
