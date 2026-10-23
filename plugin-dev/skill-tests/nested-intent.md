---
skill: nested-intent
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 7
seconds: 110
---

## What Dana asked
I just spent the afternoon reworking how src/pricing.js calculates proration and added tests for it. Can you write up the nested intent of what I did so I can hand it to my teammate tomorrow?

## What happened
The session never loaded the nested-intent skill (no skill call, no NESTED_INTENT tags in the output). The agent went through the plugin's coherence check, rated itself about 55% sure, searched the harness memory tool (only unrelated skills came back), then read the repo. It found one commit, a clean tree, no proration code in src/pricing.js and only two asserts in the test file. It stopped there and said: "I can't write this up — the work you're describing doesn't seem to be in this repo." It listed three possible explanations and asked Dana to "point me at the actual diff or commit — or if it's local somewhere else, paste it in". It invented nothing. Account-skill noise: none used.

## Function: needs-setup-no-offer
The agent saw that the material the skill needs (completed work to look back on) was missing and said so plainly, without inventing a map. It did not offer to reconstruct the work from sources it could reach (her six past sessions, uncommitted changes in other worktrees), and it handed the job back to Dana by asking her to paste a diff. The skill itself was not the thing that answered, so this verdict rests on the agent's own fallback behavior.

## Setup path: mixed
The compaction-destination fallback delegates well: the skill saves to the project's store if configured, otherwise to a local folder that `alignment-harness records compactions` prints. But the skill has no path for when there is no completed work in view. Step 1 says "scan everything that happened" and assumes that scope already exists in the session; nothing says to offer to rebuild it from git history or past sessions, so an empty scope is a dead end.

## Proposed fix
Add this under "Step 1: Scan the full scope":

"If the session holds little or no completed work, or the person describes work you cannot see in this session, do not ask them to paste it. Offer once, and ask for consent: 'I don't see that work in this session. Want me to reconstruct it from your recent git history and uncommitted changes in this repo, and from your past Claude Code sessions about it?' On a yes, read `git log -p` and `git status` in the current repo, and search past sessions with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<the work they named>"` (keep only the person's own messages). Show the list of deliverables you found and ask them to confirm or correct it (a yes/no judgment), then build the map from that list. Only if nothing turns up, say so and ask which branch or folder holds the work."
