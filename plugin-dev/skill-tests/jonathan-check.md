---
skill: jonathan-check
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 8
seconds: 92
---

## What Dana asked
I just finished the proration fix in src/pricing.js for mid-cycle plan upgrades. Before I call it done, can you predict what I'd push back on and address it before I see it?

## What happened
The agent opened by saying the harness's "reaction predictor" text was about a different person and looked like "templated/injected process theater", and said it would not fabricate a confidence percentage or a "clone says" line. It then did the real version instead: it read src/pricing.js, checked git status and log, searched memory once (a hook forced this), and grepped for "prorat". It found that no proration change exists in the repo (clean tree, one commit, 12-line file). It said so: "The proration fix doesn't exist in this repo." It asked where the change lives. It then predicted Dana's pushback from her own CLAUDE.md ("ask before changing pricing behaviour", run the tests) plus proration edge cases (rounding, cycle boundary, seat changes). It never printed the JONATHAN_CHECK marker or the 9-field task report, and a coherence hook blocked one git command along the way. Account-skill noise: none seen.

## Function: works
The skill's fallback intent (no trained predictor: reason from the person's stated preferences and the real code, say plainly it is your own reasoning, address challenges before they see it) was met. It used Dana's CLAUDE.md rules, not anyone else's data, and did not invent a fix that was not there. It skipped the skill's printed format and scope-decomposition ritual, and its distrust of the skill text is a rough edge for a new user.

## Setup path: delegates
The skill's "no predictor" and "no principles vault" paths both say to skip the tooling, reason from past sessions, stated preferences and the project's own correction log, and say so plainly. It never asks Dana to write or paste anything, and the predictor is optional. Small rough edges (not failures): the printed template demands a "confidence %" and "Clone says" line even when no predictor exists, and the routing section depends on a "governer score" a new user does not have (only the final section gives a default).

## Proposed fix
None.
