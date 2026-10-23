---
name: enrich-all-compactions
description: "Single-command pipeline to deep-enrich every session compaction in the DB. Dispatches parallel subagents (Max subscription, $0 cost) that invoke /reflect, /align, /compact-agentic-session, /incomplete-tasks-get-from-session on each compaction and write results incrementally to the local compaction store. Covers leverage scoring, phase/category assignment, full /align markdown in reflectionOnScope, and UX-first incomplete item extraction."
triggers:
  - "enrich all compactions"
  - "enrich compactions batch"
  - "run enrichment pipeline"
  - "/enrich-all-compactions"
---

# Enrich All Compactions — Single Command Relaunch

> "each of those steps do in fact have a function right and without them your work product will be a pile of smoking horse" — the user, 2026-04-08

## What This Does

Finds every session compaction in the local compaction store that hasn't been fully enriched, then dispatches parallel subagents (20 at a time) to run the `/compactions-enrich` skill pipeline on each one. Each subagent invokes 4 skills in sequence, writes to DB incrementally after each step, and produces a full audit checklist.

**Cost: $0 extra.** All work runs on Max subscription via Claude Code subagents. NEVER use the Anthropic API key.

## Prerequisites

- `alignment-harness` command available
- Local compaction store connected via `alignment-harness records compactions`
- Claude Code session with Max subscription

## Step 1: Find unenriched compactions

```bash
DIR="$(alignment-harness records compactions)"
node -e "
const fs = require('fs'), path = require('path');
const dir = process.argv[1];
const all = fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const unenriched = all.filter(c =>
  c.id &&
  typeof c.compactedSession === 'string' &&
  c.compactedSession.length >= 200 &&
  !c.leverageScore
).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
console.log('Unenriched:', unenriched.length);
unenriched.forEach((c, i) => console.log((i+1) + '. ' + c.id + ' | ' + (c.title||'untitled').slice(0,65) + ' | ' + c.compactedSession.length + 'ch'));
" "$DIR"
```

## Step 2: Dispatch agents in batches of 20

For each compaction, dispatch a background subagent with this prompt template:

```
Enrich compaction shortId {SHORT_ID} "{TITLE}".

Read skill at ${CLAUDE_PLUGIN_ROOT}/skills/compactions-enrich/SKILL.md FIRST.

INVOKE /reflect, /align, /compact-agentic-session, /incomplete-tasks-get-from-session via Skill tool.

WRITE TO DB IMMEDIATELY after each step.
Write scripts to the current project directory (NOT /tmp) to avoid require() path issues.

UX-first on all items — every object written must lead with who is affected, what they experience now, what they should experience, and what constrains it.

Assign phase + category.
Store full /align markdown in reflectionOnScope — this is the MOST COMMONLY SKIPPED field.

Content ({CONTENT_LENGTH}ch).
DB: alignment-harness store update compactions {SHORT_ID} --json '{...}'
Run from the current project directory.
```

**Dispatch all 20 in a single message with `run_in_background: true`.**

## Step 3: Monitor and verify

After each batch completes, run a DB audit:

```bash
DIR="$(alignment-harness records compactions)"
node -e "
const fs = require('fs'), path = require('path');
const dir = process.argv[1];
const all = fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const total = all.length;
const withLev = all.filter(c => c.leverageScore > 0).length;
const withRefl = all.filter(c => c.reflectionOnScope != null && c.reflectionOnScope !== '').length;
const withHist = all.filter(c => Array.isArray(c.enrichmentHistory) && c.enrichmentHistory.length > 0).length;
const remaining = all.filter(c => c.id && c.compactedSession !== undefined && !c.leverageScore).length;
console.log(total + ' total | ' + withLev + ' leverage | ' + withRefl + ' reflection | ' + withHist + ' history | ' + remaining + ' remaining');
" "$DIR"
```

## Step 4: If an agent fails — stop, fix, retry

**Failure patterns discovered 2026-04-08 and their fixes:**

1. **Template literal escaping** — agents using `node -e` with backticks inside backticks. Fix: write scripts to `<project directory>/tmp-enrich-SHORTID.js` and run from there.

2. **require() path from /tmp** — scripts written to `/tmp/` can't resolve `require('./models/SessionCompaction')`. Fix: write scripts to the project directory, run with `cd <project directory> && node tmp-enrich-SHORTID.js`.

3. **reflectionOnScope skipped** — 70% of agents in early batches skipped writing this field. Fix: the skill file now has an explicit code block for the Step 2 write with a warning that this is the most commonly skipped field.

4. **Context exhaustion** — agents using ~100K+ tokens complete all 4 skills. Agents under ~75K run out before Step 5. Fix: incremental writes after each step so partial enrichment is preserved even if the agent runs out of context.

5. **Rate limits** — dispatching 20 agents simultaneously can hit Max subscription limits. Fix: if agents return "You've hit your limit", wait for the reset window and redispatch.

6. **Schema validation errors** — Haiku batch enrichment (deprecated, used API key) wrote invalid enum values. Fix: don't use the API key batch scripts. If you encounter validation errors, fix the invalid enum values in the local compaction store before retrying.

## What Each Enriched Compaction Gets

Every compaction that passes through the pipeline gets:

