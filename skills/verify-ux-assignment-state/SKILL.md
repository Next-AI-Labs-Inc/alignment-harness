---
name: verify-ux-assignment-state
description: For each UX assignment, determine the exact user state required to test it, verify that state against actual code (never trust
triggers:
  - "verify UX assignment"
  - "UX assignment state"
  - "simulator path"
  - "assignment verification"
---

# Verify UX Assignment Required State

**Purpose:** For each UX assignment, determine the exact user state required to test it, verify that state against actual code (never trust the AI-generated claim), and update the assignment with modular atomic simulator params.

**Triggers:** 'verify assignment state', 'what state does this need', 'add required state', 'check simulator path'

---

## Step 0: Get the ux-assignments store

```bash
alignment-harness records ux-assignments
```

All calls below use the local store: `alignment-harness store list|get|update ux-assignments`

---

## Step 1: Fetch assignments sorted by severity, non-terminal only

```bash
alignment-harness store list ux-assignments --json --limit 1000 | python3 -c "
import json, sys
data = json.load(sys.stdin)
items = data
items.sort(key=lambda x: x.get('combinedScore', 0), reverse=True)
terminal = {'verified', 'failed', 'skipped'}
active = [i for i in items if i.get('status', 'pending') not in terminal]
print(f'Total active: {len(active)}')
for i in active[:20]:
    print(json.dumps({
        'id': i.get('id'),
        'title': i.get('title'),
        'category': i.get('category'),
        'combinedScore': i.get('combinedScore'),
        'simulatorPath': i.get('simulatorPath', 'NONE'),
        'uxStory': str(i.get('uxStory', ''))[:200],
        'testSteps': i.get('testSteps', []),
    }, indent=2))
    print('---')
"
```

**Key routes:**
- `alignment-harness store list ux-assignments --json --limit 1000` — all pending items sorted by score
- `alignment-harness store list ux-assignments --where status=<status>` — items by specific status
- `alignment-harness store get ux-assignments <id>` — full assignments with items

---

## Intent Integration

When verifying UX assignment state, cross-reference against Intent DB to ensure the assignment tests the ORIGINAL documented intent, not a drifted interpretation.

### During State Verification

1. **Check if the assignment has `intentSlugs`** — if present, query Intent DB for each slug:
   ```bash
   alignment-harness intent search "intent slug keyword"
   ```

2. **Validate that the simulatorPath produces a state where the intent can be verified** — if the intent says "silent renewal with zero interruption" but the simulator state doesn't trigger a renewal scenario, the simulatorPath is wrong even if it technically loads a page.

3. **If the assignment has no intentSlugs** — look up the feature area in Intent DB and add the matching slugs to the assignment when updating:
   ```bash
   alignment-harness store update ux-assignments <id> \
     --json '{
       "simulatorPath": "http://localhost:3000/admin2/user-simulator?...",
       "intentSlugs": ["silent-session-renewal", "auth-api-credentials-include"]
     }'
   ```

4. **If the assignment contradicts a documented intent** — mark it as needing review with a note explaining the contradiction:
   ```json
   {
     "validation": "intent_mismatch",
     "validationNotes": "Assignment expects upgrade button visible, but intent checkout-prevents-duplicate-purchase says subscriber should see guidance modal instead."
   }
   ```

---

## Step 2: For each assignment, determine required state

### 2a. If simulatorPath exists — parse it into atomic params

The simulatorPath is a URL like:
```
http://localhost:3000/admin2/user-simulator?auth=session_expired&userType=returning_paid&accessTier=MAX_ACCESS&redirect=/hub&clear=true
```

Parse params with:
```python
from urllib.parse import urlparse, parse_qs
url = urlparse(simulator_path)
params = {k: v[0] for k, v in parse_qs(url.query).items()}
# State params (the conditions): auth, subscription, accessTier, userType, memoryTier, plan, recovery
# Command params (ignore for state): clear, redirect
state_params = {k: v for k, v in params.items() if k not in ('clear', 'redirect')}
```

### 2b. CRITICAL — Reason about the PERSONA, not the parameters

### Before you pick a state, pick a method

Everything below is about choosing the right *simulator state*. That is the second
question. The first is whether the simulator is the right tool at all.

**If the assignment is about what a person in a given tier actually experiences, use a
real test account** (`yourname+test_NNNNN@example.com`), not the simulator. Access tier
is decided on the backend by `getUserAccessTier()` and handed over as
`user.accessTier.tier` on `/auth/me`. The simulator overrides what the browser believes
that value is; it never consults the server. So verifying a paywall under a simulated
free tier proves the paywall renders when the front-end is told "free" — it does not
prove a real free person reaches it. Reporting the former as the latter is how a
verification pipeline certifies a journey nobody has walked.

Use the simulator for fast state-flipping when the tier logic is already known good, or
when the assignment is explicitly about admin tooling. Then use the table below.

Known simulator defects (deliberately unfixed): a full page load silently wipes the
simulation, so navigate by in-app link clicks only; `redirect=` is written into the URL
but never read; `auth=logged_in` does not exist.

---

**The #1 classification mistake** is mapping category keywords to simulator params programmatically.
Instead, reason about WHO the user is in the uxStory:

**Ask yourself:** "Who is the person in this story, and what is their journey?"

| uxStory says... | Wrong mapping | Correct reasoning |
|---|---|---|
| "new subscriber going through checkout" | `subscription=canceled` (has a canceled sub) | `userType=new_user` (never had a sub at all) |
| "paid user loses access" | `accessTier=FREE_ACCESS` (free user) | `subscription=active&auth=session_expired` (was paid, session died) |
| "trial user upgrades" | `subscription=trialing` only | `subscription=trialing&accessTier=LIMITED_ACCESS` (cc_trial state) |

**The persona hierarchy:**
1. **Read the uxStory as a human narrative** — who is this person?
2. **What have they done before?** (new_user = never paid, returning_paid = previously paid)
3. **What is their current subscription?** (none, active, trialing, canceled, past_due)
4. **What access do they currently have?** (FREE_ACCESS, LIMITED_ACCESS, MAX_ACCESS)
5. **What is happening TO them?** (session expired, page load, button click)

Only AFTER you have the persona clear, translate to params.

### 2c. If simulatorPath is missing — verify against code

**DO NOT** trust the assignment's claims. Read the actual code to determine what state is needed.

**Token-efficient pattern — grep before read:**

1. **Find the relevant file:** The assignment's `title` and `uxStory` mention a feature. Grep for it:
   ```
   Grep(pattern="featureKeyword", path="<your frontend repo>/src", output_mode="files_with_matches")
   ```

2. **Find the conditional:** Once you have the file, grep for the state check:
   ```
   Grep(pattern="accessTier|subscription|isPaid|hasPaid|isOnTrial", path="<file>", output_mode="content", context=3)
   ```

3. **Read only the 20-30 lines around the conditional** — not the whole file:
   ```
   Read(file_path="<file>", offset=<line-10>, limit=30)
   ```

4. **Map the code condition to simulator params:**

   | Code Pattern | Simulator Param | Value |
   |---|---|---|
   | `accessTier === 'MAX_ACCESS'` | `accessTier=MAX_ACCESS` | Paid user |
   | `accessTier === 'LIMITED_ACCESS'` | `accessTier=LIMITED_ACCESS` | CC trial user |
   | `accessTier === 'FREE_ACCESS'` | `accessTier=FREE_ACCESS` | Free/guest |
   | `subscriptionStatus === 'active'` | `subscription=active` | Active sub |
   | `subscriptionStatus === 'trialing'` | `subscription=trialing` | CC trial |
   | `isOnProtectedRoute` | `auth=session_expired` | Session expired on protected route |
   | `had_paid_plan` localStorage | `userType=returning_paid` | Previously paid user |
   | No paid history | `userType=new_user` | Never paid |

5. **Compose the simulatorPath:**
   ```
   http://localhost:3000/admin2/user-simulator?<param1>=<value1>&<param2>=<value2>&redirect=<target_path>&clear=true
   ```

---

## Step 3: Verify the state actually works

Before writing the simulatorPath, verify:

1. **The simulator accepts these params.** Valid params are defined in:
   ```
   <your frontend repo>/src/components/pages/admin/CentralizedUserSimulatorPage.jsx
   ```
   And atomic conditions in:
   ```
   <your frontend repo>/src/admin/atomicConditions.js
   ```

2. **The code actually checks these conditions.** Read the relevant component and confirm the conditional exists. If the code does NOT check the condition the assignment claims, mark it as **phantom** (validation: 'phantom').

3. **The redirect target exists.** If the assignment says "verify behavior on /dashboard", confirm that route exists.

---

## Step 4: Update the assignment via the store

```bash
alignment-harness store update ux-assignments <id> \
  --json '{
    "simulatorPath": "http://localhost:3000/admin2/user-simulator?auth=session_expired&userType=returning_paid&accessTier=MAX_ACCESS&redirect=/hub&clear=true"
  }'
```

If the assignment is phantom (code doesn't match claim):
```bash
alignment-harness store update ux-assignments <id> \
  --json '{
    "validation": "phantom",
    "validationNotes": "Code in <file>:<line> does not match claim. <specific reason>."
  }'
```

---

## Step 5: UI rendering (already built)

The `RequiredStateDisplay` component in `UxAssignmentsPage.jsx` (line ~98) automatically parses `simulatorPath` into color-coded atomic condition chips. No UI changes needed — just update the data.

**Supported param chips:**
- `auth` (rose) — Auth condition
- `subscription` (green) — Stripe status
- `accessTier` (sky blue) — Access level
- `userType` (violet) — New vs returning
- `memoryTier` (amber) — Memory tier
- `plan` (cyan) — Plan type
- `recovery` (orange) — Recovery state

Each chip shows `ParamName: human readable value` with a "Simulate" link to open the simulator with all params pre-loaded.

---

## Step 6: Verify persistence (MANDATORY)

After updating items, spot-check that the data actually persisted:

```bash
alignment-harness store list ux-assignments --json --limit 1000 | python3 -c "
import json, sys
data = json.load(sys.stdin)
items = data
has = sum(1 for i in items if i.get('simulatorPath') and i.get('simulatorPath') != 'NONE')
total = len(items)
print(f'{has}/{total} items have simulatorPath ({total - has} still missing)')
"
```

If items you updated show as missing, the store may be silently dropping the field.
Check the store at `${CLAUDE_PLUGIN_ROOT}/lib/store.js` — confirm `simulatorPath`
is in the destructured fields AND in the persistence logic for the endpoint you're using.

---

## Efficiency Rules

1. **Grep before read** — find the 3 lines that matter, then read only 30 lines around them
2. **One API call to fetch** — don't re-fetch per item, fetch all pending in one call
3. **Batch updates** — if updating multiple items, pipeline the `alignment-harness store update` calls
4. **Stop at phantom** — if code doesn't match, mark phantom and move on. Don't try to fix the assignment.
5. **Trust simulatorPath if present** — only do deep code verification for items WITHOUT a simulatorPath or where the uxStory contradicts the params

---

## Quick Reference: API Endpoints

| Action | Method | Endpoint |
|---|---|---|
| All pending items | store list | `alignment-harness store list ux-assignments --json --limit 1000` |
| Items by status | store list | `alignment-harness store list ux-assignments --where status=<status>` |
| Update item | store update | `alignment-harness store update ux-assignments <id> --json '{...}'` |
| Agent update item | store update | `alignment-harness store update ux-assignments <id> --json '{...}'` |
| Mark phantom batch | store update | `alignment-harness store update ux-assignments <id> --json '{"validation": "phantom"}'` (once per item) |
| Get phantom items | store list | `alignment-harness store list ux-assignments --where validation=phantom` |
