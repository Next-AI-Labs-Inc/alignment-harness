---
name: agentic-prelaunch-audit
description: "Run 8-phase pre-launch audit: compaction, intent alignment, TDD, test health. Use when preparing any branch for prod."
triggers:
  - "prelaunch audit"
  - "launch readiness"
  - "pre-deploy check"
  - "go-live audit"
---

# Agentic Pre-Launch Audit

## Release-prep flow (2026-10-12): `staging-pre-launch` is where the one-time check lives

Why: staging takes about 100 pushes a day, so heavy GitHub checks (Jest, a full site build, dependency install, dated-claims) now run once at release prep instead of on every staging push. The user, 2026-10-12: "a new branch called staging-pre-launch that we only push to when prepping for production like staging was always intended to be".

- Day-to-day: agents keep pushing to `staging`. No heavy CI runs on that.
- Release prep, per repo (`origin` for api and landing, `nextai` for frontend):

```bash
cd <projects-dir>/<repo>
git push <remote> staging:staging-pre-launch        # the pre-push hook in api asks for a fresh launch-readiness audit first
gh pr create --repo <your-org>/<repo> --base main --head staging-pre-launch \
  --title "Release: staging-pre-launch → main $(date +%Y-%m-%d)" --body "Pre-launch review compaction: pre-launch-pr-eval-$(date +%Y-%m-%d)"
# PR already open? Just push again; the same PR refreshes.
```

- The release PR is `staging-pre-launch → main`. Heavy checks run there, on pushes to `staging-pre-launch`, and by hand (Actions tab, Run workflow). A pull request whose head is `staging` is skipped.
- In api the same Mongo launch-readiness audit gate that guards `main` now also guards a push to `staging-pre-launch` (`node scripts/validate-launch-readiness.js`, fresh within 24 hours, for the current commit). Run this audit's phases first.
- GitHub billing has to be unblocked once (a low spending cap is fine) or these runs will not start at all.

## ⚡ Step −1 (MANDATORY, runs before Phase 0): SEO surface conformance

Nothing launches while an SEO surface is misconfigured. Run:

```bash
cd <projects-dir>/frontend && npm run seo:check
```

Exit 1 means a live blocker — a reader or crawler is experiencing it right now. Every finding
carries its own exact fix; no interpretation needed.

Why this is here: `/insights`, `/changelog`, and `/resource-center` served an empty shell to every
crawler for months and no audit noticed, because nothing declared them SEO surfaces. This check is
static-only — no network, no keys, no build — so there is no cost to running it every time.

## Philosophy

Three months of agent-assisted coding creates a surface area too large for exhaustive manual testing. This skill applies **systematic coverage verification** — every code deviation gets documented, every document gets UX statements, every UX statement gets tests, every test gets run, every failure gets triaged. The output is a ranked list of actionables with confidence scores, not a wall of green checkmarks.

**You are the orchestrator.** You dispatch sub-agents, verify their output, aggregate findings, and present the admin with a prioritized, evidence-backed launch decision.

## Prerequisites

Before starting, the orchestrator MUST:

1. **Read these skills** (they inform your sub-agent dispatches):
   - `agentic-session-compactions` — how compactions work, API, required fields
   - `intent-alignment-audit` — coverage categories, CLI usage

2. **Run `git worktree list`** in each repo — clean up prior agent worktrees first.

3. **Identify the repos in scope**:
   - `api` — `<projects-dir>/api`
   - `frontend` — `<projects-dir>/frontend`
   - `landing` — `<projects-dir>/landing`

4. **Identify the base branch** — usually `main`. All deviations are measured from here.

## Phase 0: Deviation Discovery

**Goal:** Find every code change between the current branch and main across all repos.

### Step 0a: Collect Deviations

For each repo, collect the list of commits that exist on the current branch but not on main:

```bash
cd <projects-dir>/<repo>
git log main..HEAD --oneline --no-merges
```

The branch under audit is normally `staging` (the day-to-day branch); the release goes out as `staging-pre-launch → main`. Measure from `main` either way. If `staging-pre-launch` already exists on the remote, also compare it, so you know what the last release prep carried:

```bash
git fetch <remote> staging-pre-launch 2>/dev/null && git log <remote>/staging-pre-launch..staging --oneline --no-merges | wc -l   # commits on staging not yet in the release branch
```

If the repo IS on main, check for uncommitted/staged changes:
```bash
git diff --name-only
git diff --staged --name-only
```

Also check for untracked files that look like new features:
```bash
git status --porcelain | grep '??'
```

### Step 0b: Map Deviations to Agent Sessions

Each deviation cluster (group of related commits) should map to an agent session. Use commit messages, timestamps, and file groupings to identify logical sessions.

For each identified session, check if a compaction exists:

