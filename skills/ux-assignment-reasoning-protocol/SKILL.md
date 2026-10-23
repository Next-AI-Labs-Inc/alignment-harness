---
name: ux-assignment-reasoning-protocol
description: MANDATORY reading before creating any UX assignment. Contains the required reasoning structure that MUST be present in every UX
triggers:
  - "UX reasoning"
  - "assignment reasoning"
  - "before UX assignment"
---

# UX Assignment Reasoning Protocol

## MANDATORY: Read Before Creating ANY UX Assignment

This document defines the REQUIRED reasoning structure for every UX assignment. An assignment without this reasoning is INCOMPLETE and will require 5-10 minutes of admin detective work to understand.

---

## ⛔ MANDATORY GUARD: Trial Type Disambiguation

**If you write the word "trial" anywhere in a UX assignment without specifying the type, STOP and fix it.**

There are exactly two trial types. They are completely different systems. Using just "trial" causes agents to apply the wrong fix to the wrong users.

| Type | What it is | Stripe? | Card? | Check |
|------|-----------|---------|-------|-------|
| `legacy_trial` | Free trial from beta 19, `user.trial[]` array | No | No | `isUserOnLegacyTrial()` |
| `cc_trial` | Stripe subscription status = "trialing" | Yes | Yes | `user.subscriptionStatus === 'trialing'` or `effectiveSubscriptionStatus` |

**How to identify which one you mean:**

- Is there a Stripe subscription involved? → `cc_trial`
- Does the test use `subscription=trialing` in the simulator? → `cc_trial`
- Is the user activating a "Start Free Trial" button (no card)? → `legacy_trial`
- Does the code call `isUserOnTrial()` / `isUserOnLegacyTrial()`? → `legacy_trial`
- Does the code check `user.subscriptionStatus === 'trialing'`? → `cc_trial`

**Required replacements:**

- ~~"a trial user"~~ → "a cc_trial user (Stripe subscription status=trialing)" OR "a legacy_trial user (free trial, no card)"
- ~~"log in as a trial user"~~ → "log in as a cc_trial user" with `?subscription=trialing` simulator path
- ~~"trial status"~~ → "cc_trial status" or "legacy_trial status"
- ~~"trial features"~~ → "cc_trial access" or "legacy_trial access"
- ~~"the trial"~~ → "the cc_trial" or "the legacy_trial"

**When amending an existing assignment you found with ambiguous "trial":**

1. Read the simulatorPath — if it has `subscription=trialing` → cc_trial
2. Read the code mentioned — if `isUserOnLegacyTrial()` appears → legacy_trial
3. Read the commit message context — Stripe/customer ID issues → cc_trial; free trial button/no card → legacy_trial
4. Update title, uxStory, steps, and notes to use the specific type
5. Add a `notes` field: `"cc_trial = Stripe subscription trialing. Distinct from legacy_trial (isUserOnLegacyTrial)."` OR `"legacy_trial = free trial, no card, user.trial[] array, isUserOnLegacyTrial(). Distinct from cc_trial (Stripe)."`

---

**The goal:** Admin reads assignment → Admin clicks ONE button → Admin sees the state → Admin validates in 60 seconds

---

## The Six Required Elements

Every UX assignment MUST contain:

### 0. Code Existence Verification (GATE) — MANDATORY FIRST STEP

**Before ANY other reasoning, verify the code you're testing actually exists.**

This prevents "Phantom Code Cascades" where agents create assignments for features that were never implemented.

#### Verification Commands

| Check | Command | If Missing |
|-------|---------|------------|
| File exists? | `ls {file_path}` | STOP - mark assignment as `blocked` |
| Function exists? | `grep -r "function {name}\|const {name}" src/` | STOP - mark assignment as `blocked` |
| Route exists? | Check `App.js` or routes file | STOP - mark assignment as `blocked` |

#### Also Check for Known Broken Features

