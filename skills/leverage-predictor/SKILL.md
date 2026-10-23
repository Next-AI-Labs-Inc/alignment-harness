---
name: leverage-predictor
description: "Predict the next highest leverage move for the codebase. Use when asked 'what should we work on next', 'highest impact task', 'leverage prediction', or proactively after completing a major task. Agents analyze codebase state and propose strategic improvements."
---

# Leverage Predictor

Identify the highest-impact work opportunity. This skill is about **analysis and identification** - for submission workflow, use `how-to-submit-and-track-proposals`.

## When to Use

- After completing a major task
- When asked "what should we work on next"
- When asked for "highest impact" or "leverage prediction"
- Proactively when you notice opportunities

## Workflow

### 1. Analyze Current State

Before proposing, gather context:
- Recent user feedback/bugs
- Analytics on user drop-off
- Known pain points
- Technical debt blocking features
- Recent commits/changes

### 2. Score Opportunities (0-100)

| Factor | Weight | Questions |
|--------|--------|-----------|
| User Impact | 40% | How many users affected? How badly? |
| Business Value | 30% | Revenue, retention, conversion impact? |
| Effort Efficiency | 20% | Impact per hour of work? |
| Risk Reduction | 10% | Prevents future outages/bugs? |

**Threshold**: Only propose items scoring ≥60. Below that, skip.

### 3. Categorize

| Type | When to Use |
|------|-------------|
| `leverage-prediction` | Strategic next move |
| `seo-improvement` | Search visibility |
| `ux-refinement` | User experience |
| `intent-doc` | Missing documentation |
| `bug-hypothesis` | Suspected bug |
| `performance-fix` | Speed improvement |
| `refactor-suggestion` | Code health |

### 4. Write in Human-Legible Format (MANDATORY)

Every proposal MUST lead with a "What is actually happening to real people" section BEFORE any technical content. This is the /align communication format. The admin reads this section and instantly understands the problem without any code knowledge.

**Rules for the human-legible section:**
- ZERO code, variable names, function names, file paths, or technical jargon
- Describe the broken or missing experience from the perspective of a real person using the product
- Frame as: "When a person does X, they experience Y. What should happen is Z."
- Include certainty scores using emoji dots: 🔴 (<60%) 🟡 (60-69%) 🔵 (70-79%) 🟣 (80-89%) 🟢 (90%+ verified)
- Each claim gets: `{plain language claim} {emoji} {unique id number} {percent}%`
- Include a "Where this came from" section listing artifact IDs, knowledge atom IDs, intent doc slugs, or commit hashes that back each claim
- ALL technical detail (scoring tables, code references, fix paths) goes BELOW the human-legible section under a "## Technical Detail" header

**Structure:**
```
---
frontmatter with sources: field listing every artifact/KA/intent referenced
---

## What is actually happening to real people

[1-3 paragraphs, plain language, no code]

### How confident am I in this

[Certainty dots per claim]

### Where this came from

[Source references table]

---

## Technical Detail (agent reference)

[Scoring, code references, fix paths — everything technical goes here]
```

If you are writing proposals to `<api-repo>/docs/intent/proposed/`, check for a TEMPLATE.md in that directory and follow it.

### 5. Submit for Human Review

Use the `how-to-submit-and-track-proposals` skill to:
1. POST the proposal with your analysis
2. Store the returned proposal ID
3. Track status and respond to feedback
4. Claim and implement when approved

## Good Proposal Examples

✅ **Title:** "Fix checkout abandonment at payment step"
- **Reasoning:** Analytics show 30% drop at payment. Users report confusion.
- **Impact:** Reduce abandonment by 15%, increase conversions
- **Priority:** 90

✅ **Title:** "Add export feature to coaching sessions"
- **Reasoning:** Top requested feature in feedback. Users want to share with therapists.
- **Impact:** Increase retention, word-of-mouth referrals
- **Priority:** 70

## Anti-Patterns (DO NOT Propose)

❌ "Refactor X to be cleaner" (no user impact stated)
❌ "Add TypeScript to Y" (no business value)
❌ "Update dependencies" (maintenance, not leverage)
❌ "Add more tests" (unless blocking a feature)

## Golden Rule: Business Impact First

**NEVER** propose:
- Pure refactoring without user impact
- "Nice to have" improvements
- Tech debt that doesn't affect users
- Over-engineering

**ALWAYS** propose:
- Changes that unblock user value
- Fixes for known user pain points
- Features that increase retention/conversion
- Performance wins users will notice

## Agent Command (for prompts)

```
After completing this task, use the leverage-predictor skill to identify the next highest-leverage opportunity. Score by user impact (40%), business value (30%), effort efficiency (20%), risk reduction (10%). Only propose items scoring ≥60. Submit via how-to-submit-and-track-proposals skill.
```

## Human Review

Proposals appear at: `alignment-harness proposal list`

Human can approve, reject, defer, or add notes for clarification.
