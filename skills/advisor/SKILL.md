---
name: advisor
description: "Brief on open, recent, or historical sessions in natural language. Use when asking what's up or what's incomplete."
triggers:
  - "/advisor"
  - "what are my terminals working on"
  - "status across my claude sessions"
  - "what's each terminal doing"
  - "show me my active claude conversations"
  - "what did my last sessions cover"
  - "which terminal sessions are incomplete"
  - "review my recent claude sessions"
  - "what work is in progress across terminals"
  - "summary of my open claude tabs"
  - "what are all my claude windows doing"
  - "which of my sessions matter"
  - "what's incomplete across my terminals"
  - "brief me across my claude work"
  - "what's happening in my other terminals"
---

# /advisor

Situational briefing across all open Claude sessions.
Self-contained orchestration: data collection → Haiku, synthesis → caller (Sonnet), judgment → caller.

---

## Intelligence Routing (MANDATORY — wired in, not optional)

```
LOW_COST_RESEARCH_AGENTS = claude-haiku-4-5-20251001

Step                          Model                   Dispatch
─────────────────────────────────────────────────────────────────
Filesystem scan               None (pure Python)      Inline
API field fetch               None (curl)             Inline
Keyword → status/score        None (rule table)       Inline
Ambiguous UX reward           LOW_COST_RESEARCH_AGENTS  Background agent
Deep session read (10 msgs)   LOW_COST_RESEARCH_AGENTS  Background agent
Cross-session prioritization  Caller (Sonnet)         Inline synthesis
Full session explanation      Caller (Sonnet)         Inline synthesis
```

The caller (whoever invoked `/advisor`) NEVER does data collection work.
The caller synthesizes output from structured data returned by Haiku agents.

---

## Invocation Modes

| Command | What it scans | Description |
|---|---|---|
| `/advisor` | Last 20 by date | Lean briefing — excludes sessions with compaction status "done" |
| `/advisor today` | Last 24h | All sessions from today including ended ones |
| `/advisor last {N}` | Last N sessions by date | Any number — `/advisor last 10`, `/advisor last 50` |
| `/advisor {YYYY-MM-DD}` | That calendar day | All sessions that were active on a specific date |
| `/advisor deep {uuid8}` | One session (any age) | Full context — last 10 msgs, intent, synthesis |
| `/advisor next` | Last 2h | Which session to continue — one answer |

**Argument parsing (caller resolves before dispatch):**

`parse_advisor_args(args)` — returns `{'mode', 'hours', 'limit', 'date', 'uuid_frag'}` from CLI args string.

**Function reference**: See `${CLAUDE_PLUGIN_ROOT}/skills/advisor/utils.py`

---

## DEFAULT MODE — Lean Briefing

### Orchestrator Step 1: Dispatch Haiku data collector (background)

The caller dispatches ONE Haiku agent with `run_in_background: true`.

**CRITICAL: The Haiku agent MUST use the Bash tool to execute this script. It must NOT reason about what the script would return. If the Haiku infers results without running Bash, the output is a hallucination. The script MUST actually execute.**

**Haiku agent prompt:**

