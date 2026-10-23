---
name: governer
description: "Leverage-tiered feature pipeline. Auto-scores features via IX-SILA or category overrides, routes to the right validation depth, executes steps sequentially with confidence-gated self-reflection and tracing. Invoke at the START of any new task or feature implementation."
triggers:
  - "build a feature"
  - "implement feature"
  - "feature pipeline"
  - "leverage pipeline"
  - "what pipeline steps"
  - "how much testing does this need"
---

# Feature Pipeline Governor

Before your output, print `## GOVERNER_SCORE` on its own line. This enables automated extraction to the compaction admin UI.

After your governer output is complete, print `## END_GOVERNER_SCORE` on its own line. This closes the extraction block.

## Invocation Gate (CHECK THIS FIRST)

Before running the pipeline, ask: **Is this a new task or topic?**

- **New task or topic** → invoke governer, run the full pipeline.
- **Same task continuing** (next turn in an ongoing thread, same feature being refined) → SKIP re-invocation unless governer itself previously said to re-score (score changed signal).
- **Governer said to re-score** → re-invoke even mid-thread (score may have changed due to new information).

Print: `🚦 Governer gate: {new-task|continuing|re-score-requested} — {one sentence reason}`

If gate = `continuing` or no re-score was requested → skip to execution. Do not re-run scoring.

---

**When you are given a task with `/governer`, this skill IS the process for executing that task.** Score the task first, then build/fix it by following the pipeline steps below. The task described before `/governer` is your feature — run it through this pipeline.

Four phases: Score → Execute → Reflect → Summarize.

> **Need to build an adaptor that consumes the score?** → `/governer-adaptive-score-consumer-guide` — full response shape, every variable you can condition on, example conditional patterns.

## Decision JSON (MANDATORY — print after every confidence decision)

```
📊 {"p":"feature-name","s":"step-id","c":85,"a":"proceed","r":"one sentence reason","l":72,"t":"ISO timestamp"}
```
Fields: `p`=pipeline, `s`=step, `c`=certainty 0-100, `a`=action taken, `r`=reason, `l`=leverage, `t`=time.

## Phase 1: Score

Determine leverage. Provide BOTH category AND SILA when possible — endpoint uses the HIGHER score.

### Category Overrides (instant)

| Category | Score | If touchesUserState |
|---|---|---|
| `admin-only` | 0 | **→ 50** |
| `docs-only` | 0 | — |
| `internal-tooling` | 15 | **→ 40** |
| `cosmetic` | 20 | — |
| `core-user-feature` | 75 | 75 |
| `onboarding` | 85 | 85 |
| `core-coaching` | 90 | 90 |
| `payment` / `auth` | 100 | 100 |

> **`core-user-feature` backstop note:** This static category is a safety net only. It exists to catch cases where the UX-Breakage Reasoning Gate (Phase 1.6) was incorrectly answered with zero items. If you are touching any of the 8 core user-facing features (custom AI coach creation, avatar upload, session management, onboarding, payment flows, auth, coaching UI, user profile), classify as `core-user-feature` at minimum — but the reasoning gate is still primary and must be executed regardless of category score.

### touchesUserState Gate (MANDATORY — runs BEFORE score finalizes)

For `admin-only`, `docs-only`, and `internal-tooling` categories, you MUST answer this question and print the result BEFORE using the score:

> **"Does the OUTPUT of this task affect what any user sees, receives, or experiences — even indirectly?"**

This is NOT "did I touch UX code." This is "does the deliverable feed into something user-facing."

**If NO** → use the base category score. Print and move on.
**If YES** → classify the impact tier:

| Impact Tier | What it means | Floor score | Examples |
|---|---|---|---|
| `indirect` | Informs a future decision but doesn't ship anything yet | 40 | Research doc, data analysis, internal dashboard |
| `config` | Changes what users see/get via config, flags, or data — no code deploy needed | 65 | Feature flag toggle, segmentation spec ingested by existing system, admin tool that writes user records |
| `communication` | Controls messages users receive (email, notification, in-app copy) | 85 | Email campaign targeting, push notification rules, onboarding copy changes |
| `revenue` | Directly affects payment, churn, conversion, or subscription state | 95 | Billing logic, trial expiry emails, win-back campaigns to lapsed payers, pricing page changes |

Print: `👤 touchesUserState: {true|false} — impact: {tier} (floor {N}) — {one sentence reason}`