```bash
# Search compactions by repo + keywords from commit messages
alignment-harness store list compactions --where repo=<repo> | grep -i "<keywords>"
```

### Step 0c: Create Missing Compactions

For any session cluster WITHOUT a compaction, dispatch a sub-agent:

**Sub-agent prompt template:**
```
You are creating an agent session compaction for work that was done but never documented.

REQUIRED: Invoke the `agentic-session-compactions` skill before writing anything.

Repo: <repo>
Commits: <list of commit SHAs and messages>
Files changed: <list of files>

Read every changed file. Read every commit diff. Then create a compaction via:
alignment-harness compaction put --session <sessionId> --json '<compaction>'

Follow the full compaction schema from the skill — including agentReasoning (all 5 fields),
uxStoriesBroughtToReality, principles, and incompleteItems.

The sessionId should be: "prelaunch-audit-<repo>-<first-commit-sha-short>"

CRITICAL: The compaction must contain uxStoriesBroughtToReality entries written as
"When {user does X under Y constraints}, they {experience Z}" — these are the testable
UX statements that Phase 2 will verify.
```

Dispatch one sub-agent per missing session. Run them in parallel.

**Gate:** Do not proceed to Phase 1 until all compactions exist. Verify by re-querying the compactions API.

---

## Phase 1: Alignment Audit

**Goal:** Verify every compaction's UX intent aligns with the Intent DB and company strategy.

### Step 1a: Pull All Compactions for This Audit

```bash
alignment-harness store list compactions --where repo=<repo>
```

Filter to compactions created/updated since the branch diverged from main.

### Step 1b: Cross-Reference Each Compaction

For each compaction, dispatch a sub-agent (batches of 5-10 compactions per agent):

**Sub-agent prompt template:**
```
You are auditing compaction alignment with the Intent DB.

REQUIRED: Invoke the `intent-alignment-audit` skill first.

For each compaction below, do the following:
1. Read the overarchingIntentTitle, targetUxIntentDescription, and uxStoriesBroughtToReality
2. Search agent_find for each UX story to see if a matching intent exists:
   node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<ux story text>"
3. Search the Intent DB directly:
   alignment-harness intent search <keywords>
4. If aligned: note "ALIGNED — matches intent <slug>"
5. If NOT aligned: propose a new intent via:
   alignment-harness intent add --json '<intent>'
   with status: "proposed", leverageScore based on UX impact

Compactions to audit:
<list of compaction sessionIds, titles, and UX stories>

Output format per compaction:
- sessionId: <id>
- alignment: ALIGNED | MISALIGNED | NEW_INTENT_PROPOSED
- matchedIntents: [<slugs>]
- proposedIntents: [<proposed slug + title>]
- reasoning: <why you classified it this way>
- flagForAdmin: true/false (true if MISALIGNED or uncertain)
```

### Step 1c: Aggregate Alignment Results

Collect all sub-agent outputs. For any flagged items:
- Create actionable tasks via `alignment-harness store add task --json '<task>'` with status `proposed` and priority based on UX impact
- Link the compaction sessionId, the intent slugs, and the reasoning
- These surface in the admin UI for review

---

## Phase 2: UX Statement Coverage

**Goal:** Every compaction has complete, testable UX statements covering all changes made.

### Step 2a: Review UX Statements Per Compaction

For each compaction, verify:
1. Every file changed in the associated commits has at least one UX statement that describes the user-facing impact
2. UX statements follow the format: "When {constraints in UX terms} we {testable outcome}"
3. Non-UX changes (refactors, internal tooling) have statements like: "When an agent searches for X, they find it because Y"

### Step 2b: Fill Gaps

For compactions with missing UX statements, dispatch a sub-agent:

**Sub-agent prompt template:**
```
You are adding missing UX statements to a compaction.

Read the following files that were changed in this session:
<list of changed files with paths>

Read each file. For each user-facing change, write a UX statement:
"When {user type} {does action} {under constraints}, they {experience outcome}"

Then update the compaction via:
alignment-harness compaction put --session <sessionId> --json '<body>'
Body: { "uxStoriesBroughtToReality": [<existing + new statements>] }

Also add a comment documenting what you added:
echo '<body>' | alignment-harness record compaction-comments --name <sessionId>.jsonl
Body: { "author": "prelaunch-audit-agent", "content": "Added N UX statements covering: <summary>" }
```

**Gate:** Do not proceed until every compaction has UX statements covering all changed files.

---

## Phase 3: TDD Coverage

**Goal:** Every UX statement has a test that verifies the assumption. Every edge case is covered.

### Step 3a: Map UX Statements to Tests

For each UX statement across all compactions:

1. Search for existing test coverage:
   ```bash
   # Search for test files referencing the feature area
   grep -r "<keywords from UX statement>" --include="*.test.*" --include="*.spec.*" \
     <projects-dir>/<repo>
   ```