```bash
grep -A2 "{feature_name}" <frontend-repo>/src/admin2/pages/atomicConditions.js
```

If the feature is marked `BROKEN` in atomicConditions.js, do NOT create a UX assignment claiming it works.

#### Gate Rule

If ANY of these are true:
- Referenced file does not exist
- Referenced function does not exist
- Feature is marked BROKEN in atomicConditions.js

Then the assignment status MUST be `blocked` with:
```json
{
  "status": "blocked",
  "blockedReason": "phantom_code",
  "missingImplementation": ["PaymentRoute.js", "getAuthFailureRedirect()"],
  "notes": "Cannot test - code referenced in this assignment does not exist yet"
}
```

**DO NOT proceed to the other five elements until this gate passes.**

---

### 1. The Missing Reasoning (WHY)

**What user situation creates this state?**

Not "we need to test X" - but "when a user does A, and condition B is true, they will be in state C".

**Bad:**
> "Test that the session expiry modal appears"

**Good:**
> "When a cookied user's session token expires (JWT passed expiration timestamp), and they try to access any authenticated route, they should see a modal prompting re-authentication rather than a white screen or confusing error."

### 2. The Exact UX Context (WHAT)

**What specific combination of states must be true?**

List every variable that matters:

| Variable | Required Value | Why |
|----------|---------------|-----|
| Is logged in? | Yes, via cookie | Must have existing session to expire |
| Session expired? | Yes, token timestamp < now | The trigger condition |
| User type? | Any paid user | Unpaid users redirect differently |
| Page location? | Any authenticated route | Where the check happens |

### 3. The Simulation Steps (HOW)

**How do we create that exact state for testing?**

Reference existing atomic helpers or create new ones:

```
1. Go to http://localhost:3000/admin2/user-simulator
2. Select "Authentication State" → "Session Expired"
3. The app is now simulating an expired session
```

If no helper exists: **STOP** and create one using `~/.claude/skills/create-admin-helpers-atomic/SKILL.md`

### 4. The Modular Helper Functions (TOOLS)

**What atomic helpers are being used or need to be created?**

List the specific functions/simulators:

- `CentralizedUserSimulatorPage` → `session_expired` option
- `ModalPreviewPage` → `session-expired-modal` entry
- OR: "New helper needed at `/admin2/simulator/X`"

### 5. The One-Click URL (ACCESS)

**A single URL that creates the state AND redirects to the page being tested**

The User Simulator now supports URL parameters that auto-apply simulations:

```
http://localhost:3000/admin2/user-simulator?auth=session_expired&redirect=/hub&clear=true
```

**URL Parameter Reference:**

| Param | Values | Example |
|-------|--------|---------|
| `auth` | `logged_out`, `session_expired` | `?auth=logged_out` |
| `subscription` | `active`, `trialing`, `past_due`, `unpaid`, `canceled` | `?subscription=trialing` |
| `accessTier` | `MAX_ACCESS`, `LIMITED_ACCESS`, `FREE_ACCESS` | `?accessTier=LIMITED_ACCESS` |
| `userType` | `new_user`, `returning_paid`, `churned_user` | `?userType=churned_user` |
| `redirect` | Any path | `&redirect=/login` |
| `clear` | `true` | `&clear=true` (always include) |

**Always include `clear=true`** to reset previous simulations.

For modals only:
```
http://localhost:3000/admin2/modal-preview?modal=session-expired
```

---

## Real Example: Session Expiry Modal

Here's the complete reasoning for the session expiry example from the problem statement:

### 1. WHY (The Reasoning)

> When a user has an active session (logged in, cookie present) and that session expires (JWT timestamp passed), we first attempt automatic re-authentication using stored credentials. If that fails, we must inform the user they need to log in again. We show a modal rather than redirecting immediately because:
> - The user might have unsaved work
> - A sudden redirect is jarring UX
> - The modal explains what happened (transparency)

### 2. WHAT (The UX Context)

