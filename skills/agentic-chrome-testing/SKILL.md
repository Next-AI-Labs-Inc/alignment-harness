---
name: agentic-chrome-testing
description: "Test your app in real Chrome via CDP — navigate, click, screenshot. Use when verifying UX or running frontend smoke tests."
triggers:
  - "chrome testing"
  - "browser test"
  - "chrome devtools test"
  - "automated browser"
---

# Agent Chrome Testing

Control a real visible Chrome window via CDP. Screenshots are PNGs that Claude can read natively (multimodal).

## Prerequisites

1. **App running:** `cd <your-app> && npm start` (port 3000)
2. **Chrome debug port:** `open -a "Google Chrome" --args --remote-debugging-port=9222` (idempotent — safe to run repeatedly)

Both must be running. The debug script launches a separate Chrome instance that won't interfere with the user's normal Chrome.

If Chrome → View → Developer → "Allow JavaScript from Apple Events" is not turned on, turn it on.

## Commands

Run from your project root:

```bash
# Navigation (coaching UI is at root /, NOT /coaching)
node "${CLAUDE_PLUGIN_ROOT}/skills/agentic-chrome-testing/scripts/agent-chrome.js" navigate http://localhost:3000/

# Screenshots (Claude reads these with the Read tool)
node "${CLAUDE_PLUGIN_ROOT}/skills/agentic-chrome-testing/scripts/agent-chrome.js" screenshot /tmp/page.png
node "${CLAUDE_PLUGIN_ROOT}/skills/agentic-chrome-testing/scripts/agent-chrome.js" full-screenshot /tmp/full.png

# Interactions
node "${CLAUDE_PLUGIN_ROOT}/skills/agentic-chrome-testing/scripts/agent-chrome.js" click "#start-btn"
node "${CLAUDE_PLUGIN_ROOT}/skills/agentic-chrome-testing/scripts/agent-chrome.js" click "text=Start Session"
node "${CLAUDE_PLUGIN_ROOT}/skills/agentic-chrome-testing/scripts/agent-chrome.js" type "#email" test@example.com

# Inspect page state
node "${CLAUDE_PLUGIN_ROOT}/skills/agentic-chrome-testing/scripts/agent-chrome.js" eval "document.title"
node "${CLAUDE_PLUGIN_ROOT}/skills/agentic-chrome-testing/scripts/agent-chrome.js" eval "JSON.stringify([...document.querySelectorAll('button')].map(b => b.textContent.trim()))"

# Wait for element before acting
node "${CLAUDE_PLUGIN_ROOT}/skills/agentic-chrome-testing/scripts/agent-chrome.js" wait ".loaded" 5000

# Console errors (reloads page, listens for N ms)
node "${CLAUDE_PLUGIN_ROOT}/skills/agentic-chrome-testing/scripts/agent-chrome.js" console-errors 3000

# Tab management
node "${CLAUDE_PLUGIN_ROOT}/skills/agentic-chrome-testing/scripts/agent-chrome.js" tabs
node "${CLAUDE_PLUGIN_ROOT}/skills/agentic-chrome-testing/scripts/agent-chrome.js" tab 0
```

## Typical Agent Workflow

```
1. open -a "Google Chrome" --args --remote-debugging-port=9222
2. node agent-chrome.js navigate <url>
3. node agent-chrome.js screenshot /tmp/check.png
4. [Read /tmp/check.png — "see" the page]
5. node agent-chrome.js click "text=Some Button"
6. node agent-chrome.js screenshot /tmp/after.png
7. [Read /tmp/after.png — verify the result]
```

## Using with User Simulator

Set up specific user states before testing:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/agentic-chrome-testing/scripts/agent-chrome.js" navigate "http://localhost:3000/<your-user-simulator-path>?auth=logged_in&subscription=trialing&redirect=/&clear=true"
# Wait for redirect to complete
sleep 2
node "${CLAUDE_PLUGIN_ROOT}/skills/agentic-chrome-testing/scripts/agent-chrome.js" screenshot /tmp/simulated.png
```

Simulator params: `auth`, `subscription`, `accessTier`, `plan`, `redirect`, `clear=true`

## Selectors

| Type | Example | Notes |
|------|---------|-------|
| CSS | `"#my-id"`, `".my-class"`, `"button[type=submit]"` | Standard CSS selectors |
| Text | `"text=Start Session"` | Matches element containing that text |

**Discover selectors** when you don't know what's on the page:
```bash
node agent-chrome.js eval "JSON.stringify([...document.querySelectorAll('button')].map(b => b.textContent.trim()))"
node agent-chrome.js eval "JSON.stringify([...document.querySelectorAll('a')].map(a => ({text: a.textContent.trim(), href: a.href})))"
node agent-chrome.js eval "JSON.stringify([...document.querySelectorAll('input')].map(i => ({id: i.id, name: i.name, placeholder: i.placeholder})))"
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Cannot connect to Chrome at ..." | Run `open -a "Google Chrome" --args --remote-debugging-port=9222` |
| "Element not found" | Use `screenshot` to see the page, or `eval` to inspect DOM |
| Navigate timeout | App may not be running — check `npm start` on port 3000 |
| Blank screenshot | Page may need more time to render — use `wait` before screenshot |

## UX Testing Learnings DB

Before testing, search for known issues: `grep -i "your test flow" "$(alignment-harness records ux-testing-learnings)/log.jsonl"`
After testing, log findings: `alignment-harness record ux-testing-learnings --name log.jsonl --json '{"title":"...","lesson":"...","outcome":"win|loss|pattern|workaround|blocker"}'`
CLI: `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "query"`
Admin: `alignment-harness records ux-testing-learnings`
