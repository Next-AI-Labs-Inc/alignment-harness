---
skill: process-actionable
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 22
seconds: 313
---

## What Dana asked
Triage this signal for me: customers are reporting that invoices come out a few cents off when a discount code is applied to a multi-item order. I think it is somewhere in src/pricing.js or src/invoices.js in acme-billing, run the pipeline on it.

## What happened
The agent read the repo first, then searched the whole tree and git history for any discount or multi-item concept and found none. It printed a coherence check, then invoked the governer skill and recorded a score of 100/100 (marked uncalibrated because no risk table is set up). It wrote two runnable contract items (a grep check and the repo's own test run) and verified both. It then wrote a run folder under `.harness/pipeline-runs/` with 01-notice, 02-score, 03-verify, 03.5-sanity-check, 04-closed and REPORT. The finding was that the claim is disproven for this repo: "acme-billing can't do this yet", so the real question is which system issues the invoices Dana's customers describe. It said plainly "no skill-history oracle is set up (/alignment-harness:harness-setup can build one)" and then filed a completion report. Account-skill noise: the run file's source line copied an email address from the account, which is not Dana's; it came from the session, not from the skill text.

## Function: works
It ran the pipeline stages against Dana's real repo, grounded every claim in commands it ran, and closed the claim honestly instead of inventing a rounding bug. It did not invoke /align or /investigate-error as separate skills, but did the equivalent work inline and produced the observable run files.

## Setup path: mixed
Good: the missing README path delegates ("offer to write a starter README to that path"). Weak: the missing memory search, known-decisions registry and Stage 4.5 person-check oracle are all "say so plainly and move on" with no offer to build them from Dana's past sessions or repo, which is a dead-end by the audit. Stage 5 (Heal) reads prompts from `experiments/process-actionables/prompts/`, which a new user does not have, with no fallback. The "open REPORT in Obsidian" step hardcodes the author's vault name (`intent`) and path. `/test-actual-ux` is named as a browser-evidence option but is not in the plugin.

## Proposed fix
1. Stage 0.5 / Stage 1 step 3 / Stage 4.5: replace "say so plainly and move on" with: "If no known-decisions registry or memory search is set up, say so once, then offer: 'I can build a starter from your past Claude Code conversations (`~/.claude/projects/*/*.jsonl`, your own messages only) and this repo's commit messages; want me to?' On a yes, extract prior dismissals/decisions and corrections, show the list, and save only after she approves it to `alignment-harness records known-decisions`. Proceed without it meanwhile."
2. Stage 5: "If `experiments/process-actionables/prompts/0{N}-*.v*.md` does not exist, use the stage's instructions from this SKILL.md as the v1 prompt and save it to `<project>/.harness/pipeline-runs/prompts/0{N}-{stage}.v1.md` first, then diff against that."
3. Obsidian step: "Only run `open obsidian://...` if the person has an Obsidian vault (check `~/.claude/CLAUDE.md` and the project for a vault name); otherwise print the path to REPORT.md. Never use a hardcoded vault name."
4. Stage 3 step 11: drop `/test-actual-ux` or say "or any browser-testing skill the person has; if none, cap certainty at 70% and say so".
