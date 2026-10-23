---
skill: agentic-session-compactions
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 4
seconds: 75
---

## What Dana asked
I just spent the afternoon refactoring the proration logic in src/pricing.js and fixing a token-expiry bug in src/auth.js, and I'm stopping for the day. Can you write up a compaction of this session so I or another agent can pick it up tomorrow?

## What happened
The agent first checked the repo with git status, git log and git diff. It found a clean tree and a single commit, "8957fc2 billing service", with no trace of a proration refactor or an auth fix. It then ran `alignment-harness records compactions` and got the local store folder back, so the default store works. It did not write a file. It ended with: "I don't want to fabricate a 'here's what changed' writeup — especially for billing/pricing code — when I can't verify it against anything." It asked Dana to say where the work lives (another branch, another repo, or never saved) and offered to "read the real diff and write an accurate compaction from it" once she points it at the right place. It never called the Skill tool. It followed the skill's instructions through the harness's own coherence gate. No author-world leakage, and no account-skill noise.

## Function: needs-setup-no-offer
The agent found the local store, then saw it had no evidence of the work to summarise. It said so plainly and did not invent content, which is good. It then handed the gap back to Dana as a question. It did not offer to reconstruct the compaction from what she had just told it, or from her past session transcripts, with consent. This is partly a test artifact: the fresh sandbox session had no afternoon of work in it.

## Setup path: mixed
The main path delegates well. The skill points at `alignment-harness records compactions` for the store. If that store is not set up, it says to write a plain file in the cwd, print the path and say so plainly. "How to Find" says to say plainly when nothing turns up. The "hosted store" and "institutional-memory search" sections only point at other setup ("you build", "see harness-setup") and never offer to do it. The skill also has no path for the case where the session's work is not visible in git or in the current conversation. That leaves the agent to ask the person instead of mining material it can reach.

## Proposed fix
Add under "Agent Self-Reasoning (do this before composing)":

"Gather the material yourself before asking. Sources, in order: (1) the current conversation, (2) `git status`, `git diff` and `git log -10` in the repo, (3) this project's past sessions, via `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<files or topic the person named>"` or the newest `~/.claude/projects/*/*.jsonl` for this repo. If none of these shows the work the person describes, say so, then offer once: 'I can draft the compaction from what you just told me and mark it unverified, or look through your earlier sessions for it. Which do you want?' Show the draft before saving. Mark any field you could not verify as `unverified` rather than leaving it out."
