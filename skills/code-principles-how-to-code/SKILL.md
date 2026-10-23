---
name: code-principles-how-to-code
paths: "**/*.tsx,**/*.jsx,**/components/**,**/hooks/**"
description: "Principles for writing resilient React code that eliminates fragility without risking UX breakage. Use when writing new components, refactoring existing ones, extracting hooks, managing state, or reviewing code for structural quality. These are the coding standards for how we build."
triggers:
  - "code principles"
  - "how to code"
  - "how should I structure this"
  - "refactor this component"
  - "extract hooks"
  - "too many useEffects"
  - "this file is too big"
  - "modal state management"
  - "state ownership"
  - "how to harden"
---

# Code Principles: How to Code

> These principles were derived from hardening a 2500-line god component (CoachingUI35.js)
> with 22 cascading useEffects. Every principle maps to a class of bug it prevents.
> The goal: destroy fragility without risking UX breakage.

## The Meta-Principle: The Component Is the Intent Manifest

A component's body should read like a table of contents:
- Hook calls at the top declare **intent** (what this component does)
- Event handlers in the middle declare **interactions** (what the user can do)
- JSX at the bottom declares **structure** (what renders)

If you have to scroll past 100 lines of effect logic to find the next effect, that logic belongs in a named hook. The component is the "what." The hooks are the "how."

```js
// GOOD: CoachingUI35 reads like an intent manifest
useCoachingTheme(appTheme);
useConversationRouting({ urlConversationId, isUserReady, ... });
usePostLoginResume({ user, isLoggedIn, getInitializeCoaching, ... });
useTimeLimitPitch({ search, isUserReady, setActiveModal, ... });
```

This is the Redux flow applied to hooks: all intent readable in one place, implementation delegated to named units.

---

## Principle 1: One Semantic, One Gate

### The Bug Class It Prevents
15 files independently check `isLoggedIn && !isLoading && user?._id && !user?.isGuest` in different combinations. Some forget `!isLoading`. Some forget `!isGuest`. Each omission is a bug that takes hours to trace because the check "looks right."

### The Rule
If a concept has a name, it gets exactly one implementation. Every consumer calls the gate -- never re-derives it.

### How to Apply

