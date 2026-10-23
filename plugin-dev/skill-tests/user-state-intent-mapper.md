---
skill: user-state-intent-mapper
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 9
seconds: 73
---

## What Dana asked
"I'm about to change the proration logic in ~/work/acme-billing. Can you map every user state in our billing code (src/invoices.js, src/pricing.js, src/auth.js) and what each branch is meant to do, so I know what I might break?"

## What happened
The agent loaded the skill, then chose not to run the full 7-stage pipeline: "for 3 files that's a lot of machinery (including a stage that self-edits the skill file in `/opt/alignment-harness/`, outside this repo, which I won't do without you asking for it explicitly)". It read the three source files and the test, and was stopped once by the harness's "search memory first" hook, after which it ran the memory search (which found only Dana's README and the session itself). It grepped for conditionals and found exactly 2. It then said: "This codebase is small enough that the full intent-mapper pipeline isn't warranted (its own 'when not to use' rule: fewer than ~5 conditionals → document inline — this domain has exactly **2**)". It gave an inline map of both branches with the intent of each, and pointed out that there is no proration logic in the code yet. Ended cleanly in 9 turns. No account-skill noise and no leakage of anyone else's data.

## Function: works
Dana's repo really has only 2 conditional branches, so the skill's own "When NOT to use" rule applies, and the agent followed it and still gave her the useful part (what each branch is for, what a proration change could touch, and that proration does not exist yet). It did not invent intent sources; it cited the README and the code.

## Setup path: mixed
Stage 3 handles a missing oracle/memory search well: it says to fall back to code-pattern inference and "say plainly that no oracle or memory search was available", so it is not a silent dead end. But it never offers to build that memory from what Dana already has (past sessions, commit messages, her CLAUDE.md), and Stage 2's source list names only an Intent DB, CLAUDE.md, `docs/intent/` and git log, so past conversations are not mined. The only pointer is "see `/alignment-harness:harness-setup`", which leaves Dana to go and do it. Separately, the self-healing loop tells the orchestrator to edit this SKILL.md in place, which in a normal plugin install is outside the user's repo; the agent refused to do that unprompted.

## Proposed fix
In Stage 2 and Stage 3, replace the "if configured / if nothing is configured" wording with: "If no institutional-memory search is configured, say so in one line and offer to ground the predictions in the person's own history instead: past Claude Code conversations (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<state or domain keywords>"`, which searches `~/.claude/projects/*/*.jsonl`, keeping only the person's own messages), `git log --format=%B`, and `~/.claude/CLAUDE.md`. Ask consent once, run the searches, cite any hits as sources, and show the matches before relying on them. Only fall back to code-pattern inference alone if the person declines or nothing relevant is found." In the Self-Healing Loop, change step 2 to: "Orchestrator shows the proposed patches to the person and applies them to this SKILL.md only if they agree; otherwise it lists them in the final report."