```
You are a data collection agent. You MUST use the Bash tool to run the Python script below. DO NOT guess, infer, or reason about what it would return. EXECUTE IT. Return the raw JSON output only.

python3 << 'PYEOF'
import json, os, glob, time, subprocess, sys

# Accept args: --limit N (default 20) or --hours N
scan_limit = 20
scan_hours = None
args = sys.argv[1:]
i = 0
while i < len(args):
    if args[i] == '--limit' and i+1 < len(args):
        scan_limit = int(args[i+1]); scan_hours = None; i += 2
    elif args[i] == '--hours' and i+1 < len(args):
        scan_hours = float(args[i+1]); scan_limit = None; i += 2
    else:
        i += 1

def scan():
    projects_root = os.path.expanduser('~/.claude/projects')
    now = time.time()
    cutoff = now - (scan_hours * 3600) if scan_hours else 0
    sessions = []
    for jsonl in glob.glob(f'{projects_root}/*/*.jsonl'):
        if not os.path.basename(jsonl)[0].isalnum():
            continue
        mtime = os.path.getmtime(jsonl)
        if scan_hours and mtime < cutoff:
            continue
        uuid = os.path.basename(jsonl).replace('.jsonl', '')
        slug = jsonl.split('/')[-2]
        msgs = []
        try:
            with open(jsonl) as f:
                for line in f:
                    d = json.loads(line)
                    c = d.get('message', {}).get('content', '')
                    if (d.get('type') == 'user' and not d.get('isSidechain')
                            and isinstance(c, str) and len(c) > 3
                            and not c.startswith('<task')
                            and not c.startswith('<system')
                            and not c.startswith('<local-command')
                            and not c.startswith('<command')):
                        msgs.append(c)
        except:
            pass
        if not msgs:
            continue

        # Check for tasks in /tmp (where Claude actually stores them)
        has_tasks = False
        has_subagents = False
        for tmp_base in glob.glob('/tmp/claude-*'):
            task_dir = os.path.join(tmp_base, slug, uuid, 'tasks')
            if os.path.isdir(task_dir) and os.listdir(task_dir):
                has_tasks = True
            sub_dir = os.path.join(tmp_base, slug, uuid, 'subagents')
            if os.path.isdir(sub_dir):
                has_subagents = True
        # Also check ~/.claude/projects session dir
        session_dir = os.path.join(os.path.dirname(jsonl), uuid)
        if os.path.isdir(session_dir):
            if os.path.isdir(os.path.join(session_dir, 'subagents')):
                has_subagents = True

        # Fetch intent + compaction status — targeted fields only
        # NEVER claim "no compaction" when the API fails. Distinguish:
        #   "found" = API returned compaction data
        #   "api_error" = API unreachable or returned error
        #   "none" = API returned 200 but no matching compaction
        intent = msgs[0][:120]
        compaction_status = 'api_error'  # default pessimistic — assume we can't reach it
        compaction_done = False
        try:
            r = subprocess.run([
                'alignment-harness', 'compaction', 'get', '--session', uuid
            ], capture_output=True, text=True, timeout=3)
            if r.returncode == 0 and r.stdout.strip().startswith('no compaction'):
                compaction_status = 'none'
            elif r.returncode == 0 and r.stdout.strip():
                comp = json.loads(r.stdout)
                if comp.get('sessionId') or comp.get('title'):
                    compaction_status = 'found'
                    intent = (comp.get('scopeDeclaration', {}) or {}).get('intent') \
                          or comp.get('title') \
                          or intent
                    # Check if compaction marks session as done
                    cs = (comp.get('status') or '').lower()
                    if cs in ('done', 'completed', 'resolved'):
                        compaction_done = True
                elif (comp.get('success') == False
                        and 'not found' in (comp.get('error') or '').lower()):
                    compaction_status = 'none'  # API up, compaction just doesn't exist yet
                elif comp.get('error') or comp.get('success') == False:
                    compaction_status = 'api_error'  # Real server error
                else:
                    compaction_status = 'none'
        except:
            compaction_status = 'api_error'

        sessions.append({
            'uuid': uuid,
            'slug': slug,
            'age_min': int((now - mtime) / 60),
            'message_count': len(msgs),
            'intent': str(intent)[:120],
            'last_msg': msgs[-1][:100],
            'compaction_status': compaction_status,
            'compaction_done': compaction_done,
            'has_tasks': has_tasks,
            'has_subagents': has_subagents,
        })

    # Filter out compaction-done sessions by default
    sessions = [s for s in sessions if not s['compaction_done']]

    # Sort by most recent first, apply limit
    sessions.sort(key=lambda x: x['age_min'])
    if scan_limit:
        sessions = sessions[:scan_limit]

    # Scan for plans across ALL known locations
    plan_dirs = [
        os.path.expanduser('~/.claude/plans'),
        os.path.join(os.getcwd(), '.claude', 'plans'),
    ]
    # Also scan docs/**/plans/ and */docs/superpowers/plans/ in the repo
    cwd = os.getcwd()
    for pattern in ['docs/plans', 'docs/superpowers/plans']:
        d = os.path.join(cwd, pattern)
        if os.path.isdir(d):
            plan_dirs.append(d)
    # Scan submodule docs too
    for sub in os.listdir(cwd):
        for pattern in ['docs/plans', 'docs/superpowers/plans']:
            d = os.path.join(cwd, sub, pattern)
            if os.path.isdir(d):
                plan_dirs.append(d)

    plans = []
    seen_plans = set()
    for plans_dir in plan_dirs:
        if not os.path.isdir(plans_dir):
            continue
        for pf in os.listdir(plans_dir):
            if pf.endswith('.md') and pf not in seen_plans:
                seen_plans.add(pf)
                fp = os.path.join(plans_dir, pf)
                age_min = int((now - os.path.getmtime(fp)) / 60)
                # Read first non-header line as summary
                summary = ''
                try:
                    with open(fp) as pfile:
                        for pline in pfile:
                            pline = pline.strip()
                            if pline and not pline.startswith('#') and not pline.startswith('---') and not pline.startswith('**Date'):
                                summary = pline[:100]
                                break
                except: pass
                plans.append({
                    'name': pf.replace('.md', ''),
                    'age_min': age_min,
                    'path': fp,
                    'summary': summary,
                })
    plans.sort(key=lambda x: x['age_min'])

    print(json.dumps({'sessions': sessions, 'plans': plans[:10]}))

scan()
PYEOF

Return ONLY the JSON array. Nothing else.

The caller passes args to the script based on parsed mode:
- Default `/advisor`: `python3 script.py --limit 20`
- `/advisor today`: `python3 script.py --hours 24`
- `/advisor last 30`: `python3 script.py --limit 30`
- `/advisor 2026-04-01`: `python3 script.py --hours {computed_hours_to_that_date}`
```