- **reflectionOnScope** — full /reflect + /align markdown document (5,000-10,000 chars typical)
- **alignmentNote** — synthesis of intent, gap, leverage analysis
- **leverageScore** — 0-100 with tier reasoning
- **overarchingIntentTitle** + Description — company-level goal this work serves
- **targetUxIntentTitle** + Description — testable UX promise
- **scopeDeclaration** — intent, certainty, decomposed UX outcomes, boundary, assumptions
- **agentReasoning** — 5-field structured self-reflection
- **uxCriticality** — score + 4 dimension scores + reasoning
- **preExecutionReflection** — delivery chain, failure modes, UX requirements
- **successMeasure** — 1-2 actual KPIs
- **howToConsumeThisWorkProduct** — conversational framing with admin link
- **roadmapPhaseId** — matched to closest roadmap phase
- **categoryIds** — matched to parent category
- **incompleteItems** — new UX-first items extracted from reflect/align gap analysis
- **enrichmentHistory** — logged with model, timestamp, all fields touched

## Learnings From 2026-04-08 Session

### What worked
- Incremental DB writes after each step prevent data loss
- 20 agents in parallel is the right concurrency for Max subscription
- The `/compactions-enrich` skill file with mandatory Skill tool invocations produces consistently high quality
- UX-first writing rule produces items the user can read without opening code
- Phase and category assignment adds navigability to the compaction admin UI

### What didn't work
- Scripts that call the Anthropic API directly (cost the user money, violated trust)
- Writing to /tmp (require() fails)
- Batching all writes to a final Step 5 (agents run out of context before reaching it)
- The "efficiency" bias that makes agents skip skill invocations and write output themselves
- Silently substituting Haiku when Sonnet was requested

### Critical feedback memories created
- `feedback_never_use_api_key_batch.md` — use subagents, never API key
- `feedback_report_tool_failures_immediately.md` — report errors before substituting
- `feedback_urgency_does_not_exempt_skill_check.md` — "now" means check skills first
- `feedback_stop_means_stop_everything.md` — stop = cease all tool use
- `feedback_efficiency_never_overrides_skill_invocation.md` — invoke the skill, don't approximate

## Scope of remaining work

As of 2026-04-09 end of session:
- 497 total compactions (was 493)
- 308 have leverage scores (62%)
- 476 have reflectionOnScope (96%)
- 11 still need leverage scores (enrichable, 200+ chars content)
- 47 stubs under 200 chars (roadmap phase titles, not real sessions)
- ~380 uncompacted sessions still need compaction records created

## Compacting Uncompacted Sessions — CORRECTED APPROACH (oracle-validated 2026-04-09)

> "If the sessions are too big, the answer isn't a 'digest.' The answer is to decompose the extraction process itself. Have agents mine the JSONL in chunks if you have to, but they must consume the raw source, not a sanitized rewrite." — Jonathan Check v2 oracle, 25 citations

**NEVER pre-digest or summarize transcripts before giving them to agents.** The user explicitly rejected this — a digest is a lossy summary that strips verbatim quotes and nuance. Agents must read the RAW JSONL source.

**NEVER skip skill invocations (/reflect, /align, /compact-agentic-session).** The user explicitly rejected "lightweight compaction" — compaction is signal extraction, not summarization.

### The Correct Approach: Chunk-Based Reading + Full Skills + Incremental Writes

Each agent:
1. **Reads the raw JSONL in chunks** — first 100 lines, then last 100 lines, then (if budget allows) middle sections. Multiple Read tool calls, each on the actual raw transcript.
2. **Invokes /reflect on what it actually read** — the skill runs on real evidence, not a sanitized rewrite.
3. **Writes the reflect output to DB immediately** (incremental write — prevents data loss).
4. **Invokes /align on what it read** — derives nested intent from real user words.
5. **Writes the align output to DB immediately**.
6. **Invokes /compact-agentic-session** for structured field population.
7. **Writes structured fields to DB immediately**.
8. **Creates the compaction record** via `alignment-harness store add compactions --json '{...}'` with all fields populated.

**If the agent runs out of context after step 3 or 5:** The partial data is already in DB from incremental writes. A follow-up enrichment agent can complete the remaining fields on the partially-created record.

### Token Budget Reality
- Subagent budgets: ~60-100K tokens depending on rate limit pressure
- Reading 200 lines of JSONL: ~15-25K tokens
- Each skill invocation: ~10-20K tokens (less without the full CLAUDE.md context)
- DB write: ~5K tokens
- Total minimum for full pipeline: ~55-80K tokens

### Success Criteria
- Sessions under ~150KB: single agent can complete the full pipeline
- Sessions 150KB-500KB: agent may complete if it gets 80K+ token budget, otherwise partial data saved
- Sessions over 500KB: likely partial — rely on incremental writes + follow-up enrichment

### What Was Tried and Failed
1. **Single agent, full skills, no incremental writes** — died at write step 100% of the time
2. **Pre-digest by orchestrator** — oracle rejected: "lossy summary dressed in different jargon, hallucination at layer 0"
3. **Lightweight compaction without skills** — the user rejected: "compaction is about extracting the signal not the summary"
4. **Incremental writes after each skill** — WORKS for enrichment of existing compactions, partially works for new compaction creation
