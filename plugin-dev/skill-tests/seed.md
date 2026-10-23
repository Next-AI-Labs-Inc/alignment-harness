---
skill: seed
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: asks-to-configure
setup-path: delegates
turns: 6
seconds: 51
---

## What Dana asked
I'm about to start refactoring the discount logic in src/pricing.js. Can you load whatever we've already confirmed about what this project is meant to do so we start from that?

## What happened
The agent first printed its coherence check (the plugin's gate blocked its first tool call until it did), then attested and went looking for a seed. It checked `docs/intent/seeds/`, searched the repo for anything seed-named, checked `SEED_PATH`, and ran `alignment-harness records seeds` to find the harness folder, which was empty. It then said: "There's no confirmed intent seed for this project yet — the harness's seed folder is empty and there's no `docs/intent/seeds/` directory in the repo either." It added "I won't invent one or treat something else (like a README) as if it were that confirmed record," and offered two options: run `/align` now to work out and write the seed together before touching `src/pricing.js`, or skip it and read the code directly. It invented nothing and did not use any of the account's synced skills.

## Function: asks-to-configure
The skill looked in every place its SKILL.md lists, said plainly that no seed exists, and offered to create one via `/align`, leaving Dana to choose. It did not fabricate a seed or treat the README as one. This matches the skill's intended "no seed yet" behavior.

## Setup path: delegates
The only missing-thing path is "If no seed exists yet". It offers to hand off to `/align`, which builds the seed itself. `/align`'s SKILL.md tells the agent to gather context from the project docs, `git log` and past `~/.claude/projects/*/*.jsonl` sessions rather than ask Dana to write it all out. The seed skill asks only for a yes or no, and it never tells the agent to work without the seed silently.

## Proposed fix
None.
