---
skill: task-orchestrator
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 10
seconds: 77
---

## What Dana asked
I need to rewrite the proration logic in src/pricing.js so mid-cycle plan upgrades bill correctly, and it touches src/invoices.js too. Before I start, what steps should I run for this so I don't skip something important?

## What happened
The skill text was loaded. The agent first hit the plugin's memory-search hook, ran agent_find, then read src/pricing.js, src/invoices.js and the test file. It found there is no proration logic yet. It then said: "Skipping the orchestration ritual — nothing's been changed yet, this is just a planning question, and that pipeline is way oversized for it." It did not print the TASK_ORCHESTRATION_CONTRACT, did not call /predict-required-skills, and did not spawn guardians. Instead it gave a six-step plan grounded in her repo: agree the proration rule first (citing her CLAUDE.md note about asking before changing pricing), run the existing test as a baseline, write new tests first, implement in pricing.js and wire a new invoice line in invoices.js, rerun the full suite, and keep it one small PR. When the stop hook asked for a TaskCreate item, it searched for the tool, found none, and said "No `TaskCreate` tool exists in this environment, so I can't file one."

## Function: works
The agent answered the real question (which steps to run before a billing change) with concrete, correct steps for Dana's repo and used none of the author's world. It did not produce the formal contract or TaskCreate list the skill prescribes, so this is the useful first part of the job rather than the full ritual. Note for the author: the agent chose to skip the contract for an advisory question, and TaskCreate is not available in `claude -p`.

## Setup path: mixed
Several fallback paths exist and they do not delegate. (1) The leverage fallback says to estimate from payment/billing/auth categories and "replace with your own project's high-stakes areas during setup", which leaves Dana to supply the list instead of offering to derive it from her CLAUDE.md, repo and past sessions. (2) The "Optional: Data-Driven Rule Updates" section tells the person to "write a script that scans your own `~/.claude/projects/*/*.jsonl` history", which asks her to build what the agent could build. (3) The oracle path points to `/alignment-harness:harness-setup` and falls back to the static table, which is fine but never offers to set the oracle up. The rule tables also name `/jonathan-check2` and "founder-perspective" gates, which read as the author's own workflow.

## Proposed fix
Replace the leverage fallback line with: "If no governer score is available, offer once: 'I can work out which parts of your project are high-stakes by reading your CLAUDE.md, README and recent commit messages, and your past sessions. Want me to draft that list?' On yes, mine `~/.claude/CLAUDE.md`, the repo README/docs and `git log --format=%B`, propose the high-stakes categories (for example, money, auth, customer data) with one-line evidence for each, show them, and save only what she approves. Until then, estimate from payment/billing/auth = 8-10, core user-facing = 6-8, internal = 2-4."

Replace the "Optional: Data-Driven Rule Updates" paragraph with: "Offer once to tune these rules from the person's own history. On yes, run `node \"${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js\"` over `~/.claude/projects/*/*.jsonl` (keep only the person's own text messages and the skill invocations that followed), propose changes to the decision table with the sessions that support each, show the diff, and apply only what she approves."

In the `/predict-required-skills` paragraph, add: "If no oracle is set up, say so in one line and offer to run `/alignment-harness:harness-setup` for her."

Rename `/jonathan-check2` in the tables to the plugin's neutral quality-gate skill name, or describe it as "your own quality gate, if you have one".
