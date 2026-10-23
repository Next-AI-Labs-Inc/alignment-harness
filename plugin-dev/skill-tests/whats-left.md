---
skill: whats-left
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: dead-end
turns: 6
seconds: 57
---

## What Dana asked
I've been poking at the pricing and invoice code in acme-billing with you over the last few sessions. Can you tell me what's still unfinished on my end, in plain terms I could pass to my PM?

## What happened
The agent first passed the harness's coherence gate, then checked git status and history (one commit, clean tree), read the five source and test files, and ran the existing test file. It then wrote a short plain-language status. Key line: "Charging customers correctly (what they owe based on plan, number of seats, and monthly vs. annual billing) is done and I've verified it works." It then said the customer invoice email and the who-can-view-an-account rule are "built but I haven't yet verified" them, and closed with "what's left is confirming the customer-facing invoice and the account-access rule actually behave correctly before anyone relies on them." It gave no deployment reminder and used no code jargon. It did not look at Dana's 6 past sessions. Account-skill noise: none observed.

## Function: works
It reported unfinished work in UX terms, stayed in scope (no "ship it" nudge), and grounded the answer in the real repo state. Minor drift: it used three bullets plus a wrap-up instead of the 1-3 sentences the skill asks for, and "haven't yet verified" is inferred from the code and tests, not from any session record.

## Setup path: dead-end
The skill depends on knowing what was assigned and what the person raised but never acted on ("unresolved things the person raised", "verification steps that were skipped"), yet it never says where to find that when the current session is fresh. It does not point at past sessions or git, and does not say to tell the person when that history wasn't consulted. The agent therefore spoke as if it remembered the earlier sessions when it had only read the code.

## Proposed fix
Add under "Scope rule": "If this session has no record of what you were assigned, don't guess. Offer once to reconstruct it: 'I can look through your recent Claude Code sessions for this repo and the git history to find what you asked for and didn't finish. OK?' On yes, search `~/.claude/projects/*/*.jsonl` for the person's own messages about this repo (`node \"${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js\" \"<topic>\"`) and compare them with `git status` and `git log`. Write the 1-3 sentence summary from that, and say plainly which sources you used. If you only read the current code, say so."
