---
skill: skill-creator
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 9
seconds: 76
---

## What Dana asked
I keep re-explaining how we handle proration and rounding in src/pricing.js every time I ask Claude to touch billing code. Can you help me turn that into a proper skill for my acme-billing repo so it follows our rules automatically?

## What happened
The agent loaded the skill and went straight to Capture Intent. It ran a first search for what was already known, then read src/pricing.js, src/invoices.js, the test file and the README. It found that no proration or rounding logic exists in the repo: "no proration or rounding logic exists anywhere in the repo yet", so it said it could not reverse-engineer the rules. It then stopped and asked Dana to spell out three things (how proration is calculated, when and how rounding happens, and edge cases), and said it would then draft a SKILL.md and propose 2-3 test prompts. It did not open the pre-check protocol file that the skill's "BEFORE YOU START" section names. The agent also said it was "skipping that theater" about the plugin's hook ceremony. It did not offer to look through Dana's past sessions for where she had already explained the rules. Account-skill noise: none that mattered.

## Function: works
It did the right first part of the skill's job: it read Dana's real code, told her honestly that the rules are not in the repo, and began the Interview step with a concrete plan for drafting and testing. Two weaker points: it skipped the named pre-read, and it asked Dana to type out the rules without offering to pull them from her six past sessions, where she says she has been re-explaining them.

## Setup path: mixed
Capture Intent says to "extract answers from the conversation history first", which is good, but it only covers the current conversation, and the Interview step then asks the user for edge cases and examples with no offer to mine past sessions, CLAUDE.md, git log or her existing skills. The body also points at files that are not shipped next to SKILL.md (`scripts/init_skill.py`, `scripts/package_skill.py`, `scripts/init_json.py`, `agents/executor.md`, `agents/grader.md`, `agents/comparator.md`, `agents/analyzer.md`, `references/eval-mode.md`, `references/schemas.md`, `references/mode-diagrams.md`), and it gives no fallback when they are missing, so Improve, Eval and Benchmark modes dead-end.

## Proposed fix
1. In "Capture Intent", after the sentence ending "...before proceeding to the next step.", add: "If the workflow is not in the current conversation, do not ask the user to re-explain it. Offer once to mine it: (a) their past Claude Code conversations (`~/.claude/projects/*/*.jsonl`, only the user's own text messages, searched with `node \"${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js\" \"<topic>\"`), (b) the repo's CLAUDE.md, README, code comments and `git log --format=%B`, and (c) their own skills in `~/.claude/skills/` for house style. With their yes, extract the rules, show them as a short numbered draft, and ask only for corrections and for anything no source held."
2. Add under "Initialize": "The helper scripts and `agents/` and `references/` files named in this skill may not be present next to this file. If a named file is missing, do not stop: create the skill folder and SKILL.md by hand using the anatomy above, and for Eval and Improve modes run the prompts inline and grade by reading the outputs against the expectations."
