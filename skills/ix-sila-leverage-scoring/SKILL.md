---
name: ix-sila-leverage-scoring
description: Score any initiative through the IX-SILA 9-variable multiplicative model to surface weak links and predict higher-leverage
triggers:
  - "score this idea"
  - "evaluate leverage"
  - "ix-sila"
  - "sila score"
  - "multiplicative scoring"
  - "predict highest leverage"
  - "weak link analysis"
  - "leverage audit"
  - "which initiative is highest leverage"
  - "compare these ideas"
---

# IX-SILA — Social Impact Leverage Algorithm (Product Extended)

## What This Is

A 9-variable multiplicative scoring engine for evaluating initiatives. Variables MULTIPLY — they don't add. A weak score in any variable kills the whole product. The weakest variable is always the most important finding, not the total score.

**This is the canonical path for determining leverage ideas.** Every leverage idea proposed should be scored through IX-SILA to surface its weak links and compare against benchmarks.

## The Formula

```
SILA Score   = V1 x V2 x V3 x V4 x V5 x V6        (6 social impact variables)
IX Score     = V7 x V8 x V9                          (3 product-specific variables)
Combined     = SILA Score x IX Score                  (all 9 multiplied)
```

## The 9 Variables (Evaluate IN THIS ORDER)

### Social Impact Variables (SILA 6)

| # | Variable | Key Question | 10 = | 1 = |
|---|----------|-------------|------|-----|
| 1 | **Value/Effort Ratio** | How much value vs cost to build? | Costs nothing, massive value | Costs as much as value delivered |
| 2 | **User Pain Severity** | Are users already in pain? | Daily visible crisis, no pitch needed | Requires awareness campaign |
| 3 | **Actor Readiness** | Is someone positioned to execute? | Already doing adjacent work | Must recruit from scratch |
| 4 | **Platform Readiness** | Do systems already exist? | All APIs/models/UI exist | Must build every piece |
| 5 | **Loop Closure** | Does output feed back into input? | Each cycle makes next more likely | Every cycle needs external energy |
| 6 | **Compounding Rate** | Gets better over time on its own? | Accelerates without investment | Flatlines without constant effort |

### Product-Specific Variables (IX 3)

| # | Variable | Key Question | 10 = | 1 = |
|---|----------|-------------|------|-----|
| 7 | **AI Delegability** | Can agents execute autonomously? | Fully end-to-end autonomous | Requires constant human oversight |
| 8 | **KPI Bottleneck Impact** | Targets our most limiting KPI? | Directly addresses churn (biggest inhibitor) | Targets a KPI already performing well |
| 9 | **Reach Multiplier** | Scales toward 1M people? | Each user served makes next cheaper | Each new user costs the same |

## Benchmarks

| Benchmark | Score | What It Represents |
|-----------|-------|-------------------|
| Curitiba SILA | 583,200 | 10x9x9x10x9x8 — near-perfect social impact program |
| IX Max | 1,000 | 10x10x10 — perfect product alignment |
| Combined Max | 583,200,000 | Curitiba x perfect IX |

## Step-by-Step: Score an Initiative

### Step 1: Gather Context
Before scoring, understand the initiative deeply. Query:
- `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` for related intents, knowledge atoms, past sessions
- Leverage Ideas API for existing scores: `alignment-harness store list leverage-ideas --limit 10`
- Current KPI bottleneck (as of <date>: <KPI> at <current value>)

### Step 2: Score Each Variable (IN ORDER)
The order matters — each step informs the next.

For each of the 9 variables:
1. Score 1-10
2. Write a one-sentence justification that is **specific and falsifiable**
   - BAD: "Pretty good infrastructure"
   - GOOD: "Platform exists with 500 active coaches but no program enrollment flow"

### Step 3: Multiply
```
sila_score = v1 * v2 * v3 * v4 * v5 * v6
ix_score = v7 * v8 * v9
combined_score = sila_score * ix_score
```

### Step 4: Identify Weakest Variable
The weakest variable is the MOST IMPORTANT finding. Not the score itself.

### Step 5: Sensitivity Analysis
For each variable, compute: `total_if_improved = (combined / current_score) * min(10, current_score + 1)`
Sort by gain from +1. The top row is always the weakest variable — this proves mathematically that fixing your weakest link gives the highest ROI.

### Step 6: Design Recommendation
Recommend one specific change to raise the weakest variable by at least 2 points.

### Step 7: Benchmark Comparison
```
sila_benchmark_pct = sila_score / 583200 * 100
combined_benchmark_pct = combined_score / 583200000 * 100
```

## Output Format

