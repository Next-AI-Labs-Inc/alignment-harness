# Agent UX Verification Skill

## Purpose

Automate screenshot evidence collection for UX verification assignments. Agents provide **evidence**, humans provide **judgment**. Agents never mark items as verified - they only attach screenshots and comments.

## Workflow Overview

If the `<your-api>/admin/ux-assignments` endpoints do not exist, keep one JSON file per item, with the fields shown below, in the folder `alignment-harness records ux-assignments` prints, and do each step on those files.

```
┌─────────────────────────────────────────────────────────────────┐
│  1. FETCH:                                                       │
│     SWARM: GET /needs-screenshots (returns 20, triggers swarm)  │
│     SINGLE: GET /needs-screenshots/next?agentId=X (auto-claims) │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. CLAIM (swarm only):                                         │
│     POST /:assignmentId/items/:itemId/claim                     │
│     → Locks item for 10 minutes (prevents collision)            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. EACH AGENT:                                                 │
│     a) Can verification be done with a few clicks?              │
│        YES → Navigate + interact via DevTools MCP               │
│        NO  → Create simulator function first (see below)        │
│     b) Navigate to the correct state                            │
│     c) Take screenshot                                          │
│     d) Call attachScreenshotToItem() - ONE function call        │
│     e) Add comments explaining what was observed                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. RESULT:                                                     │
│     → Screenshot stored with 30-day TTL                         │
│     → Comments visible in FB-style feed                         │
│     → Agent does NOT change status                              │
│     → Human sees screenshot in admin UI                         │
│     → Human marks verified/failed                               │
└─────────────────────────────────────────────────────────────────┘
```

## Key Principles

1. **Agents provide evidence, not judgment** - Never mark items as verified/failed
2. **Claim before working** - Prevents swarm collision
3. **10-minute claim TTL** - If agent fails, item becomes available again
4. **One function to attach** - Screenshot + auto-comment in single call
5. **Human verification** - Only humans mark verified/failed status

---

## API Reference

### Fetch Endpoints

#### 1. GET <your-api>/admin/ux-assignments/needs-screenshots

**Purpose**: Fetch batch of items for swarm dispatch

**When to use**: Coordinator agent fetching work for parallel processing

**Query params**:
- `limit` (default: 20) - Number of items to return
- `includeClaimed` (default: false) - Include items claimed by other agents

**Returns**:
```json
{
  "success": true,
  "data": [
    {
      "assignmentId": "...",
      "itemId": "...",
      "title": "Active subscribers can enter app from checkout",
      "uxStory": "When user with active subscription checks out...",
      "steps": ["Go to /checkout", "Enter email of active subscriber", "..."],
      "expectedResult": "Modal shows two buttons...",
      "path": "/checkout",
      "environment": "local",
      "category": "payment",
      "repo": "<landing-repo>",
      "combinedScore": 81,
      "simulatorPath": "/admin2/subscription-simulator",
      "claimedBy": null,
      "claimExpiresAt": null
    }
  ],
  "count": 20,
  "total": 47,
  "hint": "Trigger a swarm: dispatch one agent per item for parallel processing"
}
```

**Agent action**: If count > 1, trigger swarm dispatch (one agent per item)

---

#### 2. GET <your-api>/admin/ux-assignments/needs-screenshots/next

**Purpose**: Fetch single highest-priority item and AUTO-CLAIM it

**When to use**: Single agent working sequentially

**Query params**:
- `agentId` (required) - Your agent identifier

**Returns**:
```json
{
  "success": true,
  "data": { /* single item */ },
  "claimed": true,
  "claimExpiresAt": "2025-01-31T12:10:00Z",
  "message": "Item claimed for 10 minutes. Attach screenshot before expiry."
}
```

**Returns null data**: When no items need screenshots
```json
{
  "success": true,
  "data": null,
  "message": "No items need screenshots at this time"
}
```

---

### Claim Endpoints

#### 3. POST <your-api>/admin/ux-assignments/:assignmentId/items/:itemId/claim

**Purpose**: Explicitly claim an item (for swarm coordinator dispatching)

**Request body**:
```json
{
  "agentId": "claude-opus-4-5-worker-3",
  "durationMinutes": 10
}
```

**Returns**:
```json
{
  "success": true,
  "data": {
    "assignmentId": "...",
    "itemId": "...",
    "claimedBy": "claude-opus-4-5-worker-3",
    "claimExpiresAt": "2025-01-31T12:10:00Z"
  }
}
```

**409 Conflict**: If already claimed by another agent
```json
{
  "success": false,
  "error": "Item already claimed",
  "claimedBy": "other-agent",
  "claimExpiresAt": "2025-01-31T12:05:00Z"
}
```

---

#### 4. DELETE <your-api>/admin/ux-assignments/:assignmentId/items/:itemId/claim

**Purpose**: Release a claim when agent cannot complete

**Request body**:
```json
{
  "agentId": "claude-opus-4-5-worker-3",
  "reason": "Could not reach checkout page - server returned 500"
}
```

**Effect**:
- Clears claim so other agents can try
- Adds `blocker` comment explaining why

---

### Evidence Endpoints

#### 5. POST <your-api>/admin/ux-assignments/:assignmentId/items/:itemId/screenshot

