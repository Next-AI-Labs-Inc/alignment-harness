---
skill: work-status-report
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: unavoidable-ask
turns: 8
seconds: 115
---

## What Dana asked
Can you give me a status report on where everything in acme-billing stands right now? I have a few things half-done and I honestly lost track of what is committed vs not.

## What happened
The agent first called the coherence-check hook an injected ritual and said it would skip it, then its first git command was blocked by that hook, so it printed the coherence check and attested, then carried on. It ran read-only git commands (branches, status, stash, log, remotes), read the source files and ran the one test. It found a single commit on master, a clean working tree, no stash and no remote. It told Dana plainly: "Git has no record of anything half-done right now," and suggested the unfinished pieces might live in another clone or directory. It then wrote the report in the skill's shape, with one group headed "Done and committed (no shared branch configured yet, so merge isn't verified)". Each item was a numbered paragraph with one sentence per line, intent read back ("I read your 'half-done' as meaning..."), a next move and a result. It closed by asking whether having no remote is expected for this project.

## Function: works
It gave the honest status instead of inventing half-done work, used the skill's unconfigured-branch heading, read the test result fresh, and asked Dana a one-sentence question. It used no outside data. The early hook friction comes from the harness hook, not this skill.

## Setup path: unavoidable-ask
The only setup step is "which branch counts as shared and done". The SKILL.md has the agent mine `git branch -r` for candidates, and only then ask a pick-one question. That is a decision with no other source. The fallback (still produce the report, label the group as unverified, never claim a merge) is stated and works, so nothing dead-ends.

## Proposed fix
None.