2. Run the intent alignment audit for the affected area:
   ```bash
   cd <projects-dir>/api
   node scripts/intent-alignment-audit.js --last 30 --area <feature-area>
   ```

3. Classify each UX statement:
   - **COVERED** — test exists that directly verifies this UX outcome
   - **PARTIAL** — test exists but doesn't cover edge cases
   - **UNCOVERED** — no test for this UX statement

### Step 3b: Write Missing Tests

For UNCOVERED and PARTIAL statements, dispatch sub-agents (one per test file):

**Sub-agent prompt template:**
```
You are writing TDD tests for UX statements that lack coverage.

REQUIRED: Invoke the `superpowers:test-driven-development` skill first.

UX Statements to cover:
<list of UX statements + the files that implement them>

For each statement:
1. Read the implementation file
2. Write a test that verifies the EXACT UX outcome described
3. Include edge cases: null inputs, error states, boundary conditions
4. Test name format: it('@intent: <slug-or-description> - When {condition} then {outcome}')
5. Run the test: npx jest <test-file> --no-coverage
6. If the test FAILS because the code is wrong: DO NOT fix the test. Flag it as a real bug.
   Report: "BUG FOUND: UX statement '<statement>' is not implemented correctly. Test expects X, code does Y."
7. If the test PASSES: confirm coverage.

Output: list of { uxStatement, testFile, testName, status: PASSING | BUG_FOUND, bugDescription? }
```

### Step 3c: Collect Bug Reports

Any sub-agent that reports BUG_FOUND — these are real bugs discovered through TDD. Add them to the actionables list with high priority.

---

## Phase 4: Full Test Suite Health

**Goal:** Run all tests. Separate real bugs from test rot.

### Step 4a: Run Full Suite

```bash
# api
cd <projects-dir>/api
NODE_ENV=test npx jest --no-coverage --no-watchman --forceExit 2>&1 | tail -20

# frontend (if tests exist)
cd <projects-dir>/frontend
NODE_ENV=test npx jest --no-coverage --no-watchman --forceExit 2>&1 | tail -20
```

Also check stored test results:
```bash
curl -s "http://localhost:<api-port>/api/admin/test-results/summary" \
  -H "x-api-key: $DEVELOPER_API_KEY"
```

### Step 4b: Triage Failures

Dispatch sub-agents in parallel (one per test file, max 5 concurrent):

**Sub-agent prompt template:**
```
You are triaging a failing test file for pre-launch readiness.

Test file: <path>
Failure output: <jest error output>

Follow the 6-phase workflow from the skill:
1. Discovery (you have the failure already)
2. Establish intended UX (check Intent DB, swarm, code)
3. Intent analysis
4. Classification: FIX THE CODE | UPDATE test | REMOVE + document
5. Resolution: implement the fix
6. Verification: run the test and confirm it passes

Output:
- disposition: FIX_CODE | UPDATE_TEST | REMOVE_TEST
- uxImpact: description of user impact if this is a real bug
- confidence: 1-100 (how sure are you this is the right fix?)
- filesChanged: [list of files you modified]
```

---

## Phase 5: System Log Triage

**Goal:** Surface all concerning errors from system logs and trace them.

### Step 5a: Query Actionable Logs

Dispatch a sub-agent for system log triage:

**Sub-agent prompt template:**
```
You are performing a pre-launch system log triage.

Steps:
1. Connect to MongoDB and query actionable logs:
   - severity >= 5, not dismissed, not silenced, level = error
   - Sort by severity desc, lastOccurredAt desc
   - Limit 30

2. For each log:
   a. Check known-fixed registry first (GET /api/admin/known-fixed-errors/match?message=...)
   b. If known-fixed: skip with note
   c. If NOT known-fixed: read the source code at the crash location
   d. Classify: REAL_BUG | ALREADY_FIXED | NON_ISSUE
   e. For REAL_BUG: propose solution in the required format (WHAT HAPPENED / INTENDED UX / PROPOSED SOLUTION)

3. Run Phase 0 severity scoring for any unscored logs first

Output per log:
- logId: <MongoDB _id>
- severity: <score>
- classification: REAL_BUG | ALREADY_FIXED | NON_ISSUE
- uxImpact: <what the user experiences>
- proposedFix: <solution if REAL_BUG>
- confidence: 1-100
```

---

## Phase 6: Systemic Checks

**Goal:** Run all existing validators and pre-launch checks.

### Step 6a: Security Validators

Run the existing launch readiness validators (if the scripts exist):

