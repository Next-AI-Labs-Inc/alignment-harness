---
skill: expand-perspective
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 7
seconds: 200
---

## What Dana asked
I've been chasing a bug in ~/work/acme-billing for over an hour. Invoice totals in src/invoices.js are off by a cent for some customers, and every rounding fix I make in src/pricing.js just moves the problem somewhere else. I keep going in circles, can you help me figure out what I'm missing?

## What happened
The agent did not call the skill by name, but it did what the skill teaches. It first said rounding bugs that "move when you fix them" usually mean one value is rounded more than once. It then read pricing.js and invoices.js and noticed neither file contains any division or decimal math. It called that "the 'wide view' moment" and zoomed out to the whole repo: git log, git status, stash, branches, reflog and the file list. It reported the disqualifying fact: "this codebase cannot produce the bug you're describing", and that there was no trace of her rounding edits in the checkout. It finished with three concrete checks (a second checkout, a stale running build, non-integer inputs like prorated seats or discounts) and one small question: where did she make her edits and what case reproduces it.

## Function: works
Dana was stuck in a frame (fixing rounding in pricing.js). The agent left that frame, checked reality (the repo history and the code) and found that the premise did not hold. This is the skill's core move, and it produced a useful next step. Two caveats. The skill was never loaded through the Skill tool; the behaviour came from the skill's description and the agent's own judgment. The agent also called the session-start hook output "harness theater" and skipped it, which is not this skill's concern.

## Setup path: no-setup-path
The SKILL.md is a self-contained ritual and corpus. It reads no notebook, config or history, and has no "if X is missing" branch. Nothing in it asks the person to supply material.

## Proposed fix
None.
