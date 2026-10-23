---
name: principle-alignment-scanner-workflow
description: Automated 6-phase audit that maps CLAUDE.md coding rules to scanner detectors, finds violations, and fixes them safely.
triggers:
  - "audit principles"
  - "check principle alignment"
  - "are our coding rules followed"
  - "principle alignment scan"
  - "run the scanner"
  - "what violations exist"
  - "add scanner rule"
  - "new code violation detector"
  - "sweep for antipatterns"
  - "codebase health check"
---

# Principle Alignment Scanner Workflow

## When to Use
- Periodic codebase health audit against CLAUDE.md coding principles
- After adding new principles to CLAUDE.md — verify retroactive compliance
- Before a major release — sweep for latent crash/security bugs
- When onboarding a new principle category (e.g., new React or Express antipattern)
- Triggered by `/track` when work type is "principle audit"

## Prerequisites

| Asset | Path | Purpose |
|-------|------|---------|
| Scanner config | `.agent-warnings-config.json` | Rule definitions (regex, scope, excludes) |
| Scanner script | `scripts/agent-code-warnings.js` | Executes rules, programmatic checks for complex patterns |
| Principles source | Root `CLAUDE.md` "Coding Antipatterns" section | Ground truth for what to detect |
| Fix safety skill | `/fix-algo-bug-determine-if-auto-fix-ok` | MANDATORY gate before every fix |
| Known fixed errors API | `alignment-harness store list known-fixed-errors --json` | Skip already-fixed bugs |

If `.agent-warnings-config.json` or `scripts/agent-code-warnings.js` does not exist, create it.

## Scanner CLI Reference

```bash
# Full scan — all files, human-readable output
node scripts/agent-code-warnings.js

# JSON output — machine-parseable for subagent consumption
node scripts/agent-code-warnings.js --json

# Staged files only — for pre-commit checks
node scripts/agent-code-warnings.js --staged

# With fix guidance — shows remediation instructions per violation
node scripts/agent-code-warnings.js --fix

# Combined
node scripts/agent-code-warnings.js --staged --fix --json
```

Exit codes: 0 = clean, 1 = violations found, 2 = config load failure.

---

## Phase 1: Map Principles to Detection Methods

**Goal**: Create a complete coverage matrix — every CLAUDE.md antipattern mapped to a detection method.

### Steps

1. **Read CLAUDE.md "Coding Antipatterns" section** — extract every NEVER rule. Group by category (React, Express, Security, Schema/Email/Integration).

2. **Read `.agent-warnings-config.json`** — list all existing scanner rule IDs.

3. **Build coverage matrix**:
   ```
   | Principle | Scanner Rule ID | Detection Type | Status |
   |-----------|----------------|----------------|--------|
   | Never bare-destructure context | BARE_DESTRUCTURE_CONTEXT | CLI regex | Covered |
   | Never findOne without null check | — | Subagent semantic | Uncovered |
   ```

4. **Classify each uncovered principle**:
   - **CLI-detectable**: Can be caught with regex + file scope + exclude patterns. These go into `.agent-warnings-config.json`.
   - **Subagent-required**: Needs multi-line semantic understanding (e.g., "is this findOne result checked for null before property access?"). These get subagent prompt templates.

### CLI-Detectable Heuristic
A principle is CLI-detectable if:
- The violation has a lexical signature (specific function call, import path, variable name pattern)
- False positives can be eliminated via file scope, exclude patterns, or simple context checks
- The presence/absence of the pattern on a SINGLE LINE determines violation

### Subagent-Required Heuristic
A principle needs semantic analysis if:
- Correctness depends on code BEFORE or AFTER the pattern (e.g., null check before property access)
- The pattern spans multiple lines or blocks (e.g., useEffect body + return statement)
- Context determines whether the pattern is safe or dangerous (e.g., $set field name vs schema)

---

## Phase 2: Add CLI Scanner Rules

For each CLI-detectable principle not yet in the scanner:

### Step 1: Design the Rule