```bash
cd <projects-dir>/api

# Admin route security
node scripts/validate-admin-security.js 2>/dev/null || echo "VALIDATOR_MISSING"

# Admin route paths
node scripts/validate-admin-routes.js 2>/dev/null || echo "VALIDATOR_MISSING"

# Frontend admin gates
node scripts/validate-admin-frontend-gates.js 2>/dev/null || echo "VALIDATOR_MISSING"

# Public leak detection
node scripts/validate-admin-no-public-leak.js 2>/dev/null || echo "VALIDATOR_MISSING"

# Code quality / syntax
node scripts/validate-syntax.js 2>/dev/null || echo "VALIDATOR_MISSING"
```

**IMPORTANT — Admin2RouteGuard equivalence:** In frontend's App.js, `Admin2RouteGuard` wraps
`Gen3AdminRoute` internally (adding AdminErrorBoundary + Suspense). Both patterns mean the route
IS protected. The validator `validate-admin-frontend-gates.js` recognizes both. Do NOT flag
`Admin2RouteGuard` routes as unguarded — they contain `Gen3AdminRoute` inside them.

### Step 6b: Intent Alignment Audit (Full Scan)

```bash
cd <projects-dir>/api
node scripts/intent-alignment-audit.js --all --max 50 2>/dev/null || echo "AUDIT_SCRIPT_MISSING"
```

### Step 6c: API Alignment Check

Verify frontend expects what backend returns.

### Step 6d: Dependency & Environment Check

```bash
# Check for outdated/vulnerable deps
cd <projects-dir>/api && npm audit --production 2>/dev/null | tail -5
cd <projects-dir>/frontend && npm audit --production 2>/dev/null | tail -5

# Verify environment variables are set (expanded list)
cd <projects-dir>/api
node -e "
  require('dotenv').config();
  const required = ['MONGODB_URI','OPENAI_API_KEY','STRIPE_SECRET_KEY','FIREBASE_PROJECT_ID','SENDGRID_API_KEY','STATSIG_SERVER_KEY'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) console.log('MISSING ENV:', missing.join(', '));
  else console.log('All critical env vars present');
"
```

### Step 6e: Built-In Diagnostic Routes

Run the API's own diagnostic suite before manual checks — these verify critical system wiring:

```bash
# One-click health check across 6 subsystems (stableId, meta-dedup, override-storm, fail-open, proactive-detection, find-account-by-phone)
curl -s http://localhost:<api-port>/api/admin/fix-diagnostics/all \
  -H "x-api-key: $DEVELOPER_API_KEY"
# Expected: all checks PASS

# Notification link integrity
curl -s http://localhost:<api-port>/api/admin/notification-diagnostics/links \
  -H "x-api-key: $DEVELOPER_API_KEY"
# Expected: all notification links valid
```

If any diagnostic fails, escalate immediately — these are systemic issues.

### Step 6f: Email System Readiness

Payment/signup flows depend on email delivery. Silent email failures break P0 paths.

```bash
# Check email provider health (if endpoint exists)
curl -s http://localhost:<api-port>/api/admin/email-audit/provider-health \
  -H "x-api-key: $DEVELOPER_API_KEY" 2>/dev/null || echo "EMAIL_HEALTH_ENDPOINT_MISSING"
```

### Step 6g: Stripe Webhook & Sync Verification

```bash
# Verify webhook endpoint exists (should return 400, not 404)
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:<api-port>/api/stripe/webhook \
  -H "Content-Type: application/json" -d '{}'
# Expected: 400 (missing signature). 404 = webhook route not registered = P0 FAIL

# Run Stripe DB sync check if available
cd <projects-dir>/api
npm run confirm-stripe-db-sync 2>/dev/null || echo "STRIPE_SYNC_SCRIPT_MISSING"
```

### Step 6h: CORS & Cookie Domain Verification

Cross-domain auth failures are silent and catastrophic. Verify configuration matches production expectations.

Dispatch a sub-agent:
```
You are verifying cross-domain security configuration.

Steps:
1. Read app.js — find CORS configuration
   Verify origin includes: example.com, staging.example.com, go.example.com, localhost:3000
   Verify credentials: true is set

2. Read the auth controller cookie-setting code
   Verify cookie domain is .example.com for production (NOT === 'production', use !== 'development')
   Verify SameSite=lax, Secure=true for production

3. Check that cookie domain uses defensive env check:
   GOOD: process.env.NODE_ENV !== 'development' (fires everywhere except local)
   BAD: process.env.NODE_ENV === 'production' (breaks if env missing)

Report: PASS | FAIL per check with file paths
```

### Step 6i: Statsig Experiment Safety Audit

Active experiments on critical paths can break payment/login for a percentage of users.

Dispatch a sub-agent:
```
You are auditing Statsig experiments for launch safety.

REQUIRED: Use MCP Statsig tools if available, otherwise check config files.

Steps:
1. List all active experiments
2. For each experiment:
   - Does it touch payment, checkout, login, auth, or access tier code?
   - If YES: verify allocation is NOT 100% (never full-rollout mid-launch)
   - If YES: verify targeting has constraints (not "all users")
   - Flag any experiment on critical paths for admin review
3. List all active feature gates
   - Any gate controlling P0 flows should be documented

Output: list of { experimentName, touchesCriticalPath, allocation, risk, recommendation }
```

