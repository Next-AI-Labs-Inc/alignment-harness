---
skill: fix-algo-bug-determine-if-auto-fix-ok
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 6
seconds: 185
---

## What Dana asked
I just fixed a bug in src/pricing.js where a discount got applied to an undefined plan tier and silently produced NaN totals. Could the same mistake exist in invoices.js or auth.js? If so, scope it and put something in place so it cannot come back.

## What happened
The agent listed the JS files, read the last commit, then read pricing.js, invoices.js and auth.js and grepped src/ for object-key lookups. It did not call the Skill tool (no Skill call in the transcript), but its work followed the skill's phases: name the bug class, scope every call site, then decide what guard fits. It reported that "PLANS[plan] is the only one in the codebase", that invoices.js is protected because it calls priceFor, and that auth.js uses an array check that fails safe. It judged a standalone detector script "overkill" for one site and proposed two regression tests instead: "Want me to go ahead and add these two tests?" It did not change any files and did not mention the optional known-fixed-errors check.

## Function: works
It did the right first part of the job for Dana's repo: root cause, scoped call sites classified as fixed/protected/not applicable, and a proportionate guard proposed with consent before touching billing code. No author-world leakage; nothing reached for the account's synced skills.

## Setup path: no-setup-path
The four phases need nothing that could be missing. The only optional dependency is the known-fixed-errors registry, and the SKILL.md handles its absence explicitly: use the project's own tracker or the harness's local JSON-lines file (created on first record), and "Say plainly if you skipped this check because nothing is configured". Phase 4b likewise says to skip if no registry is used. Nothing asks Dana to supply material.

## Proposed fix
None.