**Scoring rule**: Use the HIGHER of the impact tier floor and the `touchesUserState` column from the category table. Then run SILA — endpoint takes the max of all three (category, impact floor, SILA).

**If unsure between tiers** → pick the higher one. The cost of over-scoring is pipeline steps; the cost of under-scoring is shipping unvalidated user-facing changes.
**If you skip this gate** → the score is invalid. Period.

### IX-SILA (9 questions, 1-10 each)
V1 Value/Effort, V2 Pain Severity, V3 Actor Readiness, V4 Platform Readiness, V5 Loop Closure, V6 Compounding Rate, V7 AI Delegability, V8 KPI Bottleneck, V9 Reach Multiplier.

### Endpoint
```
alignment-harness score --task "{name}" --category {cat} --touches-user-state --ac {N} --hp {N} --ew {N} --sila 8,7,... --json
```
Print: `Pipeline: {feature} scored {N}/100 — Score: {N} — Method: {method}`

**Score 0 → skip pipeline steps. Just build it.** But score 0 is ONLY valid after the touchesUserState gate has been printed and resolved to `false`. If the gate resolved `true`, the score is no longer 0 — use the escalated score from the table.

## Phase 1.5: Adaptive Meta-Assessment (MANDATORY after scoring)

After the base score is set, self-assess three meta-dimensions that the base scorer is blind to. These determine how much care to take building this feature.

### Three Questions (1-10 each)

| Dimension | Question | 1 = low risk | 10 = maximum risk |
|---|---|---|---|
| **Agentic Compounding (ac)** | Does this change multiply across future agent decisions? | One-off change, no future agent references this | Changes how agents evaluate/decide ALL future tasks |
| **Hallucination Propagation (hp)** | If I get this wrong, how far does the error spread? | Error stays in this file, caught by tests | Error changes a scoring/routing algo — every future decision inherits the mistake |
| **Existing Wins at Stake (ew)** | Could this break something already working? | Greenfield — nothing to break | Changes auth/payment/shared middleware every route depends on |

Print: `🧠 Meta: ac={N} hp={N} ew={N} — {one sentence justification for highest dimension}`

### Endpoint
```
alignment-harness score --task "{name}" --category {cat} --touches-user-state --impact-tier {tier} --ac {N} --hp {N} --ew {N} --sila 8,7,... --json
```

Returns: `overallGovernerScore`, `method` (base-driven or meta-elevated).

Print: `🎯 Unified: {unifiedScore}/100 — Driver: {method}`

### Score-Driven Depth (continuous thresholds — NO bucket labels)

The unified score is a continuous 0-100 number. Every downstream decision references the score directly:

| Score range | Pipeline depth | Compaction depth | Reflect before acting? | Min certainty |
|---|---|---|---|---|
| < 20 | Skip pipeline steps — just build | Thin (facts only) | No | 70% |
| 20–59 | L20 steps only | Standard | No | 80% |
| 60–79 | L50 steps | Rich (principles + reasoning) | Yes (score > 60) | 85% |
| ≥ 80 | L90 all steps | Deep (/reflect prefix, full chain) | Yes (score ≥ 80) | 90% |

**Use the score to calibrate everything downstream** — step execution depth, compaction richness, reflection requirements, and the confidence floor for proceeding.

**Critical mass rule**: If 2 of 3 meta-dimensions are ≥8, the unified score is always treated as ≥80 regardless of the geometric mean. Two critical signals = maximum-depth response.

### Memory Persistence (MANDATORY — persist after scoring)

After Phase 1.5 completes, persist all sub-scores to session context using these exact descriptive labels:

```
degreeToWhichThisTaskAffectsWhatUsersExperience: {N}
degreeToWhichAgentMistakesWouldCompoundAcrossFutureSessions: {N}
degreeToWhichGettingThisWrongWouldSpreadToOtherSystems: {N}
degreeToWhichThisCouldBreakSomethingAlreadyWorking: {N}
overallGovernerScore: {N}
```

These stay active in session memory. If governer re-scores, update all five values. Never use shortened labels — the full descriptive name is the contract.

### Telemetry Logging (MANDATORY — log after scoring)

After printing the unified score, append a telemetry event:

```bash
echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"GovernerScored\",\"score\":{unifiedScore},\"feature\":\"{feature-name}\",\"ac\":{ac},\"hp\":{hp},\"ew\":{ew}}" >> .claude/logs/agent-telemetry.jsonl
```

