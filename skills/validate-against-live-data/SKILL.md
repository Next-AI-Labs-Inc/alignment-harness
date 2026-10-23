---
name: validate-against-live-data
description: Pattern for validating code correctness by auditing against real production data.
triggers:
  - "validate against live data"
  - "audit real customers"
  - "can we trust this code"
  - "does this work on real users"
  - "run against production data"
  - "validate resolver"
  - "audit production"
  - "trust this resolver"
  - "check against stripe"
  - "verify billing accuracy"
---

# Validate Against Live Data

## When to Use This Pattern

Use this whenever code makes decisions about **real users or real money**:

- Access tier resolvers (who gets premium vs free)
- Billing/entitlement systems (who is paying, who is trialing)
- Subscription state machines (status transitions)
- Permission gates (who can access what)
- Pricing logic (what does a user owe)
- Any resolver that reads from an external system (Stripe, Firebase, etc.) and makes a determination

**The core question**: "If I run this function against every real customer, does it return the right answer for all of them?"

Unit tests prove logic works in isolation. This pattern proves it works **on the actual messy data in production**.

## Why Unit Tests Are Not Enough

Real data has properties that test fixtures never capture:

- Users with multiple Stripe customers (email reuse, test-then-live migrations)
- Stale DB fields that contradict the external system
- Edge statuses like `incomplete_expired`, `paused`, `past_due` that nobody wrote tests for
- Records matched by email fallback instead of primary key
- External system records with no matching internal record at all
- Data created by old code paths that no longer exist

You cannot anticipate these in test fixtures. You must discover them empirically.

## The Progression Strategy

### Round 1: Start Small (20 records)

Purpose: Shake out script bugs and find the most obvious resolver failures.

```
node scripts/audit-resolver-accuracy.js 20
```

At this scale you will find:
- Script connectivity issues (wrong DB, wrong API key)
- Obvious resolver bugs (entire status categories returning wrong tier)
- Missing error handling in the resolver itself

Fix everything found. Then proceed.

### Round 2: Medium Scale (50-100 records)

Purpose: Find issues that only appear with more data diversity.

```
node scripts/audit-resolver-accuracy.js 50
node scripts/audit-resolver-accuracy.js 100
```

At this scale you will find:
- Multi-entity resolution issues (user has 2+ Stripe customers)
- Email fallback matches (DB has wrong primary key but email still works)
- Status edge cases that only exist on a few real accounts
- External records with no internal match (orphaned Stripe customers)

### Round 3: Full Audit (ALL records)

Purpose: Achieve 100% coverage and confirm production-grade reliability.

```
node scripts/audit-resolver-accuracy.js all
node scripts/audit-resolver-accuracy.js all quiet   # failures-only output for large runs
```

At this scale you will find:
- Long-tail edge cases (1 in 200 accounts)
- Performance issues in the resolver (API rate limits, N+1 queries)
- The true accuracy number for the system

**Each round reveals issues that were invisible at smaller scale.** Do not skip rounds.

## How to Structure the Audit Script

### Template Structure

```
scripts/audit-<system>-accuracy.js
```

Every audit script follows this skeleton:

```javascript
#!/usr/bin/env node
/**
 * <SYSTEM> ACCURACY AUDIT
 * =======================
 * Queries <EXTERNAL SYSTEM> for all real records, matches to internal DB,
 * runs the REAL <resolver/function> against each, compares to expected output.
 *
 * Usage:
 *   node scripts/audit-<system>-accuracy.js           # Last 20 (default)
 *   node scripts/audit-<system>-accuracy.js 50        # Last 50
 *   node scripts/audit-<system>-accuracy.js all       # ALL records
 *   node scripts/audit-<system>-accuracy.js all quiet # Failures only
 */

// ─── STEP 0: Environment Guard ─────────────────────────────────────────────
// ALWAYS verify you are pointing at the right external system.
// For billing audits, REQUIRE a live key — never audit test data by accident.

// ─── STEP 1: Fetch from External System (paginated) ────────────────────────
// Paginate through ALL records. Never rely on a single page.
// Show progress for large fetches.
// Respect rate limits with small delays between pages.

// ─── STEP 2: Fetch Secondary Records ───────────────────────────────────────
// Some systems have multiple record types (subscriptions + one-time purchases).
// Fetch all relevant types.

// ─── STEP 3: Build Audit List (deduplicated) ───────────────────────────────
// Dedupe by primary key (e.g., customer ID).
// For each record, compute the EXPECTED output based on its external state.
// This expected mapping is the test oracle.

// ─── STEP 4: Run the Real Resolver Against Each Record ─────────────────────
// For each external record:
//   a. Find matching internal record (try primary key, then fallback keys like email)
//   b. Run the ACTUAL resolver/function (not a mock, not a simplified version)
//   c. Compare resolved output to expected output
//   d. Log: match/mismatch, evidence, resolver confidence, match method

// ─── STEP 5: Summary Report ────────────────────────────────────────────────
// Total records, found in DB, not in DB
// Correct resolutions (passes)
// Mismatches/errors (failures) — with full detail per failure
// Special categories (multi-entity hits, email fallback matches)
// Accuracy percentage
// Exit code: 0 if clean, 1 if any failures
```

### Key Implementation Details

**Environment Guard**: For billing/money systems, require the live API key explicitly. Check that it contains `_live_` or equivalent. Refuse to run with test keys — you are auditing real data, not test fixtures.

```javascript
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY_PRODUCTION || process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY || !STRIPE_KEY.includes('_live_')) {
  console.error('ERROR: No live Stripe key found. This audit MUST run against real customer data.');
  process.exit(1);
}
```

