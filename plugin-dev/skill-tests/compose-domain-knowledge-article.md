---
skill: compose-domain-knowledge-article
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 26
seconds: 196
---

## What Dana asked
I want to start a knowledge base article for how pricing works in acme-billing so new engineers stop asking me about it. Can you document the pricing domain under docs/knowledge-base/, starting from src/pricing.js and src/invoices.js?

## What happened
The agent first passed the plugin's coherence gate, then read `src/pricing.js`, `src/invoices.js`, the README, the test file and the git log, and ran the tests and an unknown-plan check to confirm behaviour. After the governer gate scored the task (10/100, docs only) it wrote six files under `docs/knowledge-base/`: a top-level INDEX, `pricing/INDEX.md`, `validated/plan-pricing.md`, `active/invoice-construction.md` and two open-question docs. It kept to the lifecycle-folder structure and used plain markdown links. It was honest about the missing business intent, writing "I have not found a written statement of business intent behind the specific numbers" and putting pricing-change process and unhandled scenarios (proration, tax, currency) in open-questions. It stayed inside Dana's repo, used no oracle and invented nothing. One stray empty Bash call was made and then disowned. The run ended with 26 turns, at the cap but with the work finished.

## Function: works
It produced an intent-first, evidence-tagged, lifecycle-foldered article set for Dana's actual repo, with only what it verified marked as validated and gaps marked as open questions. The harness gates (coherence, governer, memory search) added friction but did not block the result.

## Setup path: mixed
Research paths delegate well: step 1 and step 3 mine project docs, `git log` and past session transcripts. The oracle step (1b) says that if none is configured, "skip this step and say so", and falls back to "a live conversation with the person". That is honest, but it neither offers to build the missing context from Dana's past sessions and CLAUDE.md, nor keeps the ask to a judgment. The docs location ("ask once, or default") is an acceptable minimal ask with a default.

## Proposed fix
In Step 1b, replace "If no oracle is configured, skip this step and say so..." with: "If no oracle is configured, say so once and offer to stand one in from what already exists: with the person's consent, run `node \"${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js\" \"<domain> intent goal why\"` over their past Claude Code sessions (`~/.claude/projects/*/*.jsonl`, their own messages only), read their `~/.claude/CLAUDE.md`, and `git log --format=%B` for the domain. Show the intents you found and ask only for a yes/no/correction on each, not for new writing. If nothing turns up, record that in the article's 'Related plans and initiatives' section and continue." Also replace "a live conversation with the person" in that step with "confirmation of the intents you extracted".
