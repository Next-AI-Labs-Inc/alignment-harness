---
skill: how-to-name-things
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 16
seconds: 125
---

## What Dana asked
I keep writing things like `const status = ...` and `const data = await fetch(...)` in src/pricing.js and src/invoices.js, and my test names are vague. Can you help me rename the variables and tighten up the test descriptions so they are clear to whoever reads them later?

## What happened
The harness asked the agent to search memory first, and the agent found the how-to-name-things skill that way. After the usual coherence check and risk score, it read src/pricing.js, src/invoices.js, src/auth.js and test/pricing.test.js, then grepped for `status`, `fetch`, `const data`, `it(` and `describe(`. Judged against the skill's banned-bare-word list, the existing names (`base`, `monthly`, `amount`, `customer`, `sub`, `PLANS`) were already fine, and the tests are a plain assert script with no test descriptions. It changed nothing and said: "the problems you described aren't actually there". It then offered two next steps: point it at the code that really has these patterns, or look for extra specificity in `plan`/`sub`/`customer`.

Note: Dana's request described patterns her sandbox repo does not contain, so the skill's rename and test-description rules were applied only as a check, not as edits. Account-skill noise: none seen.

## Function: works
The agent applied the skill's own rules (banned bare words, the `it()`/`describe()` contract) to Dana's real files, made no invented edits, and reported honestly what it found. It did not borrow the author's examples as if they were Dana's code. It could have offered to rewrite the test script into named test cases, but grounded and honest is the right first part of the job.

## Setup path: no-setup-path
The skill needs nothing that could be missing for the variable and test naming guidance. The admin-UI section points to /how-to-bulk-register-atomic-tools "if you have that skill" and says plainly that its examples come from one product and should be swapped for the user's own. That is a soft, optional reference, not a setup dependency. The pre-commit CHECK 6 and CHECK 7 labels assume a hook Dana may not have, but nothing breaks when it is absent.

## Proposed fix
None.