```json
{
  "RULE_ID": {
    "id": "RULE_ID",
    "severity": "error|warning",
    "description": "Human-readable — what the violation IS and why it's dangerous",
    "patterns": ["regex pattern(s) — conservative, prefer false negatives over false positives"],
    "fileGlobs": ["**/*.js", "**/*.jsx"],
    "scopeDirs": ["routes/", "controllers/"],
    "excludeFiles": [
      "**/node_modules/**",
      "**/__tests__/**",
      "**/*.test.*",
      "**/*.spec.*"
    ],
    "excludeFileReasons": {
      "path/to/file.js": "Why this file is excluded — prevents future agents from removing the exclusion"
    },
    "fixGuidance": "Exact instructions for fixing this violation — written for an agent, not a human"
  }
}
```

**Rule field guide**:
- `severity: "error"` = crash/security bug, must fix. `"warning"` = code smell, should fix.
- `patterns` = array of regex strings. ANY match triggers the rule. Use `(?:...)` for non-capturing groups.
- `scopeDirs` = limit scanning to these directories (relative to repo root). Omit to scan everywhere.
- `excludeFiles` = glob patterns for files to skip. Always include `node_modules`, `__tests__`, `*.test.*`, `*.spec.*`.
- `excludeFileReasons` = document WHY each non-obvious exclusion exists. Critical for preventing drift.
- `contextCheck` = if file content matches this regex, the file is handling the pattern correctly — skip it.

### Step 2: Handle Complex Patterns Programmatically

Some rules need multi-line analysis that regex alone cannot do. These get programmatic handlers in `scripts/agent-code-warnings.js`.

**Currently implemented programmatic handlers**:
- `RES_JSON_NO_RETURN` — traces brace depth to find conditional res.json without return that has a following res.json at the same scope
- `JSON_PARSE_NO_TRYCATCH` — scans backward through enclosing blocks to check if JSON.parse is inside a try
- `SETSTATE_IN_USEMEMO` — finds useMemo blocks and scans forward for setState calls within them

**When to add a programmatic handler**:
- The regex pattern has >5% false positive rate
- The pass/fail depends on surrounding code structure (brace depth, enclosing blocks)
- The rule needs to check two things on different lines (e.g., "X exists but Y is missing")

**Template for adding a programmatic handler**:
```javascript
// In scanFile(), before the generic loop:
if (rule.id === 'YOUR_RULE_ID') {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/your_trigger_pattern/.test(line)) continue;
    if (isCommentOrStringContext(line, 0)) continue;

    // Your semantic check here — scan backward/forward, check brace depth, etc.
    let isViolation = false;
    // ... analysis ...

    if (isViolation) {
      violations.push({
        rule: rule.id,
        file: relPath,
        line: i + 1,
        content: line.trim(),
        description: rule.description,
        fixGuidance: rule.fixGuidance,
      });
    }
  }
  return violations;
}
```

### Step 3: Run and Triage

```bash
node scripts/agent-code-warnings.js --json
```

**Triage each finding**:

| Finding type | Action |
|-------------|--------|
| True positive, auto-fixable | Queue for Phase 4 fix |
| True positive, needs review | Flag with `NEEDS_REVIEW` |
| False positive, fixable pattern | Tighten the regex pattern |
| False positive, file-specific | Add to `excludeFiles` with documented reason in `excludeFileReasons` |

**Iterate until zero false positives** — re-run after each pattern/exclude change. The scanner's value depends on 100% trust. One false positive teaches agents to ignore it.

---

## Phase 3: Deploy Subagent Audits for Semantic Checks

For principles that need multi-line semantic understanding, deploy subagents in parallel.

### Subagent Deployment Pattern

```
1. Define the search query (what files to find)
2. Define the pass/fail criteria (what to check in each file)
3. Define false positive guards (what looks like a violation but isn't)
4. Deploy N subagents in parallel, each with a batch of files
5. Collect results: VIOLATION | SAFE | NEEDS_REVIEW
```

### Subagent Prompt Templates

#### 1. DB Query Null Check Audit

