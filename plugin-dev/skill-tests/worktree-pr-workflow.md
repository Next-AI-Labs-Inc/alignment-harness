---
skill: worktree-pr-workflow
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 7
seconds: 103
---

## What Dana asked
I just fixed a rounding bug in the proration logic in src/pricing.js in acme-billing and it is sitting uncommitted in my checkout. Can you get it onto its own branch in a worktree and open a PR so my team can review it?

## What happened
The agent announced "Using worktree-pr-workflow to isolate the change and open a PR." and ran Step 1 (git status and diff). The sandbox repo was clean, so there was nothing to package. The coherence hook blocked its next command until it stated its understanding; it did, attested, then looked further (stash list, worktree list, reflog, grep for "round" in src/pricing.js) and found only the single initial commit. It stopped and said: "I searched thoroughly and the fix isn't here: `git status` is clean, no stash, no other worktrees...", and "I don't want to guess at writing the rounding fix myself". It asked Dana to confirm where the edit actually is. It created no branch, worktree, commit or PR, and did not reach for the account's synced skills or anyone else's data.

## Function: works
Step 1 did its job: it checked for changes, found none, searched the obvious other places, and refused to invent a fix or open an empty PR. The sandbox persona simply had no uncommitted change, so the right first part of the skill was all that could run.

## Setup path: mixed
The only stated fallback is for `gh pr create` failing ("push the branch and give the human the branch name"), which is fine. But the SKILL.md has no instruction for: no changes found in Step 1 (the agent improvised, correctly); no `origin` remote configured (Step 5 `git push` just fails); and `.worktrees/` not being in `.gitignore`, where the Safety Rules say "NEVER skip the gitignore check" but no step actually performs or fixes that check, so a missing ignore entry is a dead end.

## Proposed fix
In Step 1, after the commands, add: "If `git status` and `git diff` show nothing, look for the work before stopping: `git stash list`, `git worktree list`, `git log --oneline origin/HEAD..HEAD` (commits not yet pushed), and the files the person named. If you find it, use it. If you still find nothing, say so plainly and ask the person only where the edit lives; never write the change yourself to fill the gap."
In Step 2, before `git worktree add`, add: "Run `git check-ignore -q .worktrees || printf '.worktrees/\n' >> .gitignore` and tell the person you added that line (stage `.gitignore` with your commit)."
In Step 5, before `git push`, add: "Run `git remote -v`. If there is no `origin`, stop after the commit, tell the person the branch name, and offer to add the remote if they give you the repo URL (a decision only they can make)."
