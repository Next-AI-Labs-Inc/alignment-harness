---
name: intent-lifecycle
paths: "**/intent/**,**/seeds/**,**/proposals/**"
description: Use when starting any feature, bugfix, or refactor — ensures user intent survives from conversation through planning, i
triggers:
  - "intent"
  - "user intent"
  - "ux intent"
  - "intent tracking"
  - "intent lifecycle"
  - "decompose intent"
  - "log intent"
  - "carry intent"
  - "intent slug"
  - "users should never"
  - "users should always"
  - "when user then"
  - "intent db"
  - "company intent"
---

# Intent Lifecycle System

## Overview

Intent is the single most fragile artifact in agentic coding. It gets stated by the user, then diluted or lost as it passes through planning, code, tests, errors, commits, and audits. This skill treats **intent as a first-class entity** with a slug identifier that flows through every phase.

**Core principle:** If the user's original intent cannot be traced from their words to the deployed code, the system has failed — regardless of whether the code "works."

## Intent Statement Format

**REQUIRED:** Before writing any intent statement, consume `/intent`. That skill defines the two formats (system intent and UX intent), the wrong/right examples, and the rules for translating code into human-readable statements without losing precision.

```
System: When {every condition, described as what's happening in the person's experience} then {the system responsible, named by what it does} should {the exact behavior, as its effect on the person}
UX: When {every condition, described as what the person has done or what state they're in} then {the person} should {exactly what happens for them, with code-level precision in human terms}
```

### Rules

1. **Never use code variable names when a UX-equivalent exists**
   - Wrong: "when `plan === 1` and `stripeCustomerId` exists"
   - Right: "when user is not paying and not on a CC trial"
2. **Not all code intent CAN be translated to UX** — but never substitute code for a variable that can be expressed as the UX it resolves to
3. **Each intent must be:**
   - **Atomic** — one testable thing
   - **Precise** — as specific as code
   - **Human-readable** — any stakeholder can understand it

### Examples

```
# Good — "When {constraints} we {statement}"
When a free user reaches the session limit, we show a clear upgrade prompt with pricing

When a paying user's token expires during a coaching session, we renew it silently — the
session continues without interruption

When a user who is not paying or on a trial first lands on the home page, we do not force login

# Bad
When plan === 1 then show modal                    (code variables, not UX)
When user hits paywall then handle it               (vague, not testable)
When auth fails then retry and show error           (two things, not atomic)
```

## Two-Layer ID System

Every intent has two identifiers:

- **Machine layer:** `IX-042` (3-4 tokens) — auto-assigned on create. Use in code comments (`// @intent: IX-042`), planning docs, agent context, console.error metadata, commit `Intents:` lines.
- **Human layer:** Full UX statement — use in test names, UX assignments, console error admin UI, changelogs, commit headlines.
- **Bridge:** `getIntent('IX-042')` resolves ID → `{ intentId, slug, title, description, tags, category }`. Intent DB is the registry.

**Token budget:** Carry `IX-###` IDs (3 tokens each) through agent context. Full statements (~25 tokens) appear only on human-facing surfaces. 50 intents in a plan = 150 tokens via IDs vs 1250 via statements.

## The Seven Phases

### Phase 1: DISCOVERY (conversation)

Agent recognizes intent markers in user speech and decomposes them into atomic statements.

**Auto-mining triggers** — when the user says any of these, an intent exists to be captured:

| Pattern | Example | Intent Direction |
|---------|---------|-----------------|
| "users should never..." | "users should never see a blank screen after paying" | Direct statement |
| "users should always..." | "users should always know their trial status" | Direct statement |
| "we intend to..." | "we intend to make onboarding zero-friction" | Strategic intent |
| "the user expects..." | "the user expects their session to persist" | UX contract |
| "when X happens, they should see Y" | "when they upgrade, they should see a confirmation" | Conditional UX |
| "never show X when Y" | "never show upgrade CTA to a paying user" | Negative constraint |
| "this should be invisible to the user" | "token refresh should be invisible" | Transparency constraint |
| "this is broken because [UX description]" | "this is broken because free users see paid features" | Inverse is the intent |

