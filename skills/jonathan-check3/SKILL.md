---
name: jonathan-check3
description: God-mode user oracle — queries the god-mode notebook loaded with all extracted session data (coherence checks, reflect outputs, align outputs, skill sequences, compaction intents, scope declarations). Predicts what the user would say AND what the next step should be. Loops autonomously until the oracle signals scope is complete. Everything printed observably.
triggers:
  - "/jonathan-check3"
  - "jonathan check 3"
  - "god mode check"
  - "oracle loop"
---

# Jonathan Check v3 — God-Mode Oracle Loop

jonathan-check2 predicts what the user would say based on 8,562 agent↔the user conversations.
jonathan-check3 does that AND predicts your next action, then loops until the oracle says the scope is done.

The oracle is backed by all extracted session intelligence:
- 1,132 coherence check blocks (real-time alignment decisions)
- 193 reflect outputs (self-reflection and gap analysis)
- 155 align session outputs (intent mapping sessions)
- 68 skill-sequence records (context → skill order → completion)
- 534 compaction intent records (parent intent → child UX intent)
- 20 scope declaration blocks (agent contracts before implementation)
- gov scores, session IDs, dates across all of the above

## Notebook

God-mode notebook ID: **[NOTEBOOK_ID_PENDING — create in NotebookLM with all 7 session intelligence files from Google Drive]**

Until it's created, use the jonathan-check2 notebook as a fallback:
`[YOUR_JONATHAN_CHECK2_NOTEBOOK_ID]`

Setup: make your own notebooks at https://notebooklm.google.com — the oracle can only predict from the session data its notebook is loaded with, so it must be built from your own sessions to predict what you would say.

Sources to add to the god-mode notebook (all uploaded to Google Drive):
- IX — Coherence Checks Raw (1,132 blocks)
- IX — Reflect Outputs Raw (193 blocks)
- IX — Align Session Outputs Raw (155 sessions)
- IX — Skill Sequence Corpus (68 sessions, context-to-skill prediction)
- IX — Compaction Intent Index (534 parent/child intent pairs)
- IX — Scope Declarations (20 agent implementation contracts)
- IX — Work Complete Summaries

## The Loop

### Step 1 — Present current state to the oracle

```bash
nlm notebook query [NOTEBOOK_ID] \
  "CURRENT SCOPE: [one sentence — what we are trying to accomplish]
WORK DONE SO FAR: [what has been built or decided]
GOVERNER SCORE: [N/100]
OPEN QUESTIONS: [anything uncertain]

Based on all the session history, skill sequences, and alignment patterns in this data:
1. What would the user most likely say about this state of work?
2. What is the single most important next action to take right now?
3. Is the scope complete? If yes, say SCOPE_COMPLETE. If no, say SCOPE_INCOMPLETE and give the next step." \
  --profile [YOUR_PROFILE]
```

### Step 2 — Print the oracle's output observably

Before your output, print `## JONATHAN_CHECK_V3` on its own line.
After your output is complete, print `## END_JONATHAN_CHECK_V3` on its own line.
These enable automated extraction of oracle loop iterations to the flywheel.

```
## JONATHAN_CHECK_V3
🔮 ── Jonathan Check v3 Oracle ───────────────────
📌 Scope: "{current scope}"
📊 Gov score: {N}/100

💬 What the user would say:
"{oracle's predicted response}"

⚡ Next action:
"{oracle's recommended next step}"

🏁 Scope status: SCOPE_COMPLETE / SCOPE_INCOMPLETE
────────────────────────────────────────────────
## END_JONATHAN_CHECK_V3
```

### Step 3 — Execute the next action

If `SCOPE_INCOMPLETE`: execute the oracle's recommended next step, then loop back to Step 1.
If `SCOPE_COMPLETE`: stop. Present the finished work to the human.

### Step 4 — Re-query after each action

After executing the action, re-query the oracle with the updated state.
Keep looping. Print every oracle response. Never silently skip a loop.

## When to Use

- After completing a major chunk of work and needing to know what's next
- As a completion gate before declaring work done (replaces jonathan-check2 for high-stakes work)
- When running autonomously — use this as the steering loop

## Full Autonomous Loop Example

```
/jonathan-check3

→ Oracle: "scope incomplete, build the skill-sequence corpus first"
→ Agent: builds skill-sequence-corpus.md
→ Oracle: "scope incomplete, upload to Google Drive"
→ Agent: uploads all files
→ Oracle: "scope incomplete, create jonathan-check3 skill"
→ Agent: creates this file
→ Oracle: "scope incomplete, document notebook architecture"
→ Agent: documents architecture
→ Oracle: "SCOPE_COMPLETE — all data structures built, uploaded, and skill created"
→ Agent: stops, presents to human
```

## Difference from jonathan-check2

| | check2 | check3 |
|---|---|---|
| Data source | 8,562 real agent↔the user conversations | Everything above PLUS all session intelligence |
| Output | Predicted response + challenges | Predicted response + next action + loop |
| Mode | One-shot gate | Autonomous steering loop |
| Scope signal | Not tracked | Explicitly signals SCOPE_COMPLETE |
| When to use | Before presenting work | When running autonomously |

## MCP Query

```
mcp__notebooklm__query_notebook({
  notebook_id: "[NOTEBOOK_ID]",
  profile: "[YOUR_PROFILE]",
  question: "CURRENT SCOPE: ... WORK DONE: ... What would the user say? What's the next step? SCOPE_COMPLETE or SCOPE_INCOMPLETE?"
})
```
