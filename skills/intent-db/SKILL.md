---
name: intent-db
paths: "**/intent/**,**/seeds/**,**/proposals/**"
description: Query or document UX intentions in the Intent DB. Use for READ ("what should happen when X", "what's the intended UX", "check the intent db") or WRITE ("log intent", "document intent", "record why we built X", "add to intent db", "propose intent").
---

# Intent DB

The Intent DB is a hierarchical knowledge graph documenting strategic decisions, user journeys, operational rules, and UX contracts. **Agents should query this FIRST when making decisions about UX, feature behavior, or implementation patterns.**

## Quick Start for Agents

### 1. Search Before Building
```bash
# Find relevant intents before implementing anything
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" find "premium feature"
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" find "trial"
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" find "session expiry"
```

### 2. Check Canonical Decisions
Canonical intents are the **source of truth**. They appear first in search results.
```bash
# List canonical intents (prioritized decisions)
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" canonical
```

### 3. Get Recent Decisions
Most recently updated intents reflect the latest thinking:
```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" recent 10
```

---

## Agent API Endpoints

Base command: `node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js"`

### Primary Search (Use This First)
```
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" find <query>
```
Returns intents sorted by: canonical first, then most recent.

**Example Response:**
```json
{
  "success": true,
  "data": [{
    "slug": "beta-50-ops.premium-feature-gate",
    "title": "Premium Feature Gate System",
    "primaryIntent": "Let premium features sell themselves...",
    "tags": ["operational", "premium", "gate", "canonical"],
    "updatedAt": "2026-02-01T21:39:41.968Z",
    "keyPoints": ["Trial users see full feature marketing content", "..."],
    "exampleContract": { "when": "Trial user visits premium feature", "then": "..." }
  }],
  "meta": { "canonical": 1 }
}
```

### Get Recent Changes
```
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" recent 5
```

### Get Full Intent Details
```
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" get <slug>
```

### Get UX Stories for an Intent
```
GET /agent/ux-stories/<slug>
```
Returns all UX promises and contracts from intent and its children.

---

## Swarm Coordination

For parent agents spawning sub-agents to audit alignment:

### Extract Alignment Domains
```
GET /agent/alignment-domains/<slug>
```
Returns individual rules as sub-agent tasks with compact briefs (~200 tokens each).

### Get Compact Brief (for Sub-Agents)
```
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" brief <slug>
```
Returns ~500 token summary: core rules, never-do list, UX contracts.

### Find Proposals Citing an Intent
```
alignment-harness proposal search <slug>
```
See all proposals that reference a specific intent.

---

## Creating Proposals with Intent Citations

When proposing changes, **always cite the relevant intent** so admins can verify alignment:

```json
alignment-harness proposal add --json '<this JSON>'
{
  "title": "Implement Premium Feature Gate on Memory Kit",
  "description": "Add trial user gate per Intent DB rules",
  "linkedIntents": [{
    "slug": "beta-50-ops.premium-feature-gate",
    "citedRule": "Trial users see marketing + action gate, nothing else",
    "alignmentType": "implements"
  }],
  "alignmentDomain": "premium-feature-gate"
}
```

**alignmentType options:**
- `supports` - Aligns with intent
- `implements` - Directly implements intent rule
- `extends` - Adds to existing intent
- `questions` - Raises concern about intent
- `deprecates` - Intent should be updated

---

## Key Intents Agents Should Know

### Canonical (Always Check These)
| Slug | What It Covers |
|------|----------------|
| `beta-50-strategic-decision` | Master decision: commitment-first, card-required trials |
| `beta-50-journey` | 10-step user journey from ad to churn recovery |
| `beta-50-ops` | Operational rules: communication, features, algorithms |
| `beta-50-ops.premium-feature-gate` | How to gate premium features for trial users |

### Atomic Decisions (Quick Answers)
| Question | Search |
|----------|--------|
| Session expiry UX? | `beta-50-decision.session-expiry-ux` |
| Where do unpaid users go? | `beta-50-decision.unpaid-session-expiry` |
| Auto-refresh tokens? | `beta-50-decision.token-refresh` |
| Hide or show locked features? | `beta-50-decision.feature-visibility` |
| Require card for trial? | `beta-50-decision.trial-requires-card` |
| Directory pages free? | `beta-50-decision.directory-pages` |