```json
{
  "idea_name": "string",
  "description": "One sentence",
  "variables": {
    "surplus_cost_ratio": { "score": N, "justification": "..." },
    "problem_urgency": { "score": N, "justification": "..." },
    "actor_readiness": { "score": N, "justification": "..." },
    "infrastructure_existence": { "score": N, "justification": "..." },
    "loop_closure": { "score": N, "justification": "..." },
    "compounding_rate": { "score": N, "justification": "..." },
    "ai_delegability": { "score": N, "justification": "..." },
    "kpi_bottleneck_impact": { "score": N, "justification": "..." },
    "reach_multiplier": { "score": N, "justification": "..." }
  },
  "sila_score": N,
  "ix_score": N,
  "combined_score": N,
  "weakest_variable": "string",
  "design_recommendation": "What to fix first and how",
  "sila_benchmark_pct": N,
  "combined_benchmark_pct": N
}
```

## Predicting Higher-Leverage Actions

After scoring multiple ideas, synthesize a NOVEL idea by:

1. **Identify systemic weakness** — which variable is consistently low across all ideas?
2. **Find complementary strengths** — which ideas score highest on different variables?
3. **Fuse** — combine the high-scoring elements while patching the systemic weakness
4. **Score the synthesis** — run it through IX-SILA to verify it actually scores higher
5. **Submit** — use the leverage-ideas skill to submit with full compounding impact

### Example: Session 2026-03-05 Prediction

Scored 8 existing ideas. Found `reach_multiplier` averaged ~6 across all (retention-focused, not distribution-focused). Fused:
- Proven email retention (#1, churn-cutting)
- Referral mechanics (#2, viral coefficient)
- Agent autonomy (#5, self-optimizing)

Result: **Autonomous Retention-to-Referral Engine** scored 302M combined — 4X higher than any individual idea. The key move was patching reach_multiplier from 5 to 8 by embedding referral CTAs in retention emails.

## Agent Prompt Template

Copy this to have any AI agent score an initiative:

```
You are evaluating a product initiative using IX-SILA (9-variable multiplicative scoring).

Score each variable 1-10 with a one-sentence justification. Evaluate IN ORDER:

SILA 6:
1. VALUE/EFFORT RATIO
2. USER PAIN SEVERITY
3. ACTOR READINESS
4. PLATFORM READINESS
5. LOOP CLOSURE
6. COMPOUNDING RATE

IX 3:
7. AI DELEGABILITY
8. KPI BOTTLENECK IMPACT (current bottleneck: <KPI> <current value>)
9. REACH MULTIPLIER (path to 1M people)

Multiply SILA 6 for social impact score, IX 3 for internal score, all 9 for combined.
Identify weakest variable. Recommend one fix to raise it by 2+ points.
Compare to Curitiba benchmark (583,200 SILA / 583,200,000 combined).

The initiative:
[INSERT HERE]
```

## Integration With Existing Systems

### Leverage Ideas API
After IX-SILA scoring, submit via `alignment-harness store add leverage-ideas --json '{...}'` with:
- `tags: ["ix-sila-scored"]` to mark as evaluated
- `impactScore` and `complexityScore` for internal leverage ratio
- Full `compoundingImpact` and `kpiPredictions`

### Intent DB
If the initiative addresses specific UX intents, link via `intentIds` array.

### Internal Leverage Compatibility
- Internal leverage: `impactScore / complexityHours` (answers "what to do THIS WEEK")
- IX-SILA combined: 9-variable multiplicative (answers "what builds durable value over the next year")
- Use BOTH together: quick wins for velocity, systems thinking for direction

## Interactive Tools

Two standalone HTML artifacts exist for visual scoring:
- `sila-tool/bundle.html` — General 6-variable SILA with Curitiba benchmark
- `ix-sila-audit/bundle.html` — Full 9-variable IX-SILA with product extensions

Both include: radar charts, sensitivity analysis, benchmark comparison, side-by-side comparison mode.

## Key Principles

1. **Never average. Always multiply.** One weak link kills everything.
2. **The weakest variable is the most important finding.** Not the score itself.
3. **Justifications must be specific and falsifiable.** Not "pretty good" — cite evidence.
4. **The sequence builds understanding.** Don't jump ahead. Each variable contextualizes the next.
5. **Always benchmark.** Raw scores mean nothing without comparison.
6. **Two scoring systems coexist.** Internal leverage for velocity, IX-SILA for direction.

## Files

| File | Purpose |
|------|---------|
| `sila-tool/src/lib/sila-engine.ts` | Core 6-variable SILA engine |
| `ix-sila-audit/src/lib/ix-sila-engine.ts` | Extended 9-variable IX-SILA engine |
| `sila-tool/bundle.html` | Standalone SILA interactive tool |
| `ix-sila-audit/bundle.html` | Standalone IX-SILA interactive tool |
