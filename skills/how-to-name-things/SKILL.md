---
name: how-to-name-things
description: Guidelines for naming variables, test descriptions, and admin UI surfaces.
triggers:
  - "naming conventions"
  - "variable names"
  - "how to name"
  - "naming guidelines"
  - "test descriptions"
  - "test names"
  - "writing tests"
---

# How to Name Things

## Variable Names ARE the UX Contract (pre-commit CHECK 6)

Agents treat variable names as semantic ground truth. `status = 'active'` has ~200 possible meanings — agents pick one and cascade wrong logic. `stripeSubscriptionStatus = 'active'` has exactly one.

### Banned bare words in `const`/`let`/`var` declarations
`status`, `trial`, `type`, `data`, `result`, `value`, `item`, `flag`, `state`, `mode`, `level`, `tier`, `plan`, `role`, `access`, `config`, `options`, `info`, `details`, `response`, `error`, `count`, `list`, `active`, `enabled`, `current`

### Examples
| Bad | Good | Why |
|-----|------|-----|
| `const status = user.subscriptionStatus` | `const stripeSubscriptionStatus = user.subscriptionStatus` | Agent doesn't know which status |
| `const trial = isUserOnTrial()` | `const isOnLegacyTrial = isUserOnLegacyTrial()` | Two trial systems exist (legacy vs cc_trial) |
| `const type = session.type` | `const coachingSessionType = session.type` | `type` could mean anything |
| `const data = await fetch(...)` | `const userProfilePayload = await fetch(...)` | Agent can't infer shape from `data` |
| `const { status, type } = res` | `const { status: subscriptionStatus, type: webhookEventType } = res` | Destructure with alias |
| `const active = sub.status === 'active'` | `const isSubscriptionActive = sub.status === 'active'` | Boolean needs domain prefix |
| `const access = getTier()` | `const effectiveProvisionedAccessTier = getTier()` | Tier of what? For whom? |

### Exemptions
- **Loop variables**: `items.map(item => ...)` is fine — the scope is one line
- **Library imports**: `const { data } = useQuery(...)` — can't control the API. Alias if used beyond the immediate line: `const { data: coachingHistory } = useQuery(...)`
- **Override**: `// @naming-exempt: <reason>` suppresses the pre-commit check

### The test
If an agent reading ONLY the variable name — no surrounding code — could hallucinate a second valid meaning, the name is wrong.

---

## Test Descriptions — Agent-Facing Failure Contracts (pre-commit CHECK 7)

When a test fails, agents read ONLY the description in jest output to decide what broke. `tier L20 for score < 40` forces the agent to hallucinate what L20 means. `assigns LIMITED_ACCESS coaching tier when engagementScore below 40 — user sees basic prompts only` tells it exactly what to fix.

### Pattern
`'{verb} {precise outcome} when {precise condition} — {UX consequence}'`

### Examples
| Bad | Good |
|-----|------|
| `'tier L20 for score < 40'` | `'assigns LIMITED_ACCESS coaching tier when engagementScore below 40 — user sees basic prompts only'` |
| `'returns correct payload'` | `'returns userProfile with subscriptionStatus and accessTier when authenticated — dashboard renders user state'` |
| `'handles error'` | `'returns 401 with SESSION_EXPIRED code when JWT is expired — client redirects to login'` |
| `'works properly'` | `'creates guest user with FREE_ACCESS tier when no auth cookie — coaching session starts immediately'` |
| `'test subscription'` | `'upgrades accessTier from FREE to MAX when Stripe webhook confirms payment — user gains full coaching access'` |

### Banned vague words in `it()`/`test()` strings
`correct`, `proper`, `appropriate`, `right`, `good`, `bad`, `works`, `handles`, `basic`, `simple`, `various`, `properly`, `correctly`

### describe() blocks
Name the UX domain being protected, not the function being called:
| Bad | Good |
|-----|------|
| `describe('calculateTier()')` | `describe('Coaching tier assignment based on engagement score')` |
| `describe('authMiddleware')` | `describe('Request authentication and access gating')` |
| `describe('stripeWebhook')` | `describe('Subscription lifecycle state transitions from Stripe events')` |

