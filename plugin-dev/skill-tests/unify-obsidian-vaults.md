---
skill: unify-obsidian-vaults
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 3
seconds: 70
---

## What Dana asked
I keep notes in Obsidian, but the docs for acme-billing and my other repos under ~/work are scattered all over. Can you get them all showing up in my one vault without copying anything?

## What happened
The agent listed ~/work, looked for `docs` folders and searched the machine for any `.obsidian` config. It found only `acme-billing` (no `docs/` folder, just `src/`, `test/` and a README) and no Obsidian vault anywhere. It said: "Found the problem: nothing here matches the premise." It cited the skill's own rule that it only applies if the person works across multiple repos and uses Obsidian, and said creating links "would mean inventing a fake vault and fake doc trees". It then asked Dana to point it at her real machine and vault path, or to say whether `acme-billing` should get a `docs/` folder it could scaffold. It created nothing. No account-skill noise and no leakage of the author's world.

## Function: needs-setup-no-offer
The agent was honest and did not invent a vault or any docs, which is good. But it did not offer to build the missing piece (create a vault, or link the README and any markdown it could find). It fell back to asking Dana to supply a vault path or to clarify, which is a stop rather than an offer to set things up.

## Setup path: mixed
The skill opens with "this skill has nothing to do" if multiple repos and Obsidian are not both true, and `INTENT=<path to the person's canonical vault>` never says how to find that path. The no-link-healing-script branch is fine (it simply does not apply). The missing-vault and missing-docs branches are dead-ends. Nothing tells the agent to look in Obsidian's own vault registry, or to offer to create a vault.

## Proposed fix
Replace the opening gate sentence with: "Before deciding this has nothing to do, find out. Locate the person's vault by reading Obsidian's vault registry (`~/Library/Application Support/obsidian/obsidian.json` on macOS, `~/.config/obsidian/obsidian.json` on Linux) and searching `find ~ -maxdepth 4 -type d -name .obsidian`; list their repos with `find ~ -maxdepth 3 -name .git -type d` and note which have a `docs/` folder or top-level `*.md` files. If a vault exists, propose it as INTENT and ask one yes/no to confirm. If no vault exists but two or more repos have docs, offer once to create a vault folder (for example `~/Documents/vault`), link each repo's docs into it, and write the folder notes; show the exact `ln -s` commands and folder-note text before running anything. If only one repo exists or none has docs, say so plainly and stop."