### Step 6j: Stable Branch & Deploy Tag Verification

Before shipping, verify the rollback safety net exists.

```bash
# Check deploy tags exist across repos
for repo in api frontend landing; do
  echo "=== $repo ==="
  cd <projects-dir>/$repo
  latest=$(git tag -l 'deployed-*' --sort=-creatordate | head -1)
  echo "Latest deploy tag: ${latest:-MISSING — TAG BEFORE PROCEEDING}"
  cd <projects-dir>
done

# Check stable branch state (frontend only — Vercel deploys stable.example.com from this)
cd <projects-dir>/frontend
git log nextai/stable -1 --format="%h %ai %s" 2>/dev/null || echo "STABLE_BRANCH_MISSING"
```

If deploy tags are missing: BLOCKER. Tag current production state before any launch prep work.

Also in 6j, once the audit above is green, do the release-prep push (this is the one time heavy CI runs; see "Release-prep flow" at the top):

```bash
cd <projects-dir>/<repo>        # api, landing: remote origin; frontend: remote nextai
git push <remote> staging:staging-pre-launch
gh pr list --repo <your-org>/<repo> --head staging-pre-launch   # open or refresh the PR: staging-pre-launch -> main
```

---

## Phase 7: Risk-Ranked Actionables

**Goal:** Aggregate all findings from Phases 1-6 into a single prioritized list with confidence scoring.

### Step 7a: Collect All Findings

Gather from each phase:
- Phase 1: Misaligned compactions, proposed intents
- Phase 2: Missing UX statements (should be resolved, but note any gaps)
- Phase 3: BUG_FOUND from TDD (highest priority)
- Phase 4: Failing tests classified as FIX_CODE
- Phase 5: System logs classified as REAL_BUG
- Phase 6: Validator failures, audit violations

### Step 7b: Score Each Finding

For EVERY actionable item, compute these 4 scores (1-100):

| Dimension | Question |
|-----------|----------|
| **Root Confidence** | How confident are you that you found the actual root cause of this issue? |
| **Intent Confidence** | How confident are you in the INTENDED behavior of this code? |
| **Risk If Wrong** | How much damage if your proposed fix is incorrect? (100 = catastrophic) |
| **UX Impact If Unfixed** | What is the actual user experience impact if you leave this unfixed? (100 = app unusable) |

### Step 7c: Compute Action Threshold

```
actionScore = (rootConfidence + intentConfidence) / 2
riskScore = (riskIfWrong + uxImpactIfUnfixed) / 2

// The sensitivity formula:
// High confidence + low risk = act immediately
// Low confidence + high risk = escalate to admin
// High confidence + high risk = act but flag for review

if (actionScore >= 60) {
  if (riskScore >= 70) {
    action = "ACT + FLAG_FOR_REVIEW"  // you're confident but stakes are high
  } else {
    action = "ACT"  // confident and safe to fix
  }
} else {
  if (riskScore >= 50) {
    action = "ESCALATE_TO_ADMIN"  // not confident enough, stakes too high
    // Update leverage score so it ranks higher in admin view
  } else {
    action = "ACT_WITH_CAUTION"  // low confidence but also low risk
  }
}
```

### Step 7d: Classify by Critical Path Impact

Tag each finding with which critical path it affects:

| Tag | Path | Catastrophe Level |
|-----|------|-------------------|
| `PAYMENT` | Can users pay? | P0 - no revenue |
| `ACCESS` | Do they get what they paid for? | P0 - paying user locked out |
| `LOGIN` | Can they log in? | P0 - 100% blocked |
| `COACHING` | Does coaching work? | P1 - core value prop |
| `TIER_GATING` | Correct tier shown? | P2 - wrong experience |
| `ADMIN` | Admin tools broken? | P3 - internal only |
| `NON_CRITICAL` | Everything else | P4 - survivable |

Items tagged PAYMENT, ACCESS, or LOGIN that score ESCALATE_TO_ADMIN get **boosted leverage** and admin notification.

### Step 7e: Execute ACT Items

For items scored as ACT or ACT_WITH_CAUTION:

1. Dispatch a sub-agent to implement the fix
2. The sub-agent MUST:
   - Read the actual code (never guess)
   - Make the minimal change needed
   - Run the relevant tests after fixing
   - Report what changed and why
3. After the fix, re-run the specific test/validator that surfaced the issue
4. If the fix introduces new failures, REVERT and escalate to admin

