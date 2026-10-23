---
name: user-state-intent-mapper
description: Converts a codebase domain into a complete intent map — every conditional branch mapped to a human-readable intent statement, organized as linked documents. Use when you need to understand what the codebase intends for every user state in a domain (access control, onboarding, billing, etc.).
triggers:
  - "map user states"
  - "intent map for access"
  - "map every user state"
  - "build intent map"
  - "access control intent"
  - "map conditional branches"
  - "intent map for domain"
---

# user-state-intent-mapper

## What This Does

Takes a codebase domain (e.g. "user access control", "onboarding", "billing gates") and produces a complete intent map:

- Every conditional branch in the domain → one document
- Each document: what state the user is in, what the code does, what the intent behind it is (defined / undefined / predicted)
- Documents linked to each other (state transitions, entry paths, exit paths)
- A user review summary — what needs decisions, what needs confirmation, what is already defined

The output is a folder of linked `.md` files you can navigate like a map of the domain's logic.

## When to Use

- Before building a feature that affects an existing domain — know what every state means before you change it
- When auditing whether code behavior matches documented intent
- When the domain has grown organically and nobody knows what all the branches mean
- When onboarding a new agent or developer to a domain

## When NOT to Use

- For a single file or function — read it directly
- When the domain has fewer than ~5 conditional branches — just document inline
- When you need a quick answer about one specific state — use `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` instead

---

## Invocation

```
/user-state-intent-mapper domain="user access control" files=["src/hooks/useSimulatedUserState.js", "src/utilities/isUserOnTrial.js", "src/middleware/authMiddleware.js"]
```

Parameters:
- `domain` — human name for the domain (used as folder name and in documents)
- `files` — key files to seed Stage 1 research (agent will discover more)
- `output_path` — where to write the intent map (default: `docs/intent/maps/{domain}/`)

---

## Architecture

**Orchestrator rule:** The orchestrator never does work. It dispatches specialists, collects their outputs, and routes to the next stage. Every stage is a separate agent invocation.

**Quality layers:**
1. Intrinsic — each stage has explicit evidence requirements before its output is accepted
2. Compliance — Stage 7 audits every prior stage against a per-stage checklist
3. Self-healing — when Stage 7 finds a failure, it diagnoses the root cause in the stage *design* and proposes a patch to this skill file

**Feedback rule:** Feedback is always additive. Missing X = add X. A stage that finds a gap patches forward — it does not redo prior stages.

---

## Stage Specifications

### Stage 1: Research User States
**Model:** Sonnet  
**Role:** Code archaeologist  

**Purpose:** Find every conditional branch in the domain. No interpretation yet — just enumeration.

**Input contract:**
- Domain name
- Seed file list (agent discovers more via grep/glob)

**Output contract:** A flat list. For each state:
```
State ID: S-001
Condition: user.subscriptionStatus === 'trialing'
File: src/hooks/useSimulatedUserState.js
Line: 47
Current behavior: Returns LIMITED_ACCESS tier, restricts premium features
Access tier: LIMITED_ACCESS
```

**Evidence requirements:**
- File path + line number for every state
- Actual code snippet (the condition expression, not paraphrase)
- Current behavior described in UX terms (what happens to the user), not code terms

**Failure modes prevented:**
- Skipping files (agent must grep for all conditionals, not just seed files)
- Vague behavior descriptions ("it checks something") — rejected, must be UX-specific
- Inventing states that don't exist in code

**Compliance checklist (used in Stage 7):**
- [ ] Every state has file + line number
- [ ] Every state has a quoted code snippet
- [ ] Behavior is described in UX terms (what the user experiences)
- [ ] Total state count matches grep count of conditionals in domain files

---

### Stage 2: Research Existing Intent
**Model:** Sonnet  
**Role:** Institutional knowledge reader  

**Purpose:** For each state from Stage 1, find whether intent is already defined somewhere. Do not invent. Do not guess. Only report what exists.

**Input contract:**
- Complete state list from Stage 1

**Output contract:** For each state, one of:
```
State: S-001
Intent status: DEFINED
Intent: When user is on cc_trial (Stripe trialing status, card on file), they have LIMITED_ACCESS so we can validate their card before granting full access, and they experience the product with a meaningful subset of features.
Source: docs/intent/billing/cc-trial-access.md (line 12) | CLAUDE.md Trial Type Disambiguation
```
```
State: S-003
Intent status: UNDEFINED
Source: (none found — checked Intent DB, CLAUDE.md, docs/intent/, git log messages)
```

