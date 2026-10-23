---
skill: code-principles-how-to-code
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 13
seconds: 111
---

## What Dana asked
In acme-billing I keep copy-pasting the same "user && user.id && !user.isGuest && !user.suspended" check into src/pricing.js, src/invoices.js and src/auth.js, and last week someone forgot one of the conditions. How should I structure this so it stops happening? Follow our code principles for how to code.

## What happened
The skill loaded and the agent matched the request to Principle 1 (One Semantic, One Gate), saying it would "extract the check into one named function with a name that states the UX intent (not the mechanics)". It then scored the task, read the three real files, and found that none of them contain the check Dana described (auth.js has a different org/role check, and git history never had an isGuest condition). It searched the repo and git log to be sure, then stopped rather than invent the duplicated code: "the check you described doesn't exist anywhere". It made no edits and asked Dana whether the check lives in another repo or branch, or whether she wants it written as new code. It used no data from outside Dana's repo. Note: the request's premise did not match the sandbox repo, so the agent never got to show the extraction itself, and it did not give general structure advice while waiting. Harness gates (coherence check, governer score, stop hook) ran around the skill; no account-skill noise was seen.

## Function: works
The skill was applied to the right principle, the agent checked the real code before acting, and it did not fabricate the missing duplication or reach into anyone else's world. Stopping to confirm when the premise was false is the correct first part of the job.

## Setup path: mixed
Most of the skill needs nothing (no-setup-path). A few spots depend on things a new repo may lack and do not offer to build them: Principle 7 names `isFeatureVisible` / `checkStagedRelease` as if they exist; Principle 10 says a project without a canonical logger should build one, but never offers to do it; Principles 6, 9 and 11 say "Skill with full procedures, if your setup has one ... (not shipped with this plugin)", and Principle 11 admits the automatic rollout "needs that system" and then just carries on without it (dead-end).

## Proposed fix
Add one short paragraph after Principle 10, and a matching sentence under Principles 7 and 11:

"If the repo has no canonical logger, feature-flag helper or staged-release system, do not just skip the principle or tell the person to go build one. Offer once: 'This repo has no [logger / flag helper] yet. Want me to add a small one that matches your code style?' Mine the repo first (`grep -rn "console\.\(log\|error\)" src/` to see how errors are reported today, `git log --format=%B` and README for naming conventions, and `~/.claude/CLAUDE.md` for stated preferences). On a yes, write the smallest wrapper (for logger: message, error object, severity 1-100, uxImpact), show it with the call sites it would replace, and save only after the person approves. For Principle 11, say plainly that automatic KPI-driven expansion is not available here and offer the manual-percentage flag helper as the stand-in."
