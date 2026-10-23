---
name: pipeline-compliance-audit
description: Stage 10 of the observable pipeline. Audits every prior stage's output for every item in the batch — verifying that /align was invoked, agent_find ran, jonathan-check2 queried the oracle, /decompose converted verified findings into tasks, verification commands produced real output, proposals are zero-jargon, and reports have Mermaid diagrams and admin checkboxes. Outputs 09-compliance.md with per-stage PASS/FAIL. BLOCKS completion if any stage has FAIL. Designed to be invoked every 5 minutes by a compliance agent during a live pipeline run.
triggers:
  - "/pipeline-compliance-audit"
  - "compliance audit"
  - "audit pipeline stages"
  - "stage 10"
  - "check pipeline compliance"
  - "did every item go through every stage"
  - "pipeline gate"
---

# Pipeline Compliance Audit — Stage 10

## Why This Exists

In v1 of the observable pipeline, `jonathan-check2` ran on 5 of 31 items — not every one. `/align` was not invoked per-item. Several stage requirements were skipped silently, and nothing caught it. The pipeline produced output that looked complete but wasn't. The admin couldn't tell which items had actually gone through which gates and which had slipped through.

This skill exists so that skipping a stage is not just wrong — it is **impossible to miss**. Every item, every stage, every requirement. Before anything is marked "ready for review," this audit must pass.

---

## What This Audits (The 9-Stage Checklist)

Every item in the run must be checked against every stage. The audit is not complete until every item has a row in the output and every row has a verdict.

### Stage 1: Align

The Align agent applies `/align` to the raw signal. It separates what was observed from what was imagined. It traces the source so a following agent can read the original.

**Requirements — every item must have ALL of these:**