| Variable | Required Value | Why |
|----------|---------------|-----|
| Has cookie? | Yes | Must have existing session |
| Cookie valid? | No (expired) | The trigger |
| Auto-reauth attempted? | Yes, failed | We try silent refresh first |
| User type | Paid user (has account) | Unpaid users go to landing instead |
| Current page | Any authenticated route | Where the guard runs |

### 3. HOW (Simulation Steps)

```
1. Go to http://localhost:3000/admin2/user-simulator (<frontend-repo>)
2. In "Authentication State", click "Session Expired"
3. Simulation activates - notice the orange banner at top
4. Navigate to any authenticated page (e.g., /chat)
5. The SessionExpiredModal should appear
```

### 4. TOOLS (Atomic Helpers Used)

- **CentralizedUserSimulatorPage** - Sets `session_expired` simulation flag
- **SessionExpiredModal** - The component being tested (at `src/modals/SessionExpiredModal.jsx`)
- **ModalPreviewPage** - Can also preview at `?modal=session-expired`

### 5. ACCESS (One-Click URL)

**Option A (Full flow with redirect):**
```
http://localhost:3000/admin2/user-simulator?auth=session_expired&redirect=/hub&clear=true
```

**Option B (Modal preview only):**
```
http://localhost:3000/admin2/modal-preview?modal=session-expired
```

---

## Template for Every UX Assignment

Copy this template and fill it in:

```markdown
## UX Assignment: [Title]

### 1. WHY This State Exists

When a user [does X], and [condition Y is true], they experience [state Z] because [reason].

If we got this wrong, the user would see [bad outcome] instead.

### 2. UX Context Variables

| Variable | Value | Why |
|----------|-------|-----|
| [var1] | [value] | [reason] |
| [var2] | [value] | [reason] |

### 3. Simulation Steps

1. Go to [URL] (repo)
2. Click [button/action]
3. State is now active

### 4. Atomic Helpers Used

- [HelperName] at [path] - [what it does]
- OR: "BLOCKER: Need new helper for [state]"

### 5. One-Click Access

URL: [direct link that creates the state]

### 6. Expected Result

You should see:
- [Specific visual element]
- [Specific behavior]

If you see [wrong thing], this code is broken.
```

---

## The Decision Tree

Before creating ANY UX assignment:

```
STEP 0: DOES THE CODE EXIST? (MANDATORY GATE)
│
├── Run: ls {file_path}
├── Run: grep "{function_name}" src/
├── Run: grep "BROKEN" atomicConditions.js | grep "{feature}"
│
├── FILE/FUNCTION MISSING?
│   └── STOP. Create BLOCKED assignment with blockedReason: "phantom_code"
│
├── MARKED "BROKEN" IN atomicConditions.js?
│   └── STOP. Create BLOCKED assignment with blockedReason: "known_broken"
│
└── CODE EXISTS + NOT BROKEN → Continue:
    │
    Can the admin reach this state via URL alone?
    ├── YES → Write the assignment with that URL
    └── NO → Does an atomic helper exist?
        ├── YES → Reference it in your assignment
        └── NO → STOP. Create the helper first.
                  See: ~/.claude/skills/create-admin-helpers-atomic/SKILL.md
                  Then come back and write the assignment.
```

---

## Enforcement

Agents MUST follow this protocol. UX assignments that are missing:

- **No existence verification** → Rejected. Creates phantom code cascade.
- **References non-existent code** → Must be marked `blocked` with `blockedReason: "phantom_code"`.
- **No reasoning** → Rejected. Admin doesn't know what they're testing.
- **No UX context** → Rejected. Admin can't recreate the conditions.
- **No one-click access** → Rejected. Admin would need 5+ minutes of setup.
- **No expected result** → Rejected. Admin doesn't know what "working" looks like.

When reviewing your own work before submitting, ask:

> "Could a human who has never seen this code click one link, see the state, and know in 60 seconds if it works?"

If NO, your assignment is incomplete.
