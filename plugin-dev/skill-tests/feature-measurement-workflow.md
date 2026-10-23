---
skill: feature-measurement-workflow
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 6
seconds: 205
---

## What Dana asked
I'm about to build a proration preview for plan upgrades in my acme-billing repo (src/pricing.js and src/invoices.js). Should I measure this feature, and how do I set up measurement and a prediction before I ship it?

## What happened
The agent listed the repo, read pricing.js and invoices.js, then grepped for any analytics or metrics code and found none. It ran the substantiveness test on her feature ("this is a new surface ... sitting on a core flow ... Both say yes. Measure it."). It declined to make up KPIs: "Don't invent KPI names ... the honest move is to ask, not guess", and offered candidate KPI shapes (upgrade completion rate, tickets about surprise charges) for her to pick from. It proposed one lightweight usage event fired once per preview, gave the prediction template, and said ship-to-all beats an A/B holdout because a preview does not change what anyone is charged. It ended with "Want me to start scaffolding the proration function in pricing.js ... once you've picked the real KPI?" A separate plugin hook also made the agent call part of the harness "scoring theater" and later triggered an evidence-gate nag, which the agent correctly judged a false positive. Account-skill noise: none observed. The transcript shows no explicit Skill call, but the advice follows this skill's steps and wording closely.

## Function: works
It did the right first part of the pipeline for her request (substantiveness decision, KPI handling, one event, prediction, A/B call), grounded it in her real files, and did not use any outside product's metrics or data. It stopped to ask about KPIs instead of inventing them, as the skill says.

## Setup path: mixed
The alignment-check step delegates well: with no memory tool, "grep the repo's own docs and notes, read git log ... search your own past Claude Code sessions" and "say plainly when the search turns up nothing". The no-KPI path is an asks-for-material: "ask directly: 'what are the two or three numbers that tell you this product is working?'" without first offering to propose candidates mined from the README, git log, past sessions or any existing events file. The missing-instrumentation line ("that's the gap to close") does not offer to add the event or a log line itself. Step 10 also links unconditionally to `~/.codex/skills/how-to-measure-feature-impact/SKILL.md`, which a new user will not have (dead end; the skill needs none of it).

## Proposed fix
1. Replace the "If your project doesn't have named KPIs yet..." paragraph's ask with: "If the project has no named KPIs, offer to draft them: with the person's consent, read the README, `git log --format=%B`, any events/analytics file or `metrics.md`, and the person's past Claude Code sessions (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<feature or product area>"`), then propose one engagement, one funnel, and one negative-signal candidate, each with the evidence it came from. Show them and ask only for a yes, a pick, or a correction. Say plainly when nothing was found."
2. After "If nothing in the project tracks events yet, that's the gap to close", add: "Offer to add the simplest version yourself (a one-line structured log or a small events helper that matches the repo's language), show the diff, and apply it only after a yes."
3. In Step 10, replace the unconditional `~/.codex/...` link with: "if you have a `/how-to-measure-feature-impact` skill installed, it has the deeper protocol; otherwise the matrix and advisory steps above are complete."