**Pagination**: External APIs paginate. Always auto-paginate to get ALL records. Show progress counters for long fetches.

```javascript
let allRecords = [];
let hasMore = true;
let cursor = undefined;

while (hasMore) {
  const batch = await externalApi.list({
    limit: 100,
    ...(cursor ? { starting_after: cursor } : {}),
  });
  allRecords.push(...batch.data);
  hasMore = batch.has_more;
  cursor = batch.data[batch.data.length - 1]?.id;
  await delay(100); // Respect rate limits
}
```

**Deduplication**: One external entity may appear in multiple record types. Dedupe by the primary identifier before running the resolver.

**Matching Strategy**: Try the canonical key first, then fall back to secondary keys. Track HOW each record was matched — this itself reveals data integrity issues.

```javascript
let user = await User.findOne({ stripeCustomerId: item.customerId });
let matchedBy = 'primary_key';

if (!user && item.email) {
  user = await User.findOne({ email: item.email });
  matchedBy = 'email_fallback';  // This is a data integrity signal
}
```

**Run the REAL function**: Import and call the actual production resolver. Do not reimplement its logic in the audit script. The whole point is to test the real code path.

```javascript
const { resolveEntitlementState } = require('../resolvers/gen3/resolveEntitlementState');
const resolution = await resolveEntitlementState(user, { isLoggedIn: true });
```

**Rate Limiting**: The resolver itself may call external APIs. Add small delays between resolver calls in large audits to avoid hitting rate limits.

**Exit Code**: Exit with code 1 if any failures. This lets the script serve as a CI gate or regression check.

## What to Look For in Results

### Mismatches
The primary signal. A mismatch means the resolver returned a different answer than what the external system state implies. Every mismatch needs investigation — it is either a resolver bug or a wrong expectation in the test oracle.

### Not-Found Records
External records with no matching internal record. These may be:
- Test accounts created directly in the external system
- Deleted users whose external records were not cleaned up
- Users who started checkout but never completed registration
- A data integrity gap worth understanding even if not a resolver bug

### Multi-Entity Hits
Users matched via fallback (e.g., email search found a subscription on a different Stripe customer than the one stored in the DB). These indicate:
- Users who have created multiple external accounts
- Migration artifacts (test-mode customer vs live-mode customer)
- The resolver's fallback logic is doing real work on real data

### Email Fallback Matches
Records found only by email, not by the stored primary key. This means the DB has stale or wrong primary keys. The resolver may be compensating, but the underlying data should be fixed.

### Resolver Errors
The resolver itself throws an exception for certain records. These are bugs that only surface on specific data shapes.

## Handling Environment Differences

### Test vs Live Keys
Many external systems have separate test and live modes (Stripe, Firebase, etc.). The audit script must be explicit about which mode it targets.

For billing audits: **always require the live key**. Auditing test data tells you nothing about production accuracy.

For non-billing systems: you may want to audit both. Run the script twice with different env vars.

### Database Environment
The audit connects to a real database. Ensure `MONGODB_URI` (or equivalent) points to the right environment. For production audits, this should be the production database.

### Safeguards
The audit script is READ-ONLY. It must never write to the database or external system. It only reads and compares. This makes it safe to run against production at any time.

## After the Audit

### The Script Becomes a Permanent Tool

Once the audit script works and shows 100% accuracy:

1. **Keep it in the repo** as a regression tool
2. **Run it before deploying resolver changes** to catch regressions
3. **Run it periodically** (monthly or after data migrations) to catch drift
4. **Use it as evidence** when someone asks "can we trust this code?"

### Documenting Results

After a full audit pass, the summary is your proof of correctness:
```
Total Stripe customers:     <total>
Found in MongoDB:           <found>
Not in MongoDB:             <not found>
Correct resolutions:        <found>
Mismatches/Errors:            0
Accuracy:                   100%
```

This is stronger evidence than any number of unit tests.

## Working Example

**Reference implementation**: `scripts/audit-resolver-accuracy.js`

This script:
- Audits the entitlement state resolver against all Stripe subscriptions and lifetime purchases
- Supports 20 / 50 / 100 / all / all quiet modes
- Requires a live Stripe key (refuses to run in test mode)
- Finds users by stripeCustomerId with email fallback
- Runs the real `resolveEntitlementState()` against each user
- Reports mismatches, not-found, multi-customer hits, and email fallback matches
- Exits with code 1 on any failure

The pattern discovered 3 real bugs across 4 audit rounds:
1. Round 1 (20): Found that `incomplete_expired` status was not handled
2. Round 2 (50): Found multi-customer resolution was needed (users with 2+ Stripe customers)
3. Round 3 (all): Confirmed 100% accuracy after fixes on all matched records

## Checklist for New Audit Scripts

- [ ] Environment guard: require the correct API key mode
- [ ] Paginate through ALL external records (not just first page)
- [ ] Fetch all relevant record types from the external system
- [ ] Dedupe by primary identifier
- [ ] Compute expected output for each record (the test oracle)
- [ ] Find matching internal record with primary key + fallback strategy
- [ ] Run the REAL resolver/function (not a reimplementation)
- [ ] Compare resolved vs expected, log full evidence on mismatch
- [ ] Track match method (primary key vs fallback) as a data quality signal
- [ ] Add rate limiting delays for large audits
- [ ] Show progress for large runs
- [ ] Support quiet mode (failures-only output)
- [ ] Summary with counts: total, found, not-found, pass, fail, accuracy %
- [ ] Exit code 1 on any failure
- [ ] Script is purely read-only (never writes to DB or external system)