**Purpose**: Attach screenshot evidence (does NOT change status)

**Request body**:
```json
{
  "screenshot": "<base64-encoded-image>",
  "agentId": "claude-opus-4-5",
  "capturedUrl": "http://localhost:3005/admin2/subscription-simulator",
  "notes": "Modal displayed with two buttons as expected"
}
```

**Effect**:
- Stores screenshot with 30-day TTL
- Sets `screenshotCapturedAt`, `screenshotCapturedBy`
- Auto-adds `observation` comment
- Clears claim (item is "done" for agents)

---

#### 6. POST <your-api>/admin/ux-assignments/:assignmentId/items/:itemId/comments

**Purpose**: Add observation/blocker/question to FB-style feed

**Request body**:
```json
{
  "text": "Navigated to subscription simulator, selected 'Active - Same Plan', modal appeared.",
  "agentId": "claude-opus-4-5",
  "type": "observation"
}
```

**Comment types**:
| Type | When to use | UI color |
|------|-------------|----------|
| `observation` | What you saw/did | Gray |
| `blocker` | Can't proceed, needs human | Red |
| `question` | Unsure if behavior is correct | Yellow |
| `resolution` | Human closes the loop | Green |

---

## Swarm Dispatch Pattern

When coordinator receives multiple items:

```javascript
// Coordinator fetches batch
const response = await fetch('<your-api>/admin/ux-assignments/needs-screenshots', {
  headers: { 'x-api-key': process.env.DEVELOPER_API_KEY },
});
const { data: items } = await response.json();

if (items.length > 1) {
  // Dispatch swarm - one agent per item
  for (const item of items) {
    // 1. Claim item
    await fetch(`/api/.../items/${item.itemId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ agentId: `worker-${i}` })
    });

    // 2. Spawn agent with item context
    spawnAgent({
      task: 'capture-ux-screenshot',
      item: item,
      agentId: `worker-${i}`
    });
  }
}
```

---

## When to Create Simulator Functions

If the UX condition **cannot** be reached with a few clicks, check for existing simulator:

1. Check `item.simulatorPath` field
2. If exists, navigate there directly
3. If not, create simulator at `/admin2/{feature}-simulator.tsx`

### Existing Simulators

| Feature | Path | States |
|---------|------|--------|
| Checkout modals | `/admin2/subscription-simulator` | Active-Same, Upgrade, Downgrade, Failed |
| Error boundaries | `/admin2/error-simulator` | (to be created) |
| Auth edge cases | `/admin2/auth-simulator` | (to be created) |

---

## Environment URLs

| Environment | your app | your api | your landing |
|-------------|-----------|-------------|-----------------|
| local | localhost:<app port> | localhost:<api port> | localhost:<landing port> |
| staging | <your staging app domain> | <your staging api domain> | <your staging landing domain> |
| production | <your app domain> | <your api domain> | <your landing domain> |

---

## Self-Correction Protocol

### If This Skill Fails

If you encounter a scenario not covered by this skill file:

1. **Document the gap**: Add a `blocker` comment explaining what's missing
2. **Update Known Gaps**: Add a row to the table below
3. **Propose fix**: Describe how the skill file should be updated

### Known Gaps (Agent-Reported)

| Date | Agent | Gap Description | Proposed Fix | Status |
|------|-------|-----------------|--------------|--------|
| | | | | |

### How to Update This Skill File

```markdown
## Adding a Gap Entry

1. Read this skill file
2. Add row to Known Gaps table with:
   - Date (ISO format)
   - Your agent ID
   - Clear description of what failed
   - Proposed workflow addition
   - Status: "reported"
3. If you can fix it, update the relevant section and change status to "fixed"
```

---

## Example Agent Session

```
Human: verify ux assignments

Agent (Coordinator):
1. Fetching items needing screenshots...
   GET /needs-screenshots
   → Found 5 items, hint says "trigger swarm"

2. Claiming and dispatching agents...
   POST /item-1/claim → worker-1
   POST /item-2/claim → worker-2
   POST /item-3/claim → worker-3
   POST /item-4/claim → worker-4
   POST /item-5/claim → worker-5

Agent (Worker-1):
   → Item: "Active subscribers can enter app from checkout"
   → simulatorPath: /admin2/subscription-simulator
   → Navigating to localhost:3005/admin2/subscription-simulator
   → Selecting "Active - Same Plan"
   → Clicking "Preview Modal"
   → POST /comments: "Modal appeared with two buttons"
   → Taking screenshot...
   → POST /screenshot: [base64 data]
   → Done ✓

Agent (Worker-2):
   → Item: "Error boundary shows friendly message"
   → simulatorPath: null (need to create)
   → Creating /admin2/error-simulator...
   → [creates simulator]
   → Navigating and triggering error...
   → POST /screenshot: [base64 data]
   → Done ✓

3. Summary:
   ✓ 5/5 items have screenshots attached
   → Ready for human verification at /admin2/ux-assignments
```

---

## Related Skills

- `ux-assignment-generator` - Creates the assignments this skill verifies
- `devtools-site-testing` - Chrome DevTools MCP patterns

---

## Triggers

This skill should be invoked when user says:
- "verify ux assignments"
- "capture ux screenshots"
- "run verification swarm"
- "check what needs screenshots"