```
TASK: Find database queries (findOne, findById, findOneAndUpdate) where the result
is used without a null check, which causes "Cannot read property X of null" crashes.

SEARCH: Grep for findOne|findById|findOneAndUpdate in controllers/ and routes/

FOR EACH HIT:
1. Read 25 lines after the query
2. Check: is the result checked for null/undefined before property access?
3. Safe patterns (NOT violations):
   - if (!result) return ...
   - if (result === null) ...
   - result?.property (optional chaining)
   - const result = await X.findOne(...) || defaultValue
   - Immediately returned: return await X.findOne(...)
4. Violation: result.property accessed without any of the above guards

OUTPUT per file: { file, line, query, verdict: VIOLATION|SAFE, evidence: "null check at line X" | "no null check before .property access at line Y" }
```

#### 2. Admin Route Auth Middleware Audit

```
TASK: Verify every admin route mount in app.js has auth middleware in the chain.

SEARCH: Read app.js, find all app.use() calls mounting routes under /api/admin or /api/<version>/admin

FOR EACH MOUNT:
1. Check: does the middleware chain include authMiddleware AND gen3AdminAuthenticationMiddleware (or agentOrAdminAuth)?
2. Safe patterns:
   - app.use('/api/admin/...', authMiddleware, gen3AdminAuth, routeHandler)
   - app.use('/api/<version>/admin/...', agentOrAdminAuth, routeHandler)
   - Route file internally applies auth per-route (check the route file)
3. Violation: admin route mounted without any auth middleware

OUTPUT: { route, middlewareChain: [...], verdict: VIOLATION|SAFE }
```

#### 3. useEffect Cleanup Audit

```
TASK: Find useEffect hooks with fetch/timer/listener that lack cleanup returns.

SEARCH: Grep for useEffect in **/*.jsx and **/*.tsx

FOR EACH useEffect:
1. Read the full effect body (track brace depth to find boundaries)
2. Check: does the body contain fetch/axios/AbortController, setInterval/setTimeout, addEventListener?
3. If yes, check: does the effect have a cleanup return function?
4. Safe patterns:
   - return () => { controller.abort() }
   - return () => { clearInterval(id) }
   - return () => { element.removeEventListener(...) }
   - Empty dependency array [] with no cleanup needed (static fetch on mount — still risky but lower severity)
5. Violation: has async operation or listener but no cleanup return

OUTPUT: { file, line, asyncPattern: "fetch|setInterval|addEventListener", hasCleanup: boolean, verdict }
```

#### 4. HMR Mixed Exports Audit

```
TASK: Find files that export both React components and non-component values,
which breaks Hot Module Replacement / Fast Refresh.

SEARCH: Grep for "export " in **/*.jsx and **/*.tsx

FOR EACH FILE with 2+ exports:
1. Classify each export:
   - Component: export default function/class, export const X = () => <JSX>, export { ComponentName }
   - Non-component: export const CONFIG = {}, export const ENUM = ..., export function utilHelper()
2. Safe patterns:
   - File exports ONLY components (any number)
   - File exports ONLY non-components (utility file)
   - File in __tests__/ or *.test.* (not HMR-relevant)
3. Violation: file exports at least one component AND at least one non-component

OUTPUT: { file, components: [...], nonComponents: [...], verdict }
FIX: Extract non-component exports into a separate *Config.js or *Constants.js file
```

#### 5. Unstable Dependency Arrays Audit

```
TASK: Find useEffect/useMemo/useCallback with context objects, inline objects,
or inline arrays in dependency arrays — causes infinite re-renders.

SEARCH: Grep for useEffect|useMemo|useCallback in **/*.jsx and **/*.tsx

FOR EACH HOOK with dependency array:
1. Extract the dependency array (the [...] argument)
2. Check each dep for:
   - Context objects: socket, queryClient, privateRequest, axiosInstance
   - Inline objects: { key: value } directly in deps
   - Inline arrays: [a, b] directly in deps (not the dep array itself)
   - Function calls: someFunction() directly in deps
3. Safe patterns:
   - Primitive values: string, number, boolean
   - Refs: ref.current
   - State values: stateVar (from useState)
   - Memoized values: from useMemo/useCallback
4. Violation: any dep is a known-unstable reference

OUTPUT: { file, line, hook, unstableDep, verdict }
```