For items scored as ACT + FLAG_FOR_REVIEW:
- Implement the fix in a clearly labeled commit
- Create a task with status `proposed` linking to the commit
- Include the full scoring rationale in the task description
- The admin reviews before merging

For items scored as ESCALATE_TO_ADMIN:
- Create a task with status `proposed` and elevated leverage score
- Include: the finding, your reasoning, your uncertainty, and the UX impact
- Do NOT attempt the fix

---

## Phase 8: Critical Flow Sanity Testing

**Goal:** Actually test the payment flow, login flow, and coaching flow on localhost.

### Step 8a: Login Flow

Dispatch a sub-agent:

**Sub-agent prompt template:**
```
You are testing the login flow on localhost.

REQUIRED: Invoke the `<your-app>-local-login` skill for login mechanics.

Steps:
1. Hit the auth/me endpoint to check if the server is running:
   curl -s http://localhost:<api-port>/api/auth/me
   Expected: 401 or a user object (not connection refused)

2. Check that the login endpoint accepts credentials:
   curl -s -X POST http://localhost:<api-port>/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test"}'
   Expected: returns a token or meaningful error (not 500)

3. If token received, verify it works:
   curl -s http://localhost:<api-port>/api/auth/me \
     -H "Authorization: Bearer <token>"
   Expected: returns user object with accessTier

4. Check cookie domain configuration in the auth code:
   Read the auth controller and verify cookie domain is .example.com for production

Report: PASS | FAIL per step, with actual vs expected
```

### Step 8b: Payment Flow

Dispatch a sub-agent:

**Sub-agent prompt template:**
```
You are testing the payment flow on localhost.

Steps:
1. Verify Stripe checkout session creation:
   curl -s -X POST http://localhost:<api-port>/api/stripe/create-checkout-session \
     -H "Authorization: Bearer <token from login>" \
     -H "Content-Type: application/json" \
     -d '{"planId":"test_plan"}'
   Expected: returns a checkout URL or session ID (not 500)

2. Verify Stripe webhook endpoint is registered:
   curl -s http://localhost:<api-port>/api/stripe/webhook -X POST \
     -H "Content-Type: application/json" \
     -d '{}'
   Expected: 400 (bad request — missing signature) NOT 404

3. Check the canonical Stripe resolver:
   Read <projects-dir>/api/resolvers/gen3/canonicalStripeResolver.js
   Verify getStripeState() returns isCcTrial, effectiveAccessTier, currentPlan

4. Check fail-open behavior:
   Read the effectiveAccessTier logic — verify it defaults to MAX_ACCESS on error

Report: PASS | FAIL per step, with actual vs expected
```

### Step 8c: Coaching Flow

Dispatch a sub-agent:

**Sub-agent prompt template:**
```
You are testing the coaching flow on localhost.

Steps:
1. Create a conversation:
   curl -s -X POST http://localhost:<api-port>/api/conversations \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"title":"Audit test session"}'
   Expected: returns conversation object with _id

2. Send a message to the coaching endpoint:
   curl -s -X POST http://localhost:<api-port>/api/conversations/<id>/create-message \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"message":"Hello, this is a pre-launch audit test."}'
   Expected: returns AI response (not 500, not empty)

3. Verify stop sequences are configured:
   Read utils/modelStrategy.js — check MODEL_STRATEGIES.original.stop contains ['?\n', '?\n\n']

4. Verify session saves:
   curl -s http://localhost:<api-port>/api/conversations/<id> \
     -H "Authorization: Bearer <token>"
   Expected: returns conversation with messages array

Report: PASS | FAIL per step, with actual vs expected
```

### Step 8d: Access Tier Gating

Dispatch a sub-agent:

**Sub-agent prompt template:**
```
You are verifying access tier gating logic.

Steps:
1. Read the subscription-access-handler:
   Check that runtime override applies plan 20 when ANY Stripe subscription found

2. Read the effectiveAccessTier resolution:
   Verify FREE_ACCESS for no subscription
   Verify LIMITED_ACCESS for cc_trial (trialing)
   Verify MAX_ACCESS for active subscription

3. Verify fail-open:
   The catch block must default to MAX_ACCESS, not FREE_ACCESS
   A paying user must NEVER be locked out due to a code error

4. Check entitlement resolver:
   Verify premium features are gated by accessTier, not by plan number

Report: PASS | FAIL per check, with file paths and line numbers
```

### Step 8e: Fail-Open Deep Verification

This is THE critical safety valve. If error handling defaults to FREE_ACCESS instead of MAX_ACCESS, a Stripe outage locks out all paying users.