**Evidence requirements:**
- Every DEFINED intent has at minimum one source citation (file + location, or Intent DB ID)
- Sources checked must be listed: Intent DB, CLAUDE.md, `docs/intent/`, git commit messages, memory-search.js query
- No DEFINED intent without a source

**Failure modes prevented:**
- Marking a state DEFINED when the agent just inferred the intent — inference is Stage 3, not Stage 2
- Missing sources (every DEFINED must cite where the intent lives, not just that it "seems clear")

**Compliance checklist (used in Stage 7):**
- [ ] Every DEFINED intent has a source citation
- [ ] Sources searched are listed (not just "I checked")
- [ ] No state is marked DEFINED based on code readability alone — must have a documentation source

---

### Stage 3: Query Institutional Knowledge for Gaps
**Model:** Sonnet  
**Role:** Intent predictor  

**Purpose:** For UNDEFINED states only — query NotebookLM and memory-search.js to predict what the user likely intended. These are predictions, not definitions. They must stay marked as predictions.

Setup note: this needs your own NotebookLM notebook. If you don't have one yet, make one at https://notebooklm.google.com and load it with your own principles and past session learnings, because the oracle can only ground its answers in what you put in it.

**Input contract:**
- List of UNDEFINED states from Stage 2

**Output contract:** For each undefined state:
```
State: S-003
Prediction: The user likely intended that free users without a trial see a conversion prompt immediately, not a degraded experience, based on the "commitment-first funnel" pattern (NotebookLM: coaching-principles notebook, artifact #10042).
Confidence: 72%
Needs user confirmation: YES
```

**Evidence requirements:**
- NotebookLM citation ID or memory-search.js result for every prediction
- Confidence score (0-100%) — never omit
- "Needs user confirmation: YES" on every single prediction — no exceptions

**Failure modes prevented:**
- Treating a prediction as defined intent (the most critical failure in this stage)
- High-confidence predictions being presented without their evidence source
- Skipping UNDEFINED states because "the intent seems obvious" — every undefined gets a prediction attempt

**Compliance checklist (used in Stage 7):**
- [ ] Every prediction has a source citation
- [ ] Every prediction has a confidence score
- [ ] No prediction is marked DEFINED
- [ ] "Needs user confirmation: YES" appears on every prediction entry

---

### Stage 4: Build Linked Document Tree
**Model:** Sonnet  
**Role:** Document builder  

**Purpose:** Create the physical intent map — one `.md` file per state, organized in a folder, with links between related states.

**Input contract:**
- All states from Stage 1 with their intent status from Stages 2 and 3

**Output path:** `{output_path}/{domain}/`

**Document format per state:**
```markdown
# State: S-001 — cc_trial (Limited Access)

**Intent status:** DEFINED  
**Source:** docs/intent/billing/cc-trial-access.md

## What the code does
When `user.subscriptionStatus === 'trialing'`, returns `LIMITED_ACCESS` tier.  
File: `src/hooks/useSimulatedUserState.js:47`

## What the intent says
When a user is on cc_trial (Stripe trialing status, card on file), they have LIMITED_ACCESS so we can validate their card before granting full access, and they experience the product with a meaningful subset of features.

## Transitions
**Enters from:**
- [S-000 — Free (No Trial)](./S-000-free-no-trial.md) — when user starts cc_trial
- [S-004 — cc_trial expired](./S-004-cc-trial-expired.md) — when trial lapses (reverse)

**Exits to:**
- [S-002 — Active Subscriber](./S-002-active-subscriber.md) — when trial converts
- [S-004 — cc_trial expired](./S-004-cc-trial-expired.md) — when trial lapses

## User confirmation needed
No — intent is defined.
```

**Evidence requirements:**
- `ls -R {output_path}` showing all created files
- Word count per file (must be >50 words — stub files are not acceptable)
- Link targets must exist in the same folder (no broken links)

**Failure modes prevented:**
- Creating stub files with just a title
- Missing states — every state from Stage 1 gets a document
- Broken links — every "Exits to" link must point to a file that exists