### The test
If an agent seeing ONLY the test name in failure output can't determine: (1) what broke, (2) for which user state, and (3) what UX consequence follows — the description is wrong.

---

## Admin UI Tool Naming — humanUxTitle and humanUxSubtitle

### When to Use
When adding `humanUxTitle` and `humanUxSubtitle` to any entry in the Agent Tooling Registry. These fields translate agent-readable tool descriptions into human-readable capability statements for the admin UI.

## The Two Fields

- `humanUxTitle` — What the admin GETS from this tool. The capability, stated as an outcome.
- `humanUxSubtitle` — What it actually does, explained like you're telling someone. Specific enough that the admin recalls exactly why this exists.

## The Rules (Learned Through Iteration)

### Rule 1: Title = What You GET, Not What It Does
The title is the outcome the admin receives. Not the technical action, not the marketing pitch.

**Wrong (describes the action):**
```
"Query the Full Forecasting Analytics Engine"
```
**Wrong (marketing fluff):**
```
"How Each Segment Is Performing and Where It's Heading"
```
**Right (what you GET):**
```
"Get Deterministic Forecasting Metrics by Segment"
```

The admin reads this and knows: I get deterministic metrics, by segment. That's the capability.

### Rule 2: Title Verb Should Match the Tool's Nature
- GET endpoints → "Get ..."
- POST that saves → "Save ..."
- DELETE → "Remove ..."
- Search/query → "Scan ..." or "Search ..."
- Skills/workflows → "Create ...", "Run ...", "Build ..."
- Simulators → "Simulate ..."

### Rule 3: Subtitle = What It Does + What Makes It Specific
The subtitle must:
1. State what it actually does in plain language
2. Include what makes THIS tool specifically valuable (not generic features)
3. Ground it in real places — name the admin tool, the page path, the data source
4. Read like you're explaining it to someone, not selling it

**Wrong (marketing with reasons):**
```
"Month-by-month projections on revenue, conversions, and ad spend broken by audience segment — so you can see what's working before you commit budget"
```
Problems: "so you can..." is selling. And the content itself is vague — what projections? From where?

**Wrong (feature list without grounding):**
```
"Persist any insight from a segment comparison — with validation status, comments, and version history — restorable even after deletion"
```
Problem: Lists sub-features but never says WHERE it saves to. Where is the data going?

**Right (specific, grounded, plain language):**
```
"Auditable KPI breakdowns in the Forecasting Workbench sourced directly from raw Stripe receipts and Facebook Ads spend — real transactions, not estimates"
```
This works because: it names the tool (Forecasting Workbench), names the data sources (raw Stripe receipts, Facebook Ads spend), and states what's special (deterministic/auditable, not estimates).

**Right (grounded in real UX flow):**
```
"Save any segment finding instantly from the Forecasting Workbench to your Conversion Insights tool — with comments, validation, and full restore"
```
Pattern: **save any X from Y to your Z** — then supporting details after.

### Rule 4: No Marketing, No "So You Can..."
Never add justification or motivation. The admin knows why they'd use it — just tell them what it is.

**Wrong:** "...so you can see what's working before you commit budget"
**Wrong:** "...the first check when someone says they paid but can't get in"
**Right:** Just describe the output and its source. The admin will connect the dots.

### Rule 5: Name the Specific Thing That Makes It Special
Every tool has something that makes it not just another endpoint. Find it and lead with it.

- Forecasting endpoints → deterministic, sourced from raw Stripe receipts and direct FB spend
- Conversion insights → saves FROM the workbench TO a persistent tool
- Artifact endpoints → 5-digit ID trace back to agent research
- Stripe user lookup → formatted readable breakdown from raw Stripe data
- Raw Stripe endpoint → unprocessed, every field as Stripe stores it

### Rule 6: Subtitle Explains Like You're Telling Someone
Read it out loud. Does it sound like a human explaining what this does? Or does it sound like a spec sheet?

**Spec sheet (wrong):**
```
"Segment breakdowns, impact predictions, KPI audits, and spend tracking — every query powering the forecasting grid"
```

**Telling someone (right):**
```
"Get near-instant insights on the intent that underlies every Next AI Labs system or strategic decision"
```

## The Canonical Examples

