---
name: audit-pre-commit
description: "Pre-commit audit checklist — verify every diff against the 6 shipping principles before committing. Use before any commit, especially commits that touch user-facing code paths. Triggers: 'pre-commit', 'audit before commit', 'ready to commit', 'check before pushing', 'shipping checklist'."
---

# Audit Pre-Commit

Before committing any code that touches user-facing paths, verify against all 6 shipping principles. Each principle has a dedicated skill with full procedures.

## The 6 Shipping Principles

### 1. Structured Logging, Not Console.log

- [ ] No `console.log` in controllers, middleware, or route handlers
- [ ] All logs use `logger.info()`, `logger.debug()`, `logger.warn()`, or `logger.error()`
- [ ] Structured metadata (objects, not string concatenation)
- [ ] `console.log` is ONLY acceptable inside `if (process.env.NODE_ENV === 'development')` blocks

### 2. Feature Flag Before Ship

- [ ] New user-facing features start as `IN_DEVELOPMENT` (admin-only)
- [ ] Feature is gated with `isFeatureVisible()` (frontend) or `checkStagedRelease()` (backend)
- [ ] An admin can promote to `IN_BETA` then `IN_PRODUCTION` without a deploy
- [ ] No new feature is visible to regular users on first commit

### 3. No Incomplete Code Ships
**Check:** Does the diff introduce API routes with no frontend caller? Backend fields with no consumer? Frontend UI that calls endpoints that don't exist yet?

- [ ] Every API route has at least one caller (frontend or test)
- [ ] Every new field on a model is read somewhere
- [ ] If a route/field is intentionally pre-staged, add a `// @staged: no caller yet — will be wired in [ticket/PR]` comment
- [ ] Dead code from removed features is deleted, not commented out

### 4. Defensive Coding with logger.error on Failure

- [ ] Every user-facing code path has try-catch
- [ ] Catch blocks call `logger.error()` (backend) or `logError()` (frontend) with severity + uxImpact
- [ ] Catch blocks NEVER make UX worse — fail-open for paying users, fail-closed only for security
- [ ] No bare `catch (e) {}` or `catch (e) { console.log(e) }` — every catch logs structured error data
- [ ] Features that could break UX are wrapped so failure = feature silently disabled, not app crash

### 5. logger.error Works Everywhere
**Check:** Does the file use the canonical error logging function?

- [ ] Backend: `const logger = require('../utils/logger')` — then `logger.error(msg, metadata)`
- [ ] Frontend (app): `import { logError } from '@utilities/errorLogger'` — then `logError({ message, error, severity, uxImpact })`
- [ ] Frontend (landing): `import { logError } from '@/utils/errorLogger'` — then `logError({ message, error, severity, uxImpact })`
- [ ] If a file uses `console.error` instead, it MUST be replaced with the canonical logger
- [ ] `logger.error` calls always include: message, error object, severity (1-100), uxImpact statement

### 6. Staggered Release with Statsig Tracking

- [ ] Substantive features that could help OR harm UX use the staged release system
- [ ] Feature starts at 0% rollout, expands via KPI signal score
- [ ] Errors are tagged with `stagedReleaseTagged: true` and `featureKey` for circuit breaker
- [ ] KPI bindings defined (engagement, churn, conversion — whichever apply)
- [ ] Autotune/evaluation runs every 5 min — no manual timer-based rollout

### 7. Added Style Definitions Carry User-Sourced Consumption Intent
**Why this exists:** A reusable style definition (a CSS class, a design-system template, a design token, a styled-component) is consumed by *future agents* who never saw the conversation that created it. If it does not say **when** and **how** to use it, those agents misapply it or invent hollow comments. The user's standing rule, verbatim:

> "the intent of the code and the intent for when to use it and how to use it be articulated. That's the missing thing."

> "if there is style definitions that were added, that the intent for when and how to consume them be articulated as well from the verbatim ... statements of the user ... Not an abstraction of them, not assumptions about them, but from what the user actually said and what can be safely derived with ninety percent confidence from that."

**What to check** — if the staged diff ADDS any style definition (a new CSS class / `@layer` / selector ruleset in a stylesheet, a new design token / CSS custom property, a new `styled` / `css` template, a Tailwind `@apply` component class):

- [ ] The definition carries a comment articulating **the intent of the code** — what it is for.
- [ ] The comment articulates **WHEN to use it** (and, where it matters, when NOT to).
- [ ] The comment articulates **HOW to consume it** — the actual application mechanics (e.g. which element gets the class, any companion class / marker it depends on to work).
- [ ] That articulated intent is **sourced from the user's verbatim statements** about this style — the user's actual words, **not an agent's abstraction, paraphrase, or assumption.** Where the user's exact words don't cover a detail, only what **can be safely derived at >=90% confidence** from those words may be added; anything below 90% is left out, not invented.

**The patch (when this is missing) — DO NOT auto-generate tidy prose:** locate the user's verbatim utterances that produced this style (this session's transcript, the linked compaction, the originating request). Quote or closely paraphrase **those words** into the consumption-intent comment at the definition site. If the user's words don't exist or can't be found, **do not fabricate intent** — block and surface: "Style definition `<name>` added without user-sourced consumption intent. Capture the user's actual words on when/how to use it before committing." A comment that describes only WHAT the code does (not when/how to consume it), or one written from agent abstraction rather than user utterance, FAILS this check.

## How to Run This Audit

For each file in `git diff --cached --name-only`:

1. **Is it a controller, middleware, or route handler?** → Check Principle 1 (logging) and Principle 4 (defensive coding)
2. **Does it add a new feature?** → Check Principle 2 (feature flag) and Principle 6 (staged release)
3. **Does it add API routes or model fields?** → Check Principle 3 (completeness)
4. **Does it have catch blocks?** → Check Principle 5 (canonical logger.error)
5. **Does it add a style definition (CSS class/token/template, styled-component, `@apply` class)?** → Check Principle 7 (user-sourced consumption intent)

## Quick Grep Checks

```bash
# Principle 1: console.log in hot paths
grep -rn 'console\.log' $(git diff --cached --name-only) 2>/dev/null | grep -v node_modules | grep -v '__tests__'

# Principle 4: bare catch blocks
grep -rn 'catch.*{' $(git diff --cached --name-only) 2>/dev/null | grep -v node_modules

# Principle 5: console.error instead of logger.error
grep -rn 'console\.error' $(git diff --cached --name-only) 2>/dev/null | grep -v node_modules | grep -v '__tests__'

# Principle 7: ADDED style definitions (new CSS class/selector, custom property/token,
# styled-component, or @apply class) in the staged diff. Each hit must carry a
# user-sourced when/how-to-consume comment.
git diff --cached -- '*.css' '*.scss' '*.js' '*.jsx' '*.ts' '*.tsx' 2>/dev/null \
  | grep -E '^\+' \
  | grep -E '^\+\s*\.[a-zA-Z_-]+\s*\{|^\+\s*--[a-zA-Z-]+\s*:|styled\.[a-z]+`|css`|@apply ' \
  | grep -v node_modules
```

## Commit Message Annotation

After audit passes, include in commit message:
```
Audit: pre-commit checklist passed (logging, feature-flag, defensive, staged-release, style-intent)
```
