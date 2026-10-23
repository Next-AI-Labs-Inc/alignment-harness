---
name: fix-algo-bug-determine-if-auto-fix-ok
description: Systematically eliminate a bug class by identifying the root cause, scoping all vulnerable call sites, building a
triggers:
  - "scope this bug"
  - "this bug might exist elsewhere"
  - "automate detection"
  - "check for this pattern"
  - "build a detector"
  - "prevent regression"
---

# Bug Scope, Automate, Fix — Systematic Bug Class Elimination

## When to Use
When you find a bug and suspect it could exist in other places. Triggers:
- "this bug might exist elsewhere"
- "check if this pattern is broken in other files"
- "scope this bug"
- Any time you fix a bug caused by a missing guard, wrong default, or silent API behavior

## The Pattern (4 phases)

### Known Fixed Error Check (MANDATORY)

Before investigating ANY bug, check if it's already marked as fixed:

```
grep -F "<error message>" "$(alignment-harness records known-fixed-errors)/known-fixed-errors.jsonl"
```

If grep returns a matching line:
- **SKIP** this bug entirely
- Log: "[KNOWN FIX] {errorPattern} — Fixed in {fixedInCommit} on {fixedOnBranch}, pending merge"
- Move to the next bug

If grep returns nothing or the file does not exist:
- Proceed with normal investigation

### Phase 1: Understand the Root Cause
Before scoping, you must understand WHY the bug exists — not just WHAT broke.

- **Silent failures are the worst class**: APIs that return 200 with partial data (like Meta's 25-row pagination default) are harder to catch than errors
- **Time-dependent bugs**: Some bugs only manifest after a threshold (e.g., >25 days of daily data). These survive all testing because the threshold hasn't been crossed yet
- **Name the bug class**: Give it a short name that captures the mechanism, not the symptom. "Meta pagination truncation" not "rolling 7d shows zero"

### Phase 2: Scope the Bug Across the Codebase
Search for every place the same root cause could trigger.

```
1. Identify the vulnerable PATTERN, not just the vulnerable FILE
   - What makes code vulnerable? (e.g., "calls Meta /insights without limit param")
   - What makes code safe? (e.g., "has limit=100 in params or URL")

2. Search broadly, then filter
   - Grep for the API/function/pattern across ALL repos
   - Classify each hit: VULNERABLE | SAFE | NOT_APPLICABLE
   - Document why each safe one is safe (prevents re-investigation)

3. Count the scope
   - "3 call sites found: 2 already fixed, 1 vulnerable"
   - This number tells you if it's worth automating detection
```

### Phase 3: Create a Detection Script
Build a static analysis tool that catches this bug class automatically.

**Script requirements:**
- Runs from CLI with zero dependencies beyond Node.js
- Scans all relevant repos (not just the one where the bug was found)
- Zero false positives (the script's credibility IS its value — one false positive and agents/humans ignore it)
- `--fix` flag shows exact fix instructions per violation (file, line, code to add)
- `--strict` flag exits with code 1 for CI gating
- Console output written as if talking to an agent who needs to fix it: root cause explanation + exact remediation steps

**False positive elimination checklist:**
- Skip comment lines and JSDoc
- Skip test files and build output
- Handle parameterized patterns (e.g., `${params}` where params already has the guard)
- Check ALL template variables in a line, not just the first match (`matchAll` not `match`)
- Self-exclude the detection script
- Test the script against known-safe and known-vulnerable code before shipping

**Where to put it:**
- Cross-repo concern → `shared-tools/scripts/`
- Single-repo concern → `{repo}/scripts/`
- Name it `check-{bug-class}.js` (e.g., `check-meta-pagination.js`)
- If the `shared-tools/scripts/` or `{repo}/scripts/` folder does not exist, create it.

### Phase 4: Fix All Instances
With the detector showing exact violations, fix them all in one pass.

```
1. Run the detector → get violation list
2. Fix each violation
3. Re-run detector → verify zero violations
4. The detector becomes a permanent regression guard
```

### Phase 4b: Mark Errors as Fixed (MANDATORY after committing fixes)

After committing fixes for bug instances, register each distinct error pattern in the Known Fixed Error Registry:

```
alignment-harness record known-fixed-errors --name known-fixed-errors.jsonl <<'EOF'
{"errorPattern": "<the error message or key substring>", "fixedInCommit": "<commit SHA>", "fixedOnBranch": "staging", "repo": "<repo name>", "description": "<what was fixed and why>", "fixedBy": "agent"}
EOF
```

This prevents future agents from re-investigating the same error before the fix merges to main.

## Key Principles

**Automate detection BEFORE fixing the batch.** The detector is more valuable than any single fix because it prevents the bug from ever returning. A fix without a detector is a one-time patch; a detector without fixes is a prioritized backlog.

**Zero false positives > complete coverage.** An agent that sees false positives learns to ignore the tool. An agent that sees only real violations trusts and acts on every one. It's better to miss an edge case than to cry wolf.

**The script's console output IS the fix documentation.** Don't write a separate doc explaining the bug. The `--fix` output should contain: root cause, why it's dangerous, exact code change needed. When an agent runs the script 6 months from now, it has everything it needs.

**Time-dependent bugs need static analysis, not runtime checks.** If a bug only manifests after N days/rows/users, runtime monitoring won't catch it during development or testing. Static analysis catches it at author-time regardless of data volume.

## Principle: Never Flip Bug-Documentation Tests

When an automated agent encounters tests that are intentionally written to fail (documenting known bugs with comments like "EXPECTED: FAIL", "Bug verification", "Bug #N"), those tests MUST NOT be changed to assert current (buggy) behavior. Flipping them hides the bug and destroys the documentation trail. The correct action is to SKIP them or leave them failing — they exist as a contract that the bug is known and tracked.

When {an agent encounters a deliberately-failing bug-documentation test} then {leave it failing or mark it .skip — never change assertions to match buggy behavior}.
