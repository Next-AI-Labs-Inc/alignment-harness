---
name: workflow-factory
description: "Fully autonomous workflow production system. Takes any objective + seed, produces a verified self-healing workflow document. Uses agent_find, /insight, /jonathan-check2 for autonomous alignment. Self-heals on failure — patches its own stage designs when auditors catch errors. The factory that builds workflows IS a self-healing workflow."
triggers:
  - "/workflow-factory"
  - "build a workflow for"
  - "create a workflow for"
  - "design a pipeline for"
  - "I need a workflow that"
---

# Workflow Factory — Autonomous Workflow Production System

## What This Is

A fully autonomous system that takes ANY objective and produces a verified, self-healing workflow document. No human hand-holding required. The factory uses institutional knowledge (agent_find, /insight), the user response oracle (/jonathan-check2), and self-reflection (/reflect) to maintain alignment without human intervention.

**The factory IS a self-healing workflow.** Every stage has an agent producing output and another agent auditing that output. Failures get caught, fixed, AND traced back to the factory's own design — which gets patched so the failure can't recur.

## When to Use

- You have a confirmed sub-seed and need a workflow to execute it
- You need to produce workflows for multiple domains in parallel
- You want to throw an objective at a system and get a production-ready workflow back
- The domain is unfamiliar and you need the factory to LEARN what failure modes apply

## When NOT to Use

