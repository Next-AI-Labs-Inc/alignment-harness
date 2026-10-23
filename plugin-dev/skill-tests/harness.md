---
skill: harness
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 3
seconds: 40
---

## What Dana asked
/harness status - I just installed this in acme-billing and I can't tell which of the checks are actually doing anything yet. What's on, what's set up, and does any of it clash with my own hook?

## What happened
The agent ran `alignment-harness doctor` and then `alignment-harness conflicts`, exactly as the skill says. It then grouped the pieces in plain language: coherence check on and armed once, governer and evidence gate on but with nothing scored or checked yet, and the risk table, skill-history oracle, memory search and first-run setup not yet set up. It reported "none" for clashes with her hook, and named the one command to fix the gaps: "the one command is `/alignment-harness:harness-setup`." It also added a caveat that the risk score of 95 on her message came from the word "billing" in the directory name, a keyword guess and not a real assessment. Nothing from the plugin author's world appeared. The agent did not run setup itself, which matches the skill (status reports; setup is a separate command).

## Function: works
It did the status job for her request: per-piece on/off/set-up state backed by the doctor's evidence (armed 1x, 0 scores, 0 finishes), the conflicts check, and the setup command. No invented data and no leakage.

## Setup path: delegates
Status points to `/alignment-harness:harness-setup`, which "walks the checkpoints, says before each what it will read and write, and asks", so the agent does the setup work and the person only gives consent. The uninstall path also lists what setup created outside the data folder and "offer[s] to help remove each, with their confirmation". No path asks Dana to write or collect material. The only slight gap is that status tells her the command to run instead of offering to run it, which is acceptable.

## Proposed fix
None.
