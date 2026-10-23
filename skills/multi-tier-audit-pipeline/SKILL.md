---
name: multi-tier-audit-pipeline
description: Run a three-tier autonomous audit pipeline that discovers findings, validates them against real code, and turns confirmed
triggers:
  - "multi-tier audit"
  - "audit everything"
  - "autonomous audit pipeline"
---

# Multi-Tier Autonomous Audit Pipeline

## When to Use

- When the user says "audit everything", "find all bugs", "sweep the codebase", "what's broken"
- When preparing for a production launch and need to surface all critical issues
- When running periodic codebase health checks
- When you need to discover, validate, and propose fixes across the full project surface area

## Architecture

Three tiers, each with a distinct job:

```
Tier 1: HAIKU DISCOVERY (wide net, cheap, parallel)
  → One agent per source. Finds raw findings.
  → Writes its own compaction per source.

Tier 2: SONNET VALIDATION (evidence-based, reads real code)
  → One agent per critical/high finding.
  → Proves or disproves each finding by reading actual code.
  → Writes [VALIDATED] or [FALSE POSITIVE] compactions.

Tier 3: OPUS PROPOSALS (careful, /speak-human + /reflect + diff)
  → One agent per validated issue.
  → Writes [FIX PROPOSAL] compactions for instant user approval.
  → Format: who it hurts, what they see, code diff, approve/reject.
```

## Critical Rules

1. **One agent per source** — never share work between agents. Prevents file conflicts and enables full parallelism.
2. **Write to compactions, not files** — all output goes to `alignment-harness store add compactions --json '{...}'`. No intermediate flat files.
3. **Sonnet must read actual code** — never trust Haiku findings without code-level verification. Haiku agents misread code ordering and metadata labels.
4. **Opus proposals use /speak-human** — zero jargon in proposals. If a smart non-coder would furrow their brow, rewrite it.
5. **Each Haiku maintains its own compaction** — tagged with its source for traceability.

## Phase 1: Dispatch Haiku Sweepers

Dispatch one Haiku agent per source, all `run_in_background: true`. Each agent:
- Runs its specific checks
- Writes a compaction titled `[DISCOVERY] {source name} — X findings`
- Tags: `["discovery", "haiku", "{source-name}"]`

### Source Registry (ALL sources — Haiku is near-free, run everything)

| # | Source | Skill | What It Checks |
|---|--------|-------|---------------|
| 1 | Scanners + Jest + Lint | — | All scanner scripts + jest suites + eslint |
| 2 | System log triage | — | SystemLog DB errors, unranked, pending acceptance |
| 3 | Launch critical paths | — | Payment, login, access tier, coaching core |
| 4 | Sales pipeline audit | — | Landing → checkout → webhook → access → retention |
| 5 | UX testing learnings | `/ux-testing-learnings` | Known losses, blockers, patterns |
| 6 | Archetype ranking | — | Issues scored by user archetype weight |
| 7 | Playwright browser tests | `/playwright-validator` | Real browser: pages load, dead screens, console errors |
| 8 | Admin security audit | — | Unprotected routes, secrets, admin leaks |
| 9 | API alignment check | — | Unmounted routes, shape mismatches |
| 10 | Intent DB alignment | `/intent-alignment-audit` | @intent tag coverage gaps |
| 11 | Failing tests alignment | `/tests-failing-check` | Real bugs vs stale tests vs env issues |
| 12 | Silent failure detection | — | .catch(console.log), empty catches, silent rejections |
| 13 | OWASP security review | — | XSS, injection, CSRF, auth bypass, IDOR |
| 14 | Defensive error audit | — | Missing try-catch in user-facing code |
| 15 | Error handling standards | — | Inconsistent error response shapes |
| 16 | Missing return response | — | Express routes without `return res.json()` |
| 17 | Unstable dep arrays | — | React hooks with objects in dep arrays |
| 18 | useEffect cleanup | — | Missing cleanup returns |
| 19 | Backend quality warnings | — | Hardcoded localhost, unstable timestamps |
| 20 | Production gates | — | Broken `=== 'production'` checks |
| 21 | Console.log hotpath | — | console.log in production routes |
| 22 | PostHog errors | `posthog:errors` | Client-side JS errors from PostHog |
| 23 | Coaching telemetry errors | — | Pipeline failures, model fallbacks |
| 24 | Coaching quality readout | — | Quality composite vs peak |
| 25 | Stripe webhook health | — | Failed webhooks, snapshot staleness |
| 26 | Feature flag audit | — | Stuck flags, no-consumer flags |
| 27 | Orphaned test audit | — | Tests covering dead code |
| 28 | Pre-commit hook dry run | — | commit-guard.js check mode |
| 29 | Semgrep static analysis | — | Cross-file vulnerability patterns |
| 30 | Insecure defaults | — | Fail-open auth, permissive CORS |
| 31 | Sharp edges | — | Error-prone APIs, footgun configs |
| 32 | Cookie/auth token audit | — | Inline token reads, divergent cookie names |
| 33 | Schema field audit | — | $set on fields not in Mongoose schema |
| 34 | SendGrid bypass check | — | Direct sgMail imports outside utils/sendGrid.js |
| 35 | Naming violations | — | Bare ambiguous variable names |
| 36 | Vague test descriptions | — | Non-descriptive test names |
| 37 | React HMR violations | — | Non-component exports mixed with components |
| 38 | Async in request path | — | External API calls blocking HTTP response |
| 39 | WIP safety check | — | "Unused" schema fields that are WIP scaffolding |
| 40 | Admin page registry sync | — | Admin pages not in registry |
| 41 | Canny user feedback | `canny_list_posts` | User-reported bugs and feature requests |
| 42 | Agent telemetry patterns | — | Agent failure streaks, hook errors |
| 43 | Compaction hollow audit | — | Thin compactions missing structured fields |
| 44 | Validate against live data | `/validate-against-live-data` | Code decisions vs real user data |
| 45 | Differential security review | — | Security review of recent diffs |

