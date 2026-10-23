---
name: intent-leverage-audit
paths: "**/intent/**,**/seeds/**,**/proposals/**"
description: Audit Intent DB items by leverage priority. Fetch highest-priority unvalidated intents, verify code still matches UX promises,
triggers:
  - "audit intents"
  - "validate leverage"
  - "check happy-path intents"
  - "intent audit"
  - "leverage audit"
  - "what needs validation"
---

# Intent Leverage Audit

## When to Use

When an agent or human wants to systematically validate that the highest-leverage intents in the Intent DB still match reality. The system surfaces unvalidated intents sorted by priority so you always work on what matters most first.

## Prerequisites

- API key: `$DEVELOPER_API_KEY` (use as `x-api-key` header)
- Base URL: determined by environment (localhost:<your-port> for local, staging/prod URLs for deployed)

## The Atomic Loop

### Step 1: Fetch Batch

**Preferred — CLI tool:**
```bash
node <api-repo>/scripts/agentic-tools/intentLeverageCli.js --limit 10 --not-validated-in 7
node <api-repo>/scripts/agentic-tools/intentLeverageCli.js --limit 10 --unvalidated
node <api-repo>/scripts/agentic-tools/intentLeverageCli.js --limit 5 --tag happy-path
node <api-repo>/scripts/agentic-tools/intentLeverageCli.js --slug SLUG --brief
```

**Raw API (if CLI unavailable):**
```bash
curl -s "BASE_URL<your-intent-db-api>?sort=leverage&notValidatedSince=7&limit=10" \
  -H "x-api-key: $DEVELOPER_API_KEY"
```

**IMPORTANT:** The mount path is `<your-intent-db-api>`, NOT `/api/admin/intent-db`.

Returns up to 10 intents that either:
- Have NEVER been validated (`lastValidatedAt` is null)
- Were last validated MORE than 7 days ago

Sorted by `effectiveScore` descending — highest leverage first.

If the response returns 0 items, all intents are validated within the last 7 days. Done.

### Step 2: For Each Intent — Audit

For each intent in the batch:

#### 2a. Get the alignment brief

```bash
curl -s "BASE_URL<your-intent-db-api>/agent/alignment-brief/SLUG" \
  -H "x-api-key: $DEVELOPER_API_KEY"
```

This returns ~500 tokens with:
- `coreRules` — the key rules this intent establishes
- `neverDo` — critical constraints ("never" statements)
- `uxContracts` — WHEN/THEN promises to users

#### 2b. Read the code

If the full intent (from step 1 data) has `filePaths` or `sourceReferences`:
- Read each referenced file
- Check: does the code still implement the UX promises?
- Look for `@intent: IX-###` tags in the code that reference this intent

If no file references exist:
- Search the codebase for the intent's slug or intentId in code comments
- Use grep for key terms from the intent's primaryIntent

#### 2c. Assess alignment

Ask yourself:
- **ALIGNED**: Code matches all uxPromises. No violations found.
- **VIOLATED**: Code contradicts or doesn't implement a uxPromise. Describe which promise is broken and why.
- **UNCLEAR**: Not enough information to determine. File paths may be stale or intent may need updated references.
- **STALE INTENT**: The intent itself is outdated (references removed features, deprecated patterns, etc.)

### Step 3: Mark Validated

#### If ALIGNED:

```bash
curl -s -X POST "BASE_URL<your-intent-db-api>/agent/validate-leverage/SLUG" \
  -H "x-api-key: $DEVELOPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "validatedBy": "YOUR_AGENT_NAME" }'
```

#### If VIOLATED, UNCLEAR, or STALE:

Still mark validated (you DID check it), then **log a bug proposal**.

