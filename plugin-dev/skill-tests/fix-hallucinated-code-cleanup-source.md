---
skill: fix-hallucinated-code-cleanup-source
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 12
seconds: 223
---

## What Dana asked
An agent commit in acme-billing last week put the old percentage fee logic back into src/pricing.js, even though we deliberately moved to a flat fee. Can you undo that and track down whatever misled it so it does not happen again?

## What happened
The agent started with the git history for src/pricing.js, read the code and tests, and grepped the repo, her CLAUDE.md, memory files and past sessions for any trace of a percentage fee. It found one commit in the whole repo, flat per-seat pricing in the code, and no mention of percentage fees anywhere. It held off reverting anything, citing Phase 2 of the skill and Dana's own rule to ask before changing billing behaviour. Its closing message said: "I don't want to 'fix' something that isn't actually broken, or invent a hallucination source that doesn't exist". It then asked Dana to confirm the repo path or point to another location or PR where she saw the percentage code. The plugin's own hooks made it print a coherence check and run a memory search first; it complied and carried on.

## Function: works
The sandbox repo had no reverted commit to find, so the right first part of the job was to check the premise, refuse to invent a cause, and ask. It did that, with no author-world leakage. No account-skill noise.

## Setup path: no-setup-path
The skill's sources are the machine's own CLAUDE.md, memory files, session transcripts and git history, all marked "always available". The memory tool and the intent/compaction stores are explicitly optional, and the skill says to search them only if configured. If nothing turns up, it says "say so plainly rather than guessing", which is a legitimate outcome and not a missing-setup dead end.

## Proposed fix
None.
