---
name: company-intent-db
description: "Query or document company-level strategic intentions. Use when reading or writing company mission or pricing philosophy."
triggers:
  - "company intent"
  - "business strategy intent"
  - "company strategy"
  - "strategic decisions"
---

# Company Intent DB — Quick Functions

## Get the answer

| Want to know... | Run this |
|---|---|
| Company intents matching a keyword | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" find "pricing philosophy"` |
| Full details for one intent | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" get <slug>` |
| Children of an intent | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" children <slug>` |
| Intent tree from a root | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" tree <slug>` |
| Full tree (all roots) | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" tree` |
| Most recent intents | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" recent 10` |
| Source-of-truth intents | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" canonical` |
| Intents by category | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" category mission` |
| Compact brief for sub-agents | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" brief <slug>` |
| File metadata for evidence | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" file-meta <path>` |
| Search via API | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" find "<query>" --tags <tag1,tag2> --category <cat> --limit 10` |
| Recent changes via API | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" recent 5` |
| Full intent by slug via API | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" get <slug>` |
| Related intents (holonic nav) | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" related <slug>` |
| Strategic promises | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" promises <slug>` |
| Compact brief via API | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" brief <slug>` |
| Where is help needed | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" help-needed` |
| Pending proposals | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" pending` |
| Lightweight lookup by ID | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" get <IX-###>` |
| Lightweight lookup by slug | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" get <slug>` |
| Batch lookup | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" get slug1,slug2` |
| Full tree via API | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" tree` |
| List all (flat with filters) | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" list --category <cat> --status <status>` |

## Do something

| Want to do... | Run this |
|---|---|
| Create an intent (CLI) | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" create '<json>'` |
| Propose with certainty scoring | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" propose '<json>'` |
| Validate proposal without saving | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" validate '<json>'` |
| Boost intent in search | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" touch <slug>` |
| Create intent via API | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" create '{"slug":…,"title":…,"primaryIntent":…,"tags":[…],"category":…}'` |
| Log a principle (convenience) | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" principle '{"title":…,"description":…,"tags":[…]}'` |
| Update intent via API | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" update <slug> '{fields to update}'` |
| Approve intent | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" approve <slug>` |
| Delete intent | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" delete <slug>` |
| Touch via API | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" touch <slug>` |
| Bulk touch | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" touch slug1,slug2` |
| Propose via API | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" propose '{"slug":…,"title":…,"primaryIntent":…,"tags":[…],"certaintyScore":…}'` |
| Request help on intent | `node "${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js" request-help <slug>` |

## Auth
None needed: there is no server and no key. Each company intent is a JSON file in the folder `alignment-harness records company-intent` prints, inside your own harness data folder.

## Shell utility
`${CLAUDE_PLUGIN_ROOT}/skills/company-intent-db/company-intent.js`
- find = search company intents (canonical first, then recent)
- get = full intent details by slug
- children = list children of an intent
- tree = intent tree (from slug, or full tree if no arg)
- recent = most recently updated intents
- canonical = source-of-truth intents
- category = browse by category (mission, vision, values, strategy, product, pricing, growth, culture, market, operations, other)
- brief = compact ~500 token brief for sub-agents
- touch = refresh timestamp to boost in search
- create = create new intent (proposed status)
- propose = propose with certainty scoring (max 50)
- validate = validate proposal structure without saving
- file-meta = get file dates and git history for evidence

## MCP Tools (Claude Desktop & Cloud)

| Tool | Description |
|------|-------------|
| `company_intent_search` | Search company intents by query, tags, or category |
| `company_intent_get` | Get full details for a specific intent by slug |
| `company_intent_list` | List intents with optional category/status filters |
| `company_intent_propose` | Propose a new company intent (max certainty: 50) |
| `company_intent_tree` | Get hierarchical tree view from optional root slug |

---

The Company Intent DB is a hierarchical knowledge graph documenting **company-level** strategic decisions, mission, vision, values, pricing philosophy, growth strategy, and organizational alignment. It sits ABOVE the UX Intent DB — answering "why does this company exist and what are we building toward?" while UX intents answer "what should users experience?"

**Agents should query this FIRST when making decisions about product strategy, pricing, mission alignment, or understanding WHY a feature exists.**

### Valid Values Reference (Mongoose Enums)

| Field | Valid Values | Default |
|-------|-------------|---------|
| `status` | `draft`, `proposed`, `approved`, `deprecated` | `approved` |
| `category` | `mission`, `vision`, `values`, `strategy`, `product`, `pricing`, `growth`, `culture`, `market`, `operations`, `other` | `other` |

## Categories