**Compliance checklist (used in Stage 7):**
- [ ] Count of .md files === count of states from Stage 1
- [ ] Every file has >50 words (no stubs)
- [ ] All internal links resolve to existing files in the folder

---

### Stage 5: Cross-Verify Transitions
**Model:** Sonnet (independent — no access to prior stage reasoning)  
**Role:** Link auditor  

**Purpose:** Verify that the transition links in the document tree are bi-directionally consistent. If State A says it exits to State B, State B must say it can be entered from State A.

**Input contract:**
- Path to the document tree folder (reads files only — no prior stage context)

**Output contract:** Per document pair:
```
Link: S-001 → S-002
S-001 says "Exits to S-002": YES
S-002 says "Enters from S-001": YES
Status: CONSISTENT

Link: S-001 → S-004
S-001 says "Exits to S-004": YES
S-004 says "Enters from S-001": NO
Status: BROKEN — S-004 is missing a reverse link
```

**Evidence requirements:**
- Every directed link in the tree must appear in the output
- Status must be CONSISTENT or BROKEN — no "probably fine"
- For every BROKEN link: the exact fix required (which file, which section, what to add)

**Failure modes prevented:**
- One-way links (exits to but never enters from)
- Orphaned states (no links in or out)
- Impossible transitions (A→B where B's conditions exclude A's exit conditions)

**Compliance checklist (used in Stage 7):**
- [ ] Every directed link appears in the audit output
- [ ] All BROKEN links have a specific fix listed
- [ ] No state has zero inbound links AND zero outbound links (orphan)

**Self-healing action:** Stage 5 does not fix documents — it outputs a patch list. The orchestrator applies patches before proceeding to Stage 6.

---

### Stage 6: User Review Preparation
**Model:** Sonnet  
**Role:** Executive summary writer  

**Purpose:** Create a single summary document the user can read in 5 minutes to understand what needs their attention.

**Input contract:**
- Complete document tree (post Stage 5 patches)

**Output document:** `{output_path}/{domain}/USER-REVIEW.md`

**Document structure:**
```markdown
# {Domain} Intent Map — User Review

## Summary
- Total states mapped: N
- Defined intents (confirmed): N
- Undefined intents (need user decision): N  
- Predicted intents (need user confirmation): N

## 1. Defined Intents — Please Confirm These Are Still Correct
[One line per state with link and source]

## 2. Undefined Intents — Need Your Decision
[One paragraph per state: what the code does, why intent is unclear, proposed default assumption]

## 3. Predicted Intents — Need Your Confirmation
[One paragraph per state: prediction, confidence, evidence source, what happens if prediction is wrong]
```

**Evidence requirements:**
- Every state appears in exactly one section
- Section 2 (undefined) must include a proposed default assumption — "we don't know" is not acceptable
- Section 3 (predicted) must include consequence of being wrong

**Failure modes prevented:**
- The user can't locate what needs attention (everything buried equally)
- Undefined states with no proposed default (forces a user decision with no starting point)
- States appearing in multiple sections or no sections

**Compliance checklist (used in Stage 7):**
- [ ] Total states in all three sections === total states from Stage 1
- [ ] Every undefined state has a proposed default assumption
- [ ] Every predicted state has "consequence if wrong"
- [ ] No state appears in more than one section

---

### Stage 7: Compliance Audit
**Model:** Opus  
**Role:** Quality auditor + self-healer  

**Purpose:** Run every prior stage's compliance checklist against actual output. Produce a pass/fail matrix. For failures, diagnose root cause in stage design and propose a patch to this SKILL.md.

**Input contract:**
- All stage outputs (raw, not summarized)
- This SKILL.md (to read stage compliance checklists)

**Output contract:**

**Part 1 — Compliance Matrix:**
```
Stage 1 — Research User States
  [ ] Every state has file + line number: PASS (12/12)
  [ ] Every state has a quoted code snippet: FAIL (10/12 — S-007, S-011 missing snippets)
  [ ] Behavior in UX terms: PASS (12/12)
  [ ] Count matches grep: PASS

Stage 2 — Research Existing Intent
  [ ] Every DEFINED has source citation: PASS
  ...
```