#### 6. Catch Block Missing Response Audit

```
TASK: Find catch blocks in route handlers that don't send a response — causes
the request to hang until the client timeout (usually 30-60s silent failure).

SEARCH: Grep for catch in routes/ and controllers/

FOR EACH CATCH BLOCK in a route handler (identified by req, res in scope):
1. Read the catch block body
2. Check: does it call res.json(), res.send(), res.status(), sendErrorResponse(), or next(err)?
3. Safe patterns:
   - catch(err) { return res.status(500).json({...}) }
   - catch(err) { next(err) }
   - catch(err) { sendErrorResponse(res, err) }
   - Non-route catch (inside a utility function with no res in scope)
4. Violation: catch block in a route handler with no response sent

OUTPUT: { file, line, catchContent, hasResponse: boolean, verdict }
```

#### 7. Mongoose Schema Field Writes Audit

```
TASK: Find code that $set or saves fields not defined in the Mongoose User schema.
Mongoose 7 silently drops these writes — data is lost without any error.

SEARCH:
1. Read models/User.js — extract all defined field names from the schema
2. Grep for User.findOneAndUpdate|User.updateOne|user.save in controllers/ and routes/
3. For $set operations, extract the field names being set

FOR EACH WRITE:
1. Extract field names from the $set object or the assignment before save()
2. Compare against schema field list
3. Safe patterns:
   - Field is in the schema
   - Field is a nested path that exists in schema (e.g., "settings.theme" when settings is Mixed/Map)
   - Using $push/$pull on an array field defined in schema
4. Violation: field name not in schema

OUTPUT: { file, line, operation: "$set|save", field, inSchema: boolean, verdict }
NOTE: This audit may surface intentionally-unused fields. Flag as NEEDS_REVIEW, not auto-fix.
```

---

## Phase 4: Fix Safely

**MANDATORY before every fix**: Apply the fix safety checklist (from `/fix-algo-bug-determine-if-auto-fix-ok`).

### Fix Safety Checklist

Before making ANY code change to address a violation:

```
1. KNOWN FIX CHECK: Has this been fixed already?
   alignment-harness store list known-fixed-errors --json   (match <error> against each errorPattern)
   If matched: SKIP, log "[KNOWN FIX]", move on.

2. REVERSIBILITY: Can this fix be reverted cleanly?
   - Single-line change → YES
   - New file (config extraction) → YES (delete file, revert import)
   - Schema migration → NO — needs human review

3. BLAST RADIUS: What code paths does this change touch?
   - Low: utility function, config file, logging
   - Medium: controller logic, route handler
   - High: auth, payments, email sending, user data writes
   - If HIGH → flag NEEDS_REVIEW, do not auto-fix

4. ROOT CAUSE CLARITY: Do I understand WHY this is wrong?
   - Can I explain the crash/bug this causes? → proceed
   - It "looks wrong" but I can't describe the failure → NEEDS_REVIEW

5. FIX SIDE EFFECTS: Could this fix break working behavior?
   - Adding `return` before res.json → could it skip cleanup code below?
   - Adding null check → does the downstream code handle the null case?
   - Extracting constants to new file → are there circular import risks?
```

### Fix Classification

| Category | Action | Examples |
|----------|--------|----------|
| **Auto-fix** | Fix immediately | Add `return` before res.json, add null check, wrap JSON.parse in try/catch |
| **Config extraction** | Fix with new file | Extract constants from component file into *Config.js for HMR |
| **NEEDS_REVIEW** | Flag for human | Payment flows, email sending, auth middleware, schema changes |
| **False positive** | Update scanner | Tighten regex, add to excludeFiles with documented reason |

### After Fixing

```bash
# Re-run scanner to verify the fix resolved the violation
node scripts/agent-code-warnings.js --json

# If all fixes are committed, register in Known Fixed Errors
alignment-harness store add known-fixed-errors --json '{
  "errorPattern": "<the pattern that was fixed>",
  "fixedInCommit": "<commit SHA>",
  "fixedOnBranch": "staging",
  "repo": "<repo>",
  "description": "<what was fixed>",
  "fixedBy": "agent"
}'
```