Dispatch a sub-agent:
```
You are verifying fail-open behavior across the entire access resolution chain.

Steps:
1. Read <projects-dir>/api/resolvers/gen3/canonicalStripeResolver.js
   For EVERY try/catch that reads subscription status:
   - If catch defaults to MAX_ACCESS: PASS
   - If catch defaults to FREE_ACCESS: CRITICAL FAIL

2. Read the subscription-access-handler
   Verify the catch block uses Subscription.exists(), NOT stripeCustomerId
   (stripeCustomerId only means checkout started, not that they paid)

3. Search for ALL catch blocks in auth/access code that set access tiers:
   grep -rn "catch.*accessTier\|catch.*currentPlan\|catch.*FREE_ACCESS" \
     <projects-dir>/api/

4. For each catch block found: verify it fails toward MAX_ACCESS, not FREE_ACCESS

Report: file path, line number, what the catch block does, PASS/FAIL per location
```

### Step 8f: MongoDB Connection Health

```bash
# Verify the API can reach the database (simple health check)
curl -s http://localhost:<api-port>/api/auth/me 2>/dev/null
# Expected: 401 (unauthorized) — proves server + DB are up
# If connection refused or 503: CRITICAL — server or DB is down
```

---

## Phase 9: Final Evidence & Handoff

**Goal:** Produce a compaction file summarizing the entire audit, and flag the admin.

### Step 9a: Create Audit Compaction

```bash
alignment-harness compaction put --session "prelaunch-audit-<date>-<branch>" --json '{
    "sessionId": "prelaunch-audit-<date>-<branch>",
    "repo": "all",
    "title": "Pre-Launch Audit: <branch> -> main",
    "subtitle": "Automated audit covering compaction coverage, UX alignment, TDD, test health, system logs, and critical flow testing",
    "overarchingIntentTitle": "Production Release Confidence",
    "overarchingIntentDescription": "When the admin reviews this audit, they can make an informed go/no-go decision based on evidence, not gut feeling",
    "successMeasure": "All P0 critical paths verified working. All high-confidence bugs fixed. All low-confidence issues escalated with reasoning.",
    "targetUxIntentTitle": "Launch Readiness Evidence",
    "targetUxIntentDescription": "When the admin opens this compaction, they see a complete picture: what was checked, what passed, what failed, what was fixed, and what needs their decision",
    "howToConsumeThisWorkProduct": "<step-by-step summary of findings + links to tasks>",
    "uxStoriesBroughtToReality": ["<list of verified UX statements>"],
    "incompleteItems": ["<any ESCALATE_TO_ADMIN items>"],
    "principles": ["<any new principles discovered during audit>"],
    "agentReasoning": {
      "gestaltObservation": "<honest assessment of launch readiness>",
      "alignmentFailures": "<where the audit found alignment gaps>",
      "sanityCheckSteps": "<the 3-5 things the admin should manually verify>",
      "surfacingQuestion": "Is this branch safe to ship to production right now?",
      "surfacingAnswer": "<the honest answer with evidence>"
    },
    "compactedSession": "<full markdown report>",
    "tags": ["prelaunch-audit", "launch-readiness", "<branch-name>"]
  }'
```

### Step 9b: Generate Summary Report

The final output to the admin should be structured as:

```
## Pre-Launch Audit Report: <branch> -> main
Date: <date>
Repos: api, frontend, landing

### Coverage
- Deviations from main: <N commits across M repos>
- Compactions: <N total, M created during audit>
- UX Statements: <N total, M added during audit>
- Tests: <N covering UX statements, M new tests written>

### Critical Path Status
| Path | Status | Evidence |
|------|--------|----------|
| Payment | PASS/FAIL | <what was tested> |
| Login | PASS/FAIL | <what was tested> |
| Access Tiers | PASS/FAIL | <what was tested> |
| Coaching | PASS/FAIL | <what was tested> |

### Findings Summary
- Bugs found and fixed: <N> (list with confidence scores)
- Bugs found and escalated: <N> (list with reasoning)
- Test failures resolved: <N>
- System log issues: <N> (M fixed, K escalated)
- Validator failures: <N>

### Risk-Ranked Actionables (Remaining)
| # | Finding | Action | Root Conf | Intent Conf | Risk | UX Impact | Path |
|---|---------|--------|-----------|-------------|------|-----------|------|
| 1 | <desc>  | <type> | <score>   | <score>     | <score> | <score> | <tag> |

### Recommendation
<GO / NO-GO / CONDITIONAL-GO with specific conditions>

### What the Admin Should Manually Verify
1. <specific thing to check in browser>
2. <specific thing to check in browser>
3. <specific thing to check in browser>
```

### Step 9c: Flag Admin

Create a task for admin review:

```bash
alignment-harness store add task --json '{
    "title": "REVIEW: Pre-Launch Audit Complete — <branch>",
    "status": "proposed",
    "priority": 95,
    "description": "<summary report>",
    "tags": ["prelaunch-audit", "admin-review"]
  }'
```

### Step 9d: Deployment Gate Checklist

