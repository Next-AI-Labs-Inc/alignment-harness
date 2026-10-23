---
name: playwright-validator
description: "Validate UX flows using Playwright via MCP. Capture screenshots as evidence for UX assignments, system logs, and proposals. Use after making code changes to self-verify before creating UX assignments, or when asked to validate a flow."
---

# Playwright Validator

Capture screenshot evidence of UX flows to accelerate human verification. Agents validate their own work and attach visual proof.

## When to Use

- After completing code changes, before creating UX assignment
- When human marks UX assignment as "agent-input" needing verification
- To validate a reported bug exists or is fixed
- To capture current state for comparison

## Prerequisites

Ensure Playwright MCP is configured. Check your MCP settings for `@executeautomation/playwright-mcp-server` or similar.

## Core Pattern

```
Agent completes code change
    ↓
Agent runs Playwright to navigate the flow
    ↓
Agent captures screenshots at each step
    ↓
Agent saves evidence with `alignment-harness record evidence`
    ↓
Agent creates UX assignment with evidence attached
    ↓
Human sees thumbnails, verifies in 10 seconds
```

## Screenshot Upload API

```bash
alignment-harness record evidence --name step-1-login.json <<'EOF'
{
    "sourceType": "ux-assignment",
    "sourceId": "<assignmentId>",
    "itemId": "<itemId>",
    "base64": "<screenshot base64>",
    "filename": "step-1-login.png",
    "stepIndex": 0,
    "stepDescription": "Login page loaded",
    "url": "http://localhost:3000/login",
    "viewport": { "width": 1280, "height": 720 },
    "passed": true,
    "consoleErrors": [],
    "agentNotes": "Login form rendered correctly",
    "capturedBy": "claude-opus"
}
EOF
```

## Source Types

| Type | Use Case |
|------|----------|
| `ux-assignment` | Evidence for UX verification items |
| `system-log` | Screenshots showing error state |
| `proposal` | Visual context for proposals |
| `manual-test` | Ad-hoc captures |

## Validation Workflow

### 1. Navigate and Capture

Using Playwright MCP tools:
```
1. playwright_navigate({ url: "http://localhost:3000/checkout" })
2. playwright_screenshot() -> base64
3. Save with `alignment-harness record evidence` with sourceType, sourceId
4. playwright_click({ selector: ".submit-btn" })
5. playwright_screenshot() -> base64
6. Upload step 2
```

### 2. Check for Errors

After each step:
- Capture console errors via `playwright_evaluate`
- Check for visible error elements
- Mark `passed: false` if issues found

### 3. Attach to UX Assignment

When creating UX assignment items:
```json
{
  "title": "Checkout flow validation",
  "steps": ["Navigate to /checkout", "Click submit", "Verify confirmation"],
  "evidenceNote": "Screenshots attached - see Evidence gallery"
}
```

The UI will automatically show evidence thumbnails for items that have them.

## Evidence Display

**In collapsed view:** Items with evidence show purple "Evidence" badge

**In expanded view:** Thumbnail gallery with:
- Click to fullscreen
- Red border = agent marked as failed
- Green border = agent marked as passed
- Step number overlay
- Agent notes below

## Query Evidence

```bash
# Get all evidence for an assignment item
grep -ls '"sourceId": "{assignmentId}"' "$(alignment-harness records evidence)"/*.json | xargs grep -ls '"itemId": "{itemId}"'

# Check if item has evidence (for badge)
grep -ls '"sourceId": "{sourceId}"' "$(alignment-harness records evidence)"/*.json | xargs grep -ls '"itemId": "{itemId}"' | wc -l
```

## Storage

- Screenshots stored locally in the folder `alignment-harness records evidence` prints
- The JSON record file tracks metadata
- **30-day TTL** - cleanup via `find "$(alignment-harness records evidence)" -mtime +30 -delete`
- No S3/cloud upload - fast local access

## Best Practices

### DO:
- Capture at each meaningful step
- Include console errors in upload
- Mark `passed: false` for failures
- Add descriptive `agentNotes`
- Use consistent viewport sizes

### DON'T:
- Capture redundant screenshots (every second)
- Skip error checking
- Upload without context (missing stepDescription)
- Forget to set sourceType/sourceId

## Integration with UX Assignments

After capturing evidence:

1. Create UX assignment as normal
2. Evidence is linked via sourceId + itemId
3. UI automatically displays thumbnails
4. Human clicks thumbnail for fullscreen
5. Verification time drops from 2min to 10sec

## API Reference

### Upload Screenshot
```
alignment-harness record evidence --name <filename>.json   (record JSON on stdin)
Body: { sourceType, sourceId, itemId, base64, filename, stepIndex, stepDescription, url, viewport, passed, consoleErrors, agentNotes, capturedBy }
Response: saved evidence/<filename>.json and its full path
```

### Get Evidence
```
grep -ls '"sourceId": "{sourceId}"' "$(alignment-harness records evidence)"/*.json | xargs grep -ls '"itemId": "{itemId}"'
Response: the matching evidence record files
```

### Serve Screenshot
```
"$(alignment-harness records evidence)/{filename}.json"
Response: image as the record's base64 field
```

### Check Has Evidence
```
grep -ls '"sourceId": "{sourceId}"' "$(alignment-harness records evidence)"/*.json | xargs grep -ls '"itemId": "{itemId}"' | wc -l
Response: count (0 = no evidence)
```

### Batch Check
```
for id in {sourceIds}; do echo "$id: $(grep -ls "\"sourceId\": \"$id\"" "$(alignment-harness records evidence)"/*.json | wc -l)"; done
Response: { id: count, ... }
```

## Example: Full Flow

```javascript
// 1. Agent navigates
await playwright_navigate({ url: 'http://localhost:3000/checkout' });

// 2. Capture step 1
const step1 = await playwright_screenshot();
await uploadEvidence({
  sourceType: 'ux-assignment',
  sourceId: assignmentId,
  itemId: itemId,
  base64: step1,
  filename: 'checkout-page.png',
  stepIndex: 0,
  stepDescription: 'Checkout page loaded',
  url: 'http://localhost:3000/checkout',
  passed: true,
  capturedBy: 'claude-opus'
});

// 3. Click button
await playwright_click({ selector: 'button.submit' });

// 4. Check for errors
const errors = await playwright_evaluate({ expression: 'window.__consoleErrors || []' });

// 5. Capture result
const step2 = await playwright_screenshot();
await uploadEvidence({
  sourceType: 'ux-assignment',
  sourceId: assignmentId,
  itemId: itemId,
  base64: step2,
  filename: 'confirmation.png',
  stepIndex: 1,
  stepDescription: 'After submit click',
  url: 'http://localhost:3000/checkout/confirm',
  passed: errors.length === 0,
  consoleErrors: errors,
  capturedBy: 'claude-opus'
});
```