**Actions:**
1. Decompose into atomic `When...then...` statements
2. Assign a slug (kebab-case, 3-5 words, UX-descriptive)
3. Log to **UX Intent DB** (feature/code-level intents): `node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" create '<json>'`
   - For business strategy/KPI intents only: `alignment-harness store add company-intent --json '<json>'`
4. Print slugs to chat — carry forward through all phases

**Which DB?** UX intents (feature behavior, code intent, UX promises) → Intent DB (`intent.js`). Business strategy (KPIs, initiatives, positioning) → Company Intent DB (`alignment-harness store` kind `company-intent`). When unsure, use UX Intent DB — it's the primary target for `@intent:` tags and agent context.

**Token cost:** ~20 tokens per slug carried forward.

### Phase 2: PLANNING

Plans explicitly reference intent slugs they will address. Any intent NOT covered by the plan is flagged as a gap.

**Actions:**
1. Query Intent DB for the feature area: `node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" find "feature-area"`
   - Also check Company Intent DB for strategic context: `alignment-harness store list company-intent`
2. List intent slugs the plan will address in the plan header
3. Flag any known intent in the area NOT covered by the plan
4. If writing a plan doc, include an `## Intents Addressed` section

```markdown
## Intents Addressed
- `silent-session-renewal` — Phase 3, Task 2
- `auth-api-credentials-include` — Phase 3, Task 1
- `upgrade-cta-never-shown-to-paying-user` — Phase 3, Task 4

## Intents NOT Addressed (known gaps)
- `session-history-persists-across-devices` — out of scope, logged for future
```

**Token cost:** 1 query, ~200 tokens for results.

**REQUIRED SUB-SKILL:** Use superpowers:writing-plans for plan structure.

### Phase 3: IMPLEMENTATION

Load only the 2-3 intents relevant to the current file/function. Tag code where behavior is non-obvious.

**Code comments:**
```javascript
// @intent: silent-session-renewal
// When a paying user's token expires during a coaching session
// then the session continues without interruption
async function refreshTokenSilently() {
  // ...
}
```

**Console errors with intent tracing:**
```javascript
logger.warn('[auth] Token refresh failed — user will see re-login prompt', {
  intentSlug: 'silent-session-renewal',
  uxImpact: 'Session interrupted, user loses coaching context',
  userId: user._id
});
```

**Rules:**
- Only tag where behavior is non-obvious or where a future agent might misunderstand WHY
- Do not tag every line — tag entry points, gates, and error paths
- Include `uxImpact` in error logs so monitoring surfaces UX consequences, not just technical failures

**Token cost:** ~10 tokens per slug reference.

### Phase 4: TDD

Test descriptions state the UX intent, not cryptic function names. Test file headers list intent slugs covered.

**Test file header:**
```javascript
/**
 * @intents-covered: silent-session-renewal, auth-api-credentials-include
 *
 * Tests verify that token expiration during active coaching sessions
 * is handled invisibly to the user (no interruption, no re-login).
 */
```

**Test descriptions:**
```javascript
// Good — states UX intent
test('S1: token expiration during coaching renews silently — user sees zero interruption', async () => {
  // ...
});

test('S2: when refresh fails, user sees friendly re-login prompt — not a raw error', async () => {
  // ...
});

// Bad — cryptic function name, no UX context
test('refreshToken retries 3 times', async () => {
  // ...
});
```

**Token cost:** ~15 tokens per test description.

**REQUIRED SUB-SKILL:** Use superpowers:test-driven-development for the RED-GREEN-REFACTOR cycle.

### Phase 5: COMMIT

Commit messages reference intent slugs addressed.

```
fix(auth): add credentials to login API calls

When login API calls omit credentials, cookie-based auth silently fails
and users see a blank screen after what appears to be a successful login.

Intents: auth-api-credentials-include, registration-stores-both-tokens
```

**Rules:**
- Intent slugs go in the commit body, not the subject line
- Subject line follows conventional commits format
- Body explains the UX consequence of the bug/feature, not just the technical change