> [!important] Canonical path for the finding (2026-06-18 the user directive): file it as an **Obsidian vault note** — one `.md` per finding in `<api-repo>/docs/intent/1.7_proposed/{ID}-{slug}.md` with `cssclass: proposal`, `tags: [proposal]`, `status: needs-review`, `type: proposal`, `leverage_score`, so the canonical `1 - Open Proposals` dashboard surfaces it for batch review in Obsidian. Use `/propose` to author it well. The legacy DB-API POST below still works and is preserved as a **search surface**, but the Obsidian note is where the user now reviews — prefer it for new findings.

If the `<api-repo>/docs/intent/1.7_proposed/` folder does not exist, create it.

```bash
# 1. Validate (timestamps the check — you DID audit it)
curl -s -X POST "BASE_URL<your-intent-db-api>/agent/validate-leverage/SLUG" \
  -H "x-api-key: $DEVELOPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "validatedBy": "YOUR_AGENT_NAME" }'

# 2. (LEGACY/SEARCH-SURFACE — prefer the Obsidian note above for new findings)
#    Log the finding as an Agent Proposal (bug-hypothesis) in the DB API:
curl -s -X POST "BASE_URL<your-proposal-create-api>" \
  -H "x-api-key: $DEVELOPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "proposalType": "bug-hypothesis",
    "title": "Violation: INTENT_TITLE",
    "description": "WHAT_IS_WRONG — expected vs actual behavior",
    "reasoning": "WHY_THIS_MATTERS — reference the UX promise that is broken",
    "expectedImpact": "WHO_IS_AFFECTED — e.g. all users on checkout, only free tier, etc.",
    "priority": LEVERAGE_EFFECTIVE_SCORE,
    "linkedIntents": [{
      "slug": "INTENT_SLUG",
      "title": "INTENT_TITLE",
      "citedRule": "THE_SPECIFIC_UX_PROMISE_VIOLATED",
      "alignmentType": "violates"
    }],
    "targetFiles": ["path/to/violating/file.js"],
    "createdBy": "YOUR_AGENT_NAME",
    "alignmentDomain": "INTENT_PARENT_SLUG_OR_DOMAIN",
    "notes": [{
      "text": "Expected: WHAT_UX_PROMISE_SAYS\nActual: WHAT_CODE_DOES\nEvidence: FILE:LINE or grep match",
      "authorType": "agent",
      "authorId": "YOUR_AGENT_NAME"
    }]
  }'
```

**Key fields:**
- `priority` = copy from `intent.leverage.effectiveScore` (inherits leverage ranking so highest-leverage violations sort first in batch review)
- `alignmentType: "violates"` = marks the intent relationship as a violation (vs 'supports', 'implements', etc.)
- `targetFiles` = the specific files where the violation lives (helps human reviewer navigate quickly)
- `citedRule` = the specific UX promise or uxContract that is broken (not just "it's wrong")

**For UNCLEAR or STALE intents** (not code bugs, but intent hygiene issues):
Use `proposalType: "intent-doc"` instead of `"bug-hypothesis"`, and `alignmentType: "questions"` instead of `"violates"`.

**Batch review:** Human reviews at `GET <your-proposals-api>?type=bug-hypothesis&status=pending-review` or in the Admin UI at `/admin2/proposals`.

### Step 4: Repeat

Go back to Step 1. The `notValidatedSince=7` filter means intents you just validated will no longer appear. The list shrinks each cycle.

## Swarm Deployment Pattern

For maximum throughput, a parent agent can:

1. Fetch batch of 10
2. Dispatch 10 parallel subagents (one per intent)
3. Each subagent runs Steps 2-3 independently
4. Parent collects results, logs summary
5. Fetch next batch, repeat

Preload each subagent with the alignment brief from Step 2a (since subagents may not have MCP tools).

## Output Format

After each batch, report:

```
## Leverage Audit Batch N
| # | Score | Slug | Status | Finding | Proposal |
|---|-------|------|--------|---------|---------|
| 1 | 88.32 | post-payment-registration-resilience | ALIGNED | Code correctly handles failed registration after payment | — |
| 2 | 87.30 | auth-failures-fail-open-never-crash | VIOLATED | ErrorBoundary in AuthProvider catches but doesn't redirect — infinite blank screen | Created: 67b... |
...

Validated: X/10 | Violations: Y (proposals created) | Unclear: Z
Next batch: [fetch URL]
```

