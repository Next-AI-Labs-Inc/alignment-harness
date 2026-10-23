---
name: jonathan-check2
description: User response predictor v2 — queries a NotebookLM notebook loaded with 8,562 real agent↔user conversations to predict what the user would say to your output. Replaces the local Python predictor with NotebookLM's semantic retrieval + synthesis. Use before declaring work done, before presenting work, or when you need to anticipate the user's reaction.
triggers:
  - "/jonathan-check2"
  - "predict user response"
  - "what would the user say"
  - "user review v2"
---

# Jonathan Check v2 — User Response Oracle

Before declaring work done, ask the oracle what the user would actually say to your output. This notebook contains 8,562 real conversations between agents and the user — the user's actual words, corrections, praise, frustration, and patterns. NotebookLM does the semantic retrieval and synthesis, so there's no 1500-char truncation limit and no MiniLM embedding bottleneck.

## Why v2 is Better Than v1

| | v1 (Python predictor) | v2 (NotebookLM oracle) |
|---|---|---|
| Retrieval | MiniLM-L6-v2, truncates at 1500 chars | Google's full semantic retrieval, no truncation |
| Synthesis | Claude called with 5 similar examples | NotebookLM synthesizes across all 8,562 pairs |
| Citations | None — just returns a prediction | Every claim cites specific conversations |
| Principles | Not included | Includes Operating Mind principles index |
| Setup | Requires Python, sentence-transformers, FAISS | One CLI command, no dependencies |

## When to Use

- Before saying "done", "completed", "shipped", "ready"
- Before presenting work to the human
- When you want to anticipate what the user will challenge
- When deciding how to frame your output

## How to Query

### Quick prediction (one command):
```bash
nlm notebook query <your-notebook-id> \
  "An agent just told the user: '[paste your output here]'. Based on the 8,500+ historical conversations, what would the user most likely respond with? Predict the user's actual words, tone, and what the user would challenge." \
  --profile <your-profile>
```

### Structured prediction (for governer score >= 60):
```bash
nlm notebook query <your-notebook-id> \
  "TASK: [what was built]
AGENT OUTPUT: [paste your full output]
EVIDENCE PROVIDED: [what proof you showed]
ASSUMPTIONS MADE: [list them]

Based on the historical conversations, predict:
1. What would the user say first?
2. What would the user challenge?
3. What evidence would the user demand?
4. What tone would the user use (satisfied, corrective, frustrated)?
5. What specific phrases would the user use (cite real examples from the data)?" \
  --profile <your-profile>
```

### Via MCP:
```
mcp__notebooklm__query_notebook({
  notebook_id: "<your-notebook-id>",
  profile: "<your-profile>",
  question: "your query"
})
```

## How to Present Results

Before your output, print `## JONATHAN_CHECK` on its own line.
After your output is complete, print `## END_JONATHAN_CHECK` on its own line.
These enable automated extraction of oracle predictions to the flywheel data store.

```
## JONATHAN_CHECK
🧠 ── Jonathan Check v2 ──────────────────────────
📌 Work: "{what you built}"

💬 Predicted response:
"{the oracle's prediction of the user's actual words}"

📋 Predicted challenges:
  1. {challenge} — addressing: {your evidence or fix}
  2. {challenge} — addressing: {your evidence or fix}

🔮 Confidence signals:
  - {N} citations from real conversations
  - Tone: {satisfied | corrective | frustrated}
───────────────────────────────────────────────────
## END_JONATHAN_CHECK
```

## Addressing Challenges

For each predicted challenge:
- ✅ **Already handled**: Show the specific evidence
- 🔧 **Need to fix**: Fix it, then re-query to verify
- ⏭️ **Not applicable**: Explain honestly why

Only declare done when every challenge is ✅.

## Proportional Depth

- **Score < 30**: Quick prediction, skim response, move on
- **Score 30-59**: Full prediction, address top 3 challenges with evidence
- **Score 60-79**: Structured prediction, address ALL challenges
- **Score 80+**: Structured prediction + follow-up query: "If the agent then provided [your evidence], would the user be satisfied or push further?"

## Notebook Details

- **Notebook ID**: `<your-notebook-id>` — setup: make your own notebook at https://notebooklm.google.com and load it with your own real agent↔user conversations, because this oracle can only predict the person whose real words it holds.
- **Profile**: `<your-profile>`
- **Sources**: 45 (43 conversation batches + evaluator rubric + principles index)
- **Data**: 8,562 real agent↔user conversation pairs
- **Account**: your NotebookLM Google account

## Upgrade: jonathan-check3 (God-Mode Oracle Loop)

`/jonathan-check3` extends this skill with:
- **All extracted session intelligence** (coherence checks, reflect outputs, align sessions, skill sequences, compaction intents, scope declarations) — not just conversation pairs
- **Autonomous loop** — re-queries after each action until oracle signals SCOPE_COMPLETE
- **Next-action prediction** — doesn't just predict the user's response, predicts the next step to take

When to use check3 vs check2:
- Use **check2** (this skill) — one-shot gate before presenting work to the human
- Use **check3** — when running autonomously, or as the steering loop for high-stakes/complex scopes

Invoke: `Skill({ skill: "jonathan-check3" })`
