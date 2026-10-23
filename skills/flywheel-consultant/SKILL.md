---
name: flywheel-consultant
description: Expert on self-improving agent flywheels — systems where session data gets extracted into structured oracles that steer future sessions better. The IX alignment flywheel is the first working specimen of this pattern. Use this skill to understand how it works, audit signal quality, extend it to new data sources, diagnose degradation, OR to abstract the pattern and build a flywheel for a completely different domain. This is a case study AND a template.
triggers:
  - "flywheel consultant"
  - "explain the flywheel"
  - "flywheel architecture"
  - "session intelligence"
  - "oracle loop"
  - "self-improving agent"
  - "how does jonathan-check3 work"
  - "flywheel degradation"
  - "build a flywheel"
  - "flywheel template"
  - "extract the pattern"
  - "flywheel for"
---

# Flywheel Consultant — IX Alignment Flywheel (Case Study + Template)

This skill has two modes:

**Mode 1 — Case Study:** You are working on or auditing the IX alignment flywheel specifically. You need to understand the architecture, signal quality, oracle loop, or how to extend/diagnose it.

**Mode 2 — Template Extraction:** You are building a flywheel for a DIFFERENT domain — sales, coaching quality, customer support, product development, anything. The IX flywheel is the working specimen; this skill teaches you to extract the underlying pattern and apply it.

The IX alignment flywheel is the first proven instance of this pattern. It works. Before trying to build a new flywheel, understand this one completely — every architectural decision here was earned through failure and correction.

---

## What the Flywheel Is

Sessions → extraction → oracles → better sessions → more extraction → stronger oracles.

The loop is not metaphorical. Here is the exact mechanism:

1. **Agent sessions happen** — the user works with Claude Code agents. 10,875+ session JSONL transcript files across 38 project directories at `~/.claude/projects/`.

2. **Sessions contain signal markers** — specific skills print recognizable output blocks that can be extracted verbatim. These are the 6 signal types (see below).

3. **Signal gets extracted** into structured files — 7 data stores built, uploaded to Google Drive, added as sources to NotebookLM notebooks.

4. **NotebookLM notebooks become oracles** — 4 notebooks query all extracted data and answer questions about this company's intent, alignment patterns, and agent behavior.

5. **Oracle loop steers agents** — `/jonathan-check3` presents current scope to the god-mode oracle, gets back predicted user response + next action + SCOPE_COMPLETE or SCOPE_INCOMPLETE signal. Agent executes, loops until scope is done.

6. **Sessions continue → more signal** → the corpus grows → oracles improve → steering accuracy compounds.

---

## The 6 Signal Types and Their Extraction Markers

Every data store is built from a specific marker pattern in session transcripts. These markers are the extraction delimiters — without them, data is invisible to the flywheel.

| Signal Type | Marker | What It Captures |
|---|---|---|
| **Coherence checks** | `COHERENCE_CHECK` on its own line (within 8 lines of `1.` or `**1.**`) | Real-time alignment decisions: what the agent noticed, what it was uncertain about, how it resolved gaps |
| **Reflect outputs** | `## AGENT_REFLECTION` | Self-reflection from `/reflect` skill: target, location, gap, initiative, leverage, questions |
| **Align sessions** | `★ Alignment_Calibration_System_Initiated` | Full `/align` intent mapping sessions — nested intent discovery, certainty levels, agent_find results |
| **Scope declarations** | `## SCOPE_DECLARATION` / `## END_SCOPE_DECLARATION` | Agent contracts before implementation: decomposed UX intent statements, boundary, verification, certainty |
| **Work complete** | `## WORK_COMPLETE` | `/communicate-what-you-finished` outputs — UX stories brought to reality, what's incomplete, verification commands |
| **Skill sequences** | `skillInvocations` array in compactions DB | Ordered skill invocations per session from the compactions API (`alignment-harness compaction list`) |

---

## The 7 Data Stores

All files live at `docs/intent/session-intelligence/`. If the `docs/intent/session-intelligence/` folder does not exist, create it.