**Expected output shape:**
```json
[
  {
    "uuid": "c06eab6d-...",
    "slug": "-Users-you-react-projects-ix",
    "age_min": 0,
    "message_count": 7,
    "intent": "Build a function to read open Warp terminal contents",
    "last_msg": "so got it. create the function..."
  }
]
```

---

### Orchestrator Step 2: Apply rule functions to Haiku output (caller, no AI)

- `assess_status(last_msg)` — classifies session status from last user message: `DONE | WAITING | BLOCKED | IN_PROGRESS | UNCLEAR`
- `score_criticality(slug, intent, has_tasks, has_plans_nearby)` — returns 1–100 criticality score
- `ux_reward_fast(intent, slug)` — returns 1-sentence UX reward, or `None` to escalate to Haiku

**Function reference**: See `${CLAUDE_PLUGIN_ROOT}/skills/advisor/utils.py`

For any session where `ux_reward_fast` returns `None`, dispatch a **second Haiku agent** (background):

```
HAIKU PROMPT:
Session intent: "{intent}"
One sentence (max 15 words): what can a real user do after this work completes that they cannot do today?
Return ONLY the sentence. No preamble. No punctuation at end.
```

---

### `score_complexity(transcript_path)` — NEW

**Intelligence**: None — pure Python transcript analysis  
**Tokens**: ~0 (reads JSONL directly, no AI)  
**Returns**: `{score: int, signals: dict, violations: list}`

Scans the session transcript JSONL for structural signals. Average session = 100. Highly complex = 500-1000.

**Implementation**: See `${CLAUDE_PLUGIN_ROOT}/skills/advisor/utils.py` → `score_complexity()`

---

### `detect_user_facing_impact(transcript_path)` — NEW

**Intelligence**: None — pattern matching on tool calls and file paths  
**Tokens**: 0  
**Returns**: `{has_impact: bool, impact_score: int, evidence: list}`

Checks whether the session touched files or endpoints that real users see.

**Implementation**: See `${CLAUDE_PLUGIN_ROOT}/skills/advisor/utils.py` → `detect_user_facing_impact()`

---

### `detect_browser_testing(transcript_path)` — NEW

**Intelligence**: None — pattern matching on tool calls  
**Tokens**: 0  
**Returns**: `{tested: bool, evidence: list, test_types: list}`

Checks whether the session includes evidence of browser-based UX verification.

**Implementation**: See `${CLAUDE_PLUGIN_ROOT}/skills/advisor/utils.py` → `detect_browser_testing()`

**Future marker for agents to leave**: When an agent tests something in the browser, it should print `UX_BROWSER_TESTED: {what was checked}` in the transcript. This marker is picked up by `detect_browser_testing()`.

---

### `predict_next_actions(complexity, violations, ux_impact, browser_tested, status)` — NEW

**Intelligence**: None — rule table mapping violations to actions  
**Tokens**: 0  
**Returns**: `list[str]` — ordered list of specific next actions

