---
skill: agentic-prelaunch-audit
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 19
seconds: 183
---

## What Dana asked
We are cutting a release of acme-billing on Friday and I am nervous about the pricing and invoice changes from the last couple of weeks. Can you run a pre-launch audit on the repo and tell me whether it is safe to ship?

## What happened
After the harness's own coherence and scoring gates, the agent looked at the repo and found a single commit on master with a clean tree, so there was no base branch to diff against. It said: "there's no separate base branch or commit history to diff against, so every line in `src/` is effectively 'the last couple of weeks of work.'" It read pricing.js, invoices.js, auth.js and the test, ran the existing test (passes), and probed the real code with throwaway node one-liners. That found a real bug: negative seats give a negative invoice (`priceFor('starter', -1)` returns -20) and missing seats give a null total, with no error thrown. It saved a write-up with `alignment-harness record prelaunch-audit` and ended with "Conditional GO — one real bug needs your decision before Friday, plus a test-coverage gap." It edited nothing and asked Dana whether upstream ever sends bad seat values. It did not use any of the account's synced skills and did not touch the plugin author's data.

## Function: works
It did the useful core of the audit for her repo: it found and scoped the change surface, ran tests, exercised the code against reality, reported a verified bug with evidence, and gave a conditional go/no-go with a durable record. It skipped the explicit critical-paths confirmation question and the multi-agent phases, which was sensible for a three-file repo.

## Setup path: delegates
The "Before you start" step says to infer repos, base branch and critical flows from the repo and have the person confirm, not to make them list them. Missing records go to sub-agents that reconstruct them from diffs, and records go through `alignment-harness record`. Every missing-skill or missing-system branch names a plain fallback (local grep, direct code reading, `alignment-harness record`). The one "say so and skip" in Phase 5 (no error log) is honest and avoids fabricating findings, and the same paragraph tells the agent to grep application logs first.

## Proposed fix
None.
