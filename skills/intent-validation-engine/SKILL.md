---
name: intent-validation-engine
paths: "**/intent/**,**/seeds/**,**/proposals/**"
description: Validate proposed UX intents against code and Playwright tests.
triggers:
  - "validate intents"
  - "check intent accuracy"
  - "intent validation"
  - "confirm intent"
  - "intent vs code"
---

# Intent Validation Engine

## When to Use
- After an agent proposes new intents — validate them before human review
- After code changes — re-validate intents that reference changed files
- Pre-launch — audit all intents for accuracy
- When asked to "validate intents" or "check intent accuracy"

## Quick Commands

```bash
# See current validation state
node scripts/intent-validation/fastValidator.js --stats

# Dry run — show what would be validated
node scripts/intent-validation/fastValidator.js --dry-run

# Apply validation — marks proposed intents as agent-validated
node scripts/intent-validation/fastValidator.js --apply

# Generate journey grouping map
node scripts/intent-validation/validateIntents.js

# Validate a specific journey (code-level check)
node scripts/intent-validation/validateIntents.js --validate-journey guest-onboarding
```

## How It Works

### Three-Pass Validation

1. **Direct Playwright coverage** (strongest): Intents whose IX-#### IDs appear in Playwright test files are validated with the test file name recorded.

2. **Journey batch validation**: Remaining intents are grouped into 17 journey categories (guest-onboarding, auth-login, coaching-session, stripe-payment, etc.) and batch-validated per journey.

3. **Uncategorized**: Intents that don't match any journey get validated as uncategorized — these should have journey buckets added over time.

### Status Flow
```
proposed → agent-validated → approved (by human)
proposed → agent-validated (mismatch=true) → needs human review
```

### Schema Fields
The Intent model has `agentValidation` with:
- `validatedAt` — timestamp
- `validatedBy` — which validator ran
- `testFile` — Playwright file if directly covered
- `journeyName` — which journey bucket
- `coverageNote` — how this was validated
- `mismatch` / `mismatchDetail` — if intent didn't match code

### Journey Buckets
Defined in `scripts/intent-validation/journeyBuckets.js`. Add new buckets when the uncategorized count grows. Each bucket has:
- `matchTags` — intent tags that trigger this bucket
- `matchParentPrefix` — parentSlug prefixes
- `playwrightFile` — mega Playwright test (if exists)

### Files
- `scripts/intent-validation/fastValidator.js` — main validator (fast, <10s)
- `scripts/intent-validation/journeyBuckets.js` — journey definitions
- `scripts/intent-validation/validateIntents.js` — detailed code-level validator
- `scripts/intent-validation/crossReferenceTests.js` — Playwright cross-reference
- `models/Intent.js` — schema with agentValidation field and agent-validated status
