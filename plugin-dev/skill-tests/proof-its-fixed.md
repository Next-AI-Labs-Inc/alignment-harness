---
skill: proof-its-fixed
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 17
seconds: 151
---

## What Dana asked
I just fixed the rounding bug in src/pricing.js where discounted invoice totals were coming out a cent off. Can you put together before-and-after proof that it's fixed so I can attach it to the PR?

## What happened
The agent first hit the harness's memory-search and coherence gates, cleared them, then read the repo: git log (one commit, clean tree, no stash, no other branches), src/pricing.js, src/invoices.js, src/auth.js and the test file. It found no discount logic anywhere and no uncommitted fix. It stopped and said: "I searched the whole repo before writing anything, and the premise doesn't hold up — I want to flag that rather than manufacture evidence for it." At hand-back it wrote "Waiting on Dana to point me to the real diff/commit/file with the rounding fix before any proof can be built." It never printed the skill's `[PROOF-PKG]` trace line, never created an `evidence/` folder, and did not offer to build any proof. (Note: the sandbox repo held no rounding bug or fix, so the request's premise was absent by construction. Account-skill noise: none observed.)

## Function: needs-setup-no-offer
It refused to fabricate evidence, which is right, but it only asked Dana to go find the diff for it. It did not offer to look further itself (past sessions, reflog) or to write a test showing the bug so the before/after could still be built. It also skipped the skill's Step 0 trace print and the "state what evidence you could and couldn't produce" feedback step.

## Setup path: mixed
The skill's only missing-thing path is the "Feedback Loop" paragraph: "State what evidence you COULD produce, what you COULDN'T, and why." That is honest but it is a report, not an offer to build; it is a dead-end for the case where no fix or no reproducible before state exists. The before-screenshot step names other skills ("/devtools-site-testing", "/playwright-validator") with "if you have them" hedges, but has no fallback for a repo with no UI, and Step 2 and the composability list lean on skills and "DB query" logs a new user may not have.

## Proposed fix
Replace the "Feedback Loop" section with:

"If you cannot produce adequate evidence, do not stop at saying so, and do not ask the person to go find it. First offer, once, to build it yourself, and proceed on a yes:
- Fix not found in the working tree: search `git log --all`, `git reflog`, `git stash list`, other branches, and the person's past Claude Code sessions (`node \"${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js\" \"<bug keywords>\"`) for the change. Show the candidate diff and ask only 'is this the fix?'
- Before state not reproducible: write a small failing test or script from the bug description that fails on the pre-fix code (check out the parent commit or revert the diff in a temporary worktree) and passes on the fixed code. Show it before saving.
- No UI to screenshot (library, API, CLI): replace the screenshot with captured terminal output of the same command run before and after, saved as `evidence/before-{finding}-output.txt` and `after-{finding}-output.txt`.
- No logs or DB available: say so in one line and continue with the test output.
Only ask the person for input when several candidate fixes remain, and then as a pick-one. Always print the `[PROOF-PKG]` line and end with what you could and could not produce."