This enables later reconciliation:
- Was governer invoked? (look for `GovernerScored` event)
- What did it score? (compare `score` to the severity of any correction that followed)
- Did the agent follow the score's directives? (compare actual behavior to what the score range prescribed)

If `.claude/logs/` does not exist, create it: `mkdir -p .claude/logs`
## Phase 1.6: UX-Breakage Reasoning Gate (MANDATORY — runs AFTER Phase 1.5, BEFORE Skill Prediction Gate)

> **Primary gate.** The static category scores are a backstop. This reasoning task is the actual gate on the autonomous-commit lane. It must be performed every single time — no exceptions, no pre-computed answers, no inherited conclusions from a previous invocation.

Before proceeding to the Skill Prediction Gate, the agent MUST write prose answers (not yes/no) to the following four questions and print them under the heading `## UX-Breakage Reasoning Gate`:

### Q1 — Would breakage change or break any user's experience?

> "If this code as staged were broken or had a hallucinated bug introduced, would that change or break the experience of any of our users?"

Answer in prose. Consider every execution path that the modified code participates in — not just the obvious "happy path." Think about what calls this code, what depends on its return values, what fails silently if it throws.

### Q2 — What UX outcomes could break?

> "If yes, in what way? Describe every user-facing UX outcome that could break."

Answer in prose. Be specific about what the user would see, fail to see, or experience incorrectly. Use the user's perspective, not the code's perspective. Example: "avatar upload could fail silently — user submits the form, appears to succeed, but their image is not stored or displayed."

### Q3 — What is the risk profile per item?

> "What is the risk profile per item — frequency × severity?"

For each item from Q2, rate it. Frequency: how often does this path execute (every session, on first login, only on avatar upload)? Severity: if it breaks, how bad is the UX consequence (user blocked from core feature vs cosmetic glitch)?

### Q4 — The comprehensive broken-UX list

> "What is the comprehensive broken-UX list — every concrete user-facing thing that could go wrong?"

This is the definitive list used by the binary rule below. It must be numbered. Include items from Q2 plus any additional items discovered while answering Q1-Q3.

### Required output format

Print the answers under this exact heading before proceeding:

```
## UX-Breakage Reasoning Gate

**Q1 — Would breakage affect users?**
{prose answer}

**Q2 — What UX outcomes could break?**
{prose answer}

**Q3 — Risk profile per item**
{prose answer}

**Q4 — Comprehensive broken-UX list**
1. {item}
2. {item}
...
(or: "None — this change has no execution path that reaches any user-facing behavior.")
```

### Binary rule

Count the items in Q4.

- **Zero items** → change is eligible for the autonomous-commit lane (subject to all existing score-based rules). Continue to the Skill Prediction Gate.
- **One or more items** → change is NOT eligible for autonomous commit. The following are ALL required before any commit:
  1. Run `/sanity-check` on this change.
  2. Collect browser-based evidence (screenshots or screen recordings of a real browser session exercising the actual UX path) for EVERY item on the Q4 list.
  3. **"Browser-based evidence" explicitly excludes programmatic test passes.** A green test suite does NOT satisfy this gate. The evidence must show a real browser exercising the actual user-facing UX — what the user would see, do, and experience.
  4. Obtain explicit human authorization before any commit.

Print at the end of this phase:

```
🚪 UX-Breakage Reasoning Gate: {N items} → {AUTONOMOUS-ELIGIBLE | HUMAN-REQUIRED}
```

If `HUMAN-REQUIRED`: list the specific browser-evidence items that must be collected before proceeding.

## Skill Prediction Gate (fires between Phase 1.5 and Phase 2)

After the unified score and memory persistence are complete, evaluate whether `/predict-required-skills` must fire before execution begins.

### Threshold — consequential vs inconsequential

**FIRE `/predict-required-skills` when ANY of these are true:**

| Signal | Threshold | Source |
|---|---|---|
| Blast radius | >= 2 (admin/the user workflows or user-facing) | touchesUserState gate + impact tier |
| User-facing | true | touchesUserState resolved to `true` |
| Complexity | >= 5 | SILA scores or task description |
| Unified score | >= 40 | overallGovernerScore from Phase 1.5 |

**SKIP `/predict-required-skills` when ALL of these are true:**
- Blast radius = 1 (internal/dev only)
- touchesUserState = false
- Complexity < 5
- Unified score < 40

Print the gate decision before proceeding:

```
🔮 Skill Prediction Gate: {FIRE|SKIP}
   Reason: blast_radius={N}, user_facing={true|false}, complexity_est={N}, score={N}
```