**Part 2 — Self-Healing Proposals (for each FAIL):**
```
FAIL: Stage 1 — S-007, S-011 missing code snippets
Root cause in stage design: Stage 1 output contract says "actual code snippet" but does not specify minimum — agent used paraphrase for multi-line conditionals.
Proposed patch to SKILL.md Stage 1 evidence requirements: Add "For multi-line conditionals, quote the first expression and add '// (multi-line)' note. Paraphrase is never acceptable."
```

**Self-healing rule:** The compliance audit does NOT ask a human to fix things. It patches the stage design so the failure class is eliminated on next run. Self-healing proposals are formatted as git-diff-style additions to this SKILL.md.

**Evidence requirements:**
- Every checklist item from every stage must appear in the matrix
- Every FAIL has a specific root cause (not "agent error" — what in the stage design allowed this)
- Every root cause has a proposed SKILL.md patch

**Compliance checklist (this stage is self-auditing):**
- [ ] Every prior stage's checklist items appear in the matrix
- [ ] No FAIL without a root cause + patch proposal
- [ ] Patch proposals are specific enough to implement without guessing

---

## Team Configuration

| Stage | Model | Why |
|-------|-------|-----|
| 1 — Research User States | Sonnet | Code reading, grepping — fast and thorough |
| 2 — Research Existing Intent | Sonnet | Document search + citation — systematic |
| 3 — Query Institutional Knowledge | Sonnet | memory-search.js + NotebookLM queries |
| 4 — Build Document Tree | Sonnet | Writing + linking — structured output |
| 5 — Cross-Verify Transitions | Sonnet | Independent verification — must not share context with Stage 4 |
| 6 — User Review Prep | Sonnet | Summary writing |
| 7 — Compliance Audit | Opus | Complex multi-stage reasoning, self-healing proposals |

**Independent agent requirement:** Stage 5 must be a fresh agent dispatch with NO memory of prior stages. It reads only the files on disk. This prevents it from rubber-stamping links it "knows" are correct.

---

## Self-Healing Loop

Every time Stage 7 finds a FAIL and proposes a patch:

1. Orchestrator collects all patch proposals from Stage 7 output
2. Orchestrator applies patches to this SKILL.md (via Edit tool)
3. Orchestrator logs: `"SKILL.md patched — failure class '{class}' eliminated"`
4. On next invocation, Stage 7 verifies the patch was effective

This means every run of the workflow makes the workflow better. Failure classes compound down — they do not repeat.

---

## Orchestrator Script (for reference)

```
1. Parse domain + files from invocation
2. Dispatch Stage 1 agent (Sonnet): "Research all user states in domain {domain}, starting with files {files}. Output format: [Stage 1 output contract above]."
3. Collect Stage 1 output. Verify state count against grep count.
4. Dispatch Stage 2 agent (Sonnet): "For each state in [Stage 1 output], find existing intent documentation. Output format: [Stage 2 contract]."
5. Collect Stage 2 output.
6. Extract UNDEFINED states. Dispatch Stage 3 agent (Sonnet): "For these undefined states, query memory-search.js and NotebookLM to predict user intent. Output format: [Stage 3 contract]."
7. Collect Stage 3 output.
8. Dispatch Stage 4 agent (Sonnet): "Build linked document tree at {output_path} for all states. Use Stages 1-3 output. Output format: [Stage 4 contract]."
9. Collect Stage 4 output. Verify file count === state count.
10. Dispatch Stage 5 agent (Sonnet, FRESH — no prior context): "Read files in {output_path} and audit all transition links. Output format: [Stage 5 contract]."
11. Apply Stage 5 patches to document files.
12. Dispatch Stage 6 agent (Sonnet): "Write USER-REVIEW.md at {output_path}."
13. Dispatch Stage 7 agent (Opus): "Audit all stage outputs against compliance checklists in this SKILL.md. Output compliance matrix + self-healing patches."
14. Apply Stage 7 patches to this SKILL.md.
15. Report to user: path to intent map, USER-REVIEW.md location, Stage 7 summary.
```

---

## Output

When complete, tell the user:

- Path to the intent map folder
- Path to USER-REVIEW.md
- Count: N states mapped, N defined, N undefined, N predicted
- Any Stage 7 patches applied to this skill file (so they know the workflow improved)
