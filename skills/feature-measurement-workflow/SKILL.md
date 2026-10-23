---
name: feature-measurement-workflow
description: Canonical workflow for major feature creation with built-in measurement.
triggers:
  - "new major feature"
  - "feature measurement"
  - "should I measure this"
  - "feature impact review"
  - "canonical feature creation"
  - "ship and measure"
---

# Canonical Major Feature Creation Workflow

This is the end-to-end workflow for creating, shipping, and measuring major features at your product. Every substantive feature follows this pipeline. Measurement is not an afterthought — it's step 2.

---

## The Full Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  1. IDEATION                                                │
│     Intuitive, passion-driven:                              │
│     "Can I 2x the value users get?"                         │
│     "Can I 2x engagement / conversion / time-to-ROI?"       │
│                                                             │
│  2. LEVERAGE + MEASUREMENT DECISION  ← NEW                  │
│     Identify highest leverage within what's possible         │
│     Run the Substantiveness Test (see below)                 │
│     If substantive: pick primary KPI + secondary KPI         │
│     Write one-line prediction                                │
│                                                             │
│  3. PLANNING                                                │
│     Scope, design, identify affected surfaces                │
│     Name the feature for tracking (see naming conventions)   │
│                                                             │
│  4. ALIGNMENT CHECK: How Works                              │
│     Consult scripts/memory-search.js for architectural context │
│     Verify assumptions about existing code                   │
│                                                             │
│  5. EXECUTION                                               │
│     Build the feature                                       │
│     Add Statsig feature event during development             │
│     (one event: feature_{name}_used, fired on first use)     │
│                                                             │
│  6. TDD TESTING                                             │
│     Automated tests covering the new behavior                │
│                                                             │
│  7. UX TESTING FOR PERFECTION                               │
│     UX assignment tool — human verification                  │
│                                                             │
│  8. ALIGNMENT CHECK: Intent DB                              │
│     Verify against documented UX intentions                  │
│                                                             │
│  9. DEPLOY TO PRODUCTION                                    │
│     Ship to ALL users (no holdout unless pricing/paywall)    │
│     Release marker auto-logged at deploy time                │
│                                                             │
│ 10. 4-WEEK REVIEW  ← NEW                                    │
│     Evaluate adoption + KPI impact                           │
│     Advisory output: discovery problem? product problem?     │
│     Log result — calibrates future intuition                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 2 Deep Dive: The Substantiveness Test

Not every change needs measurement. Run this decision tree to determine if a feature is substantive enough:

```
Q1: Does it change a core user flow?
    (coaching, onboarding, paywall, engagement loop, navigation)
    → YES: substantive. Measure it.

Q2: Does it add a new surface area users interact with?
    (new page, new feature, new modal, new capability)
    → YES: substantive. Measure it.

Q3: Could it plausibly affect engagement, conversion, or churn?
    (even indirectly — e.g. faster load → more sessions)
    → YES: substantive. Measure it.

Q4: Is it cosmetic, admin-only, bug fix, or internal tooling?
    → NOT substantive. Ship without measurement.

If Q1-Q3 are all NO and Q4 is NO:
    → Use judgment. When in doubt, add measurement — it's 30 seconds.
```

### When you mark it substantive:

1. **Pick a primary KPI** — the single metric you believe this will most impact
2. **Pick a secondary KPI** — a supporting signal from a different angle
3. **Write a one-line prediction**: "I expect [primary KPI] to [increase/decrease] by ~[X%] within 4 weeks"

> This prediction is not binding. It's calibration data for your future intuition.

---

## Step 3 Deep Dive: Feature Naming

Feature names appear in Statsig dashboards among potentially 100+ other features. They MUST be instantly identifiable by an admin scanning a list.

