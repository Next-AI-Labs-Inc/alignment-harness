---
skill: intent-audit-and-repair
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 18
seconds: 176
---

## What Dana asked
Can you audit src/invoices.js in acme-billing for me? I want to know what promises it makes to our customers, which ones actually hold, and which failures we would never hear about.

## What happened
The plugin's pre-tool hook first made the agent search memory, then it read invoices.js, its dependency pricing.js, the test file, auth.js and the README in full. It told Dana she was the only reviewer: "I'm the only person reviewing this — there's no separate product owner here — so I'll show you the promise list directly and you tell me if I've misread what `invoices.js` is for before anything gets touched." It then wrote the audit in the skill's shape: a direct answer, a "thing that matters most" table, six plain-language intentions with states and confidence percentages, failure sentences starting "hey — we built an invoice for...", and a repair list. It found that a missing email or bad seat count silently produces a broken invoice, that the annual charge is not labelled as annual, and it marked the unknown-plan case CANNOT TELL because nothing in the repo calls the file. It made no edits, because this is billing code: "I'm **not making any of these changes** without your go-ahead", and offered to do the safe ones test-first. It noted that the repo has no logging at all instead of assuming a hidden sink. Account-skill noise: none that mattered (it also ran the governer skill from the plugin, which is the harness's own gate).

## Function: works
It did the read, state, audit steps for Dana's real file with honest confidence numbers and CANNOT TELL where the code did not settle it, used human-addressed failure sentences, and held off on repairs until she agrees. No author-world data was used; everything came from her repo.

## Setup path: mixed
Most paths pass. "find out where THIS project's logging actually goes — check its logging setup, or ask" is a delegates path (check first, ask second), and confirming the intention list with the one person is an unavoidable-ask that stays a judgment. But three gaps are left as dead ends: the skill says repairs are test-first and never says what to do if the repo has no test runner or no test for that file, and "Write to the assigned path" never says what to do when no path was assigned (Dana gave none, so the agent answered in chat, which worked only by luck).

## Proposed fix
Add under "TEST-DRIVEN — NON-NEGOTIABLE": "If the repo has no test for the code you are about to change, do not ask the person to write one. Look at the existing tests (for example `test/`, the `test` script in package.json, or the nearest `*.test.*` file) and offer to write the failing test in that same style and runner; show it and run it, then wait for a yes before changing the code. If there is no test runner at all, say so and offer to add the smallest one the project's language already supports (for Node, `node:assert` run by `node <file>`)."
Add under "Output — write ONE document": "If no path was assigned, say so in one line and offer to save the document as `docs/intent-audit-<component>.md` in the current repo (or answer in chat if the person prefers), and ask once."
