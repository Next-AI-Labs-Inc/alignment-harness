---
skill: contribute
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 9
seconds: 134
---

## What Dana asked
I forked the open-source decimal-math library our pricing code depends on and fixed a rounding bug in its half-even rounding, and I also tweaked our acme-billing pricing.js to use it. Can you help me get the library fix ready to send back upstream properly?

## What happened
The agent ran `git remote -v` in acme-billing (no upstream remote, no CONTRIBUTING.md), searched the home directory and filesystem for a decimal-math checkout, and read src/pricing.js. The hook made it print its understanding first, which it did at 92% certainty. It found that pricing.js has no decimal dependency at all and that no fork exists on the machine. It stopped and said: "Before I can do anything useful on the upstream contribution, I need to find the actual fork — it's not on this machine as far as I can tell." It asked whether the fork is cloned elsewhere or whether the change hasn't landed yet, and said it would then check for upstream/origin remotes and a CONTRIBUTING.md and judge whether the rounding fix is a bug fix. It did not invent a fork, a contribution guide or any atomic work products. No account-skill noise.

## Function: works
It carried out the skill's first mandatory step (find the upstream repo and its norms), reported plainly that the thing the request points at is missing, and did not make anything up. Asking where the fork lives is a reasonable stop for this request.

## Setup path: mixed
The skill's only missing-thing path is "If neither is present, ask the person which repo they're contributing to and whether it has a contribution guide", which is an ask the agent could partly answer itself (the repo's dependency list, README, git history, Dana's past sessions and CLAUDE.md may name the library or fork). It does not offer to look there first, and it asks whether a contribution guide exists instead of fetching the upstream's CONTRIBUTING.md once the repo is named. Separately, step 5 hard-codes "Keep OpenAI attribution intact" and step 3 names `apply_patch`, which are tied to the author's example rather than the repo Dana is working on.

## Proposed fix
Replace the bullet "If neither is present, ask the person which repo they're contributing to and whether it has a contribution guide, rather than guessing." with:

"If neither is present, do not ask yet. Look for the upstream yourself: read package.json / lockfiles / README for the dependency or fork name, run `git log --format=%B` and `git config --get-regexp remote` for upstream hints, and run `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<library or repo name>"` over the person's past Claude Code sessions. Show what you found and ask one yes/no or pick-one question ('Is this the repo: X?'). Only if nothing turns up, ask for the repo name or URL (one short line), then fetch that repo's CONTRIBUTING.md yourself instead of asking whether one exists."

Also change step 5's "Keep OpenAI attribution intact." to "Keep the original authors' attribution and license headers intact." and step 3's "Use `apply_patch` for single-file edits." to "Use the Edit tool for single-file edits."
