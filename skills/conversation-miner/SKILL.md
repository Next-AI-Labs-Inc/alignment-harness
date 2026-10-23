---
name: conversation-miner
description: "Scan past sessions for unlogged patterns and missing skills. Use during monthly audits or when repeated questions recur."
triggers:
  - "mine conversations"
  - "extract insights"
  - "conversation analysis"
  - "session mining"
---

# Conversation Miner - Extract Unlogged Skills from Past Sessions

<command-name>mine-conversations</command-name>

Scan past Claude Code conversations to discover critical patterns, workflows, and knowledge that were never formally logged as skills or memories.

## When to Use

- Periodic knowledge base audit (monthly)
- After noticing repeated questions across sessions
- When asked "what patterns are we missing?"
- Before major refactoring to capture tribal knowledge

---

## Quick Start

```bash
# Mine recent conversations
/conversation-miner --days 30

# Mine specific topic
/conversation-miner --topic "authentication"

# Full audit
/conversation-miner --full
```

---

## What It Mines

| Pattern | Signal | Action |
|---------|--------|--------|
| Repeated questions | Same question asked 3+ times | Create FAQ or skill |
| Multi-step workflows | Sequential tool calls with explanation | Create workflow skill |
| Hard-won solutions | Long debugging → resolution | Create memory + skill |
| "Always do X before Y" | Causal patterns | Create checklist skill |
| Admin clarifications | "Actually, what I meant was..." | Create intent entry |

---

## Mining Algorithm

### Step 1: Locate Conversation Logs

```bash
# Claude Code conversation history locations
CLAUDE_LOGS=(
  "$HOME/.claude/conversations"
  "$HOME/.claude/projects/*/conversations"
  "$HOME/Library/Application Support/Claude Code/conversations"
)

# Find recent conversation files
find "${CLAUDE_LOGS[@]}" -name "*.json" -mtime -30 2>/dev/null
```

### Step 2: Extract Skill Candidates

```javascript
// Pattern detection heuristics
const SKILL_SIGNALS = {
  // Repeated questions (high value)
  repeatedQuestion: {
    pattern: /\?(.*)\n.*\1/gi,
    weight: 3,
    action: 'Create FAQ skill'
  },

  // Multi-step explanations
  workflow: {
    pattern: /first.*then.*finally|step 1.*step 2/gi,
    weight: 2,
    action: 'Create workflow skill'
  },

  // "The trick is..." / "The key insight..."
  insight: {
    pattern: /the (trick|key|insight|secret) is/gi,
    weight: 2.5,
    action: 'Create memory'
  },

  // Admin corrections
  clarification: {
    pattern: /actually.*meant|no,? what I (want|need)/gi,
    weight: 3,
    action: 'Create intent entry'
  },

  // Debugging sessions
  debugging: {
    pattern: /finally (found|fixed|solved)|the (issue|problem|bug) was/gi,
    weight: 2,
    action: 'Create error memory'
  }
};
```

### Step 3: Score and Rank

```
SKILL_SCORE = (frequency × recency × complexity) / existing_coverage

Where:
  frequency = times pattern appeared
  recency = decay factor (recent = higher)
  complexity = token count of explanation
  existing_coverage = 0 if new, 0.5 if partial, 1 if fully covered
```

---

## Output Format

```
🔍 Conversation Mining Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Period: Last 30 days | Conversations: 47 | Tokens analyzed: 2.3M

📊 TOP UNLOGGED PATTERNS

1. [Score: 8.5] "How to test premium features as different user types"
   Frequency: 7 occurrences
   Pattern: Multi-step workflow
   Existing coverage: Partial (user-simulator exists, but workflow undocumented)

   Proposed: Create skill "testing-as-user-types"
   Key steps extracted:
   - Navigate to /admin2/user-simulator
   - Select subscription tier
   - Enable "Simulate as User" toggle
   - Test feature in new tab

2. [Score: 7.2] "Why does the session expire when..."
   Frequency: 5 occurrences
   Pattern: Repeated question → explanation
   Existing coverage: None

   Proposed: Create intent "session-expiry-triggers"
   + Create memory with causes

3. [Score: 6.8] Admin clarification pattern
   "Actually, for trial users we want them to see the feature but not use it"
   Frequency: 4 occurrences (premium gate discussions)
   Existing coverage: Partial (intent exists, not detailed enough)

   Proposed: Update intent "premium-feature-gate" with specific UX rules

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIONS RECOMMENDED:
  - 3 new skills to create
  - 2 memories to log
  - 1 intent to update

Run /conversation-miner --apply to generate drafts
```

---

## Manual Mining Workflow

When automated mining isn't available:

### 1. Review Recent Sessions

```bash
# List recent Claude Code sessions
ls -lt ~/.claude/conversations/ | head -20

# Search for pattern keywords
grep -r "always.*before\|the trick is\|actually.*meant" ~/.claude/conversations/
```

### 2. Identify Skill Gaps

Questions to ask while reviewing:
- Did I explain the same thing multiple times?
- Did I have to debug something that should be documented?
- Did the admin correct my understanding?
- Did I discover something non-obvious?

### 3. Create Knowledge Artifacts

For each gap found:

```bash
# If it's a workflow → Create skill
/skill create {name}

# If it's a learned pattern → Create memory
node "${CLAUDE_PLUGIN_ROOT}/skills/log-new-mems-in-swarm/scripts/save-memory.js" \
  --repo "{repo}" \
  --type "pattern" \
  --context "When {trigger}..." \
  --lesson "{what I learned}..." \
  --confidence 9 \
  --tags "{tags}"

# If it's about intended UX → Create intent
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" propose '{...}'
```

---

## Integration Points

### Feed to Swarm Memory

```bash
# Log mined insight as memory
node "${CLAUDE_PLUGIN_ROOT}/skills/log-new-mems-in-swarm/scripts/save-memory.js" \
  --repo "conversation-mining" \
  --type "pattern" \
  --context "From conversation mining: When agents need to test premium features..." \
  --lesson "The canonical workflow is: 1) Open /admin2/user-simulator, 2) Select tier, 3) Enable simulate mode, 4) Test in new tab. This ensures consistent test conditions." \
  --confidence 8 \
  --tags "testing,premium,workflow,mined" \
  --source "conversation-mining-2026-02"
```

### Feed to Intent DB

```bash
# Log mined intent
node "${CLAUDE_PLUGIN_ROOT}/skills/intent-db/intent.js" propose '{
  "slug": "session-expiry.mined-triggers",
  "title": "Session Expiry Triggers (Mined)",
  "primaryIntent": "When a user session expires, we want them to see a clear message and easy path to re-login...",
  "tags": ["session", "auth", "mined"],
  "certaintyScore": 35,
  "sourceReferences": [{
    "type": "conversation-mining",
    "period": "2026-01 to 2026-02",
    "occurrences": 5
  }]
}'
```

---

## Automation

### Weekly Mining Cron

```bash
# Run every Monday at 9am
0 9 * * 1 ~/.claude/skills/conversation-miner/mine.sh --days 7 >> /tmp/conversation-mining.log
```

### Session End Hook

```bash
# .claude/hooks/on-session-end.sh
#!/bin/bash
# Quick scan for high-value patterns in just-ended session
SESSION_FILE="${@:1:1}"
if grep -q "the trick is\|actually.*meant\|finally fixed" "$SESSION_FILE"; then
  echo "💡 This session may contain unlogged knowledge. Run /conversation-miner"
fi
```

---

## Privacy & Security

- Only mines local conversation logs
- Never sends conversation content externally
- Extracts patterns, not raw conversation text
- Respects .gitignore for any logged artifacts