This function does NOT guess. It maps detected violations and missing signals to the specific remediation action defined by CLAUDE.md protocol. Each action is something an agent can execute or the user can approve/dismiss.

**Implementation**: See `${CLAUDE_PLUGIN_ROOT}/skills/advisor/utils.py` → `predict_next_actions()`

---

### `post_recommendations(session_uuid, actions)` — NEW

**Intelligence**: Haiku — dispatched as background agent  
**Tokens**: ~200 in, ~50 out  
**Side effect**: writes to compaction records

When violations or recommended actions are detected, this function posts them to the compaction records as `incompleteItems` so that:
1. The next agent to resume this session sees them as requirements
2. The user can see them in the compaction record and approve/dismiss each one

**The caller does NOT call this automatically.** The caller prints the recommendations and asks:

```
Recommendations for session {uuid8}:
  1. {action}
  2. {action}

Post these as requirements to the session compaction? [y/n/edit]
```

The user approves, dismisses individual items, or edits. Only approved items get posted.

**Post format** (Haiku agent executes this):

```bash
alignment-harness record compactions --name "session-{session_uuid}.json" <<'EOF'
{
    "conversationId": "{session_uuid}",
    "userId": "advisor-system",
    "title": "[Advisor] {intent[:50]}",
    "compactedSession": "{intent}. Advisor detected protocol violations.",
    "status": "actionable",
    "tags": ["advisor", "auto-detected", "pending-review"],
    "incompleteItems": [
      {
        "title": "{action_1}",
        "content": "Detected: {violation}. Source: advisor-violation-detection",
        "status": "pending",
        "priority": 50
      }
    ]
  }
EOF
```

**Field rules** (validated against actual MongoDB schema):
- `status` enum: `pending | approved | completed | dismissed`
- `priority`: integer 1–100 (NOT a string like "medium")
- `userId`: required — always `"advisor-system"` for programmatic posts
- `conversationId`: the session UUID — must be unique per compaction

**Dismissal**: When the user marks an item as dismissed in the compaction record, it should be set to `status: "dismissed"` not deleted. This prevents the advisor from re-recommending the same thing next invocation.

---

### Orchestrator Step 3: Caller prints structured output

Wait for all background agents. Then print:

```
ADVISOR — {N} sessions | {P} plans

[{i}/{N}]  {age_min}min  ·  {status}  ·  crit:{criticality}/100  ·  complexity:{complexity_score}
{intent}
→ {ux_reward}
  impact: {impact_evidence} | browser_tested: {yes/no}
  violations: {violations or "none"}
  next: {first_recommended_action}

```

If any session has recommendations, print after the list:

```
RECOMMENDATIONS (post to compaction?):
  Session {uuid8}: {action_1}
  Session {uuid8}: {action_2}
  ...
Post these as requirements? Reply with session UUIDs to approve, or "none" to skip.
```

No additional commentary. No interpretation. The numbers and sentences are the output.

---

## DEEP MODE — `/advisor deep {uuid8}`

### Step 1: Dispatch Haiku to read last 10 messages (background)

```
HAIKU PROMPT:
Read this file: ~/.claude/projects/**/{uuid}.jsonl
Extract the last 10 user messages (type=user, isSidechain=false, content not starting with <task or <system).
Return as JSON array of strings. No interpretation. No truncation beyond 300 chars per message.
```

### Step 2: Caller synthesizes (Sonnet)

With the 10 messages from Haiku, the caller answers:
1. What is actually being built — with full context on who it's for, what changes from today, and what the resulting UX looks like
2. What is blocking it, if anything — specific blocker with evidence, or "nothing blocking"
3. What the next concrete action is — specific enough that an agent could execute it without further clarification
4. Does this need the user's input, or can an agent continue autonomously? (`NEEDS_HUMAN | CAN_CONTINUE`)

Print as plain blocks. No tables.

---

## NEXT MODE — `/advisor next`

### Step 1: Run lean data collection (same Haiku agent as default)

### Step 2: Caller ranks without AI

```python
# Filter DONE sessions
candidates = [s for s in sessions if s['status'] != 'DONE']

# Score: criticality + status weight
status_weight = {'BLOCKED': 30, 'IN_PROGRESS': 20, 'WAITING': 10, 'UNCLEAR': 5}
ranked = sorted(candidates,
    key=lambda s: s['criticality'] + status_weight.get(s['status'], 0),
    reverse=True)

top = ranked[0]
```

