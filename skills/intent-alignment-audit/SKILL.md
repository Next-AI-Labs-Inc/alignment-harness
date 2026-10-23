---
name: intent-alignment-audit
paths: "**/intent/**,**/seeds/**,**/proposals/**"
description: On-demand audit that cross-references Intent DB against codebase @intent tags and @intents-covered test headers.
triggers:
  - "intent audit"
  - "alignment audit"
  - "intent coverage"
  - "check intent coverage"
  - "scan intents"
  - "intent violations"
  - "resolution playbook"
  - "what intents are uncovered"
  - "intent gaps"
---

# Intent Alignment Audit

## What This Does

Cross-references the Intent DB (701+ intents with IX-### IDs) against codebase references to surface:
- **Uncovered intents** -- intents exist in the DB but no code or tests reference them
- **Orphaned references** -- code references intents that don't exist in the DB
- **Missing playbooks** -- intents without resolution playbooks for systemic fixes
- **Coverage gaps** -- intents with code but no tests, or tests but no code

## When to Use

- Before starting work on a feature area -- see what intents govern it
- After a bug fix -- check if the intent has a resolution playbook (author one if not)
- During review -- verify committed code references the intents it implements
- Periodic audit -- scan the full codebase for coverage gaps

## How to Use

### CLI (from your project directory)
```bash
# Scan staged files
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-alignment-audit/intent-alignment-audit.js" --staged

# Scan a specific commit
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-alignment-audit/intent-alignment-audit.js" --commit abc123

# Scan last 7 days of changes
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-alignment-audit/intent-alignment-audit.js" --last 7

# Full codebase scan (capped at 10 violations)
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-alignment-audit/intent-alignment-audit.js" --all --max 10

# Filter to a specific area
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-alignment-audit/intent-alignment-audit.js" --staged --area auth

# JSON output for programmatic use
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-alignment-audit/intent-alignment-audit.js" --last 7 --json
```

## Coverage Categories

| Category | Symbol | Meaning |
|----------|--------|---------|
| COVERED | + | Intent has both code references AND test coverage |
| CODE_ONLY | ~ | Intent has code references but no test |
| TEST_ONLY | ? | Intent has test coverage but no code references |
| UNCOVERED | X | Intent is in the DB for this area but has no code or test references |
| ORPHANED | ! | Code references an intent slug/ID that doesn't exist in the DB |

## Resolution Playbooks

When an intent has a `resolutionPlaybook`, the audit includes it. Playbooks describe:
- **Pattern**: The systemic implementation pattern (files, architecture)
- **Mechanism**: Why it works
- **Failure modes**: What typically breaks it
- **Restoration**: How to restore the pattern (NOT a point fix)
- **Verify with**: Test file that confirms the intent holds

### Authoring a Playbook

After fixing an intent violation, propose a playbook via the UX Intent DB:
```bash
# Update via the alignment-harness CLI — use intent records for UX intents
alignment-harness intent update IX-698 --json '{ "resolutionPlaybook": {
    "pattern": "Every fetch/axios call to auth endpoints includes credentials: \"include\"",
    "mechanism": "Browser only sends httpOnly cookies when request opts in. Without this, cookie-based auth silently fails.",
    "failureModes": ["New fetch call added without credentials", "Axios instance missing withCredentials"],
    "restoration": "Grep ALL fetch/axios calls to /auth/ or /api/ endpoints. Each must have credentials configured.",
    "verifyWith": "__tests__/intents/systemic-auth-credentials-guarantee.test.js",
    "canonicalFiles": ["src/components/common/EmailPasswordLogin.js", "src/utils/tokenRefresh.js"]
}}'
```

## What This Is NOT

- NOT a CI gate -- never blocks commits
- NOT injected into agent context automatically -- invoked on demand
- NOT expensive -- runs locally, no LLM calls, ~2 seconds for staged files

## Implementation Details

- **Script**: `${CLAUDE_PLUGIN_ROOT}/skills/intent-alignment-audit/intent-alignment-audit.js`
- **Primary model**: `alignment-harness records intents` (local `intents` records folder — UX/code-level intents)
- **Secondary model**: `alignment-harness records company-intents` (use `--include-company` flag to merge both)
- **Regex patterns scanned**:
  - `@intent: <slug-or-IX-id>` in code comments
  - `@intents-covered: <slug1>, <slug2>` in test file headers
  - `intentSlug: '<slug>'` in logger/console calls
- **Repos scanned**: your current directory, or each path passed with `--repo`
- **Excludes**: node_modules, build, dist, .next, .git, coverage, public

## Persisting Audit Findings

When an alignment audit surfaces significant coverage gaps or regressions, persist findings in the **Research Findings DB** (`researchType: "decision-audit"` or `"ux-regression"`):
- `grep -ril "intent coverage" "$(alignment-harness records research-findings)"` — check if similar audit was already done
- `alignment-harness store add research-findings --json '{...}'` — create finding with `linkedIntentIds` pointing to the gap intents
- Records folder: `alignment-harness records research-findings`