- [ ] **certainty dots present** — every claim is followed by a dot and a percentage. Format: `{claim} 🔴/🟡/🔵/🟣 {id} {pct}%`. No bare assertions without dots.
- [ ] **imagined vs observed separated** — the output explicitly labels which statements are "Noticing" (observed) vs "Imagining" (inferred/predicted). These are never blended.
- [ ] **agent_find (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`) ran at least once** — the output includes a visible `agent_find` result block or explicitly states "agent_find returned no results for [query]." Silent skipping is a FAIL.
- [ ] **source traced** — a source path, artifact ID, or document link is present that an agent in Stage 2 can actually open and read. "Observation" without a traceable source = certainty ceiling 70% maximum.
- [ ] **key uncertainty identified** — the one question that would most reduce uncertainty is named explicitly.

**FAIL conditions:**
- Any claim written as a bare fact (no dot, no %)
- "Observing" and "Imagining" sections are merged or absent
- No evidence that agent_find was called
- Source is described but not linked or pathed

---

### Stage 2: Research

The Research agent runs agent_find with decomposed sub-queries to build institutional context before the governer scores the claim.

**Requirements — every item must have ALL of these:**

- [ ] **agent_find results included** — at least one agent_find query result is quoted or summarized in the output. The query string itself must be visible.
- [ ] **institutional context documented** — what past sessions, compactions, or swarm memory said about this domain is noted, even if the answer was "nothing relevant found."
- [ ] **sub-queries decomposed** — if the claim has multiple aspects, agent_find was called on sub-aspects separately, not just on the full claim as one blob.
- [ ] **certainty impact noted** — the research output states how the findings shifted (or didn't shift) the agent's certainty relative to Stage 1.

**FAIL conditions:**
- agent_find not called at all
- Research section present but contains no actual retrieved results — just the agent's own reasoning
- No acknowledgment of what institutional knowledge did or didn't exist

---

### Stage 3: Score

The Score agent invokes `/governer` on the claim. Not rebuilds it. Calls it. The full governer output is captured visibly.

**Requirements — every item must have ALL of these:**

- [ ] **touchesUserState gate ran** — the output explicitly shows whether `touchesUserState` is true/false and which impact tier was assigned (indirect / config / communication / revenue). If this was skipped, the score is invalid.
- [ ] **SILA scored** — all 9 SILA dimensions (V1–V9) appear in the output with scores and brief reasoning. A table or list is acceptable. Missing dimensions = FAIL.
- [ ] **Adaptive Meta scored** — all 3 adaptive meta dimensions (Agentic Compounding, Hallucination Propagation, Existing Wins at Stake) appear with scores.
- [ ] **depth routing assigned** — the output explicitly states which depth was assigned: `skip`, `quick`, `moderate`, or `full`.
- [ ] **unified score stated** — a single unified score (0–100) is present and traceable to the above inputs.
- [ ] **"impact IF TRUE" framing** — the scoring assumes the claim is accurate and notes this explicitly. It does not treat unverified claims as confirmed.
- [ ] **found-something-worse check** — the output either flags a higher-priority concern discovered during scoring, or explicitly states "no higher-priority concern identified during scoring."

**FAIL conditions:**
- touchesUserState absent or not explicitly stated
- Fewer than 9 SILA dimensions present
- Adaptive Meta missing
- Score present but no derivation visible (score stated without the inputs that produced it)
- Depth not assigned

---

### Stage 4: Verify

The Verify agent invokes `/investigate-error` at the depth the score prescribed. It runs actual commands and reports actual output.

**Requirements — every item must have ALL of these:**

- [ ] **actual commands with actual output** — every verification step shows the exact command run AND the exact output received. Summaries of what the command "would show" are not acceptable. The raw output (or a clearly marked excerpt) must appear.
- [ ] **observation / inference / prediction separated** — the output labels which statements came directly from command output (observation), which were derived from that output (inference), and which are forward-looking (prediction). These must be distinct labeled sections.
- [ ] **negative check done** — for items scored 60 or above, the output includes a "what would I expect to see if this claim were completely false?" check, run as an actual command or query, with the result reported.
- [ ] **depth honored** — the depth of investigation matches what Stage 3 assigned. A `full` depth item without browser-level verification (when UX-facing and score 80+) is a FAIL.
- [ ] **emergent findings captured** — any discovery during verification that wasn't in the original claim is explicitly flagged as an emergent finding. "Nothing new found" is acceptable — silence is not.
- [ ] **correct environment** — verification ran against Atlas (mongodb+srv://) not localhost. Any localhost reference in a verification command for a production claim = FAIL.

**FAIL conditions:**
- Commands listed without output
- "I verified by reading the code" without showing the actual code read
- Negative check absent for score ≥ 60
- Browser verification absent for score ≥ 80 + UX-facing
- localhost in verification for production claim

---

### Stage 5: Cross-Verify

An independent agent — different from the Stage 4 agent — re-examines the evidence with a fresh context. This stage exists specifically to catch Stage 4 rubber-stamping.

**Requirements — every item must have ALL of these:**

- [ ] **independent agent context** — the cross-verifier states it has received only the Stage 3 handoff block and Stage 4 evidence, not the full prior conversation. It does not have access to the Stage 4 agent's reasoning chain.
- [ ] **different from Stage 4 agent** — the cross-verifier is explicitly a different agent instance. An agent cannot cross-verify its own Stage 4 work.
- [ ] **evidence re-examined independently** — the cross-verifier reads the actual sources cited in Stage 4 independently, not just reads Stage 4's interpretation of them.
- [ ] **agreement or disagreement stated** — the cross-verifier explicitly states whether it agrees or disagrees with Stage 4's verdict, and on which specific claims.
- [ ] **any disagreement blocks Stage 6** — if the cross-verifier disagrees on any claim, that item must go back to Stage 4 for resolution before Stage 6 can proceed.

**FAIL conditions:**
- Same agent running Stage 4 and Stage 5
- Cross-verifier has access to Stage 4 reasoning (not truly independent)
- Cross-verifier output says "I agree" without showing independent evidence examination
- Disagreement noted but item advanced to Stage 6 anyway

---

### Stage 6: Jonathan-Check

The oracle is queried via `jonathan-check2` to predict the user's reaction to the evidence and proposed framing before it becomes a proposal. This stage runs on **every item** — not just high-score items, not just contested items. Every item.

**Requirements — every item must have ALL of these:**

- [ ] **oracle queried** — `nlm notebook query <your-notebook-id>` was called with the item's evidence and proposed framing. The actual CLI command or MCP call must be visible. (Setup: make your own notebook at https://notebooklm.google.com and load it with your own real agent↔user conversations, because this oracle can only predict the person whose real words it holds.)
- [ ] **question logged** — the exact query sent to the oracle is present in the output. Not a paraphrase — the literal query string.
- [ ] **answer logged** — the oracle's full response is included or quoted at sufficient length to be auditable. "The oracle said it looks good" is not a logged answer.
- [ ] **predicted challenges listed** — the oracle's predicted challenges are extracted and listed as a numbered checklist.
- [ ] **actions taken logged** — for each predicted challenge: either (a) evidence shown that addresses it, (b) a fix made before advancing, or (c) an honest statement that it's not applicable with reasoning. Unaddressed challenges = FAIL.
- [ ] **jonathan-check2 depth honored** — the structured prediction format was used for items scored 60+ (TASK / AGENT OUTPUT / EVIDENCE PROVIDED / ASSUMPTIONS MADE all present in the query).

**FAIL conditions:**
- jonathan-check2 not run at all (this was the v1 failure — 5/31 items)
- Oracle queried but question or answer not logged
- Predicted challenges listed but not addressed
- Abbreviated query format used for score ≥ 60 item

---

### Stage 7: Decompose

The Decompose agent runs /decompose on a finding that has been verified, cross-verified, and oracle-validated. It prints a reasoning document before any tasks are created, and waits for human approval before TaskCreate runs.

**Requirements — every item must have ALL of these:**

**07-decompose.md** — Stage 7 (Decompose)
- [ ] Reasoning document printed with: verbatim intent, perfect realization, current reality, gap, approach?
- [ ] Verbatim intent preserved word-for-word (not summarized)?
- [ ] Current reality verified by code read (not assumed)?
- [ ] Each task independently scoreable (not batched)?
- [ ] Human approved reasoning before tasks created?

**FAIL conditions:**
- Reasoning document absent or produced after TaskCreate ran
- Intent paraphrased instead of copied verbatim
- Current reality described without a code read to verify it
- Multiple tasks submitted to /governer as a single batch
- No evidence of human approval before task creation

---

### Stage 8: Propose

The Propose agent produces a decision document using the REPORT-TEMPLATE.md structure. It translates everything into zero-jargon human language.

**Requirements — every item must have ALL of these:**

- [ ] **follows TEMPLATE.md structure** — the proposal matches the fields defined in `<api-repo>/docs/intent/experiments/process-actionables/REPORT-TEMPLATE.md`. Check: YAML frontmatter, Pipeline Progress section, Admin Actions section, /align section, Stage sections with proper callout blocks.
- [ ] **zero jargon in human section** — the "What is actually happening to real people" section contains no variable names, no code references, no technical acronyms without plain-English explanation. Test: could a non-coder read this and know exactly what's happening to whom?
- [ ] **certainty dots present** — every claim in the proposal carries a dot and percentage. Same format as Stage 1.
- [ ] **scope-stop explicit** — the proposal says explicitly what it does NOT fix — what's left for separate work. This is never omitted.
- [ ] **risk in UX terms** — if the fix could fail, the proposal describes what a real person would experience if it fails. Not technical risk — UX risk.
- [ ] **verified claim used** — if Stage 3 verification changed the scope or numbers from the original claim, the proposal leads with the verified version and states the divergence from the original.
- [ ] **admin questions pre-answered** — what does this fix, who does it affect, what could go wrong, how would I know it worked, what's not covered — all present.

**FAIL conditions:**
- Missing YAML frontmatter or wrong fields
- Jargon in the human-facing section (variable names, acronyms, code paths)
- No certainty dots
- Scope-stop absent
- Proposal uses original claim numbers after Stage 3 changed them

---

### Stage 9: Report

The Report produces a consolidated, admin-readable summary of all items in the batch.

**Requirements — every item must have ALL of these:**

- [ ] **Mermaid diagram** — a pipeline progress diagram using the format from REPORT-TEMPLATE.md. Colors: green = complete, amber = in-progress, gray = pending, red = failed. The diagram must reflect the actual state of each stage for this item — not a generic template.
- [ ] **admin checkboxes** — the Admin Actions block is present with checkboxes: Approve / Reject / Revise / Implement / Merge. These are not filled in — they are blank, waiting for admin input.
- [ ] **all evidence linked** — every claim in the Report links back to the stage output that produced it. A claim without a stage citation = unverifiable.
- [ ] **per-item status** — for a batch Report, every item in the batch appears with its current pipeline status. No item is silently omitted.
- [ ] **stuck items flagged** — any item that stalled at a stage (didn't advance within expected time or is incomplete) is called out explicitly with which stage it's stuck at.

**FAIL conditions:**
- No Mermaid diagram
- Mermaid diagram is the blank template (not updated to reflect actual state)
- Admin checkboxes absent
- Evidence cited without links to source stage files
- Items in the batch absent from the Report

---

## Per-Item Governer Contract Enforcement

This section is **in addition to** the 9-stage checklist above — not a replacement for it. The 9-stage checklist verifies that every pipeline stage ran and produced the required artifacts. This section verifies that the governer's own prescriptions for THIS item's complexity were honored as verifiable stages.

### How to Determine What Was Required

Read the item's governer score from its stage 3 output file:

```bash
# Score is in the unified score line of the stage 3 file:
grep -i "unified score\|score:" $RUNDIR/02-score.md | head -5

# touchesUserState determination:
grep -i "touchesUserState\|user state\|impact tier" $RUNDIR/02-score.md | head -5
```

### Score-Based Requirements

Each threshold is **cumulative** — score 80 requires everything in the 70, 60, and 50 tiers as well.

---

#### Score >= 50: Written Plan or Decompose Output Required

**What to check:**

- [ ] **07-decompose.md exists and is non-trivial** — a reasoning document (not a stub) showing verbatim intent, gap analysis, and proposed approach. OR an equivalent plan artifact exists and is linked.
- [ ] **Tasks were not created before decompose ran** — if TaskCreate evidence predates the decompose reasoning document, that's a FAIL regardless of the document's existence.

**FAIL conditions:**
- `07-decompose.md` absent when score >= 50
- Decompose document is a one-liner or template placeholder
- Tasks exist with creation timestamps earlier than the decompose reasoning document

---

#### Score >= 60: Independent Evaluator Required

**What to check:**

- [ ] **05-cross-verify.md produced by a different agent** — the Stage 5 cross-verify file must exist (this overlaps with the Stage 5 checklist, but here the additional requirement is that the score explicitly triggered it — it cannot be waived)
- [ ] **Evaluator explicitly states what governer score it received** — the cross-verifier must show it was given the Stage 3 handoff block and knew the score was >= 60
- [ ] **Evaluator ran at least one independent verification command** — for score >= 60, the cross-verifier cannot simply read Stage 4's output and agree. It must independently re-run at least one command and show its own output.

**FAIL conditions:**
- `05-cross-verify.md` missing when score >= 60 (double-fail: Stage 5 checklist AND this gate)
- Cross-verifier does not state the governer score it was handed
- Cross-verifier shows no independent command output — only reads Stage 4 output and agrees

---

#### Score >= 70: Human Gate Required

**What to check:**

- [ ] **Approval evidence present before Stage 7 (Decompose) ran** — explicit evidence that a human reviewed and approved the reasoning document before any implementation or task creation. This can be a logged approval message, a task status change to "Approved," or a documented confirmation in the pipeline run artifacts.
- [ ] **Approval is not agent-self-certification** — "I determined this meets the bar" is not a human approval. The evidence must be traceable to a human action (message, UI click, explicit confirmation in the run log).

**FAIL conditions:**
- Score >= 70 with no human approval artifact present
- Approval artifact is an agent statement about the human approving (not actual human approval evidence)
- Approval timestamp appears after implementation or TaskCreate ran

---

#### Score >= 80: Browser/UX Verification Required

**What to check:**

- [ ] **05.6-ux-verify.md exists** — a UX verification artifact from the `/pipeline-ux-verify` skill or equivalent browser-level verification. This is not a code read — it's a running browser interaction with real output.
- [ ] **Verification ran against the live app, not test mocks** — the UX verify output must reference a running server (localhost with the server active, or a deployed URL). Mock-only verification = FAIL.
- [ ] **At least one negative case verified** — the UX verify must show what a user who should NOT see the behavior does NOT see it. Positive-only UX testing for score >= 80 = FAIL.

**FAIL conditions:**
- `05.6-ux-verify.md` absent when score >= 80
- UX verify artifact exists but references only test output, not actual browser/server interaction
- No negative case (what a non-qualifying user sees) in the UX verify output

---

#### touchesUserState = true: UX Impact Traced End-to-End

**What to check** (regardless of score, whenever touchesUserState was resolved to `true`):

- [ ] **UX impact traced in proposal (Stage 8)** — the proposal explicitly names: who is affected (which user type/state), what they currently experience, what they will experience after the fix, and what they would experience if the fix fails (fail-open/fail-closed behavior)
- [ ] **Fail-open/fail-closed behavior explicitly stated** — for any feature gate or conditional: what does a user get when the code fails? This is never omitted for touchesUserState items.
- [ ] **Impact tier from Stage 3 referenced in Stage 8 proposal** — the proposal must echo the impact tier (indirect / config / communication / revenue) assigned in Stage 3. A revenue-tier item that proposes a non-revenue UX outcome has drift and is a FAIL.

**FAIL conditions:**
- touchesUserState was true but Stage 8 proposal has no UX impact section
- Fail-open/fail-closed behavior absent from proposal
- Impact tier from Stage 3 contradicts or is absent from Stage 8 proposal

---

#### Governer Dimension-Specific Validation Types

Beyond the unified score thresholds, individual governer dimensions drive SPECIFIC types of validation. Read these from the Stage 3 score file's SILA breakdown and adaptive meta-assessment.

**Impact Tier → Validation Type:**

| Impact Tier (from touchesUserState) | Required Validation | Agent Type |
|---|---|---|
| `revenue` (payment, billing, subscription) | Full payment flow verification: multiple sonnet agents in browser testing checkout, webhook, access grant | 2-3 sonnet agents |
| `communication` (emails, notifications, in-app copy) | Message rendering verification: sonnet agent confirms message appears correctly to recipient | 1 sonnet agent |
| `config` (feature flags, segmentation, settings) | State verification: haiku agents confirm flag/config state is applied correctly | 1-2 haiku agents |
| `indirect` (analytics, admin dashboards, research) | Data accuracy check: verify the output matches source data | 1 haiku agent or code read |

**Adaptive Meta-Dimensions → Extra Requirements:**

| Dimension | Score | Extra Requirement |
|---|---|---|
| Hallucination Propagation | >= 8 | Double cross-verification: TWO independent agents (not one) verify the claims |
| Existing Wins at Stake | >= 8 | Regression verification: confirm current working behavior is preserved BEFORE and AFTER any change |
| Agentic Compounding | >= 8 | Downstream impact trace: identify all systems that consume this output and verify they handle the change |

**SILA Dimensions → Proportional Depth:**

| SILA Dimension | Score | Implication for Verification |
|---|---|---|
| V2 Pain Severity | >= 8 | User experience impact is severe — UX verify stage MUST include the pain scenario |
| V6 Compounding Rate | >= 8 | Error compounds rapidly — verify with negative cases (what happens if this is wrong?) |
| V9 Reach Multiplier | >= 8 | Affects many users — test with multiple user states (guest, free, trial, paid, admin) |

**How to check:** Read the full SILA table and adaptive meta-assessment from the item's `02-score.md`. For each dimension scoring >= 8, verify the corresponding extra requirement was met. Report as additional rows in the governer contract table.

**FAIL conditions:**
- Revenue-tier item lacks payment flow browser verification
- Hallucination Propagation >= 8 but only one cross-verifier ran
- Existing Wins at Stake >= 8 but no regression check documented
- Pain Severity >= 8 but UX verify doesn't include the pain scenario

---

### How to Report Governer Contract Enforcement in 09-compliance.md

Add a dedicated block per item after its stage checklist table:

```markdown
### Governer Contract Enforcement — {item title}

**Governer score:** {N} (from 02-score.md)
**touchesUserState:** true / false
**Impact tier:** {indirect / config / communication / revenue}

| Threshold | Requirement | Status | Gap (if FAIL) |
|-----------|-------------|--------|---------------|
| Score >= 50 | Written plan / 07-decompose.md non-trivial | ✅ PASS / ❌ FAIL | {gap} |
| Score >= 50 | Decompose ran before TaskCreate | ✅ PASS / ❌ FAIL | {gap} |
| Score >= 60 | Independent evaluator (05-cross-verify.md) | N/A / ✅ PASS / ❌ FAIL | {gap} |
| Score >= 60 | Cross-verifier states governer score | N/A / ✅ PASS / ❌ FAIL | {gap} |
| Score >= 60 | Cross-verifier ran independent command | N/A / ✅ PASS / ❌ FAIL | {gap} |
| Score >= 70 | Human approval before implementation | N/A / ✅ PASS / ❌ FAIL | {gap} |
| Score >= 70 | Approval traceable to human action | N/A / ✅ PASS / ❌ FAIL | {gap} |
| Score >= 80 | Browser/UX verify (05.6-ux-verify.md) | N/A / ✅ PASS / ❌ FAIL | {gap} |
| Score >= 80 | UX verify against live app (not mocks) | N/A / ✅ PASS / ❌ FAIL | {gap} |
| Score >= 80 | Negative case in UX verify | N/A / ✅ PASS / ❌ FAIL | {gap} |
| touchesUserState | UX impact traced in Stage 8 proposal | N/A / ✅ PASS / ❌ FAIL | {gap} |
| touchesUserState | Fail-open/fail-closed behavior stated | N/A / ✅ PASS / ❌ FAIL | {gap} |
| touchesUserState | Impact tier consistent Stage 3 → Stage 8 | N/A / ✅ PASS / ❌ FAIL | {gap} |

**Governer contract result: PASS / BLOCK**
```

Mark rows as `N/A` when the score threshold was not reached for that requirement. A row is only graded when the threshold applies to this item's score.

### Critical Rule: Governer Contract FAILs Block the Same as Stage FAILs

A governer contract FAIL is not a secondary concern. Any FAIL in the governer contract enforcement table blocks the item from advancing — identical to a stage checklist FAIL. Include governer contract failures in the item's FAIL count and in the BLOCK message's "Most common failures" list.

---

## How to Run This Audit

### Step 1: Locate the run directory

```bash
# All runs are in:
ls <api-repo>/docs/intent/experiments/process-actionables/runs/

# Pick the run you're auditing:
RUNDIR=<api-repo>/docs/intent/experiments/process-actionables/runs/{run-id}
```

### Step 2: Identify all items in the batch

```bash
# Each run directory contains stage files for one item:
ls $RUNDIR/

# For batch runs, list all run directories:
ls <api-repo>/docs/intent/experiments/process-actionables/runs/
```

### Step 3: Check each item against each stage's checklist

For each item and each stage:

1. Read the stage file: `{run-id}/0{N}-{stage-name}.md`
2. Check every requirement in the checklist for that stage
3. Mark PASS or FAIL with a specific note for each FAIL (what's missing, where)

### Step 4: Write `09-compliance.md`

Save the compliance report to:
```
$RUNDIR/09-compliance.md
```

Or, for batch runs covering multiple items:
```
<api-repo>/docs/intent/experiments/process-actionables/runs/09-compliance-{date}.md
```

### Step 5: Block or pass

- **If any stage has FAIL for any item**: print the BLOCK message (see below) and do not mark anything "ready for review"
- **If all stages PASS for all items**: print the PASS message and the run may advance

---

## Output Format: `09-compliance.md`

```markdown
# Pipeline Compliance Audit — {run-id or batch label}
**Date:** {YYYY-MM-DD HH:MM}
**Items audited:** {N}
**Overall result:** PASS / BLOCK

---

## Item: {LP-XXX or item title}

| Stage | Requirement | Status | Gap (if FAIL) |
|-------|-------------|--------|---------------|
| 1: Align | Certainty dots present | ✅ PASS | — |
| 1: Align | Imagined vs observed separated | ✅ PASS | — |
| 1: Align | agent_find ran | ❌ FAIL | No agent_find result block in 01-notice.md |
| 1: Align | Source traced | ✅ PASS | — |
| 1: Align | Key uncertainty identified | ✅ PASS | — |
| 2: Research | agent_find results included | ❌ FAIL | 02-research.md has no quoted results, only agent reasoning |
| 2: Research | Institutional context documented | ❌ FAIL | No mention of swarm memory or prior sessions |
| 2: Research | Sub-queries decomposed | ✅ PASS | — |
| 2: Research | Certainty impact noted | ❌ FAIL | Stage 2 output doesn't state how research shifted certainty |
| 3: Score | touchesUserState gate ran | ✅ PASS | — |
| 3: Score | SILA scored (all 9) | ❌ FAIL | V3, V7, V9 absent from 02-score.md |
| 3: Score | Adaptive Meta scored | ✅ PASS | — |
| 3: Score | Depth routing assigned | ✅ PASS | — |
| 3: Score | Unified score stated | ✅ PASS | — |
| 3: Score | "impact IF TRUE" framing | ✅ PASS | — |
| 3: Score | Found-something-worse check | ❌ FAIL | Not present in 02-score.md |
| 4: Verify | Actual commands + actual output | ❌ FAIL | 03-verify.md lists commands but shows no output |
| 4: Verify | Observation/inference/prediction separated | ✅ PASS | — |
| 4: Verify | Negative check done (score ≥ 60) | ❌ FAIL | Score was 72, negative check absent |
| 4: Verify | Depth honored | ✅ PASS | — |
| 4: Verify | Emergent findings captured | ✅ PASS | — |
| 4: Verify | Correct environment (no localhost) | ✅ PASS | — |
| 5: Cross-Verify | Independent agent context | ❌ FAIL | No cross-verify stage file exists (05-cross-verify.md missing) |
| 5: Cross-Verify | Different from Stage 4 agent | ❌ FAIL | Same |
| 5: Cross-Verify | Evidence re-examined independently | ❌ FAIL | Same |
| 5: Cross-Verify | Agreement/disagreement stated | ❌ FAIL | Same |
| 6: Jonathan-Check | Oracle queried | ❌ FAIL | No 04-jonathan-check.md in this run |
| 6: Jonathan-Check | Question logged | ❌ FAIL | Same |
| 6: Jonathan-Check | Answer logged | ❌ FAIL | Same |
| 6: Jonathan-Check | Predicted challenges listed | ❌ FAIL | Same |
| 6: Jonathan-Check | Actions taken logged | ❌ FAIL | Same |
| 7: Decompose | Reasoning document printed | ❌ FAIL | No 07-decompose.md in this run |
| 7: Decompose | Verbatim intent preserved | ❌ FAIL | Same |
| 7: Decompose | Current reality code-verified | ❌ FAIL | Same |
| 7: Decompose | Tasks independently scoreable | ❌ FAIL | Same |
| 7: Decompose | Human approved before TaskCreate | ❌ FAIL | Same |
| 8: Propose | Follows TEMPLATE.md structure | ✅ PASS | — |
| 8: Propose | Zero jargon in human section | ✅ PASS | — |
| 8: Propose | Certainty dots present | ✅ PASS | — |
| 8: Propose | Scope-stop explicit | ❌ FAIL | "What this does NOT fix" section absent |
| 8: Propose | Risk in UX terms | ✅ PASS | — |
| 8: Propose | Verified claim used | ✅ PASS | — |
| 8: Propose | Admin questions pre-answered | ✅ PASS | — |
| 9: Report | Mermaid diagram | ✅ PASS | — |
| 8: Report | Admin checkboxes | ✅ PASS | — |
| 8: Report | All evidence linked | ❌ FAIL | Stage 3 claims have no links to 03-verify.md |
| 8: Report | Per-item status | ✅ PASS | — |
| 8: Report | Stuck items flagged | ✅ PASS | — |

**Item result: BLOCK**
**FAIL count: 19**
**FAIL summary:**
- Stage 1: agent_find not evidenced in notice
- Stage 2: Research section is agent reasoning only, no retrieved results
- Stage 3: 3 SILA dimensions missing, found-something-worse check absent
- Stage 4: Commands without output, negative check absent for score 72
- Stage 5: Cross-verify stage entirely missing
- Stage 6: jonathan-check2 not run (THIS IS THE v1 FAILURE — item was skipped)
- Stage 7: Decompose stage entirely missing
- Stage 8: Scope-stop section absent
- Stage 9: Evidence citations missing

---

## Batch Summary

| Item | Stages Present | FAIL Count | Result |
|------|---------------|-----------|--------|
| LP-XXX | 1,2,3,4,8,9 | 19 | BLOCK |
| LP-YYY | 1,2,3,4,5,6,7,8,9 | 0 | PASS |
| ... | ... | ... | ... |

**Items passing: {N}/{total}**
**Items blocked: {N}/{total}**
```

---

## BLOCK Message

When any item has any FAIL:

```
🚫 PIPELINE COMPLIANCE BLOCK

{N} item(s) have stage failures. Nothing in this batch can be marked "ready for review" until all FAILs are resolved.

Items blocked: {list}
Total FAILs: {N}

Most common failures:
1. {stage}: {what's missing} — {N} items affected
2. {stage}: {what's missing} — {N} items affected

To resolve:
- Return each FAIL to its stage agent with the specific gap listed
- The stage agent re-runs ONLY the failed requirements
- Re-run /pipeline-compliance-audit after fixes are applied

Do NOT advance any item past its current stage until this audit shows PASS.
```

---

## PASS Message

When all items pass all stages:

```
✅ PIPELINE COMPLIANCE PASS

All {N} items have completed all required stages with no failures.
All jonathan-check2 oracles queried. All verification commands showed actual output.
All cross-verify stages used independent agents.

This batch is ready for admin review.
```

---

## Timer Operation (5-Minute Compliance Agent)

This skill is designed to be invoked by a compliance agent on a 5-minute loop during an active pipeline run. The loop should be started with:

```
/loop 5m /pipeline-compliance-audit — check all items in the current run that have reached Stage 8 or Stage 9, verify all prior stages passed for those items, output 09-compliance.md update
```

**What the compliance agent does on each tick:**

1. Check which items have reached Stage 8 or 9 (proposal or report stage)
2. For each such item, run the full per-stage checklist
3. For any item that passes all stages: note as PASS in the compliance log
4. For any item with a FAIL: immediately output a BLOCK notification with specific gaps
5. Do not re-check items already audited and marked PASS on prior ticks (unless their files changed)
6. Update `09-compliance.md` with the current tick's findings

---

## Critical Rules

1. **Every item, every stage** — the audit is not a sample. If the batch has 31 items, 31 items get audited. The v1 failure was 5/31. This never happens under this skill.

2. **Stage 6 (jonathan-check2) is mandatory for every item** — not high-score items only, not contested items only. Every item. The oracle must be queried, the question must be logged, the answer must be logged, and every predicted challenge must be addressed.

3. **Stage 5 (Cross-Verify) cannot be skipped** — no item advances to Stage 6 without a cross-verify stage file produced by an independent agent.

4. **FAILs block the whole item** — a single FAIL in Stage 1 blocks that item from being marked ready, even if Stages 2–9 are perfect. Each stage depends on prior stages being sound.

5. **"Looks complete" is not compliance** — the audit reads the actual stage files and checks specific fields. An agent saying "I ran agent_find" without the result block present = FAIL.

6. **This audit is self-contained** — the compliance agent does not share context with the pipeline agents. It reads files only. This makes it independent.

---

## Related Skills and Files

- `/align` — the quality gate invoked at Stage 1 and after every stage's draft. Never modify it.
- `/jonathan-check2` — the oracle skill invoked at Stage 6. Every item. Not optional.
- `/governer` — invoked at Stage 3. Not rebuilt, called.
- `<api-repo>/docs/intent/experiments/process-actionables/README.md` — canonical pipeline intent document
- `<api-repo>/docs/intent/experiments/process-actionables/REPORT-TEMPLATE.md` — the template Stage 7 must follow
- `<api-repo>/docs/intent/experiments/process-actionables/DIAGNOSTICS.md` — health metrics across runs

---

## What This Skill Does NOT Do

- It does not fix failures — it identifies them and blocks advancement. The stage agent responsible for the failed requirement makes the fix.
- It does not score the quality of stage outputs — it checks for presence and format compliance. Whether the content is good is what jonathan-check2 answers.
- It does not run pipeline agents — it reads their output files.
- It does not replace Stage 5 (cross-verify) — it verifies that Stage 5 happened and was independent.

---

*This skill governs Stage 9 of the observable pipeline. Version: v1.0. Created: 2026-04-09.*
*The v1 failure context: 5/31 items had jonathan-check2 run. This makes that failure structurally impossible going forward.*
