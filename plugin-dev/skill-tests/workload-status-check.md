---
skill: workload-status-check
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 8
seconds: 108
---

## What Dana asked
I just finished fixing the rounding bug in src/pricing.js so invoices stop coming out a cent off. Can you do a status check on that work before I hand it to my team lead?

## What happened
The agent said it would give "a real status check, per the skill's format" and went to inspect the repo. Two plugin hooks got in the way: one asked for a memory search before a code search (it ran that search, which found nothing useful), and one blocked a command until it printed a COHERENCE_CHECK block. After that it read src/pricing.js and the test file, and found a clean working tree with a single commit and no rounding-sensitive code (only integer multiplication). It did not produce the four-part handoff (UX gap, confirmations checklist, files changed, what's next). It stopped with: "I don't want to hand your team lead a status report confirming a fix that I can't actually find in this repo. Can you point me to where the change is — a different branch, a stash, another directory — so I can verify the real diff and run the tests against it?" Two of its checking commands were denied by the sandbox permissions, so it never ran the tests. The session list also showed the account's synced skills, but the agent did not use them.

## Function: works
The skill is a handoff template for completed work. Dana's repo had no such work to report on, and the agent verified that rather than inventing a checklist or a file list. That is the right first part of the job and it used none of the plugin author's data. It is a soft pass: she got a question back instead of a structured report, and the skill itself says nothing about what to do when there is no completed workload to report on.

## Setup path: no-setup-path
The SKILL.md needs nothing that could be missing. It is a fixed output format with rules and has no fallback or configuration step. The one gap is the case where the work cannot be found, which the skill does not cover, so the agent improvised sensibly.

## Proposed fix
None.