| Category | What It Captures |
|----------|-----------------|
| `mission` | Why the company exists |
| `vision` | Where we're going |
| `values` | How we operate |
| `strategy` | How we win |
| `product` | What we build |
| `pricing` | How we charge |
| `growth` | How we grow |
| `culture` | Team and org |
| `market` | Positioning and competition |
| `operations` | How we run things |

---

## Schema Reference

```javascript
{
  slug: String,           // required, unique (e.g., "mission", "pricing-philosophy")
  title: String,          // required
  primaryIntent: String,  // required - the core "what" statement
  category: String,       // mission|vision|values|strategy|product|pricing|growth|culture|market|operations|other
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
    notes: [String]       // Edge cases, context
  }],

  // Strategic Promises (company-level equivalent of UX promises)
  strategicPromises: [{
    when: String,         // Trigger condition
    then: String          // Expected outcome
  }],

  // Business Contracts
  contracts: [{
    name: String,
    description: String,
    stakeholder: String,    // Who this applies to
    commitment: String,     // What we commit to
    measuredBy: String      // How we measure success
  }],

  // Links to UX Intent DB (bridging company → feature intent)
  linkedUxIntents: [{
    slug: String,           // UX Intent DB slug
    relationship: String,   // implements|supports|extends|constrains
    note: String
  }],

  stack: [String],        // Visual summary bullets

  // Workflow
  status: String,         // draft|proposed|approved|deprecated
  proposedBy: String,
  approvedBy: String,
  approvedAt: Date,

  // Certainty Scoring (for proposals)
  certaintyScore: Number, // 1-50 for agents, 51-100 for humans only
  certaintyBreakdown: {   // Required for agent proposals
    baseScore: Number,
    evidenceFactors: [{ factor, points, location }],
    uncertaintyFactors: [{ factor, points, note }],
    finalScore: Number
  },

  // Timestamps (auto-managed)
  createdAt: Date,
  updatedAt: Date
}
```

---

## Relationship to UX Intent DB

The Company Intent DB and UX Intent DB form a **two-tier intent hierarchy**:

```
Company Intent DB (WHY & WHAT)
├── Mission: "Help people become better leaders"
├── Pricing Philosophy: "Commitment-first, card-required trials"
│   └── linkedUxIntents: [
│         { slug: "beta-50-ops.premium-feature-gate", relationship: "constrains" }
│       ]
└── Growth Strategy: "Product-led growth via coaching quality"

UX Intent DB (HOW users experience it)
├── beta-50-ops.premium-feature-gate
├── beta-50-journey
└── session-expiry-ux
```

**When to use which:**
- **Company Intent DB**: Strategic decisions, "why" questions, business model, values
- **UX Intent DB**: Feature behavior, "what should the user see" questions, UX contracts

---

## When to Query Company Intent DB

**ALWAYS check Company Intent DB when:**
- Making decisions about pricing or subscription tiers
- Deciding feature priority or product direction
- Understanding WHY a business decision was made
- Evaluating whether a proposal aligns with company values
- Writing marketing copy or positioning

**The pattern:**
1. Search Company Intent DB for strategic context
2. Read the canonical intent if one exists
3. Cross-reference with UX Intent DB for implementation details
4. Cite the company intent in your proposal/commit
5. If no intent exists, propose one

---

## Admin UI

- **View/Edit Company Intents:** the JSON files in the folder `alignment-harness records company-intent` prints
- **View/Edit UX Intents:** the JSON files in the folder `alignment-harness records intents` prints
- **Search:** `agent_find` with "company intent" finds them, and `agent_read` opens one by the ref it prints

---

## Writing Company Intents: Strategy-Centric Format (REQUIRED)

**Company intents are about STRATEGIC DIRECTION, not code behavior.**

When writing or proposing company intents, describe:
1. **WHAT** - The strategic decision or commitment
2. **WHY** - The business rationale
3. **HOW** - How this manifests in the product
4. **MEASURED BY** - How we know it's working

### Example
```
When we decide on pricing, we commit to a card-required trial model because
we've learned that commitment-first users have {N}x higher conversion rates and
dramatically lower support costs. This manifests in every signup flow requiring
a card before accessing coaching features. We measure success by trial-to-paid
conversion rate, aiming for {X}%+ within 14 days.
```

---

## Agent Intent Proposal Protocol

Same certainty scoring as UX Intent DB. **Agent-proposed intents can NEVER exceed 50** without human approval.

```
CERTAINTY = min(50, BASE_SCORE + EVIDENCE_BONUS - UNCERTAINTY_PENALTY)
Where BASE_SCORE = 10
```

See the full scoring algorithm in the [Intent DB skill](${CLAUDE_PLUGIN_ROOT}/skills/intent-db/SKILL.md).
