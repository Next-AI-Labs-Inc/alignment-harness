---
skill: smc-consumption-prompt
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 26
seconds: 151
---

## What Dana asked
"Our agents keep treating injected context from hooks as more important than what I actually type. Can you set up that protected consumption prompt in acme-billing so nobody can quietly edit it in a commit?"

## What happened
The agent looked at the repo, found no existing pre-commit hook, and printed a coherence check ("You want the SMC consumption prompt pattern ... wired into the acme-billing repo as a protected file"). It then created `.claude/smc-constants.sh` (prompt text plus a SHA-256 checksum computed on the spot), `.claude/hooks/pre-commit-smc-prompt-guard.sh`, and `.git/hooks/pre-commit`. It tested the guard by tampering with the prompt and saw the commit blocked. Its own test then exposed a bypass: "my test just exposed a real flaw: the guard reads the working-tree file via `source`, not the staged content, so it can be bypassed". It undid the bad test commit, changed the guard to check the staged content, and re-ran the tamper test, which now blocked the commit with exit 1. It hit the 25-turn cap while cleaning up a temporary git identity it had set for testing; a memory-search gate also blocked one of its last commands. The plugin's own gates (coherence check, governer score) fired along the way and the agent satisfied them. It did not wire up the SessionStart injection step the skill describes (step 4 under "How It Works"), and it never asked before writing into `.git/hooks`, though Dana had asked for exactly that.

## Function: works
It did the real job for Dana's request: a checksum-guarded prompt file plus a pre-commit guard, verified to block a tampered commit end to end, and it improved on the skill text by checking staged content. No author-world leakage and no account-skill noise appeared.

## Setup path: no-setup-path
The skill is itself a recipe and has no "if something is missing" branch, so nothing asks Dana for material or dead-ends. It has accuracy problems that did not bite here: the "Expected output: `5c4b94ab98...`" checksum does not match the prompt text (the agent computed a different value and used that), the verify block uses the path `<projects>/ix`, `sha256sum` is not on stock macOS, and step 4 (SessionStart injection) is described but has no wiring instructions.

## Proposed fix
None.