---

## CLI Commands

```bash
# Search
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" find <query>
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" find "stripe trial"

# Get specific intent
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" get <slug>
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" get beta-50-ops.premium-feature-gate

# Get children of an intent
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" children <slug>

# Get full tree
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" tree <slug>

# Get recent intents
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" recent 5

# Get canonical intents
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" canonical

# Create new intent (admin)
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" create '<json>'

# Touch intent (refresh timestamp to boost in search)
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" touch <slug>
```

---

## Schema Reference

```javascript
{
  slug: String,           // required, unique (e.g., "beta-50-decision.trial-card")
  title: String,          // required
  primaryIntent: String,  // required - the core "what" statement
  tags: [String],         // required for search (include 'canonical' for priority)

  // Hierarchy
  parentSlug: String,     // for nesting
  depth: Number,          // 0=root, 1=child
  order: Number,          // sort among siblings

  // Content
  items: [{
    statement: String,    // The intent statement
    therefore: [String],  // What this means in practice
    why: [String],        // Rationale
    notes: [String]       // Edge cases, UX characteristics
  }],

  // UX Contracts
  uxPromises: [{
    when: String,         // Trigger condition
    then: String          // Expected outcome
  }],

  // API Contracts
  contracts: [{
    name: String,
    endpoint: String,
    method: String,
    payload: String,
    usage: String
  }],

  stack: [String],        // Visual summary bullets

  // Workflow
  status: String,         // proposed|approved|deprecated
  proposedBy: String,
  approvedBy: String,
  approvedAt: Date,

  // Timestamps (auto-managed)
  createdAt: Date,
  updatedAt: Date         // Sorted by this for "recent first"
}
```

---

## Admin UI

- **View/Edit Intents:** the JSON files in the folder `alignment-harness records intents` prints
- **Approve Proposals:** `alignment-harness proposal update <id> --status approved`
- **Cmd+K Search:** Type "intent" to find Intent DB page

---

## When to Query Intent DB

**ALWAYS check Intent DB when:**
- Implementing any feature involving trials/subscriptions
- Building premium/gated features
- Handling authentication states
- Making UX decisions about modals, redirects, messaging
- Unsure about intended behavior

**The pattern:**
1. Search Intent DB for relevant rules
2. Read the canonical intent if one exists
3. Cite the intent in your proposal/commit
4. If no intent exists, propose one

---

## Writing Intents: UX-Centric Format (REQUIRED)

**Intents are about the USER'S EXPERIENCE, not code behavior.**

When writing or proposing intents, you MUST describe:
1. **WHEN** - The user's state/trigger
2. **WE AIM TO** - What we render/show the user
3. **HOW** - How we determine what to show
4. **BECAUSE** - The journey toward aha moment → conversion → retention

### ❌ BAD: Code-Centric (REJECTED)

```
The intent of this function is to check feature flags and render components based on conditions.
```

```
This component's intent is to query the user's subscription status and display appropriate UI.
```

These describe CODE, not USER EXPERIENCE. They will be rejected.

### ✅ GOOD: UX-Centric (REQUIRED)

```
When the user lands on hub, the first thing we aim to render is a prediction of the optimal next step for that user. We attempt to figure that out presently via checking all feature flags for which features they had adopted as well as funnel stage criteria which would predict the next step for states like not logged in etc.

Then we aim to render the single highest likely next step based on what we believe will progress the user towards their next aha moment and eventually conversion if not yet converted, and if converted towards the next most impactful aha moment for sustained positive impact on their lives and long term retention.
```

**Notice:**
- Written from USER's perspective ("when the user lands...")
- Describes what we AIM to show, not what the code does
- Explains WHY in terms of user journey (aha moment → conversion → retention)
- Conversational and human-readable

### Intent Writing Checklist

Before submitting an intent, verify:

- [ ] Does it start with "When the user..." or similar user-centric trigger?
- [ ] Does it describe what we AIM TO render/show, not what code does?
- [ ] Does it explain WHY in terms of user journey progression?
- [ ] Could a non-technical person understand the user experience from reading it?
- [ ] Does it avoid code terminology (functions, components, queries, APIs)?
