---
skill: predict-next-action2
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: dead-end
turns: 8
seconds: 65
---

## What Dana asked
I just wrapped up the proration fix in src/pricing.js and the invoice tests are green. What's the highest-leverage thing I should work on next in acme-billing?

## What happened
The agent never called the Skill tool, so none of the skill's steps (context block, Sonnet subagent, oracle query) ran. It read the repo (git log, all four source files, the test, the README) and answered on its own. It said: "there's no NotebookLM oracle configured here, and running unverified commands to an external `alignment-harness` binary or `nlm notebook query` isn't warranted just to answer a prioritization question." It caught that the repo has no proration logic and no invoice tests, contrary to what Dana said. It then recommended adding tests for `canViewAccount` in src/auth.js as the next step, and asked "Want me to write that test file now?" A stop-hook evidence gate fired once on the reply; the agent correctly called it a false positive and repeated the question. Account-skill noise: none seen.

## Function: needs-setup-no-offer
The request matches the skill's triggers ("what's highest leverage"), but the skill was not used. The agent did see that no oracle existed and said so plainly. It then fell back to repo-only reasoning and never offered to build an institutional-history source from Dana's past sessions, CLAUDE.md or repo history.

## Setup path: dead-end
SKILL.md says that with no oracle configured the skill should "skip this step and say so plainly". It does say so, but it never tells the agent to offer to build the missing history from sources already on the machine. It only points at `/alignment-harness:harness-setup`, which leaves the setup to the person. The Part A instructions also name an `nlm` command and a "switches file / oracle registry" that a new user does not have, and the skill gives no way to tell whether one is configured.

## Proposed fix
Replace the "If no oracle is configured" paragraph in Part A (and the matching sentence under "Which oracle this uses") with:

"If no response-predictor oracle is configured, say so in one clause in your opening, then make one offer: 'I can build a lightweight history from your past Claude Code sessions, CLAUDE.md and this repo's commit messages so the prediction reflects how you actually prioritize. Want me to?' On a yes, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<topic of this session>"` over `~/.claude/projects/*/*.jsonl` (the person's own messages only), read `~/.claude/CLAUDE.md` and `git log --format=%B -30`, and run `alignment-harness records corrections` and `alignment-harness records intents` if present. Show the 3-5 most relevant past corrections or priorities you found, and use them as the evidence for the prediction. Ask only for a yes/no. If they decline, give the session-only prediction, labeled as such."

Also add to the skill description or top section a line telling the agent to invoke this skill on "what should I work on next" requests, so it is not bypassed.