- Single-agent tasks (use /governer directly)
- The workflow already exists (use it, don't rebuild it)
- You need human alignment first (use /align, THEN feed the confirmed seed to this factory)

---

## The Factory Pipeline

The factory has 6 phases. Each phase has a PRODUCER and a CHECKER. The checker audits the producer's output before the next phase begins. If the checker finds a problem, the producer revises AND the factory logs a self-healing patch.

```
Phase 1: FIND & UNDERSTAND
  Producer: Seed Finder
  Checker: Alignment Verifier
  
Phase 2: REFLECT & CLASSIFY  
  Producer: Work Classifier
  Checker: Classification Auditor

Phase 3: LEARN FAILURE PATTERNS
  Producer: Pattern Researcher  
  Checker: Pattern Verifier

Phase 4: DESIGN STAGES
  Producer: Workflow Designer
  Checker: Design Auditor

Phase 5: VALIDATE WITH USER ORACLE
  Producer: (Phase 4 output)
  Checker: Jonathan-Check2

Phase 6: PACKAGE & SAVE
  Producer: Document Writer
  Checker: Scope Guardian
```

---

## Phase 1: FIND & UNDERSTAND

**What happens:** The factory receives an objective (plain language). It finds the relevant seed, reads it, and states its understanding.

### Producer: Seed Finder

1. **Search for the seed.** Run agent_find with the objective keywords:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "{objective keywords}" --limit 8
   ```
   
2. **If no seed exists:** The factory STOPS and reports: "No seed found for this objective. Run /align first to create one." The factory does NOT create seeds — /align does. This separation prevents the factory from hallucinating intent.

3. **If seed exists:** Read it. Extract:
   - The objective in UX terms (what does the human get?)
   - The full scope (every question that must be answered)
   - The success metric (how do we know it's done?)
   - Any stated constraints or risks

4. **State understanding:** Print:
   ```
   FACTORY — Phase 1: FIND & UNDERSTAND
   Seed found: {path}
   Objective: {one sentence}
   Scope items: {count}
   Success metric: {from seed}
   ```

### Checker: Alignment Verifier

The checker reads the seed independently and verifies the producer's extraction:
- Did the producer capture ALL scope items? (Count them in the seed, count them in the extraction)
- Is the objective stated in UX terms (what the human gets), not agent terms (what agents do)?
- Is the success metric specific enough to verify?

**If gap found:** Producer re-reads the seed and revises. Log: `SELF-HEAL: Phase 1 — producer missed {N} scope items. Patching extraction template to enumerate scope items explicitly.`

---

## Phase 2: REFLECT & CLASSIFY

**What happens:** The factory reflects on the objective to understand what TYPE of work this is. The type determines which failure modes are most dangerous and which stages are most important.

### Producer: Work Classifier

Run /reflect on the objective. Specifically answer:

1. **What type of work is this?**
   - RESEARCH — gathering and verifying facts from external sources
   - ACTION — producing a checklist/plan that a human executes immediately
   - DESIGN — creative work that produces a system, journey, or experience
   - SYNTHESIS — combining outputs from other teams into a unified deliverable
   - IMPLEMENTATION — writing code or building something technical
   - DECISION — analyzing options and recommending one path

2. **What is the primary constraint?**
   - THOROUGHNESS — must be exhaustive and verified (regulatory research)
   - SPEED — must be done fast, lean stages (first sale sprint)
   - CREATIVITY — must explore possibilities, persona feedback (CX design, brand)
   - ACCURACY — numbers must be real, no assumptions (financial model)
   - COMPLETENESS — must cover every item, no gaps (competitive intelligence)

3. **What is the risk profile?**
   - HIGH STAKES — wrong output leads to legal, financial, or reputational harm
   - MEDIUM STAKES — wrong output wastes time but is recoverable
   - LOW STAKES — wrong output is easily corrected

4. **What existing workflows or patterns are similar?**
   Run agent_find to search for prior workflows:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "workflow {work type} {domain keywords}" --limit 5
   ```

Print:
```
FACTORY — Phase 2: REFLECT & CLASSIFY
Work type: {type}
Primary constraint: {constraint}
Risk profile: {level}
Similar workflows found: {list or "none"}
```

### Checker: Classification Auditor

Queries /insight to verify the classification:

Setup: this is the user's own NotebookLM notebook, so its ID only works on the user's account. Make your own at https://notebooklm.google.com and put its ID in place of `<your-notebook-id>`, because an oracle can only answer from the material you load into it.

```bash
nlm notebook query <your-notebook-id> \
  "What principles apply to {work type} work in the domain of {domain}? What failure patterns are most common?" \
  --profile <your-profile>
```

Cross-checks: does the institutional knowledge agree with the classification? If the Operating Mind says "regulatory research has confirmation bias as the #1 risk" and the producer classified it as THOROUGHNESS-constrained — that's consistent. If the producer classified a first-sale sprint as THOROUGHNESS-constrained — that's a misclassification.

**If misclassified:** Producer re-reflects with the /insight data. Log: `SELF-HEAL: Phase 2 — misclassified {objective} as {wrong type}. /insight surfaced {evidence}. Reclassified as {correct type}. Patching classifier to weight {signal} higher for {domain pattern}.`

---

## Phase 3: LEARN FAILURE PATTERNS

**What happens:** The factory researches what specifically goes wrong with THIS type of work. Not generic failure modes — specific ones informed by institutional knowledge.

### Producer: Pattern Researcher

Three parallel research tracks:

**Track A — Institutional Knowledge:**
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "failure hallucination error {domain keywords}" --limit 8
```
Extract: What has gone wrong before with similar work? What patterns were caught? What corrections did the user make?

**Track B — Operating Mind Principles:**
```bash
nlm notebook query <your-notebook-id> \
  "What are the most dangerous failure modes when agents do {work type} work about {domain}? What principles prevent them?" \
  --profile <your-profile>
```

**Track C — /workflow-design Case Studies:**
Read the 5 failure modes from the Pipeline Hallucination Root Cause Analysis:
1. STALENESS (47%) — proposing things that already exist or using outdated data
2. WRONG EVIDENCE (20%) — citing wrong source or misreading data
3. CONTEXT GAP (13%) — missing a global mechanism that invalidates the premise
4. CONFIRMATION BIAS (13%) — finding partial evidence and inflating it
5. SCOPE MISFRAME (7%) — solving the wrong problem

For each: is this failure mode RELEVANT to the current objective? Rate HIGH/MEDIUM/LOW/NOT APPLICABLE.

**Derive domain-specific failure modes:**
Combine all three tracks. Produce 3-7 failure modes specific to THIS objective. Each must have:
- A name
- What it looks like in this domain (specific example)
- Why it's dangerous (what happens if it's not caught)

Print:
```
FACTORY — Phase 3: LEARN FAILURE PATTERNS
Failure modes identified: {count}
1. {name} — {one sentence} [source: {which track surfaced it}]
2. ...
```

### Checker: Pattern Verifier

For each failure mode, the checker asks: "Is this real or is the producer inventing problems?"

Verification method:
- If sourced from institutional knowledge (Track A): verify the agent_find result actually says this
- If sourced from Operating Mind (Track B): verify the /insight response actually says this
- If sourced from case studies (Track C): verify the relevance rating makes sense for this domain

**If a failure mode is fabricated:** Remove it. Log: `SELF-HEAL: Phase 3 — producer fabricated failure mode "{name}" without source evidence. Removed. Patching researcher to require source citation for every failure mode.`

**If a real failure mode is MISSING:** Add it. Log: `SELF-HEAL: Phase 3 — checker found failure mode "{name}" in /insight data that producer missed. Added. Patching researcher to always query /insight for domain-specific risks.`

---

## Phase 4: DESIGN STAGES

**What happens:** The factory designs the workflow stages. Each failure mode maps to a stage that makes it structurally impossible.

### Producer: Workflow Designer

Using /workflow-design's stage library, select and configure stages:

**Stage Selection Rules (based on Phase 2 classification):**

| Work Type | Required Stages | Optional Stages | Skip |
|-----------|----------------|-----------------|------|
| RESEARCH | Align, Research, Verify, Cross-Verify, Scope Guardian, Consumption Handoff | Adversarial, Jonathan-Check | UX Verify, Decompose |
| ACTION | Align, Blocker Scan, End-to-End Journey Check, Scope Guardian | Minimum Legal Check | Adversarial, Cross-Verify |
| DESIGN | Align, Research, Persona Feedback, Adversarial, Jonathan-Check | UX Verify | Heavy Verification |
| SYNTHESIS | Align, Dependency Check, Integration, Scope Guardian, Jonathan-Check | Cross-Verify | Primary Research |
| IMPLEMENTATION | Align, Research, Build, Test, UX Verify, Scope Guardian | Code Review | Adversarial |
| DECISION | Align, Research (both options), Verify, Adversarial, Jonathan-Check | Cross-Verify | UX Verify |

**For each failure mode from Phase 3:** Map to a stage that prevents it. If no existing stage covers it, design a custom stage.

**For each stage, define:**
- Input: what this stage receives from the prior stage
- Output: what this stage produces
- Evidence requirements: what PROOF must be present (not claims — artifacts)
- Failure conditions: when to reject and route back
- Agent role: who executes this stage (model, specialization)

**Assign agent roles following /workflow-design principles:**
- Orchestrator (opus): dispatches, NEVER does work
- Specialized agents (sonnet): one per stage concern
- Lightweight checks (haiku): URL verification, format validation
- 1 item per agent for verification stages
- Sequential chaining for dependent stages, parallel for independent items

**Three quality layers (ALL required):**
1. Intrinsic design — stages structured so correct behavior is easiest
2. Compliance audit — dedicated agent checks all stage outputs
3. Self-healing loop — compliance patches stage designs on failure

Print the full workflow design.

### Checker: Design Auditor

The auditor performs THREE checks:

**Check 1 — Seed Coverage:**
For every scope item in the sub-seed: does a stage answer it?
```
Scope item: "State-by-state market map"
Mapped to: Stage 3 (Research), Track B
Status: COVERED
```
If any scope item is NOT covered → FAIL.

**Check 2 — Failure Mode Coverage:**
For every failure mode from Phase 3: does a stage prevent it?
```
Failure mode: "Staleness"
Prevented by: Stage 4 (Verify) — requires dated sources from 2026
Status: COVERED
```
If any failure mode is NOT prevented → FAIL.

**Check 3 — Principle Compliance:**
Check against /workflow-design's 12 principles:
- [ ] Feedback interpreted as additive by default (Principle 1)
- [ ] Nuance preserved, not compressed to binaries (Principle 2)
- [ ] Orchestrator never does work (Principle 3)
- [ ] Each stage shows evidence of compliance (Principle 4)
- [ ] All three quality layers present (Principle 5)
- [ ] UX verification via actual system when relevant (Principle 6)
- [ ] Consumption handoff verifies everything human touches (Principle 7)
- [ ] Decompose comes after verify (Principle 8)
- [ ] Per-item enforcement from scoring dimensions (Principle 9)
- [ ] Self-healing loop active (Principle 10)
- [ ] Pipeline can feed itself (Principle 11)
- [ ] Jonathan-check2 resolves ambiguity before escalating (Principle 12)

If any check FAILS:
1. Report the specific gap
2. Designer revises the workflow
3. Log: `SELF-HEAL: Phase 4 — design missing {check}. Patching stage selection rules to always include {stage} for {work type} workflows.`

---

## Phase 5: VALIDATE WITH USER ORACLE

**What happens:** The complete workflow design gets passed through /jonathan-check2. This is the autonomous alignment gate — no human needed.

### How to Query

Setup: this is the user's own NotebookLM notebook, so its ID only works on the user's account. Make your own at https://notebooklm.google.com and load it with your own real agent↔user conversations, because this oracle can only predict the person whose real words it holds.

```bash
nlm notebook query <your-notebook-id> \
  "TASK: Design a self-healing workflow for {objective}
WORKFLOW PRODUCED: {paste workflow summary — stages, failure modes, evidence requirements}
SEED IT FULFILLS: {paste seed scope}

Based on the 8,500+ historical conversations:
1. What would the user say first?
2. What would the user challenge or find insufficient?
3. What would the user want to see that's missing?
4. Would the user approve this for autonomous agent execution?" \
  --profile <your-profile>
```

### Interpreting the Response

| Oracle Says | Action |
|-------------|--------|
| Approval signals ("thorough", "this covers it", "good") | Proceed to Phase 6 |
| Specific challenges ("what about X?", "missing Y") | Route challenge back to Phase 4 Designer for revision |
| Structural concerns ("this is too templated", "needs more nuance") | Route to Phase 2 for re-reflection, then re-design |
| Alignment concerns ("this doesn't match the intent") | Route to Phase 1 for seed re-reading |

**Max loops:** 2 revision rounds. If still failing after 2 rounds, save the workflow with a `status: needs-human-review` tag and report what jonathan-check2 flagged.

---

## Phase 6: PACKAGE & SAVE

**What happens:** The verified workflow gets saved as a reusable document.

### Producer: Document Writer

Write the workflow document with this structure:
```markdown
---
name: {workflow-name}
domain: {domain identifier}
parent_workflow: /workflow-factory
sub_seed: {path to sub-seed}
status: designed
version: 1
date: {today}
work_type: {from Phase 2}
risk_profile: {from Phase 2}
failure_modes_count: {from Phase 3}
stages_count: {from Phase 4}
jonathan_check_passed: {true/false}
---

# Workflow: {name}

## Objective (UX Terms)
{what the human gets}

## Failure Modes
{table from Phase 3}

## Stages
{full stage descriptions from Phase 4}

## Agent Roles
{role table}

## Evidence Log Format
EVIDENCE LOG — {domain}
Stage | Item | Claim | Source | Status | Agent | Timestamp

## Self-Healing Protocol
When any stage fails:
1. Error logged with stage, failure mode, and specific evidence
2. Pattern traced to root cause in stage design
3. Stage skill patched to prevent recurrence
4. Next run cannot reproduce same failure class

## Factory Metadata
Classification: {Phase 2 output}
Failure patterns sourced from: {Phase 3 sources}
Auditor gaps found: {count from Phase 4}
Auditor gaps patched: {count}
Jonathan-check2 loops: {count}
Jonathan-check2 verdict: {summary}
```

Save to: `{venture_directory}/workflows/{domain-name}.md`

If the `{venture_directory}/workflows/` folder does not exist, create it.

### Checker: Scope Guardian

Final check:
- Every scope item from the seed appears in a stage
- Every failure mode has a prevention stage
- The evidence log format is defined
- The self-healing protocol is present
- The file is saved to the correct directory

If any check fails → route back to Document Writer.

---

## The Self-Healing Meta-Loop

The factory itself improves with every run. Here's how:

### What Gets Patched

| When This Happens | Patch This |
|-------------------|-----------|
| Phase 1 checker finds missed scope items | Phase 1 extraction template — enumerate explicitly |
| Phase 2 checker finds misclassification | Phase 2 classification rules — add the signal that was missed |
| Phase 3 checker finds fabricated failure mode | Phase 3 researcher prompt — require source citation |
| Phase 3 checker finds missed failure mode | Phase 3 research tracks — add the source that had it |
| Phase 4 auditor finds uncovered scope item | Phase 4 stage selection rules — add stage for this pattern |
| Phase 4 auditor finds uncovered failure mode | Phase 4 failure-to-stage mapping — add prevention |
| Phase 4 auditor finds principle violation | Phase 4 principle checklist — flag this for this work type |
| Phase 5 jonathan-check2 raises challenge | Phase 4 design — address the specific challenge |

### Where Patches Are Logged

Every patch is logged in the workflow's Factory Metadata section AND in a running factory log:
```
{venture_directory}/workflows/_factory-log.md
```

Format:
```
## Patch Log

| Date | Domain | Phase | Gap | Patch Applied | Prevents |
|------|--------|-------|-----|--------------|----------|
```

This log is the factory's learning history. Future runs READ this log in Phase 3 to avoid repeating known issues.

---

## Autonomy Protocol

The factory operates WITHOUT human intervention for most decisions. Here's when it acts autonomously vs when it escalates:

| Situation | Action |
|-----------|--------|
| Seed exists, objective is clear | Proceed autonomously through all 6 phases |
| No seed found | STOP. Report to human: "No seed found. Run /align first." |
| Classification uncertain (Phase 2) | Query /insight. If still uncertain, default to RESEARCH type with THOROUGHNESS constraint. |
| Failure modes uncertain (Phase 3) | Query agent_find + /insight. Include ALL 5 canonical failure modes as baseline. |
| Design auditor finds gaps (Phase 4) | Fix autonomously. Only escalate if gap requires new stage type not in the library. |
| Jonathan-check2 fails (Phase 5) | Revise up to 2 times. If still failing, save with needs-human-review tag. |
| Checker and producer disagree | Checker wins. Always. The producer revises. |

### The Agent Uncertainty Protocol

**CRITICAL:** When any agent in the factory has uncertainty > 30% about what to do:

1. **STOP** — do not proceed uncertain
2. **Search** — run agent_find with the specific question
3. **Query** — run /insight on the relevant domain
4. **Predict** — run /jonathan-check2 with the specific decision
5. **Only then proceed** — with the enriched context

This protocol applies to EVERY agent in the factory, not just the orchestrator. A verification agent uncertain about whether a source is reliable → stops, searches, queries, then decides. A designer uncertain about which stage to include → stops, searches, queries, then decides.

---

## How to Invoke

### Single workflow:
```
/workflow-factory
Objective: "Research the competitive landscape for {your domain}"
Seed location: ventures/{venture-name}/seeds/08-competitive-intelligence.md
Output: ventures/{venture-name}/workflows/08-competitive-intelligence.md
```

### Batch (multiple domains):
```
/workflow-factory --batch
Seeds directory: ventures/{venture-name}/seeds/
Output directory: ventures/{venture-name}/workflows/
```

In batch mode, the factory runs Phase 1-2 for ALL seeds first (to classify work types), then runs Phases 3-6 in parallel for each seed. This allows the factory to learn from early workflows and apply that learning to later ones.

### Test mode:
```
/workflow-factory --test
Objective: {any objective}
```

In test mode, the factory runs all 6 phases but does NOT save the output. Instead, it prints the full trace (every phase, every check, every patch) so the human can verify the factory is working correctly.

---

## Factory Version History

| Version | Date | Change |
|---------|------|--------|
| v1 | 2026-04-12 | Initial creation. 6 phases, producer/checker pattern, self-healing meta-loop, autonomy protocol. |

### Self-Healing Patch Log

| Date | Phase | Gap | Patch Applied | Prevents |
|------|-------|-----|--------------|----------|
| 2026-04-12 | All | Agents exhaust context researching before writing deliverable | Added Write-First Protocol: save draft within first 50% of context budget | Lost work from context exhaustion |
| 2026-04-12 | Phase 6 | Agents produce sub-artifacts but miss the main deliverable | SAVE instruction made explicit and FIRST priority in Phase 6 | Incomplete output |

### Write-First Protocol (MANDATORY — learned from production failure)

Agents MUST save a draft deliverable within the first 50% of their context budget. The pattern that fails: research exhaustively → run out of context → deliverable never written. The pattern that works: read seed → design stages → SAVE the workflow file → THEN enrich with research if context remains. Two agents failed this way on 2026-04-12 (D3 regulatory, D5 CX). Both were redeployed with this instruction and succeeded.

### Known Gaps for Future Enrichment

1. **Phase 3 research tracks could be broader** — currently uses agent_find + /insight + case studies. Could also query the Agent Steering notebook for work-type-specific principles.
2. **Phase 4 stage selection rules are initial** — they'll improve as the factory processes more domains and the self-healing log accumulates patterns.
3. **Batch mode parallelism** needs testing — does learning from early workflows actually help later ones?
4. **The Uncertainty Protocol** should track how often agents stop to search — if it's > 50% of the time, the factory needs more context injected upfront.