### When FIRE — invoke `/predict-required-skills`

Query the Agent Skill Pattern Oracle with the current scope:

Setup: the Agent Skill Pattern Oracle is your own NotebookLM notebook. Make your own at https://notebooklm.google.com and put its ID in place of `<your-skill-pattern-notebook-id>`, because the oracle can only predict from the skill invocation history you put in it.

```bash
nlm notebook query <your-skill-pattern-notebook-id> \
  "Given this scope: {one sentence scope description}. Tags: {tags}. Based on historical skill invocation patterns for similar work, which skills should be invoked, in what order, and why? Include timing (early/mid/late session) and flag any skills commonly skipped in this scope type." \
  --profile <your-profile>
```

Or via MCP if available:
```
mcp__notebooklm__query_notebook({
  notebook_id: "<your-skill-pattern-notebook-id>",
  profile: "<your-profile>",
  question: "Given this scope: {scope}. Tags: {tags}. Which skills in what order?"
})
```

**Deduplication:** If `_skillPredictionCache` is already set for this scope (scope hash unchanged), use the cached result — do NOT re-query the oracle.

**Format the result as REQUIREMENTS, not suggestions**, and include in the governer output:

```
## Required Skill Sequence (oracle-grounded)

The following skills are REQUIRED for this scope based on historical patterns.
Each must be executed. Each becomes a TaskCreate item immediately after this output.

1. /[skill] — [why] [EARLY]
2. /[skill] — [why] [MID]
...
N. /consume — build admin-consumable output [LATE]
N+1. /commit [LATE]

Skipped-skill risk: [oracle flag if any]
```

**Immediately after printing**, call `TaskCreate` for each predicted skill not already in the task list.

### When SKIP

Print: `🔮 Skill Prediction Gate: SKIP — inconsequential task (score={N}, not user-facing, low complexity)`

Do not query the oracle. Proceed directly to Phase 2.

---

## Phase 2: Execute Steps

The endpoint returns a `steps` array. For each step:

1. Print: `[Step {i}/{total}] {step.id} (gate: {step.leverageGate}) — {step.description}`
2. Execute based on type:
   - `step.skill` → invoke that skill (this is the **lean recipe** — fast, focused)
   - `step.skillFull` → only read this if the lean recipe says to or if certainty < 70%
   - `step.action` → run inline action (see below)
3. Print decision JSON after each step
4. Trace: `alignment-harness store add pipeline-trace --json '{"feature":"{feature}","leverageScore":{N},"stepId":"{step.id}","status":"{status}","notes":"{notes}"}'`

**Token rule:** Always use `step.skill` first. Only escalate to `step.skillFull` when uncertain.

### Inline Actions

**`confidence-check`** — The Confidence Escalation Ladder:

1. Self-assess certainty 0-100: "Can I state the UX intent in one sentence AND am I >90% sure my plan fulfills it?"

**CERTAINTY SOURCE RULE (MANDATORY):**
If your certainty comes from logged sources (agent_find, swarm memory, compactions, intent DB, past session notes) rather than **reading the actual current code**, your certainty ceiling is 70%. Logged information decays — code may have changed since it was logged. To break through 70%, you MUST read the actual code files and verify the logged claims match reality. Print: `📊 {..., "r":"certainty capped at 70% — source is logged, not code-verified"}`

2. Route based on certainty:

| Certainty | Action | Next |
|---|---|---|
| >= 90% | Print decision JSON, proceed | Continue pipeline |
| 70-89% | Invoke `/reflect` skill | Re-assess → if now >=90% proceed, else research |
| < 70% | Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<feature domain>"` on the feature domain | Re-assess → if now >=90% proceed, else prepare brief |

3. If still <90% after research: **prepare brief, don't block**:
   - Write session compaction via `/compact-agentic-session`
   - Note specific gaps and uncertainties in the compaction
   - Print: `📋 Brief queued: [compaction shortId] — admin review requested`
   - **Continue to next pipeline step** (human reviews async)

**`ground-check`** — Verify claims against actual code, not just logs:
1. Grep/Glob to verify intent references exist in code. Mark missing as `pending-implementation`.
2. If any logged source (agent_find, compaction, intent DB) informed your plan, READ the actual code files it references. Confirm the code does what the log claims. If it doesn't, update your plan and re-assess certainty.
3. Print which claims were verified vs which were stale.