**Token cost:** ~10 tokens per commit.

### Phase 6: UX ASSIGNMENTS

Each UX test assignment validates the ORIGINAL intent — not deviations from it.

**Assignment structure includes intent linkage:**
```markdown
## Assignment: Verify Silent Token Renewal
**Intent:** `silent-session-renewal`
**When:** User is mid-coaching-session and token expires (simulated via admin tool)
**Then:** Session continues without interruption — no modal, no redirect, no visible error
**Simulator URL:** <your-user-simulator-url>?auth=expired-token&subscription=active&redirect=/coaching
```

**Token cost:** 1 query per assignment.

**REQUIRED SUB-SKILL:** Use ux-assignment-generator for assignment creation.

### Phase 7: AUDIT

Query the intent system to find gaps, measure velocity, and trace errors back to intent.

**Audit queries:**
```bash
# Which intents have no TDD coverage?
# Search for intents, then grep codebase for @intents-covered referencing each slug
alignment-harness store list company-intent → list slugs → grep for @intents-covered

# Which intents were addressed in the last sprint?
# Search git log for "Intents:" in commit messages
git log --since="2 weeks ago" --grep="Intents:" --oneline

# Which console errors reference this intent?
# Grep for intentSlug in codebase
grep -r "intentSlug.*silent-session-renewal" src/
```

**Token cost:** 1 query per audit question.

## Token Budget Strategy

Do not carry all intents in context. Make them queryable.

| Artifact | Token Cost | Strategy |
|----------|-----------|----------|
| Slug only | ~3-5 tokens | Carry freely in context |
| Full description | ~50-100 tokens | Fetch on demand via `alignment-harness store get company-intent <id>` |
| Phase-gated set | ~20-60 tokens | Only load intents for current phase + feature area |

**Phase-gated loading:**
- Discovery: all intents for the conversation topic
- Planning: all intents for the feature area (1 query)
- Implementation: only 2-3 intents for the current file
- TDD: only intents relevant to the test file
- Commit: only slugs (no full descriptions needed)

## Opportunistic Linkage — When to Attach Intent IDs

Intent linkage is **conditional, not mandatory**. The IX-#### ID flows through whatever systems the agent naturally touches during work. If an intent surfaces, link it. If not, don't force it.

**When to link:**
- An intent is discovered or clarified during conversation → create it in Intent DB (Phase 1)
- Writing code that serves a known intent → `// @intent: IX-042` (Phase 3)
- Creating TDD for intent-related behavior → `@intents-covered` header (Phase 4)
- Committing code with intent relevance → `Intents:` line (Phase 5)
- Creating UX assignments → `intentIds: ["IX-042"]` field (Phase 6)
- Creating changelog entries → `intentIds: ["IX-042"]` field
- Creating agent proposals → `linkedIntents[].intentId` field

**When NOT to link:**
- Pure maintenance/refactoring with no UX intent
- Infrastructure changes (CI, tooling, deps)
- The agent doesn't know of a relevant intent and nothing surfaced during work

### Systems That Accept `intentIds[]`