---

## Phase 5: Expand Scope

After the first wave of detection + fixes, add the next tier of rules.

### Expansion Prioritization

```
Priority 1 (crash bugs):     DB null checks, JSON.parse no try/catch, res.json no return
Priority 2 (silent failures): empty catch blocks, catch without response, .then without .catch
Priority 3 (security):        isAdmin defaults, admin route auth, hardcoded secrets, env spoofing
Priority 4 (code quality):    console.log in routes, HMR violations, unstable dep arrays
Priority 5 (data integrity):  Mongoose schema writes, SendGrid outside utils, ambiguous trial names
```

### Adding a New Rule — Checklist

```
[ ] Principle identified in CLAUDE.md antipatterns section
[ ] Detection type classified (CLI regex vs subagent semantic)
[ ] For CLI: rule added to .agent-warnings-config.json
[ ] For CLI complex: programmatic handler added to agent-code-warnings.js
[ ] Scanner run — zero false positives confirmed
[ ] For subagent: prompt template added to this skill file
[ ] Subagent tested on one file manually before batch deployment
[ ] Results triaged: auto-fix vs NEEDS_REVIEW
[ ] Scanner rule table in this skill updated
```

---

## Phase 6: Cross-Cutting Audits

Deploy these in parallel after violation fixes are complete.

### 6a. Test Runner — Validate No Breakage

```bash
# Run existing test suites to confirm fixes don't break anything
cd <backend-repo> && npm test
cd <frontend-repo> && npm test
```

If tests fail after a fix: the fix introduced a regression. Revert the specific fix, classify as NEEDS_REVIEW.

### 6b. UX Intent Alignment

After fixing violations, verify the fixed code still delivers on its UX intents:

1. Check intent DB for intents covering the modified files
2. For each relevant intent, verify the code still satisfies `uxPromises`
3. If a fix changed behavior (not just added safety), verify the intent is still met

### 6c. Error Log Triage

Pull production errors and trace to root cause:

```bash
# Cross-reference errors with violation categories — some production crashes
# may be instances of the antipatterns just fixed
```

---

## Results Tracking

After each audit run, log results in this format:

```
## Audit Run: YYYY-MM-DD

### Scanner Rules
- Total rules: N (was M)
- New rules added: [list]
- Rules with programmatic handlers: [list]

### Findings
- Total findings: N across K principle categories
- Auto-fixed: N
- Flagged NEEDS_REVIEW: N
- False positives eliminated: N (pattern tightened / exclude added)

### Impact
- Production crash bugs fixed: N (describe each)
- Silent timeout bugs fixed: N
- HMR violations fixed: N (new config files created: N)
- Schema discoveries: N (describe each)
- Security issues: N

### Remaining Work
- NEEDS_REVIEW items: [list with file:line]
- Principles still uncovered: [list]
```

### Benchmark: March 2026 Audit Results

```
Scanner Rules: 16 (was 7)
Total findings: 150 across 24 principle categories
Auto-fixed: 113
Flagged for human review: 41
Production crash bugs fixed: 9 (DB null checks — findOne/findById without guard)
Silent timeout bugs fixed: 31 (catch blocks in routes without res.json/next(err))
HMR violations fixed: 17 (14 new *Config.js files extracted)
Schema discovery: 1 critical (35 feature adoption flags silently dropped by Mongoose 7)
```

---

## Swarm Deployment Pattern

### When to Parallelize

- Phase 1 (mapping): Sequential — must complete before Phase 2
- Phase 2 (CLI rules): Sequential — each rule depends on scanner state
- Phase 3 (subagent audits): **PARALLEL** — all 7 audits are independent
- Phase 4 (fixes): **PARALLEL by category** — null checks, catch blocks, HMR can run simultaneously
- Phase 5 (expansion): Sequential per rule, parallel across rule categories
- Phase 6 (cross-cutting): **PARALLEL** — tests, intent alignment, error logs are independent

