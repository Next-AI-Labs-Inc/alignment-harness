---
skill: research
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 18
seconds: 136
---

## What Dana asked
I am trying to figure out why invoice totals in acme-billing sometimes differ by a cent from what pricing.js computes. Can you do a proper investigation of that, with a hypothesis up front, and write up what you find?

## What happened
The agent first hit a hook that forced a memory search before any code search, ran the plugin's agent_find once, then read src/pricing.js, src/invoices.js and the test file in Dana's repo. It ran a small script comparing priceFor output with buildInvoice totals across plans, seat counts and annual/monthly, and ran the existing test. It asked the harness where records live, created the folder and wrote a finding JSON (title, hypothesis, methodology, findings, conclusion, verdict) under the records path. It printed "## RESEARCH_FINDING" and reported "Verdict: refuted (confidence 85%)" because the code is all integer multiplication and buildInvoice reuses a single priceFor result, so no cent drift can arise in this repo. Along the way it said it would not "fabricate confidence scores" from hook text, but then complied with the hooks that were enforced. The hypothesis was written into the record at the end, together with the results, not before the evidence was gathered as Step 2 asks.

## Function: works
It followed the lifecycle (prior-knowledge check, hypothesis, evidence from the real repo, local JSON record, verdict and confidence, observed-vs-concluded wording) and stayed on Dana's code with no use of anyone else's data or servers. The one slip is ordering: the record file was created after the evidence, not before. Account-skill noise: none that affected the run.

## Setup path: mixed
Step 1 (memory search) and the "own API" branches fall back quietly to grep or local files and say so, which is fine. But Step 3 says that if the data location is unknown the agent should ask "where does it live?", which asks Dana for something the agent could look for itself (repo config, README, .env.example, package.json, past sessions). The web-research line ("say so and reason from what's available") is a dead-end that never offers to set anything up. Step 1 also never names the plugin's own memory-search script as the thing to use when no command is configured.

## Proposed fix
1. Step 1, replace the "If nothing is set up yet, say so plainly and proceed" paragraph with: "If no memory-search command is configured, use the plugin's own: `node \"${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js\" \"<topic>\"`, which searches the person's past Claude Code sessions, then grep the records folder. Say which sources you actually searched."
2. Step 3, replace the "Your own data" question with: "Find where this project's data lives before asking: check the README, package.json scripts, .env.example, config files, and `git log` for database, analytics or log references. Tell the person what you found and ask only for a yes/no or a pick between candidates. Ask 'where does it live?' only if nothing turns up."
3. Step 3, web research: "If there is no web-research tool, offer once to set one up (for example by checking which search or browser tools are already installed and proposing to use one), and continue from code and docs if they decline."
4. Step 2: add "Write the finding file with the hypothesis before running any query or reading the data files; add evidence to it afterward."
