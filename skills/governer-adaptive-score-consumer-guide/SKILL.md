---
name: governer-adaptive-score-consumer-guide
description: How to consume the adaptive scoring response — every variable an agent can condition on, what each means, and how to build c
---

# Consuming the Adaptive Score Response

When you call the adaptive scoring endpoint, you get back a rich response with every variable you need to build conditional agent behavior. This guide explains what you get and how to use it.

## How to call it

```
node -e "console.log(JSON.stringify(require('${CLAUDE_PLUGIN_ROOT}/lib/scorer/pipelineLeverageScorer').computeAdaptiveScore({ category: '{cat}', touchesUserState: true, impactTier: '{tier}', agenticCompounding: {N}, hallucinationPropagation: {N}, existingWinsAtStake: {N} }), null, 2))"
```

## Full response shape

```json
{
  "unifiedScore": 74,
  "baseScore": 15,
  "metaScore": 74,
  "method": "meta-elevated",
  "tier": "L50",
  "budget": "elevated",
  "budgetDetails": { "pipelineDepth": "L50", "compactionDepth": "rich", "reflectionTrigger": true, "confidenceFloor": 85 },
  "base": {
    "score": 15,
    "method": "override",
    "details": {
      "category": "internal-tooling",
      "overrideScore": 15,
      "wasElevated": false,
      "elevationReason": null,
      "impactTier": null
    }
  },
  "meta": {
    "metaScore": 74,
    "weakestDimension": { "name": "Existing Wins at Stake", "value": 5 },
    "dimensions": {
      "agenticCompounding": 9,
      "hallucinationPropagation": 8,
      "existingWinsAtStake": 5
    }
  },
  "steps": [ ... ],
  "skipped": [ ... ]
}
```

## Every variable you can condition on

### Headline numbers (1-100, continuous)

| Field | What it means | When to use it |
|---|---|---|
| `unifiedScore` | The single number representing total reasoning depth needed. Max of baseScore and metaScore. | Default for any "how careful should I be?" decision. |
| `baseScore` | How important is this feature to users/business? Driven by category, SILA, impact tier. | When you need to know business importance independent of agent risk. |
| `metaScore` | How risky is this for an agent to execute? Geometric mean of ac/hp/ew × 10. | When you care specifically about agent execution risk, not business value. |

### Method (what drove the score)

| Value | Meaning |
|---|---|
| `"base-driven"` | Business importance was higher than agent risk. The feature matters to users more than it's dangerous for agents. |
| `"meta-elevated"` | Agent risk exceeded business importance. The feature might be low-stakes business-wise but dangerous if the agent gets it wrong. |

Use `method` when you need to know WHY the score is what it is — same score of 74 means different things depending on whether base or meta drove it.

### Individual meta-dimensions (1-10 each)

| Field path | What it measures |
|---|---|
| `meta.dimensions.agenticCompounding` | Does this change multiply across future agent decisions? 1 = one-off, 10 = changes how all future agents decide. |
| `meta.dimensions.hallucinationPropagation` | If the agent hallucinates here, how far does the error spread? 1 = stays in this file, 10 = every future decision inherits the mistake. |
| `meta.dimensions.existingWinsAtStake` | Could this break something already working? 1 = greenfield, 10 = touches auth/payment/shared middleware. |

These are the most powerful fields for conditional logic. An agent building a code review step might only care about `hallucinationPropagation`. An agent deciding whether to run integration tests might only care about `existingWinsAtStake`.

### Weakest dimension

| Field path | What it tells you |
|---|---|
| `meta.weakestDimension.name` | Which dimension scored lowest — the bottleneck holding the meta-score down. |
| `meta.weakestDimension.value` | The actual score of that dimension (1-10). |

Use this when you want to know what's pulling the score DOWN. If `weakestDimension` is `"Existing Wins at Stake"` at value 2, the feature is risky for agents but safe for existing code — you might skip regression tests.

### Base scoring details

| Field path | What it tells you |
|---|---|
| `base.method` | How base score was determined: `"manual"`, `"override"` (category), `"sila"`, `"sila-over-override"`. |
| `base.details.category` | The category used (e.g. `"payment"`, `"internal-tooling"`, `"core-coaching"`). |
| `base.details.wasElevated` | Did the touchesUserState gate raise the score above the category default? |
| `base.details.elevationReason` | Human-readable explanation of why the score was elevated. |
| `base.details.impactTier` | The impact tier that drove elevation: `"indirect"`, `"config"`, `"communication"`, `"revenue"`. |

### Pipeline steps

| Field | What it tells you |
|---|---|
| `steps` | Array of pipeline steps that activated for this score. Each has `id`, `leverageGate`, `skill`, `phase`. |
| `skipped` | Array of steps that were skipped because the score was too low, with a `reason` for each. |

## Example conditional patterns

**"Only run deep security review when hallucination could spread to users":**
```
if meta.dimensions.hallucinationPropagation >= 7
```

**"Skip regression tests for greenfield features":**
```
if meta.dimensions.existingWinsAtStake <= 3
```

**"Require human review when agent risk is high but business stakes are low":**
```
if method === "meta-elevated" AND baseScore < 30 AND metaScore > 70
```

**"Extra care with anything that changes agent decision-making":**
```
if meta.dimensions.agenticCompounding >= 8
```

**"Scale test coverage continuously with the score":**
```
coverageTarget = 60 + (unifiedScore * 0.35)
```

**"Different behavior depending on what drove the score":**
```
if method === "base-driven"  → focus on UX validation
if method === "meta-elevated" → focus on code correctness and testing
```

**"Only flag for staged release if it touches revenue AND agents could compound errors":**
```
if base.details.impactTier === "revenue" AND meta.dimensions.agenticCompounding >= 6
```

## Building an adaptor

An adaptor is any skill or agent behavior that reads the adaptive score and adjusts its own depth based on the response. To build one:

1. **Call the endpoint** at the start of your workflow
2. **Pick the fields you care about** — you don't need all of them. A test depth adaptor might only use `unifiedScore` and `existingWinsAtStake`. A compaction adaptor might only use `unifiedScore` and `method`.
3. **Write your conditional logic** using the fields directly — no buckets, no label translation. Branch on numbers and strings.
4. **Document your conditions** in your skill file so other agents know what you're keying on.

There is no adaptor registry or framework. Your skill reads the response, makes decisions, and documents those decisions in its own SKILL.md. The scoring system provides the data. Your skill owns its logic.
