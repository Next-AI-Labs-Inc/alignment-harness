---
name: ux-testing-learnings
description: Search and log UX testing learnings — agent swarm institutional memory for autonomous testing
triggers:
  - "ux testing"
  - "agent testing learnings"
  - "what worked in testing"
  - "testing patterns"
  - "autonomous testing memory"
  - "testing wins losses"
  - "before testing a flow"
---

# UX Testing Learnings — Agent Swarm Institutional Memory

## When to Use

- **Before testing any UX flow** — search for prior learnings to avoid repeating known failures
- **After discovering anything during testing** — log it so future agents benefit
- **When debugging a test failure** — check if another agent already found the root cause

## MCP Tools (when agent-find MCP is attached)

### Search: `agent_find`
```
agent_find({ query: "login cookie expired", limit: 10, sources: ["record"] })
```

### Log: `alignment-harness store add ux-testing-learnings`
```
alignment-harness store add ux-testing-learnings --json '{
  "title": "Login flow fails when cookie expired",
  "lesson": "Must clear cookie before retry, not just refresh token",
  "outcome": "loss",
  "severity": "high",
  "testFlow": "login",
  "tags": ["login", "cookie", "auth"]
}'
# outcome:  win | loss | pattern | workaround | blocker
# severity: critical | high | medium | low
```

## CLI Fallback (when MCP transport is dead)

```bash
node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" "login cookie" --limit 10 --sources record
alignment-harness store list ux-testing-learnings --where testFlow=checkout,outcome=blocker
node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" "auth login session" --sources record
```

## Local Records (for direct access)

```bash
# Search
node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" "login auth" --limit 10 --sources record

# Create
alignment-harness store add ux-testing-learnings \
  --json '{"title":"...","lesson":"...","outcome":"loss","tags":["auth"]}'

# List all
alignment-harness store list ux-testing-learnings
```

## Admin UI

Human review at the records folder (`alignment-harness records ux-testing-learnings` prints its path)

## Outcome Types

| Outcome | Emoji | When to use |
|---------|-------|-------------|
| `win` | ✅ | Confirmed a flow works correctly |
| `loss` | ❌ | Found a bug or regression |
| `pattern` | 🔄 | Recurring observation (not a bug, not a win) |
| `workaround` | 🔧 | Found a way around a limitation |
| `blocker` | 🚫 | Cannot proceed — needs human or code fix |

## Agent Workflow

1. **Before testing**: `agent_find("the flow you're about to test")`
2. **Read learnings**: Apply known workarounds, skip known blockers
3. **Test the flow**: Navigate, interact, verify
4. **Log what you find**: `alignment-harness store add ux-testing-learnings --json '{ ... }'`
5. **Tag consistently**: Use flow names (login, checkout, onboarding) and component names (AuthContext, PricingTable) as tags
