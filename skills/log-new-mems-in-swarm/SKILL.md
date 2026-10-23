---
name: log-new-mems-in-swarm
description: Quick-reference for logging new memories to the agent swarm. Use when wrapping up a task, capturing learnings, documenting
triggers:
  - "log memory"
  - "save memory"
  - "remember this"
  - "add to swarm"
---

# Log New Memories to Agent Swarm

## The Command

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/log-new-mems-in-swarm/scripts/save-memory.js" \
  --repo "REPO_NAME" \
  --type "TYPE" \
  --context "When TRIGGER_CONDITION" \
  --lesson "WHAT_YOU_LEARNED" \
  --tags "tag1,tag2,tag3" \
  --confidence N
```

## Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `--repo` | Repository or feature name | `<frontend-repo>`, `<api-repo>`, `auth-system` |
| `--type` | Memory category | `pattern`, `intent`, `success`, `error`, `learning` |
| `--context` | Trigger condition (starts with "When...") | `"When creating a new coaching session"` |
| `--lesson` | What was learned (3-5 sentences) | `"Always navigate to /dashboard/{id}/session..."` |
| `--tags` | Comma-separated keywords | `"routing,session,navigation"` |
| `--confidence` | 1-10 scale | `10` (verified), `8` (high), `5` (moderate) |

## Memory Types

| Type | When to Use |
|------|-------------|
| `pattern` | Recurring code/architecture pattern |
| `intent` | Why something was built a certain way |
| `success` | Something that worked well |
| `error` | Mistake to avoid / gotcha |
| `learning` | General insight or discovery |
| `kpi` | Metrics or measurement approach |

## Confidence Scale

| Score | Meaning |
|-------|---------|
| 10 | Verified via testing |
| 8-9 | Verified via code inspection |
| 6-7 | High confidence |
| 1-5 | Needs validation |

## Examples

### Pattern Memory
```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/log-new-mems-in-swarm/scripts/save-memory.js" \
  --repo "<frontend-repo>" \
  --type "pattern" \
  --context "When creating a new coaching session programmatically" \
  --lesson "Always navigate to /dashboard/{conversationId}/session (not just /dashboard) to load the specific conversation and prevent duplicate session creation on mount." \
  --tags "routing,navigation,session,conversation" \
  --confidence 10
```

### Intent Memory
```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/log-new-mems-in-swarm/scripts/save-memory.js" \
  --repo "<frontend-repo>" \
  --type "intent" \
  --context "When deciding how to gate premium features" \
  --lesson "Premium features show full marketing content with button always visible. Gate happens ON CLICK via usePremiumGate hook, not on render. Never hide the feature - show it, let them click, then gate." \
  --tags "premium,ux,feature-gate,intent" \
  --confidence 10
```

### Error/Gotcha Memory
```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/log-new-mems-in-swarm/scripts/save-memory.js" \
  --repo "<api-repo>" \
  --type "error" \
  --context "When using user.trial array for subscription checks" \
  --lesson "NEVER use ambiguous 'trial' - legacy_trial (user.trial[] array, no card) is different from cc_trial (Stripe trialing status, card on file). Use isUserOnTrial() for legacy, subscriptionStatus === 'trialing' for cc_trial." \
  --tags "trial,subscription,disambiguation,critical" \
  --confidence 10
```

## What to Capture

After completing work, save memories for:

1. **Intent confirmed** - What UX you built and why
2. **Patterns discovered** - Unique to this codebase
3. **Gotchas resolved** - Things you got stuck on then figured out
4. **Architecture decisions** - Why code is structured a certain way
5. **Integration points** - How systems connect

## One Memory = One Thing

Keep memories atomic. If you learned 3 things, create 3 separate memories.

## Storage Location

Memories are saved to:
```
$(alignment-harness records memory)/{REPO_NAME}.jsonl
```

## Before Adding

Search first to avoid duplicates:
```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/log-new-mems-in-swarm/scripts/search-memory.js" "your topic"
```
