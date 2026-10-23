---
skill: commit
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 5
seconds: 60
---

## What Dana asked
I just fixed a rounding bug in src/pricing.js and separately added a currency check to src/invoices.js in acme-billing. Can you commit my changes?

## What happened
The agent ran `git status` and `git diff` on the two files, listed `src/`, read the git log, and read both files. The sandbox repo had a clean working tree with a single commit, and neither file contained a rounding fix or a currency check. It stopped and reported: "No rounding fix or currency check, and no uncommitted changes to commit", then asked Dana to confirm "where the edits actually are (right directory/branch?)". It said that once a diff exists it would split the work into two commits, run the tests, and check with her before committing the pricing change. It did not run the skill's governer scoring, evidence-stamp or orchestrator steps. It called them "an elaborate multi-step ritual" that it would not run. It did not leak anything from the plugin author's world. The agent did not invoke the Skill tool, and the SKILL.md has no `attest` command, so some of that ritual text may have come from a hook or from the session's injected context. Account-skill noise: the session listed the account's synced skills, but the agent did not use any.

## Function: works
With nothing to commit, stopping, saying so plainly and asking where the edits are is the right first part of the job for this request, and the Section 0 intent-preservation rule does not apply because this is not a missing-repo case. A mild concern remains: the agent declined the skill's mandatory governer/evidence ritual as suspicious, so the skill's full workflow was not exercised. That is a finding about how heavy the skill is for a first-time user, not a failure to run it.

## Setup path: mixed
The missing-git-repo path delegates (propose or run `git init`, then continue), the `/insight` path delegates (falls back to the repo's git log, docs and past sessions), and the proposals path delegates (local `alignment-harness records proposals` grep). The one weak spot is "If it's ambiguous which repos count as 'the workspace,' ask once", which asks Dana to describe her repos when the agent could find them itself. Two smaller gaps: `/governer` and the `alignment-harness` CLI are invoked with no stated fallback if they are missing, and the Intent DB and the pre-commit hook are skipped with no mention to Dana.

## Proposed fix
Replace the sentence in "Default scope" that starts "If it's ambiguous which repos count as 'the workspace,' ask once..." with:

"If it's ambiguous which repos count as 'the workspace,' work it out first: run `git rev-parse --show-toplevel` in the current folder, then `find . .. -maxdepth 2 -name .git` to list sibling and nested repos, and check `~/.claude/projects/*/*.jsonl` for other folders this person has worked in recently. Show the list you found and ask one yes/no question ('commit across these N repos?'). If they say yes, record the answer with `alignment-harness config` so you don't ask again."
