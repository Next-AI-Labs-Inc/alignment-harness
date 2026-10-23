---
name: compact-from-transcript
description: "Create a full-quality session compaction from an uncompacted Claude Code session transcript. Uses signal extraction to strip noise, then invokes /reflect + /align + alignment-harness compaction put. For sessions that have never been compacted."
triggers:
  - "compact session"
  - "compact transcript"
  - "create compaction from session"
  - "/compact-from-transcript"
---

# Compact From Transcript — Signal-First Session Compaction

> "compaction is about extracting the signal not the summary" — the user, 2026-04-09
> "Have agents mine the JSONL in chunks if you have to, but they must consume the raw source, not a sanitized rewrite" — Jonathan Check v2 oracle

Creates a FULL-QUALITY session compaction from a raw Claude Code transcript. The pipeline:

1. **Signal extraction** — programmatically strip noise (tool calls, system prompts, metadata) preserving the user's verbatim words + agent responses + structured outputs
2. **Read the signal file** — the agent consumes the user's actual words, not a digest
3. **INVOKE /reflect** — extract what matters from the session
4. **INVOKE /align** — derive nested intent layers
5. **Write to the harness compaction records** via `alignment-harness compaction put` with all structured fields

## Step 0: Extract signal from transcript

Run the extraction script BEFORE dispatching the agent:

```bash
cd <api-repo>
node scripts/extract-session-signal.js SESSION_UUID --out /tmp/signal-SESSION_SHORT.txt
```

This produces a signal file containing:
- Every human message (verbatim, never truncated)
- Agent response before and after each human message (truncated to 500 chars)
- Any structured agent outputs: /reflect results, /align intent maps, audit findings, compaction drafts, hallucination diagnostics
- Session metadata: message count, human turn count

**The signal file IS the raw source** — it's the user's actual words with JSONL metadata stripped. It's not a summary, not a digest, not an interpretation.

## Step 1: Read the signal file

The agent reads the signal file (typically 3-75KB vs 50KB-5MB raw JSONL). This preserves the user's verbatim words while fitting within the subagent's token budget.

## Step 2: INVOKE /reflect

Invoke the /reflect skill on the session content. Produce:
- **Target**: What was the user trying to accomplish?
- **Location**: Where did the session end up?
- **Gap**: What remains between intent and reality?
- **Initiative**: What overarching goal does this serve?
- **Leverage**: What hasn't been considered?

## Step 3: INVOKE /align

Invoke the /align skill to derive nested intent layers with certainty scores.

## Step 4: Write to the harness compaction records

Write via `alignment-harness compaction put`, from a script at `/tmp/tmp-compact-SESSION.js`:

```javascript
const fs = require('fs');
const record = {
    sessionId: 'SESSION_UUID',
    title: 'TITLE',
    subtitle: 'SUBTITLE',
    compactedSession: 'SIGNAL EXTRACTION (2000-5000 chars)',
    overarchingIntentTitle: 'FROM /ALIGN',
    overarchingIntentDescription: 'FROM /ALIGN',
    targetUxIntentTitle: 'FROM /ALIGN',
    targetUxIntentDescription: 'FROM /ALIGN',
    leverageScore: N,
    reflectionOnScope: 'FULL /REFLECT + /ALIGN MARKDOWN',
    agentReasoning: { /* from /reflect */ },
    scopeDeclaration: { /* from /align */ },
    tags: ['tag1', 'tag2'],
    creatorSessionId: 'SESSION_UUID',
    enrichmentHistory: [{
      enrichedBy: 'compact-from-transcript',
      enrichedAt: new Date(),
      enrichedFields: ['all'],
      confidenceLevel: 'high',
      modelUsed: 'claude-opus-4-6'
    }]
};
fs.writeFileSync('/tmp/compact-SESSION.json', JSON.stringify(record, null, 2));
```

Run `node /tmp/tmp-compact-SESSION.js`, then `alignment-harness compaction put --session SESSION_UUID --file /tmp/compact-SESSION.json`. Verify with `alignment-harness compaction get --session SESSION_UUID`. Clean up temp file.

## Batch Mode

The orchestrator (Opus) pre-extracts signal for multiple sessions:

```bash
# Extract signal for 20 sessions at once
for uuid in SESSION1 SESSION2 ...; do
  node scripts/extract-session-signal.js $uuid --out /tmp/signal-${uuid:0:8}.txt
done
```

Then dispatches agents with the signal file content pre-loaded in the prompt. Each agent gets:
- The signal file content (3-75KB of the user's verbatim words)
- Instructions to invoke /reflect + /align + `alignment-harness compaction put`
- The `alignment-harness compaction put` script template

## Quality Requirements

- `compactedSession` must be SIGNAL EXTRACTION not summary — what the user was trying to accomplish, what got done, what's still open, what the UX impact is
- Every human message referenced must be the user's actual words
- UX-first writing: every object leads with who is affected, what they experience, what changes
- reflectionOnScope must contain the full /reflect + /align markdown analysis
