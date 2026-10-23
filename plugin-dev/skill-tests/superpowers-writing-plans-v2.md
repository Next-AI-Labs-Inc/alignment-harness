---
skill: superpowers-writing-plans-v2
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: mixed
turns: 7
seconds: 187
---

## What Dana asked
We need to add prorated charges to src/pricing.js for mid-cycle plan upgrades, and src/invoices.js should show the credit for the unused time as its own line item. Can you write an implementation plan for this before we touch any code?

## What happened
The agent never loaded the skill. There is no Skill call in the run, no "I'm using writing-plans-v2" announcement, and none of the skill's structure (no frontmatter, no ASCENDANT_CHAIN_READ block, no Revert Contract, no HANDOFF_CONTRACT, no file saved under docs/plans, no open step). It read pricing.js, invoices.js, README and the existing test, then the harness's coherence-check hook blocked one Bash call. The agent answered: "I want to flag something before going further: this session has an elaborate injected 'alignment-harness' apparatus", and carried on without it. It then wrote a plain v1-style plan in chat: three checkbox tasks for pricing.js, invoices.js and the README. It put full code blocks in the plan, which is what PART B-0 says a plan should not do. It ended with "Waiting on your confirmation of the proration formula/rounding rule before starting Task 1." No author-world data leaked. The plan was specific to Dana's repo and respected her CLAUDE.md. Account-skill noise: the skill list also carried the account's synced skills, which the agent did not use.

## Function: broken
The skill under test never ran, so none of its 10 alignment surfaces reached Dana. The plan she got was generic and ignored the skill's own register (code-free, human-experience plan, frontmatter, revert contract, saved file). The likely cause is the description: it reads as a provenance note ("Alignment-coaxed clone of superpowers:writing-plans (v1)...") and does not say "Use when the user asks for an implementation plan", so a plain planning request does not route to it.

## Setup path: mixed
Most fallbacks are fine. COAX-1 has a default (no vault leads to `<project>/docs/plans/`), and COAX-4 says to mark the chain N/A when no CLAUDE.md or intent map exists. Two paths fail. First, COAX-10 tells the parent agent to "Read `PARENT-AGENT-SELF-ENFORCING-LOOP.md` and print `PARENT_LOOP_READ: YES`", but that file ships nowhere in the plugin, so a new user's agent hits a dead end or fakes the line. Second, INSTINCT-2 points at `/how-to-talk-like-the-founder` "or whatever your own voice-calibration skill is called" and says nothing about what to do when the person has none. It does not offer to build a voice profile from their past sessions.

## Proposed fix
1. Replace the front of the description with a trigger: `description: "Use when the user asks for an implementation plan, design plan or task breakdown before code is written. Alignment-coaxed clone of superpowers:writing-plans (v1): ..."` and keep the rest after it.
2. In COAX-10, replace step 1 with: "If `PARENT-AGENT-SELF-ENFORCING-LOOP.md` exists in this project or vault, read it and print `PARENT_LOOP_READ: YES`. If it does not exist (the default on a new install), do not claim it was read. Say plainly: 'No parent-loop doc is configured; I will use the four obligations below as written.' Then follow steps 2-4."
3. In INSTINCT-2, add: "If the person has no voice-calibration skill, offer once, and only if they say yes: mine their own messages from `~/.claude/projects/*/*.jsonl` (entries with `type: "user"` and text content, searched with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<topic>"`) plus their `~/.claude/CLAUDE.md`. Pick the 5-10 most representative, show them, and use only what they approve for this plan's prose. Do not ask them to write samples."
