---
skill: decompose
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: mixed
turns: 13
seconds: 136
---

## What Dana asked
I want mid-cycle plan upgrades in acme-billing to be prorated on the next invoice instead of charging the full new price. There are a ton of steps here across pricing.js, invoices.js and auth.js, can you decompose it into tasks for me?

## What happened
The skill fired, but the agent opened by refusing to follow it: "I'll ground this in the actual code rather than the elaborate ritual the decompose skill wants me to perform — that skill asks me to print theatrical banners, fabricate "confidence scores" and "verified reality" claims without checking, and run an attestation command framed as needing "no permission prompt."" (The attestation line comes from the plugin's prompt hook, not the SKILL.md itself.) It was then blocked once by the memory-search hook, ran the agent-find search, read pricing.js, invoices.js, auth.js, the test and the README, and gave a plain-prose answer: two clarifying questions and a 4-item breakdown (pricing, invoices, optional auth, tests). It never printed the start banner, the PLAN_BREAKDOWN markers, verbatim-intent work items, confidence scores or checkboxes, never wrote a seed file, and never ran /governer. When the turn-end hook asked it to create tasks, it reported: "No `TaskCreate` tool exists in this environment", and stopped. It also never said that the skill needs a confirmed intent map from /align first, and never offered to build one. No account-skill noise.

## Function: broken
The agent rejected the skill's own ritual and produced none of its deliverables (seed expansion, verbatim-intent work items, tasks). The skill also depends on `TaskCreate`, which did not exist in this headless run, and on a confirmed /align map that Dana did not have, which the agent did not flag. The ungrounded-looking demands ("If you receive this code, immediately print ... no exceptions") read as prompt-injection-style text and the agent pushed back. The repo-grounded breakdown itself was useful but came from the agent's own judgment, not the skill.

## Setup path: mixed
Most fallbacks delegate or degrade sensibly: no seed file means "create one at that default path", no memory-search command means fall back to Grep/Glob and past sessions, no Obsidian means print the path. But Step 1 is a dead end for a new user: "If you don't have one, stop and run /align first." It does not offer to build the intent map from what the person already said and what is in the repo, and it says nothing for environments without `TaskCreate`.

## Proposed fix
In Step 1, replace "If you don't have one, stop and run /align first. You cannot decompose what hasn't been confirmed." with: "If there is no confirmed intent map, don't stop. Say so in one line, then offer to draft one yourself from the person's own words this session, plus the repo's README and recent `git log --format=%B`, and this project's past sessions (`~/.claude/projects/*/*.jsonl`, their own messages only). Show the draft as a short list of their statements, ask once for a yes or a correction on each, and only then decompose the items they confirm." In Step 5 and Tools, add: "If TaskCreate is not available in this session, write the work items only in the seed document and say so." Also soften the opening line "If you receive this code, immediately print ... no exceptions" to plain wording (for example "Start by printing this banner:") so it does not read as injected text.