| File | What It Contains | Size | Google Drive ID |
|---|---|---|---|
| `coherence-checks-raw.md` | 1,132 coherence check blocks from JSONL extraction | ~1.5MB | Parts 1+2 uploaded via FileStream |
| `reflect-raw.md` | 193 `/reflect` outputs | ~540KB | Uploaded via FileStream |
| `align-raw.md` | 155 `/align` sessions | ~376KB | Uploaded via FileStream |
| `skill-sequence-corpus.md` | 68 sessions with gov score + scope + ordered skill invocations | 28KB | `<your-drive-file-id>` |
| `compaction-intent-index.md` | 534 parent/child intent pairs from all compactions | 257KB | `<your-drive-file-id>` |
| `scope-declarations-raw.md` | 20 verbatim SCOPE_DECLARATION blocks | 35KB | `<your-drive-file-id>` |
| `work-complete-raw.md` | 3 verbatim WORK_COMPLETE blocks | 9KB | `<your-drive-file-id>` |

**Format discipline is critical.** Each file uses a flat, marker-based format so NotebookLM can retrieve individual records without context overflow:

- Coherence checks: `{date} {session_id[:8]}\n{raw block}\n\n---`
- Skill sequences: `{date} {session_id[:8]}\ngov:{score}\nscope: {title}\nux: {ux_title}\nskills: skill1(xN) → skill2(xN)\n\n---`
- Compaction intents: `{date} {session_id[:8]}\nparent: {overarchingIntentTitle}\nchild: {targetUxIntentTitle}\n  • {decomposed statements}\n\n---`

---

## The 4 NotebookLM Notebooks

Source file: `docs/intent/session-intelligence/NOTEBOOK-ARCHITECTURE.md`

| Notebook | Purpose | Sources |
|---|---|---|
| **1 — Company Intent Nesting** | Answers: what are the main initiatives, how does child UX intent connect to parent strategic intent, what patterns exist across 534 sessions | compaction-intent-index.md |
| **2 — Generalist Agent Oracle** | Answers: what was the user's actual intent in session X, what alignment failures look like, what scope declarations agents make | All coherence, reflect, align, scope, work-complete files |
| **3 — Skill Sequence Prediction** | Answers: given this scope type, what skill sequence completes it, what does a completed session look like structurally | skill-sequence-corpus.md |
| **4 — God Mode (Everything)** | Answers: what would the user say, what's the next action, is this scope complete — the master oracle powering `/jonathan-check3` | All 7 data sources |

---

## The Oracle Loop — `/jonathan-check3`

The god-mode oracle loop is the payoff of the flywheel. It runs autonomously until the oracle signals the scope is done.

**Skill file:** `~/.claude/skills/jonathan-check3/SKILL.md`
**Notebook:** Notebook 4 (God Mode) — ID to be pasted into the skill file once the user creates it in NotebookLM.

**How it works:**

```
Step 1 — Present current state to oracle:
  CURRENT SCOPE: {one sentence}
  WORK DONE SO FAR: {what was built}
  GOVERNER SCORE: {N/100}
  OPEN QUESTIONS: {anything uncertain}
  → Ask: what would the user say? what's the next action? SCOPE_COMPLETE or SCOPE_INCOMPLETE?

Step 2 — Print oracle response observably

Step 3 — If SCOPE_INCOMPLETE: execute the next action, loop back to Step 1
          If SCOPE_COMPLETE: stop, present to human

Step 4 — Never silently skip a loop
```

The oracle can do this because it has access to 1,132 real alignment decisions, 193 self-reflection outputs, 155 intent mapping sessions, 68 skill sequence records, and 534 session intent pairs — all from real IX agent work. It pattern-matches across all of them to predict what the user would actually say.

---

## The 6 Operating Principles

