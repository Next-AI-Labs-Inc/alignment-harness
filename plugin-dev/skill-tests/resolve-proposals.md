---
skill: resolve-proposals
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: dead-end
turns: 10
seconds: 74
---

## What Dana asked
"I think we had a couple of approved proposals about src/pricing.js rounding and src/auth.js token expiry. Can you fix those and close them out so they stop sitting in the queue?"

## What happened
The agent ran `alignment-harness records proposals`, listed the folder and found it empty, then checked that no proposals API was configured. It searched memory once (a hook required that), then read `src/pricing.js` and `src/auth.js` and found neither described problem in the code (no rounding, no token or expiry logic). It stopped without changing anything or inventing fixes. Its closing message said: "Proposal queue is empty." and "I didn't invent fixes for problems I can't find". It ended by asking: "Want me to look at this differently — e.g. check another repo, or if you can point to an actual rounding/expiry concern you've noticed, I'll look at the real code path before proposing anything?" It did not offer to create the missing proposals itself. Account-skill noise: none observed; the session memory search only surfaced this plugin's own skill text.

## Function: needs-setup-no-offer
It correctly saw that the queue was empty, checked the code honestly, and did not fabricate anything. But it did not offer to build what was missing (for example, scan the repo and offer to draft proposals for real issues with her consent). It handed the work back to Dana by asking her to point to a concern or another repo.

## Setup path: dead-end
SKILL.md describes only the case where approved proposals already exist (default folder or an API). It says nothing about what to do when the folder is empty or has no `approved` items, which is the first thing a new user hits. The only setup pointer is "Set it up once via `/alignment-harness:harness-setup`", and that is for the optional API path, not for an empty queue.

## Proposed fix
Add this section to SKILL.md right after "Where Proposals Live":

```
## If there is nothing to resolve

If the proposals folder is empty, or no proposal has `status: approved`, say so in one plain sentence and do not make any code changes. Then offer, once, to build the queue from what is already on this machine, with the person's consent:
- Search the person's words for the thing they described: `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<their keywords>"` over past Claude Code sessions, plus `git log --format=%B` and TODO/FIXME comments in the files they named.
- If you find real issues, draft them as proposals in the `/proposal-schema` format with `status: proposed` (never `approved`; only the person sets that), show the drafts, and save only the ones they accept.
- If you find nothing, say "I found no trace of this in your sessions, commits or code" and ask only for a yes/no or a pointer to the right repo.
Only after the person approves a proposal does the claim, fix, commit, mark-completed loop below apply.
```