| System | Field | Location |
|--------|-------|----------|
| **UX Assignment** | `items[].intentIds[]` | VerificationItemSchema |
| **Leverage Idea** | `items[].intentIds[]` | LeverageIdeaItemSchema |
| **Changelog** | `intentIds[]` | Root schema |
| **Notification** | `intentIds[]` | Root (auto-inherited from Changelog) |
| **Developer Task** | `intentIds[]` | Root schema |
| **Agent Proposal** | `linkedIntents[].intentId` | Subdocument (alongside existing slug) |
| **System Log** | `intentSlugs[]` | Root (slug-based, predates IX-#### IDs) |
| **Staged Release** | `intentDbSlug` | Root (slug-based, single value) |

## Quick Reference

| Phase | Agent Action | Artifact Created |
|-------|-------------|-----------------|
| Discovery | Decompose user speech into atomic intents | Intent DB entries with slugs |
| Planning | Query Intent DB, reference slugs in plan | Plan with `## Intents Addressed` |
| Implementation | Tag code with `@intent:` slug | Code comments, `intentSlug` in logs |
| TDD | Name tests after UX intent | `@intents-covered` headers, descriptive test names |
| Commit | Include slugs in commit body | `Intents: slug-1, slug-2` |
| UX Assignment | Link assignment to intent slug + `intentIds[]` | Assignment with intent linkage |
| Audit | Query for coverage gaps | Gap reports, velocity metrics |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Carrying full intent descriptions through all phases | Carry slugs only. Fetch full descriptions on demand. |
| Writing intents with code variable names | Translate to UX language. `plan === 1` becomes "free user." |
| Compound intents (two things in one statement) | Split. Each intent must be independently testable. |
| Tagging every line of code with @intent | Tag entry points, gates, and error paths only. |
| Skipping Phase 1 decomposition ("I know what they mean") | Always decompose explicitly. Implicit understanding does not survive phase transitions. |
| Test names that describe functions instead of UX outcomes | "token refresh retries 3 times" tells nothing about UX. State what the user experiences. |
| Console errors without `uxImpact` field | Technical errors are invisible to UX triage. Always state the user-facing consequence. |

## Related Skills

- **intent-db** — UX Intent DB CRUD (primary for code/feature-level intents)
- **company-intent-db** — Company Intent DB CRUD (business strategy, KPIs, initiatives)
- **intent-alignment-audit** — On-demand cross-reference of Intent DB vs codebase `@intent:` tags
- **superpowers-writing-plans** — Plan structure with intent references
- **superpowers-test-driven-development** — TDD cycle integrating intent-named tests
- **ux-assignment-generator** — Creating UX tests that validate intents
- **how-to-write-meta-analysis-docs** — Documenting intent coverage audits
- **how-to-log-to-each-internal-log** — Console error intent tagging destinations

## Two-DB Architecture

| | UX Intent DB | Company Intent DB |
|---|---|---|
| **Purpose** | Feature behavior, code intent, UX promises | Business strategy, KPIs, initiatives |
| **Collection** | `alignment-harness records intents` | `alignment-harness records company-intent` |
| **Model** | `${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js` | `${CLAUDE_PLUGIN_ROOT}/lib/store.js` |
| **Routes** | `intent.js find\|get\|create` | `alignment-harness store add\|list\|get\|update company-intent` |
| **Admin UI** | `alignment-harness records intents` | `alignment-harness records company-intent` |
| **When to use** | `@intent:` tags, test headers, agent context, code comments | Strategic decisions, company values, market positioning |
| **Shared** | Both use IX-### IDs (shared sequence), both have `resolutionPlaybook` |

**`getIntent('IX-042')`** queries UX Intent DB first, falls back to Company Intent DB. This is the canonical bridge for resolving any IX-### ID regardless of which DB it lives in.

## Intent DB Quick Reference

```bash
# Resolve any intent by IX-### or slug (queries both DBs automatically)
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" get IX-042

# Search UX intents for a feature area
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" find "auth login"

# Search company intents for strategic context
alignment-harness store list company-intent

# Propose new UX intent (feature/code-level)
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" create '<json>'
{
  "title": "Silent Session Renewal",
  "primaryIntent": "When a paying user's token expires during coaching, the session continues without interruption",
  "slug": "silent-session-renewal",
  "tags": ["auth", "session"],
  "parentSlug": null
}

# Propose business strategy intent
alignment-harness store add company-intent --json '<json>'
{
  title: "Session Continuity Priority",
  primaryIntent: "We prioritize uninterrupted coaching sessions as a core product differentiator",
  slug: "session-continuity-priority",
  tags: ["strategy", "product"],
  category: "product"
}

# CLI: lookup any intent (tries UX DB first, then Company DB)
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" get IX-042
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" get silent-session-renewal
```

## Quick Recipe (Pipeline Use)

When inside a governer pipeline step and you only need to POST one intent, use the lean recipe instead of this full skill:
- **`/intent-define`** — 200-token recipe: POST URL, body format, slug naming rules. Links back here when uncertain.
