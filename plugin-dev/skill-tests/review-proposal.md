---
skill: review-proposal
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 12
seconds: 73
---

## What Dana asked
Can you review LP-003? I think it was the proposal about invoices.js retrying a failed charge and maybe double-billing someone. I want to decide whether we fix it this sprint.

## What happened
The agent ran `alignment-harness records proposals` and `records known-decisions`, found both folders empty, and grepped git history for LP-003 with no hits. It said: "There's no LP-003 file anywhere ... Per the skill, I shouldn't invent one." It then read the real `src/invoices.js` and grepped the repo for retry and charge logic, and found none. An alignment-harness hook asked it to search memory first, so it ran agent_find, which found nothing relevant. Its one-paragraph brief said there is no LP-003 on file and that `invoices.js` only builds an invoice object, with no charge or retry code anywhere in the repo. It closed by asking whether the logic lives in another service, or whether it should "write up a fresh proposal from what you remember". A turn-end hook asked it to call TaskCreate, which does not exist in the sandbox. The agent said so and stopped. That hook is not part of this skill.

## Function: works
It did the right first part of the job for a proposal that does not exist. It looked in the right places, did not invent a proposal, checked Dana's actual code for the concern she described, and offered to write the proposal up as the skill's last rule says. The brief was one paragraph, then it waited for her.

## Setup path: mixed
The "no proposal by that id" rule is fine. It offers to write one up from Dana's description, which is a minimal unavoidable ask. Steps 3 and 5 (institutional-memory search, oracle) say what to do when these are not set up: say so, then fall back to git log and repo docs. They never offer to build the missing pieces from sources already on her machine, such as her past Claude Code sessions via `memory-search.js` or the repo's own docs. They only point to `/alignment-harness:harness-setup`. The fallback is honest, so this is not silent, but it stops short of the offer the audit wants.

## Proposed fix
In Step 1.3 replace the "If it's not set up, say so and check what you can" sentence with: "If institutional-memory search isn't set up, say so in one line, then search her past sessions yourself with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<domain terms>"`, plus `git log --oneline --grep` and the repo's docs. Offer once to run `/alignment-harness:harness-setup` to make this permanent." In Step 1.5 replace the oracle fallback with: "If no oracle is configured, say so once and answer from the repo's docs, `CLAUDE.md`, git history and past sessions. Offer, with consent, to build a small principles summary from those sources and show it before saving. Don't ask her to write principles herself."