### Subagent Pre-Loading

Subagents cannot use MCP tools. Pre-load them with:

```
1. The relevant CLAUDE.md antipattern text
2. The file list to audit (from grep results)
3. The pass/fail criteria from the prompt template above
4. The fix safety checklist
```

### Batch Sizing

- DB null checks: ~50 files in controllers/ — split into 2 batches of 25
- useEffect cleanup: ~200 component files — split into 4 batches of 50
- HMR mixed exports: ~300 component files — split into 4 batches of 75
- Catch blocks: ~80 route files — split into 2 batches of 40

### Collecting Results

Each subagent outputs structured JSON:
```json
{
  "audit": "db-null-checks",
  "filesScanned": 25,
  "violations": [
    { "file": "controllers/foo.js", "line": 42, "verdict": "VIOLATION", "evidence": "..." }
  ],
  "safe": [
    { "file": "controllers/bar.js", "line": 10, "verdict": "SAFE", "evidence": "null check at line 11" }
  ],
  "needsReview": []
}
```

Aggregate across subagents. Deduplicate. Feed violations into Phase 4.

---

## Current Scanner Rules (16 total)

| Rule ID | Severity | Category | Detection | Notes |
|---------|----------|----------|-----------|-------|
| AUTH_INLINE_TOKEN | error | Security | CLI regex | Inline Cookie.get/localStorage for auth tokens |
| AMBIGUOUS_TRIAL | error | Schema | CLI regex | Undifferentiated "trial" variable names |
| ENV_DETECT_SPOOFABLE | error | Security | CLI regex | Origin/Host header for env detection |
| BARE_DESTRUCTURE_CONTEXT | error | React | CLI regex | `const { x } = useContext()` without null guard |
| SETSTATE_IN_USEMEMO | error | React | Programmatic | setState inside useMemo body |
| LANGCHAIN_SENTINEL | error | Integration | CLI + contextCheck | ChatAnthropic without topP/topK sentinel strip |
| ISADMIN_DEFAULT_TRUE | error | Security | CLI regex | isAdmin defaulting to true or read from user input |
| ADMIN_IMPORT_LEAK | warning | Security | CLI regex | Admin component imported in user-facing code |
| RES_JSON_NO_RETURN | error | Express | Programmatic | res.json without return causing double-response crash |
| EMPTY_CATCH_BLOCK | error | Express | CLI regex | catch(err) {} — errors silently swallowed |
| CONSOLE_LOG_IN_ROUTES | warning | Express | CLI regex | console.log in routes/controllers instead of logger |
| SENDGRID_OUTSIDE_UTILS | error | Integration | CLI regex | Direct @sendgrid/mail import bypassing bounce guard |
| HARDCODED_LOCALHOST | warning | Integration | CLI regex | Hardcoded localhost URLs in non-config files |
| PRODUCTION_ENV_GATE | warning | Express | CLI regex | === 'production' instead of !== 'development' |
| HARDCODED_SECRETS | error | Security | CLI regex | sk_live_, AKIA*, sk- keys in source |
| THEN_WITHOUT_CATCH | warning | Express | CLI regex | .then() without .catch() — unhandled rejection |
| JSON_PARSE_NO_TRYCATCH | error | Express | Programmatic | JSON.parse without enclosing try/catch |

## Non-CLI Principles (Subagent-Required)

| Principle | Subagent Template | Priority |
|-----------|------------------|----------|
| DB query without null check | #1 DB Query Null Check Audit | P1 — crash bug |
| Admin routes without auth | #2 Admin Route Auth Audit | P3 — security |
| useEffect without cleanup | #3 useEffect Cleanup Audit | P4 — memory leak |
| Mixed component/non-component exports | #4 HMR Mixed Exports Audit | P4 — DX |
| Unstable dep arrays | #5 Unstable Dep Arrays Audit | P4 — infinite re-render |
| Catch blocks missing response | #6 Catch Block Response Audit | P2 — silent timeout |
| Mongoose schema field writes | #7 Schema Field Writes Audit | P5 — silent data loss |
