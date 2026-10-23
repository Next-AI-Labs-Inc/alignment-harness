---
skill: governer-adaptive-score-consumer-guide
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 4
seconds: 83
---

## What Dana asked
I am about to refactor the proration logic in src/pricing.js and it touches the token checks in src/auth.js too. Can you get the harness adaptive risk score for that change and tell me which fields I should use to decide whether it needs extra review before merge?

## What happened
The agent checked that the local `alignment-harness` command exists, then ran the scorer once with its own risk answers for the change (ac 6, hp 8, ew 9, touches user state, revenue tier) and `--json`. The scorer printed a score of 80/100, method meta-elevated, marked "UNCALIBRATED (general defaults)". The agent summarised: "Ran the scorer locally (pure function, no network): `overallGovernerScore = 80`, uncalibrated (no risk table set up yet — `/alignment-harness:harness-setup` would fix that)." It then walked through which fields matter for a merge gate (`unifiedScore` against `scoreThresholds`, `method`, and `existingWinsAtStake` at 9/10 as the main driver). It did not edit any code. The stop hook asked for a hand-back and the agent replied that nothing had changed and the next step was Dana's. Account-skill noise: none seen.

## Function: works
It did the job the skill exists for: produced a real local score for Dana's own change and explained which response fields to branch on for an extra-review decision. It stated plainly that the score was uncalibrated. The one minor gap is that it only named the calibration step and did not offer to run it.

## Setup path: no-setup-path
The skill needs nothing that can be missing: the scorer is local with no server or key. The only optional input is a user risk table, and the skill says plainly that without one the shipped defaults apply and the score is reported as "uncalibrated". That is disclosed, not a silent fallback, and the calibration itself lives in `/alignment-harness:harness-setup`. The skill has no ask-the-person-for-material path.

## Proposed fix
None.
