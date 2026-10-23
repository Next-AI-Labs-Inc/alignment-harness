---
skill: agentic-find-how-to-optimize-monthly-maintenence-only
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: dead-end
turns: 4
seconds: 122
---

## What Dana asked
Search over my acme-billing history has been noisy lately - results for pricing questions keep surfacing old auth stuff. Can you help me do the monthly tuning pass on it so the signal is better?

## What happened
The agent grepped the repo for agent-find, agent-swarm and search-profiles files, listed the top-level layout and read the README. It found no search tool of any kind. It then said: "acme-billing has no search tool to tune." It quoted the skill's own line that without a comparable search tool "there's nothing here to do — skip this skill entirely," and declined to fabricate edits. It offered two guesses (wrong project, or plain grep/git-history noise) and asked Dana which she meant. It did not offer to build a search tool or mention the harness setup skill.

## Function: needs-setup-no-offer
It correctly detected the missing tool and did not invent one or use the author's files, which is good. But it ended by asking Dana to clarify instead of offering to build a search over her sessions and repo history, so she was left with no path forward.

## Setup path: dead-end
The SKILL.md says that without a comparable search tool "there's nothing here to do — skip this skill entirely," and only mentions `/alignment-harness:harness-setup` in a parenthetical. The skill never says to offer to build the missing tool from Dana's own history, so the missing-tool case stops with nothing offered.

## Proposed fix
In "Before you use this", replace the final sentence of the first paragraph ("...there's nothing here to do — skip this skill entirely.") with:

"If you haven't built or connected a comparable search tool, do not skip silently and do not ask the person to describe or collect material. Say plainly that there is nothing to tune yet, then offer once: 'I can build a small search over your past Claude Code sessions (~/.claude/projects/*/*.jsonl, your own messages only), the repo's README and git log, and your CLAUDE.md and skills, using /alignment-harness:harness-setup and scripts/memory-search.js. Want me to set that up?' On a yes, run the setup, show a few sample queries with their results for her approval, and only then continue with this skill's tuning checklist using her new tool's files."