### Step 3: Caller prints one answer

```
Continue: [{uuid8}] {intent}
Reason: {criticality}/100 criticality, status {status}
```

No explanation beyond this. One answer.

---

## Token Budget

| Mode | Haiku agents | Haiku tokens | Sonnet tokens |
|---|---|---|---|
| Lean (10 sessions) | 1 + 0–3 reward agents | ~400 total | ~200 (print only) |
| Deep (1 session) | 1 | ~600 | ~400 (synthesis) |
| Next | 1 | ~400 | ~100 (rank + print) |

---

## Governer Routing Note

`/advisor` scores 15/100 on governer (internal tooling, no user state touched).
Per CLAUDE.md: score < 20 → skip governer pipeline, just execute.
This skill IS the pipeline for this task class. Do not run `/governer` before `/advisor`.

---

## Rules

- `LOW_COST_RESEARCH_AGENTS = claude-haiku-4-5-20251001` — hardcoded, never override
- All data collection steps dispatch background Haiku agents — caller never reads files or hits APIs directly
- Compaction API: always use `?fields=scopeDeclaration.intent,title` — never fetch the full document
- Scores are always integers 1–100 — never convert to labels
- Status is always one of five tokens: `DONE | IN_PROGRESS | BLOCKED | WAITING | UNCLEAR`
- UX reward: keyword table first, Haiku only on fallback — never ask Sonnet for a sentence Haiku can produce
- Caller (Sonnet) touches data only in deep synthesis steps — never in collection or scoring
- NEVER dispatch work that overlaps with what another terminal/session is already doing — advisor surfaces what exists, it does not duplicate active work
- When recommending actions, check if a session is already handling that task before suggesting dispatch

## Leverage Assessment — Anti-Hallucination Rules (CRITICAL)

**Missing compaction ≠ incomplete work.** Agents don't have a workflow that updates compactions on completion. Most sessions complete their work and close without filing. NEVER claim work is "incomplete" or "at risk" based solely on the absence of a compaction. The absence means nothing — you have to look at actual evidence.

**Not checked off ≠ not done.** Compaction items, task lists, and tracked items that aren't marked complete are usually just items that were never updated — not items that are actually unfinished. The default state of most items is "not checked off" regardless of whether the work was done. NEVER use labels like "unfinished," "incomplete," or "remaining" for items whose actual status you haven't verified. Use neutral terms like "tracked items" that describe what they ARE (items being tracked) not what you're GUESSING about their state.

**To determine if work is actually incomplete, use these signals (in order):**
1. The user explicitly said it's not done in a subsequent message or session
2. The last transcript message was a directive with no visible follow-up action
3. Recent git commits show no code changes related to the session's intent
4. The user is currently asking about or blocked on the same topic

**To determine what's highest leverage, use these signals (in order):**
1. What would move the product forward for real users RIGHT NOW?
2. What is the user currently blocked on or actively asking about?
3. What infrastructure problem is actively degrading every session? (e.g. token burn)
4. What recent git commits show was shipped vs only discussed?
5. Do NOT rank infrastructure above product work unless the user explicitly prioritizes it

**Default assumption:** If a session is older than 2 hours with no compaction, the work is PROBABLY done or abandoned — not "incomplete and urgent." State this assumption explicitly rather than asserting incompleteness as fact.

**When you don't have data, say so.** "I don't know if this is complete — no compaction was filed and I haven't checked the code" is correct. "This work is incomplete" without evidence is a hallucination that compounds when other agents build on your assessment.
- ALWAYS end every advisor output and every completion reply to the human with the next 6 highest-priority initiatives. For each one, write a short paragraph covering: what unrealized potential exists today, what specific action would unlock it, and what the user or customer would experience differently afterward. Rank by leverage. No jargon. Validate assumptions — don't state things as fact that you haven't verified (e.g. don't claim "context is permanently lost" if the human extracts compactions after the fact). Format:

```
NEXT 6:

1. {Title}
{What's true today that shouldn't be — the gap between what exists and what's possible. Then: the specific action that closes it. Then: what changes for a real person when it's done.}

...through 6.
```
