---
name: how-to-submit-and-track-proposals
description: LEGACY/SEARCH-ONLY. The DB-backed developer-proposals API documented here is preserved as a read/search surface for OLD proposals — do NOT file NEW proposals here. To author a new proposal, use /propose (it lands the proposal as an Obsidian vault note that the canonical "1 - Open Proposals" dashboard surfaces). Use this skill only to look up or track proposals already in the DB API.
---

# How to Submit and Track Proposals

> [!warning] ⛔ DO NOT FILE NEW PROPOSALS HERE — this is the OLD system, kept for search only.
> **The canonical path for a NEW proposal is an Obsidian vault note**, not this DB API.
> A proposal is a `.md` file in `<api-repo>/docs/intent/1.7_proposed/` whose frontmatter
> (`cssclass: proposal`, `tags: [proposal]`, `status: needs-review`, `id: LP-###`, `leverage_score`)
> makes the **canonical dashboard engine** `5.0_Founder_Dashboards/Indexes/1 - Open Proposals.md`
> surface it as a reviewable row in Obsidian. That is where the user reviews proposals.
>
> **To author a new proposal → use `/propose`** (chains `/proposal-ground` → `/proposal-schema` →
> write the vault note). Do NOT POST to the developer-proposals API below for new work.
>
> **This API is NOT dead** — it still returns 200 and holds older proposals. It is preserved as a
> **search/lookup surface** for proposals already filed in the DB. Read from it; don't write new
> proposals to it. (User directive 2026-06-18: "the old proposals are not trash but no longer to
> be used; direct proposals to the new location, leave the old as a search surface.")

Submit ideas for human review before implementing. This keeps humans in the loop on strategic decisions while letting agents identify opportunities autonomously.

## When to Use This

- You identified an improvement but need human approval before implementing
- You want to suggest a bug fix, refactor, or enhancement
- You need to check status of proposals you've submitted
- Human added feedback to your proposal and you need to respond
- You're ready to implement an approved proposal

## Proposal Types

| Type | When to Use |
|------|-------------|
| `leverage-prediction` | Strategic next move, high-impact opportunity |
| `seo-improvement` | Search visibility improvements |
| `ux-refinement` | User experience improvements |
| `intent-doc` | Missing intent documentation needed |
| `bug-hypothesis` | Suspected bug that needs investigation |
| `performance-fix` | Speed/performance improvements |
| `refactor-suggestion` | Code health improvements |

## API Base

```
Base: <your-proposals-api-url>
Header: X-API-Key: $DEVELOPER_API_KEY
```

To get the API key:
```bash
export DEVELOPER_API_KEY=$(grep -E '^DEVELOPER_API_KEY=' .env | cut -d'=' -f2)
```

---

## Complete Workflow

### Step 1: Submit Proposal

```bash
curl -X POST "<your-proposals-api-url>" \
  -H "X-API-Key: $DEVELOPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "proposalType": "ux-refinement",
    "title": "Simplify checkout to reduce abandonment",
    "description": "Users drop off at payment step. Propose consolidating to 2-step checkout.",
    "reasoning": "Analytics show 30% drop at step 3. User feedback mentions confusion.",
    "expectedImpact": "Reduce abandonment by 15%, increase conversions",
    "priority": 75,
    "createdBy": "claude-opus",
    "targetRoutes": ["/checkout", "/payment"],
    "targetFiles": ["src/components/Checkout.jsx"]
  }'
```

**CRITICAL**: Store the returned `_id`. You need it to track this proposal.

```bash
# Response
{ "success": true, "data": { "_id": "abc123...", ... } }

# Store it
MY_PROPOSAL_IDS+=("abc123...")
```

### Step 2: Check Status (By Your IDs)

Multiple agents may share the same agentId. Always query by the specific proposal IDs you created:

```bash
curl -X POST "<your-proposals-api-url>/by-ids" \
  -H "X-API-Key: $DEVELOPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"ids": ["abc123", "def456"]}'
```

**Response includes status flags:**
```json
{
  "success": true,
  "data": [{
    "_id": "abc123",
    "status": "pending-review",
    "hasHumanNotes": true,
    "lastNoteIsHuman": true
  }]
}
```

| Flag | Meaning |
|------|---------|
| `status: "approved"` | Ready to implement |
| `status: "rejected"` | Human declined, move on |
| `status: "pending-review"` | Waiting for human |
| `hasHumanNotes: true` | Human added feedback |
| `lastNoteIsHuman: true` | Human is waiting for your response |

### Step 3: Respond to Human Feedback

If `lastNoteIsHuman: true`, the human asked a question or raised a concern:

```bash
curl -X POST "<your-proposals-api-url>/abc123/reply" \
  -H "X-API-Key: $DEVELOPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "claude-opus",
    "reply": "Good point about error handling. I will add try/catch around the payment API call.",
    "addressedNoteIndex": 0
  }'
```

### Step 4: Claim Approved Proposal

When status is `approved`, claim it before implementing:

```bash
curl -X POST "<your-proposals-api-url>/abc123/claim" \
  -H "X-API-Key: $DEVELOPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "claude-opus"}'
```

This sets status to `in-progress` and assigns to you.

### Step 5: Implement and Mark Done

After implementing:

```bash
curl -X POST "<your-proposals-api-url>/abc123/implemented" \
  -H "X-API-Key: $DEVELOPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "claude-opus",
    "commitHash": "e737e68",
    "uxAssignmentId": "xyz789",
    "notes": "Implemented 2-step checkout with error handling"
  }'
```

---

## Quick Reference: All Endpoints

### Context-Efficient (Use These)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/by-ids` | Check status of YOUR proposals (primary method) |
| GET | `/next` | Get single highest-priority approved proposal |
| GET | `/approved?limit=5` | Get approved proposals to choose from |
| POST | `/:id/claim` | Claim proposal for implementation |
| POST | `/:id/implemented` | Mark as done |
| POST | `/:id/reply` | Respond to human feedback |

### Standard CRUD

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/` | Create new proposal |
| GET | `/` | List proposals with filters |
| GET | `/:id` | Get single proposal details |
| GET | `/stats` | Aggregate stats by type/status |

---

## Proposal Status Flow

```
pending-review  →  approved  →  in-progress  →  implemented
                →  rejected
                →  deferred
```

---

## Priority Scoring (0-100)

Use this formula when setting priority:

| Factor | Weight | Questions |
|--------|--------|-----------|
| User Impact | 40% | How many users? How badly affected? |
| Business Value | 30% | Revenue, retention, conversion impact? |
| Effort Efficiency | 20% | Impact per hour of work? |
| Risk Reduction | 10% | Prevents future outages/bugs? |

**Threshold**: Only submit proposals scoring ≥60. Below that, skip.

---

## Human Review UI

Humans review proposals at: `http://localhost:3000/admin2/proposals`

They can:
- Approve → You implement
- Reject → Move on
- Defer → Revisit later
- Add notes → You respond

---

## Anti-Patterns

**DON'T propose:**
- Pure refactoring without user impact
- "Nice to have" improvements
- Tech debt that doesn't affect users
- Dependency updates without business justification

**DO propose:**
- Changes that unblock user value
- Fixes for known user pain points
- Features that increase retention/conversion
- Performance wins users will notice

---

## Integration with Other Skills

After implementing an approved proposal:
1. Use `ux-assignment-generator` skill to create verification assignments
2. Link the proposal ID in the UX assignment
3. Use `playwright-validator` skill to capture screenshot evidence

## Open filed proposals in Obsidian

If the proposal was written as a file in the intent vault (`<api-repo>/docs/intent/proposed/`), open it in Obsidian for the user after filing (if the person has an Obsidian vault; otherwise print the path):

```bash
open "obsidian://open?vault=<their vault name>&file=proposed/PROPOSAL_FILENAME_WITHOUT_EXTENSION&newtab=true"
```

Example: `open "obsidian://open?vault=<their vault name>&file=proposed/LP-042-checkout-abandonment&newtab=true"`

Do not include the `.md` extension in the URI. This ensures the user sees the proposal immediately in their Obsidian app.
