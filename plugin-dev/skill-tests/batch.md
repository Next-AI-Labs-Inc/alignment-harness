---
skill: batch
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 3
seconds: 88
---

## What Dana asked
I've been hacking on acme-billing all week and have a pile of uncommitted changes across pricing, invoices and auth. Can you group them into sensible commits and walk me through each one before I commit anything?

## What happened
The agent opened by telling Dana the skill was built for a bigger setup: "None of that infrastructure (vault, dashboard) exists here, so I'll skip the ceremony and just do the useful part: scan your uncommitted changes, group them into sensible commits, and walk you through each one before anything gets committed". It ran `git status` and found the sandbox repo clean: "Working tree is actually clean ... The only commit on `master` is `b429c54 billing service`." It then tried to check stashes and branches, but a coherence-check hook blocked that read-only command. It stopped and said "there's nothing to batch yet", explained what it had checked, and asked Dana to confirm the path to the repo where the work lives, or whether it should look at stashes and other branches. No files were changed and no vault or dashboard was invented. Account-skill noise: none seen.

## Function: works
It did the right first part of the skill: scanned for uncommitted changes, found none, said so plainly, and asked one small question instead of making up batches. It also dropped dashboard mode without inventing a vault, which matches the skill. The "nothing to batch" result comes from the sandbox repo being clean, not from the skill.

## Setup path: mixed
Most paths delegate or are unavoidable asks. With no vault, the skill says to tell the person plainly, "offer to help them point one at a folder" via `/alignment-harness:harness-setup`, and fall back to chat. The ledger and commit-log paths fall back to `alignment-harness records ledger` and `records commit-log`. All the skills it references exist in the plugin. One path is a dead-end: §1 says scope is "your product repos ... ALWAYS. Never ask", as a "standing default you set once", but never says what to do on a first run when nothing has been set. Much of §1 and the dashboard section is also written around the author's own multi-repo, Obsidian layout, which leaves a new user's agent to work out the generic case itself.

## Proposed fix
Replace the first paragraph of the "Scope is your product repos" subsection in §1 with: "If the person has not yet told you which repos are the product, do not ask and do not stop. Take the git repo of the current working directory as the scope. If it is inside a workspace with several git repos, list them with their dirty counts and use the dirty ones the person has been working in (mine `git log` dates and the current session's paths to decide). State the scope you chose in one line, for example 'Scanning acme-billing (the repo you're in)', and keep it as the default for later sweeps. Widening is the person's call, unprompted. If the current directory is not a git repo and no workspace repos are found, ask for the path: that is the one unavoidable ask."