### Example 1: Company Intent Get API
```json
{
  "humanUxTitle": "Scan All Known Company Intent",
  "humanUxSubtitle": "Get near-instant insights on the intent that underlies every Next AI Labs system or strategic decision"
}
```

### Example 2: Forecasting Workbench Endpoints
```json
{
  "humanUxTitle": "Get Deterministic Forecasting Metrics by Segment",
  "humanUxSubtitle": "Auditable KPI breakdowns in the Forecasting Workbench sourced directly from raw Stripe receipts and Facebook Ads spend — real transactions, not estimates"
}
```

### Example 3: Conversion Insights Endpoints
```json
{
  "humanUxTitle": "Save and Restore Segment Comparison Findings",
  "humanUxSubtitle": "Save any segment finding instantly from the Forecasting Workbench to your Conversion Insights tool — with comments, validation, and full restore"
}
```

### Example 4: Artifact Endpoints
```json
{
  "humanUxTitle": "Get the Full Audit Trail Behind Any Forecasting Number",
  "humanUxSubtitle": "Trace any KPI in the Forecasting Workbench back to the agent research document that produced it — retrieved by 5-digit artifact ID"
}
```

### Example 5: Stripe User Lookup (formatted)
```json
{
  "humanUxTitle": "Get Any User's Stripe Billing Summary by Email",
  "humanUxSubtitle": "Pull any user's full Stripe account by email into a readable admin view — subscriptions, charges, trial status, payment methods, and invoices"
}
```

### Example 6: Stripe Customer Raw
```json
{
  "humanUxTitle": "Get the Raw Stripe Customer Object by Email",
  "humanUxSubtitle": "Pull the complete unprocessed Stripe customer record by email — every field exactly as Stripe stores it, no formatting or filtering"
}
```

## The Evolution (Why Each Wrong Version Was Wrong)

### Attempt 1: Abstract "strategic promises" framing
```
Title: "Pull up any strategic promise you made and see if it's actually wired to the product"
Subtitle: "Every pricing rule, UX guarantee, and business commitment you locked in — traced to which screens enforce it and whether agents are honoring it"
```
**Why wrong:** "Strategic promise" is abstract jargon. The admin's reaction was "I don't get it. What's a strategic promise?" The tool gives agents semantic search on company intent — say THAT.

### Attempt 2: Capability as action instead of outcome
```
Title: "Query the Full Forecasting Analytics Engine"
```
**Why wrong:** Title should be what you GET, not what you DO. "Query" is an action. "Get Deterministic Forecasting Metrics" is an outcome.

### Attempt 3: Marketing fluff noun-stacking
```
Subtitle: "Segment breakdowns, impact predictions, KPI audits, and spend tracking — every query powering the forecasting grid"
```
**Why wrong:** Sounds like a marketing brochure. A pile of nouns stuffed together to sound important. Doesn't say what's actually special about this endpoint (deterministic data from real Stripe/FB sources).

### Attempt 4: Adding "why you'd care" reasons
```
Subtitle: "Subscriptions, charges, trial status, payment methods — look up any user's Stripe account when they say something's wrong with their access"
```
**Why wrong:** "when they say something's wrong with their access" is selling you on why to use it. The admin already knows why. Just describe what it returns.

### Attempt 5: Feature list without grounding
```
Subtitle: "Persist any insight from a segment comparison — with validation status, comments, and version history — restorable even after deletion"
```
**Why wrong:** Lists features (validation, comments, version history, restore) but never says WHERE it saves to. The fix: "Save any segment finding instantly from the Forecasting Workbench to your Conversion Insights tool" — names the source AND the destination.

## Checklist Before Submitting

- [ ] Does the title state what the admin GETS? (not what they DO)
- [ ] Does the title verb match the tool type? (Get/Save/Scan/Simulate/etc.)
- [ ] Does the subtitle explain it like telling someone?
- [ ] Does the subtitle name specific things? (tools, pages, data sources — not generic nouns)
- [ ] Does the subtitle state what's SPECIFICALLY special about this tool?
- [ ] Is there zero "so you can..." or other motivation/justification?
- [ ] Would the admin instantly know exactly what this does without clicking into it?
- [ ] Is the subtitle grounded in real places where possible? (FROM x TO y)
