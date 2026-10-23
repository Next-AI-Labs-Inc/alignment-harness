---
skill: tests-failing-check
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 13
seconds: 97
---

## What Dana asked
One test in ~/work/acme-billing is failing, the proration one in the pricing tests. Can you tell me whether the test is wrong or the code in src/pricing.js is wrong, and what I should change?

## What happened
The agent picked up the skill, stated its intent in a coherence check (a hook required this before it could run anything), then went looking for the failing test. `npm test` found no package.json, so it located `src/pricing.js` and `test/pricing.test.js` by search, read both, ran the test file with node, and checked git history, branches and stashes for any proration code. It found neither a proration test nor proration logic, and the existing two assertions pass. It then followed the skill's output format (code intent, test intent, code path, proof points, verdict) and closed with: "Intent vs actuality: can't assess — the described test doesn't exist." It added "I don't want to guess at proration logic and hand you a fix for a bug that isn't the one you're actually looking at" and asked Dana to point at the exact file or paste the failure output. Two harness hooks (coherence check, search-memory-first) blocked tool calls once each; the agent satisfied them and carried on. It used no author data.

## Function: works
The skill's job is to compare a failing test's intent to the code's intent and give a verdict. The agent read the real code and test, ran the test, reported honestly that the premise did not hold in this repo instead of inventing a proration bug, and used the skill's required format. Asking for the failure output is a minimal, appropriate ask. (The sandbox repo simply has no failing proration test, so this mainly shows the skill behaves well when the named test is absent.)

## Setup path: no-setup-path
The skill needs nothing that could be missing in the sense of the audit: it reads the code and test already in the repo. It has no stated fallback for "the named test cannot be found," but the agent handled that sensibly on its own with a small ask (a file path or pasted failure output), which is an unavoidable ask.

## Proposed fix
None.
