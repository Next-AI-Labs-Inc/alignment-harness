---
skill: pipeline-scope-guardian
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: mixed
turns: 7
seconds: 78
---

## What Dana asked
"I need three things done in acme-billing this week: (1) update the rounding in src/pricing.js and every call site, (2) review the 5 open TODOs in src/invoices.js, and (3) add tests for the token refresh path in src/auth.js. Before we start, register the full scope so nothing gets dropped."

## What happened
The agent began with "the skill wants me to run a specific binary and write JSON state files, and I'd rather confirm those exist than cargo-cult commands into a real repo." It checked the harness binary, found that `jq` is not installed in the sandbox (only `node` was found), and found no `.claude` folder in the repo. It then read the three source files and told Dana that none of her three tasks matched the code: no rounding logic, no TODOs, no token refresh path. It stopped and asked whether this was the wrong repo or branch. It never wrote a scope registry and never printed the "SCOPE REGISTERED" summary. A Stop hook then asked for tasks, and the agent replied "No `TaskCreate` tool is actually available in this session." It restated the three items in her words and ended. The account's synced skills were not used.

## Function: broken
Dana's one explicit ask was to register the full scope before work starts. The skill's core output (the registry file and the printed scope with confirmation) was never produced, and the agent spent its turns second-guessing whether the tasks were real. The skill's scripts depend on `jq` (and `bc`), which the sandbox lacks, and the skill gives the agent no way to carry on without them.

## Setup path: mixed
Some paths are fine. The `alignment-harness session-id` call falls back to "unknown-session". Phase 3 and Phase 4 say plainly when no registry exists. The confirmation step asks Dana only for a yes/no judgment. Other paths are dead ends. Every registry read and write needs `jq`, and `bc` for the percentages, with no check for them and no fallback, so on a machine without them the scripts fail. Step 4 calls `declareScope` from `/declare-scope`, which a new user may not have, and it says nothing about what to do if it is missing. The example requirement names `/jonathan-check2`, a command from the author's setup, although it is hedged as "one example".

## Proposed fix
1. Add this at the top of Phase 1: "Before writing the registry, run `command -v jq bc`. If either is missing, do not stop and do not ask Dana to install them. Say 'jq is not installed, so I'll keep the scope registry using node instead' and use `node -e` for every JSON read and update (same file, same JSON shape). Do the percentage arithmetic with shell `$(( ))`, or in the same node snippet."
2. Replace Step 4 with: "If `/declare-scope` or `declareScope` is not available, skip it and say so in one line. The scope file plus the chat printout is the record."
3. Replace the R1 example with: "e.g. 'run the repo's tests on every item' or, if you can find one in ~/.claude/skills/ or the repo CLAUDE.md, the person's own review step. Offer to use what you find there and confirm once."
4. Add to Step 1: "Register every list the person gave, even if you doubt an item exists in the repo (for example '5 open TODOs'). Record the person's exact words, mark doubts in a `notes` field, and ask about them after the scope is printed, not before."
