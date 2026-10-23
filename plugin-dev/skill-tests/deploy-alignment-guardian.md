---
skill: deploy-alignment-guardian
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: asks-for-material
turns: 9
seconds: 312
---

## What Dana asked
I'm about to have several agents rework pricing.js, invoices.js and auth.js in acme-billing over the next few hours. Can you deploy an alignment guardian so the work stays checked against what I actually want for the billing changes?

## What happened
The agent searched memory and the repo for a confirmed-intent seed (`docs/intent/seeds/` and any `*seed*` file) and found none. It scored the task 100/100 on the governer and gave a plain explanation. It then stopped without deploying a guardian. Key lines: "I looked for a seed and there isn't one." and "a watcher with no written intent to compare against is just theater, not coverage." It closed with "can we do a quick `/align` pass covering what "correct" looks like ... or do you already have something written down elsewhere I should use as the seed?" It never looked at Dana's README, CLAUDE.md, code or past sessions to draft a seed, and it never offered to. The final hand-back said the guardian was "not deployed, waiting on a quick `/align` pass". Account-skill noise: none. It found no author-world data and invented nothing.

## Function: needs-setup-no-offer
It correctly noticed the missing seed, refused to deploy a hollow guardian, and said so clearly. But it put the work back on Dana (run `/align`, or point to a seed) instead of offering to draft a seed itself from her repo and history and ask her to confirm it.

## Setup path: asks-for-material
Step 1 looks in the seed folder, the governer state, or "explicitly provided by the person", then says "If no seed exists yet, stop and run `/align` first". No path offers to draft a candidate seed from sources the agent can reach (the repo README and commit messages, `CLAUDE.md`, past Claude Code sessions, `alignment-harness records`), so the person is sent off to produce the intent material. The intent itself is a real decision, but the ask can shrink to "confirm or correct this draft".

## Proposed fix
In Step 1, replace "**If no seed exists yet, stop and run `/align` first** ..." with:

"**If no seed exists yet, offer to draft one.** Say plainly that the guardian needs a written intent to watch against, and ask consent once to build a first draft from what is already on the machine: the project README and recent `git log --format=%B`, the person's `CLAUDE.md`, past Claude Code conversations about this project (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<project name>"`, keeping only the person's own messages), and any confirmed intents from `alignment-harness records`. Show the draft (what it should make possible, what success looks like, what must stay true) and ask only for a correction or a yes. Save it to the project's seed folder once confirmed. Use `/align` when the draft is too thin to confirm. Do not deploy the guardian until a confirmed seed is saved."