Proposals are reviewable at `/admin2/proposals?type=bug-hypothesis` sorted by priority (inherited from leverage score).

## Related Skills

- `intent-alignment-audit` — broader audit that cross-refs intent DB vs code @intent: tags vs test headers
- `validate-against-live-data` — pattern for checking code correctness against reality
- `verify-ux-assignment-state` — verify simulator paths still work
- `how-to-submit-and-track-proposals` — full Agent Proposals workflow (create, claim, implement, close)

## Bug Logging Reference

**Create endpoint:** `POST <your-proposal-create-api>` (accepts `x-api-key` header)
**Admin review UI:** `/admin2/proposals`
**Query by type:** `GET <your-proposals-api>?type=bug-hypothesis&status=pending-review`
**Query by linked intent:** `GET <your-proposals-api>?linkedIntent=SLUG` (if supported) or use proposals-by-intent: `GET /api/admin/intent-db/agent/proposals-by-intent/SLUG`

**Priority inheritance:** Always set `priority` = `intent.leverage.effectiveScore` when creating violation proposals. This ensures the `/admin2/proposals` page sorts bugs by the same leverage ranking the audit uses — highest-impact violations surface first for human review.

## Leverage Score Reference

| Score | Priority | What Lives Here |
|-------|----------|-----------------|
| 70-100 | CRITICAL | Checkout, auth, payment safety — audit first |
| 50-69 | HIGH | Feature gates, upgrade flows, first experiences |
| 30-49 | MODERATE | Funnel classification, communication |
| 10-29 | LOW | Analytics, infrastructure |
| 1-9 | NOISE | Admin cosmetics — audit last or skip |

## Success Signals

1. **Fetch batch returns sorted data** (not auth error):
```json
{
  "success": true,
  "data": [ "... 10 intents ..." ],
  "count": 10,
  "meta": { "sort": "leverage", "filters": {} }
}
```
Top item should be ~88 (`post-payment-registration-resilience`), not random order. Unscored intents (null effectiveScore) are excluded from leverage sort.

2. **The `notValidatedSince=7` filter shrinks over time:**
   - First run: returns unvalidated intents sorted by score
   - After validation: those intents disappear from the query
   - Eventually returns `"count": 0` — everything validated

3. **Each validate call returns the timestamp:**
```json
{
  "success": true,
  "data": { "slug": "...", "leverage": { "lastValidatedAt": "2026-02-22T..." } },
  "meta": { "message": "Leverage validated by audit-agent at ..." }
}
```

4. **Audit report table appears** after each batch of 10.

## Red Flags (Something's Wrong)

| Symptom | Cause | Fix |
|---------|-------|-----|
| `AUTH_HEADER_MISSING` | Wrong header name | Use `x-api-key` (also accepts `x-developer-key`, `x-developer-api-key`) |
| `"count": 0` immediately | No scored intents, or all validated within window | Try without `notValidatedSince`, or without `tag` filter |
| Intents not sorted by score | Used wrong sort param | Must use `sort=leverage` |
| Unscored intents at top | Controller bug (fixed Feb 2026) | `sort=leverage` now excludes null-score intents |
| `[object Object]` in filePaths | sourceReferences stored as objects not strings | Access `.path` property, not the object directly |
| Agent skipping code reads | No filePaths on intent | Fall back to grep for slug/intentId in code comments |
| `lastValidatedAt` set but no audit happened | Scoring script was stamping validation | Fixed Feb 2026 — `assign-leverage-scores.js` no longer sets `lastValidatedAt` |

## Self-Healing Directive

Skill files and agent tools are meant to be self-healing. If you are using a tool that appears to be broken or causing extra steps required, define the fix and propose deploying a sub agent to perform that fix to the user. Do not silently work around broken tooling — fix it or flag it.