**When you see** the same 2+ condition compound check in 3+ files:
1. Name it after the UX intent, not the implementation
2. Extract to a hook (if it needs React context) or a pure function (if it doesn't)
3. Replace every inline check with the named gate

**Naming:**
- BAD: `isLoggedInAndReady` (describes implementation)
- GOOD: `isRegisteredUser` (describes UX intent: "is this a real user who completed registration?")

**Two forms for two contexts:**
- React components: `useUserReadyState()` hook (reads from context)
- Pure functions/tests: `getUserReadyState({ user, isLoggedIn, isLoading })` (explicit params, no React imports)

### The Test
Search the codebase: `grep -rn "isLoggedIn && !isLoading" src/`. If you find 3+ hits with slightly different variations, you have a One Semantic violation.

---

## Principle 2: Single Owner Per Domain

### The Bug Class It Prevents
URL and React state both "own" which conversation is active. URL changes trigger state changes, state changes trigger URL changes, URL changes trigger state changes. The loop is broken by a `useRef` with a 100ms timeout that sometimes races. Every month a new edge case breaks through.

### The Rule
Every piece of app state has exactly one owner. Everything else is a read-only reflection. When you see two-way sync between state stores, one of them is wrong.

### How to Apply

**Pick the real owner:**
- Conversation selection: React state owns it. URL is cosmetic.
- Theme preference: localStorage owns it. React state reflects it.
- Auth status: The server owns it. `isLoggedIn` reflects the last known server state.

**The ref test:** If you're writing a `useRef` to prevent an effect from re-triggering another effect, you have two owners. Kill one.

**Implementation pattern:**
```
Owner (writes)          Reflections (read-only mirrors)
--------------------    --------------------------------
setSelectedConversation --> URL via navigate(replace: true)
                        --> sidebar highlight via prop
                        --> analytics via effect
```

Never: URL change --> setSelectedConversation --> URL change

**Exception:** Initial mount. A deep-link URL can set the initial owner state once. After that, the URL becomes read-only. Use a `hasLoadedFromUrlRef = useRef(false)` that is set once and never reset.

---

## Principle 3: Impossible States Should Be Impossible

### The Bug Class It Prevents
6 independent modal booleans create 64 possible combinations. Only 6 are valid. A developer adds `setShareModal(true)` without remembering to `setAskWhy(false)`. Two modals render on top of each other. The user sees a broken stacked UI.

### The Rule
The data structure should make invalid states unrepresentable. Don't rely on developers remembering "close modal A before opening modal B." Make the type enforce it.

### How to Apply

**Mutually exclusive states --> one enum:**
```js
// BAD: 6 booleans, 64 possible states, 58 of them invalid
const [askWhy, setAskWhy] = useState(false);
const [feedbackSent, setFeedbackSent] = useState(false);
const [shareModal, setShareModal] = useState(false);

// GOOD: 1 enum, only valid states representable
const [activeModal, setActiveModal] = useState(null);
// 'newPitch' | 'askWhy' | 'feedbackSent' | 'share' | null
```

**The mutual exclusion test:** For every `setX(true)` call, ask: "Should any other boolean be false when this is true?" If yes, you have mutual exclusion that's enforced by discipline instead of types.

**What stays separate:**
- Context-owned modals shared across components (e.g., guest signup, session limit) -- these have different lifecycle owners
- Self-closing modals (e.g., toast notifications) -- these manage their own state
- Only group modals that are mutually exclusive AND owned by the same component

**Dead code indicator:** If a boolean is declared but never set to `true`, or a modal has `modalOpen={false}` hardcoded, delete it. Dead state variables create confusion about what's actually possible.

---

## Principle 4: Name the Cascade, Then Fence It

### The Bug Class It Prevents
22 effects in a flat file. Effect #8 sets state that triggers Effect #9, which updates the URL, which triggers Effect #8 again. The cascade is invisible because effects are anonymous -- you can't see the chain without reading every dependency array. A change to one effect breaks three others, and the developer who changed it had no idea they were connected.

### The Rule
Effects that form a logical unit get a name. The name becomes a boundary. The hook's parameter list is the contract. Internal refs, guards, and timing logic are private. Changes inside can't accidentally break effects outside.

### How to Apply

**The naming test:** If you can describe 2-4 effects with one phrase, they belong in one hook.
- "handles URL routing" --> `useConversationRouting`
- "handles post-login resume" --> `usePostLoginResume`
- "handles theme" --> `useCoachingTheme`

**The parameter list is the contract:**
```js
// The calling component sees exactly what this hook needs
useConversationRouting({
  urlConversationId,
  isUserReady,
  selectedConversation,
  setSelectedConversation,
  navigate,
  updateTimestamp,
  isConversationStale,
});
```

No reaching into context internally. The hook takes explicit params. This makes dependencies visible and the hook testable.

**What stays in the component:**
- Trivial effects (3-4 lines, no interaction with other effects)
- Debug-only effects (console.log, dev tooling)
- Effects tightly coupled to DOM refs (scroll, focus, keyboard layout)

**What gets extracted:**
- Any cluster of 2+ effects that share a ref or form a chain
- Any effect over 20 lines
- Any effect that's been the source of a bug (name it so the fix is findable)

---

## Principle 5: Defensive Coding for UX Posterity

### The Bug Class It Prevents
A new feature checks `plan === 'premium'` to unlock access. The check fails silently in production because the field is undefined during loading, or the API returns a different shape than expected. A paying user sees a locked feature. Trust is broken.

### The Rule
Code defensively so that failure gives users MORE access, not less. Check for `should_be_limited` rather than `should_have_access`. On code failure, paying users get full access.

### How to Apply

**Fail-open for user-facing features:**
```js
// BAD: Breaks if accessTier is undefined/null/unexpected value
if (accessTier === 'MAX_ACCESS') { showFeature(); }

// GOOD: Only restrict when we're SURE they shouldn't have access
if (accessTier === 'FREE_ACCESS') { showUpgradePrompt(); }
else { showFeature(); } // Unknown state = give access
```

**Fail-closed for dev-only tools:**
```js
// BAD: Dev tools fire in staging, test, and unset envs
if (process.env.NODE_ENV !== 'production') { enableDevTools(); }

// GOOD: Dev tools only fire when explicitly in development
if (process.env.NODE_ENV === 'development') { enableDevTools(); }
```

**The loading state trap:**
Guest accounts call `auth.login(token)` which sets `isLoggedIn = true`, but the user hasn't registered. `useSimulatedUserState` fail-opens to `MAX_ACCESS` when user is undefined (before `/auth/me` resolves). Effects that check `isLoggedIn` without checking `!isLoading` fire prematurely, seeing the fail-open default instead of the real tier.

This is why Principle 1 exists -- `isUserReady` gates on `isLoggedIn && !isLoading && !!user?._id`, preventing the entire class.

---

## Quick Reference: When to Apply Each Principle

| You notice... | Apply... |
|---|---|
| Same compound boolean check in 3+ files | **Principle 1:** One Semantic, One Gate |
| Two state stores syncing bidirectionally | **Principle 2:** Single Owner Per Domain |
| Multiple booleans that are mutually exclusive | **Principle 3:** Impossible States Should Be Impossible |
| 3+ effects that share refs or form chains | **Principle 4:** Name the Cascade, Then Fence It |
| Feature gating that could lock out paying users | **Principle 5:** Defensive Coding for UX Posterity |
| A `useRef` preventing effect A from re-triggering effect B | **Principle 2** (you have two owners) |
| A `setTimeout` between two `setState` calls | **Principle 3** (state transition should be atomic) |
| Scrolling past 100 lines of effect code | **Principle 4** (extract to named hook) |
| `useState(false)` that's never set to `true` | **Principle 3** (dead code, delete it) |
| A name/flag whose meaning a reader could guess wrong (e.g. `emailFrequencyEnabled` really means "not opted out") | **Principle 12:** Code States Its Own User-Journey Meaning, With Honest Confidence |
| A comment asserting what code means that's actually a guess | **Principle 12** (mark it `(NN%)`) |

---

## Shipping Principles (6-11)

> These principles govern what ships to production. They apply to every commit, not just React code.
> Pre-commit audit skill: `audit-pre-commit`

---

## Principle 6: Structured Logging, Not Console.log

### The Bug Class It Prevents
`console.log('🎯 Score:', score)` in production fills logs with unstructured noise. No levels, no metadata, no Slack alerts, no correlation. When something breaks at 2 AM, you grep through millions of emoji lines to find the one that matters.

### The Rule
Use `logger.info()` / `logger.error()` / `logger.warn()` / `logger.debug()` — never bare `console.log` in controllers, middleware, or route handlers.

### How to Apply
```javascript
// BAD
console.log(`🎯 [Feature] Score: ${score}`);

// GOOD
logger.info('[Feature] Score evaluated', { score, threshold: 80, action: 'extend' });
```

`console.log` is ONLY acceptable inside `if (process.env.NODE_ENV === 'development')` blocks for local debugging.

---

## Principle 7: Feature Flag Before Ship

### The Bug Class It Prevents
A half-built feature ships to production. Users see a button that does nothing, a route that 500s, or a flow that dead-ends. Trust is broken and support tickets flood in.

### The Rule
New user-facing features start as `IN_DEVELOPMENT` (admin-only). An admin pushes to `IN_BETA` then `IN_PRODUCTION` — never the developer on first commit.

### How to Apply
- **Frontend:** Gate with `isFeatureVisible('MY_FEATURE', user, adminSettings)` — returns false for non-admins when `IN_DEVELOPMENT`
- **Backend:** Gate with `checkStagedRelease(userId, 'my_feature')` — `featureIsActive: false` until promoted

No feature is visible to regular users on first commit. Period.

---

## Principle 8: No Incomplete Code Ships

### The Bug Class It Prevents
An API route exists with no frontend caller. A model field is saved but never read. A button calls an endpoint that doesn't exist yet. The user hits a dead end.

### The Rule
Every API route has at least one caller. Every model field is read somewhere. Every frontend action calls a real endpoint. If something is intentionally pre-staged, annotate it: `// @staged: no caller yet — will be wired in [ticket/PR]`.

### How to Apply
Before committing, check:
- [ ] Every new route is called from frontend or tests
- [ ] Every new model field is consumed
- [ ] Every new frontend call targets an existing endpoint
- [ ] Dead code from removed features is deleted, not commented out

---

## Principle 9: Defensive Coding with logger.error on Failure

### The Bug Class It Prevents
A new feature throws an unexpected error. The catch block is empty, or it `console.log`s the error and rethrows. The user sees a white screen. The dev sees nothing in logs.

### The Rule
Every user-facing code path has try-catch. Catch blocks call `logger.error()` (backend) or `logError()` (frontend) with severity and uxImpact. Catch blocks NEVER make UX worse. Features that could break UX are wrapped so failure = feature silently disabled, not app crash.

### How to Apply
```javascript
// BAD
try { riskyThing(); } catch (e) { console.log(e); }

// GOOD
try {
  riskyThing();
} catch (err) {
  logger.error('[Feature] Failed — falling through to safe default', {
    error: err?.message,
    stack: err?.stack,
    severity: 40,
    uxImpact: 'Feature disabled silently — user gets normal behavior',
  });
  // Fall through to safe default — never crash
}
```

---

## Principle 10: logger.error Works Everywhere

### The Bug Class It Prevents
A file uses `console.error` instead of the canonical logger. A bare `console.error` is still captured into the admin error log (the logger rewrites it), but without the structured detail (who, which file, what the person was doing) that a `logger.error` call adds, so it is hard to triage and easy to miss in the noise. (Corrected 2026-10-16: the old text said it was invisible in the admin logs UI. A Slack post is not an alert either: nobody watches Slack.) The team finds out about the bug from a user complaint, not from monitoring.

### The Rule
Every error log uses the canonical logger:
- **Backend (<api-repo>):** `const logger = require('../utils/logger')` → `logger.error(msg, { error, severity, uxImpact })`
- **Frontend (<frontend-repo>):** `import { logError } from '@utilities/errorLogger'` → `logError({ message, error, severity, uxImpact })`
- **Frontend (<landing-repo>):** `import { logError } from '@/utils/errorLogger'` → `logError({ message, error, severity, uxImpact })`

If the canonical logger does not exist yet, create it.

If a file uses `console.error`, it MUST be replaced with the canonical logger. `logger.error` calls always include: message, error object, severity (1-100), uxImpact statement.

---

## Principle 11: Staggered Release with Statsig Tracking

### The Bug Class It Prevents
A well-intentioned feature ships to 100% of users. It has a subtle bug that increases churn by 3%. Nobody notices for two weeks because there's no baseline comparison. By then, 500 users have churned.

### The Rule
Substantive features that could help OR harm UX use the staged release system. Feature starts at 0%, expands via KPI signal score (engagement, churn, conversion). Errors trigger instant circuit breaker rollback. KPI evaluation runs every 5 minutes.

### How to Apply
1. Create staged release via admin API (0% initial)
2. Gate code with `checkStagedRelease(userId, featureKey)`
3. Tag errors with `stagedReleaseTagged: true` and `featureKey`
4. Bind KPIs with weights and significance thresholds
5. Let the evaluator expand automatically based on data

---

## Principle 12: Code States Its Own User-Journey Meaning, With Honest Confidence

### The Bug Class It Prevents
A boolean named `emailFrequencyEnabled` reads, to anyone who didn't write it, as "the person turned their email channel on." Its real meaning is "this person has not *explicitly* opted out of recurring re-engagement email — and a person who never set any preference at all still counts as eligible, on the Weekly default." Those are very different claims. The name asserts an *active choice* the person may never have made. An agent reading only the name will build the wrong mental model, write the next feature on top of that wrong model, and the error compounds silently across every future decision that touches the field — nobody traces three files back to the set-site to discover the name was lying. The user found exactly this and named it: *"this is actually correct, but it's impossible to know that because the code is ambiguous."* Correct code that can't be *known* to be correct is a latent hallucination waiting for the next reader.

### The Rule
Any code whose plain-English name or shape does not, by itself, reveal what it means **for a real person in their journey** must carry a comment at the point of reading that states that meaning — in user terms, not code terms. And any assertion of semantic intent the author is not 100% certain of must carry its confidence inline as `(NN%)`, so a future reader can instantly tell verified fact about what the code does from the author's best inference. This is the conversational anti-hallucination doctrine (never present inference as fact) applied to code comments. The meaning travels *with* the code, forever, at every site the meaning is re-exposed — including downstream renames (`emailFrequencyEnabled` → `emailChannelOn` re-propagates the same misleading name and so needs the same caveat).

### How to Apply

**Write the comment from the journey, not the mechanism.** State what a `true`/`false`/return value means for the actual human — who they are, what they did or didn't do, what they'll experience — the same discipline the `/batch` "See it yourself" step demands. "`true` when `cadence.status !== 'Never'`" is the mechanism; "`true` means the person has not explicitly opted out (incl. people who never set a preference, included on the default)" is the journey meaning.

**Mark confidence honestly.** If you traced the value to its set-site and the gate it mirrors, you may write `(100%)`. If you're inferring meaning from the name and one read, write your real number — `(90%)`, `(75%)` — so the next agent knows to verify before building on it. A confident-sounding comment that's actually a guess is worse than no comment.

**Disambiguate at every re-exposure.** When the same value is passed through under a new key (a DTO field, a display string, a log line), the new name can re-introduce the ambiguity. Carry the caveat to each site. Don't assume the reader will find the original.

**Don't silently "fix" by editing rendered strings.** If the real defect is a misleading *displayed* label (what an admin/user sees), that is a separate, scored decision — flag it, don't fold a UX-visible string change into a comment pass.

### The Test
Pick any non-obvious name in the file and ask: *"Could a competent agent who never saw the set-site infer a second, plausible, WRONG meaning from this name alone?"* If yes, the meaning must be written next to it. Then ask of every comment asserting intent: *"Is this a fact I verified, or an inference?"* If inference, it must carry a `(NN%)`. (This is the always-on companion to Principle 1: Principle 1 says give one concept one gate; Principle 12 says make that gate *tell the truth about itself* to the next reader.)

---

## Anti-Patterns to Grep For

Run these periodically to find violations:

```bash
# Principle 1: Ad-hoc auth checks (should use isUserReady/isRegisteredUser)
grep -rn "isLoggedIn && !isLoading" src/ --include="*.js" --include="*.jsx"

# Principle 2: Bidirectional sync indicators
grep -rn "isLoadingFromUrl\|isSyncing\|skipNextUpdate" src/ --include="*.js" --include="*.jsx"

# Principle 3: Mutually exclusive booleans
grep -rn "const \[show.*Modal\|const \[is.*Open" src/components/ --include="*.js" --include="*.jsx" | head -20

# Principle 5: Fragile production gates
grep -rn "=== 'production'" src/ --include="*.js" --include="*.jsx"

# Principle 6: console.log in hot paths
grep -rn "console\.log" controllers/ middlewares/ routes/ --include="*.js" | grep -v node_modules | grep -v __tests__

# Principle 10: console.error instead of logger.error
grep -rn "console\.error" controllers/ middlewares/ routes/ resolvers/ --include="*.js" | grep -v node_modules | grep -v __tests__
```