These came from querying the principles oracle (notebook `<your-principles-notebook-id>` — make your own at https://notebooklm.google.com and load it with your own principles and session learnings, because the oracle can only answer from what you put in it) during the flywheel design session:

**1. Preserve causal DNA — extraction must be verbatim**
Paraphrased or summarized extraction destroys the signal. The oracle works because it can match against the user's actual words, corrections, and frustrations verbatim. Every extraction block must be copied literally from the transcript, not interpreted.

**2. Predictable H2 markers are the only reliable extraction delimiters**
`## AGENT_REFLECTION`, `## SCOPE_DECLARATION`, `## END_SCOPE_DECLARATION`, `## WORK_COMPLETE` — these exist specifically because regex can reliably find them. When adding new signal types, always create a new H2 marker that will appear on its own line. Never rely on prose proximity or semantic similarity for extraction.

**3. agentReasoning before compaction — signal before compression**
The extraction pipeline must run before compaction, not after. Compaction summarizes and destroys the fine-grained signal. The markers must be in the full session transcript, not the compacted version.

**4. Store in compactions, not swarm memory**
Swarm memory is unreliable across sessions. Compactions are the primary persistence layer. Any extracted signal that needs to survive across sessions must be posted to the compactions API with `alignment-harness compaction put`. Never rely on swarm memory as the canonical store.

**5. Seed + track pattern — extraction is a project, not a one-time script**
The flywheel needs a seed file for each data extraction initiative and a tracking mechanism to know what's been processed. New sessions are added continuously — the pipeline must be re-runnable and able to identify what's new since the last run.

**6. Self-correct the source, not just the output**
When an oracle response reveals a drift or misalignment, the fix is not to patch the agent's output — it's to identify which marker or data source produced the bad signal and fix the extraction rule. The flywheel self-improves by improving its inputs, not its outputs.

---

## The Gold Standard: reflect → align → greenlight

Not all signal is equal. The single highest-quality signal the flywheel can receive is the reflect→align→greenlight sequence — and it's the only type that contains explicit human validation.

Here's why this trio is categorically different:

- **`/reflect`** — the agent steps back and examines its own work against the intent. This is the agent asking "am I actually building the right thing?"
- **`/align`** — the user and agent co-construct a shared understanding of intent. Nested intent gets surfaced, named, and made specific.
- **greenlight** — the user explicitly confirms items in the intent map (green dot, ID confirmation, "yes that's right"). This is a human saying "the agent's model of my intent is correct."

The greenlight is what makes this trio irreplaceable. It's the only moment where the oracle can be certain the agent understood correctly and the user agreed. Every other signal type is agent-generated, potentially self-serving, and unconfirmed by a human. Coherence checks are user-triggered but not explicitly approved. Work-complete blocks are useful but the human didn't confirm the work matched the intent.

**Implication for the flywheel:** When you see a session with a reflect→align→greenlight sequence followed by a scope declaration and work-complete — that session is worth triple the weight of a session where the agent just ran governer and started building. Prioritize refreshing the oracle with sessions containing this sequence.

**Implication for signal design:** When adding new signal types to the flywheel, ask: "Does this contain explicit human confirmation, or just agent output?" The former feeds the oracle's confidence in predictions. The latter feeds pattern recognition but not ground truth.

---

## Signal Quality — What Degrades the Flywheel

The flywheel degrades when signal quality drops. These are the known failure modes:

**Paraphrased extraction** — copying the gist instead of verbatim text. The oracle loses the ability to match on the user's actual language. Detection: query the oracle with a known exact phrase from a session and see if it retrieves the right context.

**Marker drift** — skills change their output format without updating the extraction regex. A skill that used to print `## AGENT_REFLECTION` now prints `# Agent Reflection` — the extractor misses it entirely. Detection: run extraction and compare record counts to expected (coherence should be ~1,100+, reflect ~190+, align ~150+).

**Gap in coverage** — new sessions accumulate but extraction only ran once. The oracle is steering from stale data. Detection: check the most recent date in the data stores vs today's date. If more than 2 weeks old, run re-extraction.

**Source size overflow** — a data store grows past NotebookLM's per-source limit (~50MB). The notebook silently drops the overflow. Detection: check that all records are queryable (query for a known recent session and verify it returns).

**Wrong notebook** — an agent queries Notebook 2 (generalist oracle) when it needs Notebook 4 (god mode) for full context prediction. Detection: check which notebook ID is configured in `/jonathan-check3/SKILL.md`.

---

## How to Extend the Flywheel

When adding a new data source to the flywheel:

1. **Identify the signal** — what does an agent print to chat that captures valuable knowledge? It must be printed verbatim, not computed silently.

2. **Create a marker** — add an H2 markdown header that will appear on its own line. Example: `## LEVERAGE_ASSESSMENT`. This is the extraction delimiter.

3. **Update the skill** — modify the skill file that produces this output to print the marker before and after the block.

4. **Write the extraction script** — grep the JSONL files for the marker, extract the block, format it in the flat `{date} {session_id}\n{content}\n\n---` pattern.

5. **Run extraction** — produce the raw data store file in `docs/intent/session-intelligence/`.

6. **Upload to Google Drive** — either via the Google Drive MCP (`mcp__<your-google-drive-connector>__create_file` with `textContent` field) or via the FileStream mount at `~/Library/CloudStorage/GoogleDrive-<your-email>/My Drive/Session Intelligence/` for files > ~250KB.

7. **Add to relevant notebooks** — determine which of the 4 notebooks should have this as a source. Add via NotebookLM web UI (MCP is read-only — no add_source capability).

8. **Update NOTEBOOK-ARCHITECTURE.md** — add a row to the file table, document the purpose and which notebook it goes in. If `NOTEBOOK-ARCHITECTURE.md` does not exist, create it.

---

## Files to Know

- **NOTEBOOK-ARCHITECTURE.md** — `docs/intent/session-intelligence/NOTEBOOK-ARCHITECTURE.md` — maps 4 notebooks, their sources, Drive IDs, creation instructions
- **jonathan-check3 SKILL.md** — `~/.claude/skills/jonathan-check3/SKILL.md` — the oracle loop skill (god-mode notebook ID lives here)
- **Principles oracle** — notebook `<your-principles-notebook-id>` — 1,400+ principles from 389 sessions, query for operating principles before making architecture decisions
- **Data stores directory** — `docs/intent/session-intelligence/` — all 7 raw data files live here

---

## User Action Required

The oracle loop is not yet active because Notebook 4 (God Mode) has not been created in NotebookLM. The user must:

1. Open [notebooklm.google.com](https://notebooklm.google.com)
2. Create a new notebook
3. Add all 7 files from Google Drive as sources (see NOTEBOOK-ARCHITECTURE.md for the exact file list)
4. Copy the notebook ID from the URL
5. Open `~/.claude/skills/jonathan-check3/SKILL.md` and replace `[NOTEBOOK_ID_PENDING]` with the real ID

Until this is done, `/jonathan-check3` falls back to the jonathan-check2 notebook (`<your-jonathan-check2-notebook-id>` — make your own at https://notebooklm.google.com from your own conversation pairs, because the fallback can only predict from the words you put in it), which has 8,562 conversation pairs but not the full session intelligence.

---

## Signal Quality Hierarchy — What the Oracle Actually Depends On

Not all signals are equal. Ranked by quality, from highest to lowest:

**1. Coherence check blocks** (1,132 captured)
The crown jewel. These are captured at the exact moment of misalignment — real frustration from the user, real correction in the session. They're involuntary signal, which makes them more truthful than intentional outputs. The user said "f***" more frequently in sessions that ended in coherence failures — the system tracks this. If you had to pick one signal source to power the oracle, this is it.

**2. Compaction intent pairs** (534 captured)
The parent intent + child UX intent for every session. Tells the oracle what people were actually trying to accomplish. The strongest predictor of what a new session SHOULD be trying to accomplish.

**3. Align session outputs** (155 captured)
Full intent mapping sessions where nested intent was surfaced and validated. High signal because they contain the user's actual words describing what they wanted, at moments of deliberate clarity.

**4. Reflect outputs** (193 captured)
Self-reflection moments — the agent stepping back and examining its own work. These surface what the agent modeled as the gap, the target, and the leverage. Useful for understanding agent reasoning quality over time.

**5. Skill sequences** (68 sessions captured)
Context + governer score + ordered skill invocations. The only signal type that enables NEXT-ACTION PREDICTION. Without this, the oracle can say "the user would say X" but not "therefore do Y."

**6. Scope declarations** (20 captured)
Agent contracts before implementation. Useful for auditing whether what was scoped matched what was built.

**7. Work complete blocks** (3 captured)
Completion summaries. Lowest count because the skill isn't invoked consistently. Each one is high quality; coverage is the gap.

---

## Known Signal Gaps — Markers Missing from High-Signal Skills

These skills produce valuable output but their content is invisible to the flywheel because they lack extraction markers. Verified by researcher audit (2026-05-04):

| Skill | Signal Type | Gap | Recommended Fix |
|---|---|---|---|
| `/jonathan-check2` | Oracle predictions + challenge list | Uses emoji separator lines, no `##` H2 marker | Add `## JONATHAN_CHECK` / `## END_JONATHAN_CHECK` |
| `/jonathan-check3` | Oracle loop responses + SCOPE_COMPLETE signals | Uses emoji separator lines, no `##` H2 marker | Add `## JONATHAN_CHECK_V3` / `## END_JONATHAN_CHECK_V3` |
| `/decompose` | Decomposed UX intent statements + confidence scores | Has `★ Decomposition_Engine_Initiated` opener but no closing output block | Add `## DECOMPOSITION_OUTPUT` / `## END_DECOMPOSITION_OUTPUT` |
| `/insight` | Notebook query responses | Verbatim oracle responses printed but no `##` marker | Add `## ORACLE_QUERY` / `## END_ORACLE_QUERY` |

**Impact of these gaps:** Every check2 prediction, every check3 loop iteration with SCOPE_COMPLETE, every decomposed UX statement, and every insight notebook response is currently lost. These are the 4 highest-frequency, highest-quality outputs in the system that the oracle doesn't yet see.

---

## Oracle Cadence — The Refresh Problem

**The oracle does not auto-refresh.** This is the most operationally dangerous gap in the system.

When new sessions happen — and they happen every day — the new coherence checks, reflect outputs, and skill sequences are NOT automatically added to the NotebookLM notebooks. The oracle continues to steer from stale data unless someone manually:

1. Re-runs extraction scripts on the new JSONL files
2. Uploads updated data stores to Google Drive (replacing or appending to the existing files)
3. Re-syncs the notebook sources (or replaces the source file in NotebookLM)

**Refresh cadence recommendation:**
- Weekly for high-frequency signals (coherence checks, skill sequences)
- Monthly for lower-frequency signals (align sessions, work complete)
- After any major alignment correction session (same day)

**How to know when the oracle is stale:** Query it for a known recent session by date. If it can't retrieve anything from the last 2 weeks, the data stores need refreshing.

**The extraction scripts live at:** `docs/intent/session-intelligence/` — re-run the build scripts against the JSONL files, upload the updated files to the same Google Drive locations (same IDs), and the notebooks will use the new versions on next query.

---

## The Flywheel as a Template — Building Flywheels for Other Domains

The IX alignment flywheel is a working specimen of a general-purpose pattern. This section teaches you to extract that pattern and apply it to any domain.

### The Universal Flywheel Pattern

```
1. Identify what knowledge matters in your domain
   → What information, if captured from every session, would make future sessions better?
   
2. Design the signal events
   → What moments produce that knowledge? (alignment corrections, closing decisions, 
     evaluation outputs, customer reactions, pricing negotiations, etc.)
   
3. Create extraction markers
   → What H2 header will appear when each signal event fires?
   → Rule: must be on its own line, must be unambiguous, must wrap the full output block
   
4. Build the extraction pipeline
   → Grep the session transcripts for markers
   → Format into flat, marker-delimited data stores
   → Upload to oracle (NotebookLM or equivalent)
   
5. Wire the oracle loop
   → Define the oracle query: current state + what matters → predicted next action
   → Loop until the oracle signals the session goal is achieved
   
6. Maintain the signal
   → Refresh cadence
   → Marker coverage audit
   → Signal quality monitoring
```

### What Makes a Good Signal Event

A signal event is worth capturing if:
- It contains knowledge a future agent couldn't easily reconstruct from context alone
- It happens recurrently (the same type of event fires across many sessions)
- Its content is specific enough to be useful (not generic, not always the same)
- Capturing it doesn't meaningfully slow down the primary session

A signal event is NOT worth capturing if:
- It's always the same text (no variance = no learning)
- It requires the agent to stop and generate summary content (interrupts the session)
- It duplicates information already persisted to a database

### Example Domains Where This Pattern Applies

| Domain | High-Signal Events | Extraction Marker |
|---|---|---|
| **Sales** | Pricing objection + resolution, competitor comparison, deal structure decisions | `## DEAL_DECISION` |
| **Customer support** | Escalation decisions, root cause determinations, resolution patterns | `## RESOLUTION_PATTERN` |
| **Coaching quality** | Session turning points, breakthrough moments, technique evaluations | `## COACHING_ASSESSMENT` |
| **Product development** | Scope change decisions, design tradeoffs, user feedback interpretations | `## PRODUCT_DECISION` |
| **Financial analysis** | Model assumptions, scenario interpretations, risk flags | `## ANALYSIS_JUDGMENT` |

### What This Case Study Teaches

The IX flywheel reveals three non-obvious things about flywheel construction:

**1. Involuntary signal beats intentional signal**
The coherence check is the most valuable signal because it's captured at the moment of friction — not curated afterward. When designing a new flywheel, find the moments of friction in your domain. Those are your highest-quality signal events, not the structured summary outputs.

**2. The oracle's confidence depends on marker precision**
A vague marker produces noisy retrieval. `COHERENCE_CHECK` near a numbered list is precise. A `## NOTES` block with mixed content is not. The more precisely the marker identifies the specific type of knowledge, the higher the retrieval quality.

**3. Frequency of extraction is a design decision**
The IX flywheel extracts from JSONL transcripts. This means extraction requires a pipeline run, not live capture. For some domains, real-time persistence to a database (like the Intent DB) is more appropriate than batch extraction. The choice depends on how quickly the knowledge needs to be queryable.

---

## Signal Quality Audit Procedure

Run this when you suspect oracle quality has degraded, or after 2+ weeks without extraction:

```
1. Check marker counts
   grep -c "COHERENCE_CHECK" /path/to/new-sessions/*.jsonl
   → Expected: ~3-5 per session. If 0, the coherence gate hook may have stopped firing.

2. Check date coverage
   → Query oracle: "What happened in the session from [last week's date]?"
   → If it returns nothing, data stores are stale.

3. Check signal variance
   → Run a sample extraction of the last 20 sessions
   → Are coherence checks still varied? Or does the same text appear repeatedly?
   → Low variance = the skill is producing templated output, not authentic signal.

4. Check marker integrity
   → Did any skill updates remove or rename the markers?
   → Search the skill files for the expected marker strings.

5. Check notebook source size
   → In NotebookLM, confirm each source file is < 50MB
   → Large files may be silently truncated by NotebookLM's per-source limit.
```

---

## Related Skills

- **`/jonathan-check3`** — the oracle loop this flywheel powers. Use for autonomous steering and completion gates on high-stakes work.
- **`/jonathan-check2`** — one-shot user response prediction. Use before presenting work to the human.
- **`/reflect`** — produces `## AGENT_REFLECTION` blocks. Every reflect output feeds the flywheel.
- **`/align`** — produces `★ Alignment_Calibration_System_Initiated` blocks. Every align session feeds the flywheel.
- **`/declare-scope`** — produces `## SCOPE_DECLARATION` / `## END_SCOPE_DECLARATION` blocks. Every scope declaration feeds the flywheel.
- **`/communicate-what-you-finished`** — produces `## WORK_COMPLETE` blocks. Every completion feeds the flywheel.
- **`/governer`** — scores tasks. Gov scores are recorded in compactions and extracted into the skill-sequence-corpus.
- **`/insight`** — queries the 8 NotebookLM notebooks. Each `/insight` query should eventually feed back into the flywheel once `## ORACLE_QUERY` markers are added.
- **`/decompose`** — produces UX intent statements. Once `## DECOMPOSITION_OUTPUT` markers are added, every decompose output feeds the flywheel.