**`evidence-grounded-analysis`** — High-leverage evidence grounding (score ≥ 80):
1. Read the `/evidence-grounded-analysis` skill file for the full 6-phase methodology.
2. Run the 30-second fitness check from that skill: "If I'm wrong, do other agents or humans build on my wrong conclusion?" If NO → skip, print decision JSON, continue. If YES → proceed through applicable phases.
3. For each of the 6 phases (instrument → anomalies → composite → hypothesize → proposals → re-validation), check that phase's "When to skip" condition FIRST. Only execute phases that fit.
4. The minimum viable execution is Phase 1 (build the instrument) + Phase 4 (hypothesize from evidence). Phases 2-3 apply when aggregating multiple signals. Phases 5-6 apply when the deliverable includes recommendations.
5. Print decision JSON after each phase completed or skipped, with reasoning.

**`phantom-scan`** — `POST <your-api>/ux-assignments/validate-phantom` to flag phantom items.

**`completion-reflection`** — Post-build reflection LOOP:

1. Reference initial certainty from the confidence-check step
2. Invoke `/reflect` skill — asks: "Does what I built match my stated intent?"
3. Self-assess certainty. Print decision JSON.
4. **If gaps found → FIX LOOP:**
   - Fix the gap (code change, test addition, intent update)
   - Invoke `/reflect` again — "Did the fix close the gap?"
   - Re-assess certainty. Print decision JSON.
   - **Repeat until**: certainty >= 90% OR certainty plateaus (same score twice) OR 3 iterations max
5. If certainty plateaus below 90% after loop:
   - Write compaction brief via `/compact-agentic-session` with gaps noted
   - Print: `📋 Gap detected: certainty plateaued at {N}%. Brief queued: [shortId]`
   - **Continue** — human reviews async
6. If certainty >= 90%: print decision JSON confirming alignment, done.

### Failure handling
- Step fails → trace as `failed`, continue
- Step miscategorized → trace as `miscategorized` with reason
- **Never stop the pipeline. Log everything, continue working.**

## Phase 3: Summary

```
| Feature: {name} | Score: {N}/100 |
| degreeToWhichThisTaskAffectsWhatUsersExperience: {N} |
| degreeToWhichAgentMistakesWouldCompoundAcrossFutureSessions: {N} |
| degreeToWhichGettingThisWrongWouldSpreadToOtherSystems: {N} |
| degreeToWhichThisCouldBreakSomethingAlreadyWorking: {N} |
| overallGovernerScore: {N} |
| Step | Certainty | Status | Notes |
| confidence-gate | 85→92% | reflected+proceeded | intent verified via /reflect |
| ... | ... | ... | ... |
Briefs queued: {count} | Phantoms: {count} | Intents created: {count}
```

## Autonomous Commit Rule

After pipeline completes, can you commit without human approval?

| Condition | Commit? |
|---|---|
| UX-Breakage Reasoning Gate produced ANY items (Q4 non-empty) | **NO — Sanity-check required + browser evidence per item + explicit human authorization** |
| Score < 40 AND all tests pass | **YES — commit autonomously** |
| Score 40–69 AND certainty >= 90% AND all tests pass | **YES — commit + trace** |
| Score >= 70 | **Queue brief, continue. Human batch-approves.** |
| Any test fails | **NO — fix first or queue brief** |
| Payment/auth/email code touched | **Queue brief regardless of score** |

## Rules
- Score < 20 → skip pipeline, just build
- Failures don't block — trace and continue
- Human is NEVER a blocker — prepare brief, queue it, keep working
- Token budget: read this skill ONCE, execute, trace. Don't re-read.

## Proposal Communication Format (applies when pipeline produces a document)

When the governer pipeline results in a written proposal, intent doc, or actionable document saved to `<api-repo>/docs/intent/`, the document MUST lead with a human-legible section BEFORE any technical content.

**This does NOT change the pipeline steps, scoring, or execution flow.** It is a format requirement on the OUTPUT document only.

The human-legible section follows the `/align` communication format:
- "What is actually happening to real people" — plain language, no code, no variable names, no file paths
- Certainty dots: 🔴 (<60%) 🟡 (60-69%) 🔵 (70-79%) 🟣 (80-89%) 🟢 (90%+ verified)
- Source references for every claim (artifact IDs, knowledge atoms, intent slugs)
- All technical detail goes BELOW under a "Technical Detail" header

If a TEMPLATE.md exists in the target directory, follow it. This requirement applies to any document the pipeline produces — not to the pipeline's own console output, tracing, or telemetry.
