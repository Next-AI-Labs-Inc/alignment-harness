---
skill: batch-whats-next
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 9
seconds: 94
---

## What Dana asked
I just finished the proration fix in src/pricing.js and the tests pass. What's ready for me to commit, and what do I need to decide on before it ships?

## What happened
The agent checked the repo before reporting anything: git status (clean), git diff (empty), git log (one commit), then read src/pricing.js and the pricing tests. It found no proration logic anywhere. A plugin hook asked it to search memory first, which returned nothing useful for this fix. Another hook asked it to print its understanding before continuing, and it did. It then told Dana: "there's nothing to report as ready, because I can't find the fix you're describing." It asked where the change lives (another branch, an unsaved buffer, another directory) and promised to "verify the tests myself and give you the actual greenlight report" once it could see the diff. It did not invent any items, and it did not reach for anyone else's data. The Skill tool was never called by name; the run's memory search only surfaced the skill text from a past session. Account-skill noise: none observed.

## Function: works
Dana's premise did not match her sandbox repo, so there were no finished items to present. The agent checked reality instead of trusting "tests pass", said plainly that nothing was ready, and asked one small question, which is the right first part of the skill's job and is consistent with its "only work that still needs something from the person" rule. The full per-item card format was not exercised because no qualifying work existed.

## Setup path: no-setup-path
SKILL.md is a pure output-format skill: it takes already-verified finished work and shapes it into per-item yes/no/hold cards. It needs no notebook, config, sample or history that could be missing, and its only fallback is "not human-observable: {one-line why}" for items with nothing to see, which is a one-line statement and not a request for material. It is silent on the case where there is no finished work to present, but that is not a setup gap the audit covers.

## Proposed fix
None.
