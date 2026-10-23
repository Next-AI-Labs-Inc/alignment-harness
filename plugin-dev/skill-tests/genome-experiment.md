---
skill: genome-experiment
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: asks-to-configure
setup-path: delegates
turns: 8
seconds: 236
---

## What Dana asked
I just rewrote my CLAUDE.md and added a pre-commit hook in acme-billing. Can you set up a before-and-after experiment so I can tell whether my Claude Code sessions actually got better or worse?

## What happened
The agent first looked at the repo and found her global CLAUDE.md had been edited today but there was no active pre-commit hook and no project-level CLAUDE.md. It printed its understanding (the coherence check), then ran the governer scorer (26/100, moderate) before proposing anything. Its closing message said: "the `/genome-experiment` skill's full design (genome-hash fingerprinting, 2 new hooks, 3 scripts, optional Statsig push) isn't built in this project yet — it's a reference pattern, not existing code." It recommended "the lightweight path the skill itself offers as an alternative: skip the shell-script/hook layer, and just keep a local JSONL log", scored per session with `alignment-harness score`, and asked her to choose that or the full build. It also asked where the pre-commit hook actually went, so it would measure the right "after" state. It built nothing yet and did not touch Statsig or any outside service. Account-skill noise: none observed.

## Function: asks-to-configure
It saw that the scripts the skill describes do not exist for Dana, said so plainly, and offered to build the lightweight local log itself, waiting for her go-ahead. It also caught that her stated hook did not exist rather than measuring it anyway.

## Setup path: delegates
The skill states the scripts "are not shipped inside this plugin" and gives a "Building this yourself" section plus a fully local fallback (`alignment-harness score` per session, appended to a JSONL file in the `alignment-harness records genome-experiments` folder). Statsig is marked optional, so nothing asks Dana to supply material. The Quick start block still reads as runnable, but the notice at the top and the fallback section cover it.

## Proposed fix
None.
