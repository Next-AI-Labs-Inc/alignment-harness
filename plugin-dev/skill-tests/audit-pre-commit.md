---
skill: audit-pre-commit
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 2
seconds: 36
---

## What Dana asked
I have changes staged in ~/work/acme-billing (mostly src/pricing.js and src/invoices.js) and I'm about to commit. Can you run your pre-commit audit on them before I push?

## What happened
The agent opened with a short restatement of her intent (run the pre-commit checklist against the staged diff, as a review not a rewrite). It then ran `git status` and `git diff --cached --stat` in her repo, which is what the skill's "How to Run This Audit" section starts with. The tree was clean and nothing was staged. It said: "There's nothing actually staged right now — `git status` shows a clean working tree on `master`, and `git diff --cached --stat` is empty." It listed likely reasons and asked: "Want me to check unstaged changes (`git diff`) or the contents of that last commit instead, so I can audit whatever's actually there?" It did not show any sign of loading the skill through the Skill tool, and it did not invent findings. No account-skill noise.

## Function: works
It did the right first part of the job (inspect the staged diff), reported plainly that there was nothing to audit, made up nothing, and offered sensible next steps. Whether the skill text itself was read is not visible in the transcript, so the pass rests on the behaviour matching the skill's first step.

## Setup path: mixed
Most of the skill is self-contained and says so ("the checklist under each principle here is self-contained"), and the companion skills are marked "if installed", so those paths are fine. Two paths are weak. Principle 7 says to find the person's own words in the transcript or compaction, and if they are missing, "block and surface" and tell the person to capture their words. That tells the person to go collect material and never offers to search their past sessions or commits. The skill also has no instruction for an empty staged diff, so it quietly depends on the agent improvising. Also, the principle text leans on one company's conventions (IN_DEVELOPMENT, isFeatureVisible, checkStagedRelease, Statsig), which a new user's repo will not have, but the skill does not offer to find the repo's own equivalents.

## Proposed fix
1. Replace the Principle 7 last-resort sentence ("If those words don't exist or can't be found, do not fabricate intent — block and surface: ...") with: "If the words are not in this session, offer to search the person's past Claude Code conversations for them (`node \"${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js\" \"<style name or selector>\"`, keeping only the person's own messages) and the repo's commit messages (`git log --format=%B -- <stylesheet>`). Show the closest matches and ask the person to confirm or correct them before writing the comment. Only if nothing turns up, block and ask them for one sentence on when to use the style."
2. Add to "How to Run This Audit": "If `git diff --cached --name-only` is empty, say so, then offer to audit the unstaged changes (`git diff`) or the last commit (`git show HEAD`) instead."
3. Add under Principles 2, 4, 5 and 6: "If this repo has no `logger`, feature-flag or staged-release system, say so and offer to look for the repo's own equivalent (grep for the logging and flag helpers it already uses) and audit against that, rather than reporting the missing names as failures."