**See full naming conventions:** [how-to-measure-feature-impact](~/.claude/skills/how-to-measure-feature-impact/SKILL.md#naming-conventions)

Quick rules:
- Pattern: `{domain}_{surface}_{specific_action}`
- UX-translated: describe what the USER experiences, not what the CODE does
- Hyper-specific: another human must distinguish this from 99 other features at a glance

---

## Step 5 Deep Dive: Adding the Statsig Event

During development, add ONE event per feature:

```javascript
// Frontend: <frontend-repo>/src/utilities/unifiedEventTracking.js
export const APP_EVENTS = {
  // ... existing
  FEATURE_COACHING_CHAT_SOURCE_CITATIONS_SHOWN: 'feature_coaching_chat_source_citations_shown',
};

// Fire on first interaction per session:
trackAppEvent(APP_EVENTS.FEATURE_COACHING_CHAT_SOURCE_CITATIONS_SHOWN, {
  sessionId: currentSessionId,
});
```

For detailed instrumentation including backend events, missing metrics, and edge cases:
**See:** [how-to-measure-feature-impact](~/.claude/skills/how-to-measure-feature-impact/SKILL.md)

---

## Step 9 Deep Dive: Deploy Batch Markers

### The Reality: Features Ship in Batches

Features don't ship individually to production. They accumulate on staging, then merge to production as a batch. This means:

- **The unit of measurement is the deploy batch, not the individual feature**
- You can't isolate "which feature caused the KPI change" within a batch — you measure the batch's collective impact
- Individual feature *adoption* is still tracked per-feature (via Statsig events), but *KPI impact* is measured at the batch level

### Automatic Deploy Markers via Statsig

Every merge of staging → production should automatically fire a Statsig marker. This removes manual labor and creates clean before/after comparison points.

**The deploy marker captures:**

| Field | Value |
|-------|-------|
| `deployId` | Auto-generated unique ID for this deploy |
| `deployTimestamp` | ISO timestamp of production merge |
| `features` | Array of substantive features in this batch (each with their name, primary KPI, prediction) |
| `totalFeatureCount` | How many substantive features in this batch |
| `reviewDueDate` | deployTimestamp + 4 weeks |
| `status` | `pending_review` → `reviewed` → `archived` |

**The Statsig marker:**
- Fire a `production_deploy` event at deploy time with metadata about the batch
- This creates a clean timestamp in the Statsig timeline for all metrics
- Enables automatic before/after contrast on any metric without manual date selection

### Per-Feature Predictions Within a Batch

Each substantive feature still gets its own prediction (written during step 2), but they're grouped under the deploy batch:

```
Deploy Batch: 2026-02-15T14:30:00Z
├── feature_coaching_chat_source_citations_shown
│   Primary: coaching_replies_per_logged_in_user (+15%)
│   Secondary: words_shared_per_session (+10%)
├── feature_onboarding_page_goal_selection_carousel
│   Primary: visitor_to_trial_rate (+8%)
│   Secondary: funnel_stage_velocity (+5%)
└── feature_settings_sidebar_memory_tier_upgrade_prompt
    Primary: trial_to_paid_rate (+3%)
    Secondary: distinct_features_per_logged_in_user (+5%)
```

At the 4-week review, you evaluate the batch's KPI impact collectively, then cross-reference individual feature adoption to reason about which features likely drove the change.

### What This Means for the Review

- **Batch-level question:** "Did this deploy improve our KPIs?"
- **Feature-level question:** "Which features in this batch got adopted?"
- **Synthesis:** If batch KPIs improved and Feature A had 45% adoption but Feature B had 3% adoption, Feature A likely drove the change
- **If batch KPIs declined:** All features in the batch are suspects. Check adoption of each to narrow the investigation.

This marker is what powers the 4-week review. Without it, there's nothing to evaluate against.

---

## Step 10 Deep Dive: The 4-Week Review

At 4 weeks post-deploy, every marked feature gets reviewed. This is NOT a pass/fail — it's a calibration exercise.

### The Evaluation Matrix

| Adoption | Primary KPI | What it means | Action |
|----------|-------------|---------------|--------|
| High (>30% of logged-in users touched it) | Improved | **Success.** Feature works and users found it. | Log win. Note prediction accuracy. |
| High | Flat | **Product gap.** Users found it but it didn't move the needle. | Investigate: is the feature solving a real problem? |
| High | Declined | **Possible harm.** Users found it and something got worse. | Urgent: investigate if feature caused regression or if external factor. |
| Low (<30%) | Improved | **Indirect benefit.** Small group using it but it's powerful for them. | Consider: is this a power-user feature? That's fine. |
| Low | Flat | **Discovery problem OR irrelevant feature.** | Run discovery advisory (see atomic skill). |
| Low | Declined | **Investigate correlation vs causation.** Low usage + decline is likely coincidental. | Check for external factors. Don't blame the feature without evidence. |

**IMPORTANT:** The 30% threshold is a reasoning aid, NOT a cutoff. A feature used by 5% of users that 10x'd their engagement is a massive win. Always reason about the numbers in context.

### Discovery Advisory

When adoption is low and you suspect a discovery problem, the agent should:

1. **Identify the feature's entry points** — how does a user currently reach this feature?
2. **Assess discoverability friction** — is it buried? Behind a menu? Only visible in certain states?
3. **Generate discovery proposals** with considerations:
   - Could it be surfaced in onboarding?
   - Could a changelog/spotlight announcement drive awareness?
   - Could a contextual tooltip introduce it at the right moment?
   - Could the feature be moved to a more visible surface?
   - Is the entry point named in a way users would look for?
4. **Present to admin as a prioritized list** — each proposal with expected adoption lift and implementation effort

**See full evaluation and advisory protocol:** [how-to-measure-feature-impact](~/.claude/skills/how-to-measure-feature-impact/SKILL.md#evaluation-protocol)

---

## The Metrics (All Normalized to % of Logged-In Users)

**CRITICAL:** Every metric below is expressed as a ratio per logged-in user. Raw counts are meaningless because traffic fluctuates with marketing spend. Gating to logged-in users filters bots and normalizes for acquisition volume.

### Engagement (Positive Signals)
| Metric | What it measures | Why it matters |
|--------|-----------------|----------------|
| **Coaching replies per logged-in user** | Central engagement | This is the heartbeat. If this is up, the product is working. |
| **Words shared by user per session** | Depth of engagement | Long writing = trust + investment in the coaching relationship. |
| **Total feature interactions per logged-in user** | Breadth of engagement | Are users exploring the product? Each named feature fires a Statsig event. |
| **Distinct features used per logged-in user** | Diversity of engagement | Of N named features, how many did this user touch? |

### Funnel Velocity (Conversion Signals)
| Metric | What it measures | Why it matters |
|--------|-----------------|----------------|
| **Visitor → trial conversion rate** | Compelling enough to try? | Top of funnel health. |
| **Trial → paid conversion rate** | Proving value fast enough? | Product-market fit signal. |
| **Stage progression speed** | Time between funnel stages | Faster = more momentum = less drop-off. |

### Negative Signal (Separate Track)
| Metric | What it measures | Why it matters |
|--------|-----------------|----------------|
| **Churn rate** | Users who leave | Tracked INDEPENDENTLY as a negative signal. A feature could increase engagement AND increase churn (e.g., cognitive overload). Both signals must be visible separately. |

---

## When to Use A/B Testing Instead

**Default: Ship to all. Measure with time-series.**

Exception — use a real A/B test (Statsig experiment with holdout) when:
- **Pricing / paywall changes** — directly affects revenue, easy to get wrong
- **Core coaching interaction changes** — if the coaching experience itself changes (not additions, but modifications to existing behavior)
- **You genuinely don't know if it helps or hurts** — and the risk of shipping a harmful change to 100% is too high

For A/B test setup, see: [how-to-create-manage-and-run-statsig-experiments](~/.claude/skills/how-to-create-manage-and-run-statsig-experiments/SKILL.md)

---

## Related Skills

| Skill | When to use |
|-------|-------------|
| [how-to-measure-feature-impact](~/.claude/skills/how-to-measure-feature-impact/SKILL.md) | Atomic: naming, flags, evaluation, discovery advisory, edge cases |
| [how-to-create-a-new-statsig-kpi-and-confirm-it-works](~/.claude/skills/how-to-create-a-new-statsig-kpi-and-confirm-it-works/SKILL.md) | When the metric you need doesn't exist yet |
| [how-to-create-manage-and-run-statsig-experiments](~/.claude/skills/how-to-create-manage-and-run-statsig-experiments/SKILL.md) | When you DO need a real A/B test (pricing, core coaching changes) |
| [leverage-predictor](~/.claude/skills/leverage-predictor/SKILL.md) | Predicting highest leverage move before ideation |
| [intent-db](~/.claude/skills/intent-db/SKILL.md) | Alignment check against documented UX intentions |
| [ux-assignment-generator](~/.claude/skills/ux-assignment-generator/SKILL.md) | Generating UX verification assignments |
