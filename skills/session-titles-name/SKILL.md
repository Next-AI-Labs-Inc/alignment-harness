---
name: session-titles-name
description: Rename unnamed Claude Code sessions with intent-rich titles using batched haiku subagents. Dispatches as background orchestrator task.
trigger: When user asks to name/rename/title sessions, or when sessions lack descriptive names
---

# /session-titles-name — Batch Session Renaming

Renames unnamed Claude Code sessions with rich intent-capturing titles using cost-optimized haiku subagents. Runs as a background `/orchestrator` task via sonnet subagent.

## How It Works

1. **Scan** all session JSONL files for those missing a `custom-title` entry
2. **Extract** first 3 real user messages (skip `isMeta`, `<command>`, `<local-command>`, `<task-notification>` entries)
3. **Batch** sessions into groups of ~55 per haiku agent call
4. **Generate** titles via parallel haiku subagents
5. **Write** two JSONL entries per session: `custom-title` and `agent-name`

## Title Quality Requirements

Each title must answer ALL of these:
- What was this session about and what outcome did it aspire to create?
- What question did it seek to answer?
- What overarching initiative did it connect to?
- What specific UX intent or possibility was it exploring?
- What did it accomplish or try to?

Rules:
- NO repo names (your-repo-a, your-repo-b, your-repo-c) — noise
- NO fluff words unless they carry unique signal
- State the UNIQUE focus in terms of the OUTCOME it aspired to create
- Distinguish: researching vs planning vs building vs automating vs fixing vs exploring
- Be specific about WHAT, not generic categories
- Each title ends with `C{num}*L{num}` (complexity 1-100, leverage 1-100)

## Step 1: Find Unnamed Sessions

```python
import json, os, glob, re

sessions_dir = os.path.expanduser("~/.claude/projects/" + re.sub(r"[^a-zA-Z0-9]", "-", os.getcwd()) + "/")
files = sorted(glob.glob(sessions_dir + "*.jsonl"), key=os.path.getmtime, reverse=True)[:1000]

unnamed = []
for f in files:
    sid = os.path.basename(f).replace(".jsonl", "")
    has_title = False
    with open(f) as fh:
        for line in fh:
            d = json.loads(line)
            if d.get("type") == "custom-title":
                has_title = True
                break
    if not has_title:
        msgs = []
        with open(f) as fh:
            for line in fh:
                d = json.loads(line)
                if d.get("type") == "user" and not d.get("isMeta"):
                    content = d.get("message", {}).get("content", "")
                    if isinstance(content, str) and "<command" not in content and "<local-command" not in content and "<task-notification" not in content and len(content) > 15:
                        msgs.append(content[:200].replace("\n", " "))
                        if len(msgs) >= 3:
                            break
        preview = " | ".join(msgs)[:300]
        if preview.strip():
            unnamed.append((sid, preview))
```

## Step 2: Build Batch Prompts

Split unnamed sessions into batches of ~55. Each batch prompt contains:

```
You are a session title generator for the user's Claude Code sessions...
[title quality requirements from above]

Format: Each title ends with C{num}*L{num} (complexity 1-100, leverage 1-100)

Output ONLY lines like:
SID:full-session-id TITLE:Your descriptive title here C45*L82

Sessions:
SID:{session-id}
Messages: {preview}
---
```

Write each batch to `/tmp/session-batch-{i}.txt`.

## Step 3: Dispatch Parallel Haiku Agents

Launch one haiku Agent per batch file, all in parallel with `run_in_background: true`:

```
Agent(model: haiku, prompt: "Read /tmp/session-batch-{i}.txt and follow its instructions exactly. Output ONLY the SID:xxx TITLE:xxx lines.")
```

## Step 4: Parse Results and Write JSONL

After all agents complete, read their output files. Parse lines matching:

```
SID:([a-f0-9-]+)\s+TITLE:(.+?C\d+\*L\d+)
```

For each match, append two entries to the session's JSONL file:

```json
{"type": "custom-title", "customTitle": "...", "sessionId": "..."}
{"type": "agent-name", "agentName": "...", "sessionId": "..."}
```

**Important**: Remove any existing `custom-title` and `agent-name` entries first (rewrite the file without them, then append new ones).

## Cost

- ~$0.02 per batch of 55 sessions (haiku pricing)
- 414 sessions = 8 batches = ~$0.16 total
- ~$0.0004 per session rename

## Overwriting Existing Titles

To re-title sessions that already have names, modify Step 1 to skip the `has_title` check. The write step already handles removing old title entries.

## Empty Sessions

Sessions with no real user messages (only system/meta/command entries) are skipped — nothing to derive intent from.
