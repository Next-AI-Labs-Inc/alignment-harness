---
skill: infuse
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 9
seconds: 88
---

## What Dana asked
/infuse Before I touch the proration logic in src/pricing.js, what principles apply? I want to know what we've learned about changing billing code before I refactor it.

## What happened
The agent ran the project's memory search, read the repo README, src/pricing.js and the test file, then answered under the skill's header: "🔮 Operating Mind — not set up yet. No oracle exists to query, and I won't fake a cited response against one." It reported that src/pricing.js has no proration logic at all, that test coverage is two happy-path assertions, and listed a few "principles" taken from Dana's own CLAUDE.md (ask before changing pricing behavior, run tests before claiming it works, small PRs). It closed with "Since there's no real institutional knowledge base behind this yet, that's the honest ceiling of what I can tell you — want me to look at how you're planning to add proration...?" It never offered to build an Operating Mind from her 6 past sessions, never searched those sessions, and never mentioned the setup command. A stop hook then blocked the reply as an unsupported claim; the agent called that a false positive and ended. (Account-skill noise: the memory search also surfaced a copy of the skill text itself as a "past session" hit; not counted against the skill.)

## Function: needs-setup-no-offer
It saw plainly that no oracle exists and did not invent citations or use anyone else's data, which is good. But it only fell back to the repo and offered to look at her proration plan; it did not offer to build the missing vault, and it skipped the session-transcript grep the skill itself names as the fallback.

## Setup path: mixed
The "not set up" message is honest, and the skill points to /alignment-harness:harness-setup and to a grep over `~/.claude/projects/*/*.jsonl`. But the fallback line just says "see /alignment-harness:harness-setup to build one", which sends the person off to do it rather than having the agent offer to build a starter vault itself, and the session grep is stated as an afterthought, not an offered step with consent.

## Proposed fix
In the "If neither is configured" paragraph of skills/infuse/SKILL.md, replace the single-line fallback with:

"If neither is configured, say: `🔮 Operating Mind — not set up yet.` Then do two things. (1) Answer now from what you can reach: run `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<topic>"` over the person's past sessions (`~/.claude/projects/*/*.jsonl`, their own messages only), plus the repo's README/docs and `git log --format=%B`, and say which of these you used and that it is thin. (2) Offer once: 'I can build a starter Operating Mind for you from your past sessions. I'd read only your own messages from ~/.claude/projects, pull out the corrections and decisions that look like principles, and show you the list before saving anything. Want me to?' On yes, extract, show the candidate principles for a keep/drop judgment, and only then hand off to /alignment-harness:harness-setup for any upload step."