## Phase 2: Sonnet Validation

After Haiku agents complete, query compactions for `[DISCOVERY]` tagged findings.

### Cron Loop Setup
```
/loop 5m Sonnet validation: Query compactions API for discovery findings not yet validated. For each critical/high finding, dispatch a Sonnet agent to read actual code and prove/disprove.
```

### Per-Finding Sonnet Agent Protocol
1. Read the ACTUAL source file at the cited line
2. Trace the execution path — don't assume from function names
3. Check system logs for production evidence of the issue
4. Write compaction:
   - `[VALIDATED] {title}` with evidence OR `[FALSE POSITIVE] {title}` with disproof
   - Tags: `["validation", "sonnet", "{source}", "confirmed-issue"|"false-positive"]`
   - If validated, add incompleteItem: "Needs Opus fix proposal"

### Validation Priority
- Critical findings → immediate manual dispatch (don't wait for cron)
- High findings → next cron cycle
- Medium/low → batch in cron

## Phase 3: Opus Fix Proposals

After Sonnet validates findings, query compactions for `[VALIDATED]` + `confirmed-issue` tags.

### Cron Loop Setup
```
/loop 10m Opus proposals: Query compactions API for validated findings without fix proposals. Dispatch one Opus agent per issue.
```

### Per-Issue Opus Agent Protocol
1. **Invoke /speak-human** — translate to zero-jargon language
2. **Invoke /reflect** — catch assumption cascades
3. **Read actual source code** — trace full UX impact
4. **Capture browser evidence** if UI-visible (via `/agentic-chrome-testing`)
5. **Write compaction** with EXACT format:

```markdown
## 🔴 {FINDING-ID} {One-sentence plain-English problem}
**Who it hurts**: {user type} during {UX moment}
**What they see**: {exact broken experience}
**Screenshot evidence**: {path or "not UI-visible"}

### Proposed Fix
**File**: `path/to/file.js:line`
**Change**: {2-3 sentence human description}
**Risk**: {low/medium/high} — {why}
**Reversible**: {yes/no}

### Code Diff
\```diff
- old line
+ new line
\```

**Approve?** ✅ Yes / ❌ No / 🔄 Revise
```

Tags: `["fix-proposal", "opus", "awaiting-approval", "{repo}"]`

## Phase 4: User Review

All proposals stream to: `alignment-harness store list compactions`

- Search `[FIX PROPOSAL]` or filter tag `awaiting-approval`
- Each proposal is a 5-second approve/reject decision
- Approved → agent implements and commits
- Rejected → dropped or revised

## Orchestrator Dispatch Template

```javascript
// Phase 1: Dispatch all Haiku agents in parallel
const sources = [
  { name: "scanners-jest-lint", model: "haiku", prompt: "..." },
  { name: "system-log-triage", model: "haiku", prompt: "..." },
  // ... one per source from the registry
];

// All dispatched with run_in_background: true
// Orchestrator stays available to the user

// Phase 2: As Haiku agents complete, dispatch Sonnet for critical findings
// Phase 3: As Sonnet validates, dispatch Opus for confirmed issues
// Never block — always background dispatch
```

## Learnings from First Run (2026-03-26)

1. **Sonnet validation caught 2 of 3 false positives** — Haiku agents misread access tier waterfall ordering and DRY_MODE metadata label as control flag
2. **Shared /tmp files cause race conditions** — multiple Haiku agents overwriting same file lost data. Use compactions instead.
3. **Manual dispatch is faster than cron for criticals** — push critical findings through immediately, don't wait for next cron tick
4. **80+ system log errors surfaced** — 6 critical, 7 high, 50 unranked
5. **3 unmounted routes found** — therapist directory, coach lookup, practices library all 404 for users

## API Reference

```bash
# Write compaction
alignment-harness store add compactions --json '{...}'

# Query compactions by tag
alignment-harness store list compactions --json

# Query system logs
{your project's error log query}

# Query UX testing learnings
cat "$(alignment-harness records ux-testing-learnings)/log.jsonl"

# Query Intent DB
alignment-harness intent search {query}

# Check known-fixed errors
grep -F "{message}" "$(alignment-harness records known-fixed-errors)/known-fixed-errors.jsonl"
```

## Related Skills
- `/orchestrator` — top-level coordination protocol
- `/compact-agentic-session` — compaction creation protocol
- `/investigate-error` — per-error Haiku research
