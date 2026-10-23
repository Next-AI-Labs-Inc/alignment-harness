---
name: predict-next-action2
description: "Predict the next highest-leverage action by enriching session context through NotebookLM institutional knowledge, then producing a nuanced, UX-focused, intent-grounded recommendation. Use when finishing a session and wanting a deeply informed next-step prediction."
triggers:
  - "predict next action"
  - "what should we work on next"
  - "what's highest leverage"
  - "next priority"
  - "what comes after this"
---

# /predict-next-action2 — Institutional Knowledge-Enriched Next Action Prediction

## How This Works

This skill dispatches a Sonnet subagent that:
1. Assembles a context payload describing what was built, what overarching intent it serves, what scope was completed, and what remains
2. Queries NotebookLM via `/insight` with that context to get institutionally-informed recommendations
3. Cleans up and frames the result as a nuanced, UX-focused prediction

The orchestrator (you) does NOT do the research — the subagent does. You assemble context and dispatch.

## Execution Protocol

### Step 1: Assemble Context (orchestrator — inline)

Before dispatching, compose a context block containing:

```
OVERARCHING INTENT: {what the session's work was building toward — the bigger initiative}

SCOPE COMPLETED:
- {UX story 1 — "When X, then Y" format}
- {UX story 2}
- {UX story N}

CRITICAL CONTEXT:
- {Key finding 1 that shapes what comes next}
- {Key finding 2}
- {Data point that constrains options}

OPEN GAPS:
- {Gap 1 — what's broken or missing}
- {Gap 2}

WHAT WAS NOT DONE:
- {Incomplete item 1}
- {Incomplete item 2}
```

### Step 2: Dispatch Sonnet Subagent (background)

Dispatch a Sonnet agent with `run_in_background: true` using this prompt template:

```
You are producing a deeply informed next-action prediction for the user.

## Your Context
{paste the assembled context block from Step 1}

## Your Task

### Part A: Query NotebookLM for institutional knowledge

Run this command to get institutional knowledge relevant to the next action:

Setup note: this uses your own NotebookLM notebook. Make one at https://notebooklm.google.com and load it with your own corrections, decisions and priorities, because the oracle can only ground its answer in what you put in it. Use that notebook's ID and your own `nlm` profile below.

```bash
nlm notebook query <your-notebook-id> \
  "Given this session's work: {1-2 sentence summary of what was built}. What does the institutional knowledge suggest is the highest-leverage next move? Consider: what historically drove the biggest improvements, what patterns the user has corrected agents on, what strategic priorities are active, and what open gaps in the system would compound if left unfixed." \
  --profile <your-profile-name>
```

### Part B: Synthesize into a prediction

Using the NotebookLM response AND your session context, produce a prediction with this structure:

#### Opening (MANDATORY — 2 full sentences minimum, before anything else)

The first two sentences must make crystal clear:
1. **What the prediction IS** — the specific change being proposed
2. **Why it matters NOW** — in what conditions this change would have its effect, what exact system would cause the intended effect, and the specific UX-framed intent impact within that context

Do NOT compress these sentences. Be nuanced. Be specific about the system, the user, the condition, and the experience change. The user reads these two sentences and either instantly gets it or moves on.

Example of the right density:
"The checkout flow at your app's domain currently shows the pricing page before the person has experienced coaching, which means the $[price]/month ask lands before they've felt what they're paying for — and the institutional knowledge shows the golden window's [X]% conversion was specifically driven by reversing this order, showing the personalized NewPitch modal only AFTER the person had coached enough to generate a salesPitchObject with their own Longings, Wants, and Vision extracted from the conversation. Restoring this 'pitch after investment' timing to the beta50 funnel — where the person coaches first on your app's domain, hits the message depth threshold, THEN sees their personalized pitch with the $[intro price] first-month offer — would test whether the golden window mechanic works in the commitment-first context, which is the single highest-leverage conversion experiment available because it combines the proven UX trigger with the funnel that has actual ad spend behind it."

#### Body

After the opening, include:
- **What the NotebookLM oracle surfaced** — key institutional knowledge that informed this prediction (cite specific patterns)
- **The UX journey this creates** — walk through what a person experiences step by step if this change ships
- **What could go wrong** — risk in UX terms, not technical terms
- **What this does NOT address** — scope boundary, what's explicitly not included
- **Confidence and reasoning** — your confidence level with the specific reasoning chain

#### Format Rules
- No bullet-point summaries in the opening — full prose sentences
- Technical terms must be immediately followed by (what this means for the person using it)
- Every claim about "what works" must reference whether it comes from NotebookLM institutional knowledge, live data from this session, or your inference
- Do NOT compress nuance — the user values seeing the full reasoning more than a tidy conclusion
```

### Step 3: Present Result (orchestrator — inline)

When the subagent returns, present its output directly to the user. Do not summarize or compress — the nuance is the product.

### Step 4: If the user asks follow-up questions

Re-dispatch the subagent with the follow-up question added to the context. The subagent can query NotebookLM again for deeper context on the specific follow-up.

## Model Selection

| Role | Model | Why |
|------|-------|-----|
| Context assembly | Orchestrator (current) | Has the full session context |
| Research + synthesis | Sonnet | Good balance of depth and speed for NotebookLM queries |
| Presentation | Orchestrator | Maintains conversation continuity |

## What This Is NOT

- NOT a replacement for `/predict-next-action` — that's a quick inline prediction. This is the enriched version.
- NOT a planning skill — it predicts ONE action, not a roadmap
- NOT a governer — it doesn't score or route. It recommends.
