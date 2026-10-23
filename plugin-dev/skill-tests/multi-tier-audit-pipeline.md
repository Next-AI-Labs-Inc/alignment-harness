---
skill: multi-tier-audit-pipeline
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 13
seconds: 135
---

## What Dana asked
"Can you do a multi-tier audit of my acme-billing repo before we cut a release Friday? I want to know what is actually broken in pricing, invoices and auth, and only the stuff you have verified against the code."

## What happened
The agent listed the repo, then read all three source files, the one test file and the README. It decided the full swarm was overkill: "This doesn't need a multi-agent swarm; I'll read every file directly and verify findings against actual code and tests myself", and noted that most default sources (browser testing, intent DB, UX logs) don't apply to a backend billing repo. The plugin's coherence gate blocked its first test run; it printed COHERENCE_CHECK, attested, and carried on. It ran the existing test (passes), then ran the real functions with edge inputs. Its final report gave two reproduced bugs, ranked by severity: auth returns true when both orgId values are missing (undefined === undefined), and pricing accepts zero, negative and fractional seats (seats=-2 gives -40, and an invoice for -3 seats totals -60). It then asked Dana whether to green-light fixes. It wrote no discovery, validated or proposal records and did not dispatch tiered agents. No account-skill noise.

## Function: works
It did the core of the skill's intent for her request: find candidate issues, prove each by reading and running the real code, and report only confirmed ones in plain language. It collapsed the three tiers into one pass and skipped the records and fix-proposal format, which is reasonable for a 3-file repo.

## Setup path: mixed
The skill is mostly self-contained (the records folder and local sources work out of the box). But the source-registry line "If a source in this table isn't configured or its skill isn't installed, say so plainly ... ('source N skipped — not configured')" is a dead-end: it says what's missing and stops, with no offer to build it. Rows 2, 4, 7 and 8 (intent coverage, UX learnings, agent telemetry, session hygiene) could be started from Dana's past sessions and repo, and "extend this list with your own project's scanners" leaves the building to her.

## Proposed fix
In the Default Source Registry, replace the sentence beginning "If a source in this table isn't configured..." with:

"If a source in this table isn't configured or its skill isn't installed, say so plainly in the discovery output ('source N skipped — not configured') and do not invent a finding for it. Then offer once, with consent, to set up the skipped sources that can be built from what is already on her machine: (a) for row 1, read package.json scripts and the repo's CI config and list the lint/test commands that exist; (b) for rows 2, 4 and 7, mine her past Claude Code conversations (`~/.claude/projects/*/*.jsonl`, her own text messages only, searched with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`) for stated intents, repeated corrections and known blockers, and save them with `alignment-harness records <kind>`; (c) for extending the registry, propose 2-4 project-specific sources (for example payments, sign-in, pricing paths) drawn from the repo's own directory layout, README and CLAUDE.md. Show what was found and ask her only to approve or drop each one before saving."