Include this in the final report — an explicit sign-off list for the admin:

```
### Deployment Gate Checklist

Before deploying to production, the admin MUST verify:

- [ ] All P0 critical paths (Payment, Login, Access, Coaching) tested and PASS
- [ ] Email system health checked (SendGrid operational, transactional emails sending)
- [ ] Admin routes all protected (validate-admin-security.js PASS)
- [ ] Cookie domain configured for .example.com (not gated on === 'production')
- [ ] CORS allowlist includes all expected domains
- [ ] Statsig: No active experiments at 100% allocation on critical paths
- [ ] Stripe webhook endpoint responding 400 (not 404)
- [ ] Fail-open verified: ALL catch blocks default to MAX_ACCESS, not FREE_ACCESS
- [ ] All critical env vars present (MONGODB_URI, STRIPE_SECRET_KEY, SENDGRID_API_KEY, etc.)
- [ ] System logs: No severity 7+ unresolved errors
- [ ] Deploy tags exist for all repos (deployed-YYYY-MM-DD)
- [ ] Stable branch tagged and updated (if shipping to stable.example.com)
- [ ] Full test suite: no NEW failures introduced by this branch
- [ ] Pushed staging -> staging-pre-launch in all 3 repos; PR staging-pre-launch -> main is open/refreshed; the heavy CI checks ran there (Jest, dependency check, dated-claims, sitemap build) and were read, not assumed
- [ ] GitHub billing unblocked so those runs could start (the user fixes once; a low spending cap is fine)
- [ ] Admin manually tested 1 payment flow + 1 login flow in browser

Recommendation: GO only if ALL boxes checked.
```

---

## Orchestration Principles

### Sub-Agent Dispatch Rules

1. **Always pass the relevant skill** — sub-agents start cold. If a skill informed your understanding, the sub-agent needs it too. Use: "REQUIRED: Invoke the `<skill-name>` skill before starting."

2. **Parallel when independent** — Phases 0c (missing compactions), 1b (alignment checks), 3b (test writing), 4b (test triage), and 8a-8d (sanity tests) can all dispatch parallel sub-agents.

3. **Sequential when dependent** — Phase 1 needs Phase 0 complete. Phase 3 needs Phase 2 complete. Phase 7 needs Phases 1-6 complete.

4. **Max concurrency** — limit to 5 parallel sub-agents to avoid overwhelming the system.

5. **Verify sub-agent output** — never trust blindly. Spot-check at least 1 in 5 sub-agent results by reading the files they claim to have changed.

### Confidence Calibration

- **90-100**: You read the code, ran the test, saw it pass/fail, understand the intent from Intent DB. Act.
- **70-89**: You read the code, the logic makes sense, but you couldn't run it or the intent is deduced. Act with review flag.
- **50-69**: You read the code but the intent is ambiguous or the system is complex. Escalate if risk > 50.
- **Below 50**: You're guessing. Always escalate. Never act.

### When to Stop

Continue the audit loop until:
1. All P0 critical paths show PASS in sanity testing
2. All ACT items are implemented and verified
3. All ESCALATE items are logged as tasks
4. The full test suite has no NEW failures (pre-existing failures are documented)
5. System logs show no severity 7+ unresolved errors

Then — and only then — state your launch recommendation with evidence.

---

## Anti-Patterns (NEVER DO)

- Skip reading code and propose fixes based on error messages alone
- Bulk-fix failing tests by mocking away the failures
- Dismiss system logs without tracing the root cause
- Claim "ready to ship" without running the sanity tests in Phase 8
- Act on low-confidence findings that touch payment/login/access flows
- Create compactions without the 5 agentReasoning fields
- Write UX statements in code terms instead of user-experience terms
- Skip Phase 0 and assume all sessions have compactions
- Run phases out of order — the dependency chain exists for a reason

## Cross-References

| Skill | Used In |
|-------|---------|
| `agentic-session-compactions` | Phase 0 — creating missing compactions |
| `intent-alignment-audit` | Phase 1 — cross-referencing Intent DB |
| `superpowers:test-driven-development` | Phase 3 — writing missing tests |
| `<your-app>-local-login` | Phase 8a — login flow testing |
| `commit` | Any phase — committing fixes |
| `work-complete-audit` | Phase 9 — final self-audit |

## Incomplete work the readiness scans report (never blocks shipping)

When `npm run seo:check` or `npm run pre-launch` prints "INCOMPLETE WORK" for concern pages with no headline in a language, those pages are live in that language with an English title and heading. It is report only: never treat it as a reason to stop or delay a ship (the user, 2026-10-11: "NEVER block shipping to production for this"). Tell the human the count and the cost the scan prints, and finish it with `frontend/docs/concern-pages/name-every-new-batch-in-six-languages.md`, or hand it to whoever is building concern pages.
