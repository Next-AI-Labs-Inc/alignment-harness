---
name: oracle-pre-query
description: "Structured pre-check before any jonathan-check2 call. Forces agents to declare domain, audience, perfect-state, and negative boundaries so the oracle applies the right pattern library. Run /reflect on the scope first, then answer the schema."
triggers:
  - "/oracle-pre-query"
  - "before calling jonathan-check"
  - "pre-oracle"
---

# /oracle-pre-query — Structured Pre-Check for Oracle Queries

## Why This Exists

The jonathan-check2 oracle is trained on 8,500+ conversations that are predominantly product-UX work. When asked to evaluate agent infrastructure, data pipelines, or other non-product work, it defaults to its strongest patterns (simulator URLs, Silver Grail ROI, customer-facing UX) which may not apply.

This protocol was born from a real failure: an oracle query about agent infrastructure hooks returned 50% misapplied product patterns because the query didn't frame the domain. Adding a structured pre-check reduced misapplication to ~11%.

## When to Use

EVERY time you call jonathan-check2. No exceptions.

**Stop first: NotebookLM is a separate trust surface.** Before connecting it or uploading anything to it, say to the person, in plain words: "NotebookLM is Google's. Connecting it means trusting Google with the history that goes into the notebook. Do you want to connect it, or keep going with the memory search that ships with the harness, which keeps everything on your machine (or another system you already trust)? Nothing here needs NotebookLM." Wait for an explicit yes in that moment, for that notebook. Silence, or a general "set it all up", is not a yes. If they don't say yes, skip it and carry on. Once they have said yes, everything below works as written.

## Oracle Selection — Which Oracle for Which Question

You may query MULTIPLE oracles. The pre-query schema determines which ones. Print ALL queries and ALL responses.

### Routing Table (by `domain` field)

| Domain | Primary Oracle(s) | Notes |
|--------|-------------------|-------|
| `product-ux` | Jonathan Check v2 | Broadest coverage (45 sources), default for anything product-facing |
| `agent-infrastructure` | Operating Mind + Jonathan Check v2 | Both — principles alignment first, then user prediction |
| `data-pipeline` | Operating Mind + Jonathan Check v2 | Same as agent-infrastructure; principles first |
| `business-strategy` | Silver Grail + Jonathan Check v2 | Revenue-connected decisions always check unit economics |
| `content` | Jonathan Check v2 | User voice/tone patterns live here |
| `which-skill-to-use` | Agent Skill Pattern Oracle | Sole oracle for skill sequencing questions |
| `agent-system-architecture` | Sentinel Protocol + Operating Mind | Self-replicating agent firm design + principles check |
| `other` | Operating Mind first, then route | Principles-based and domain-agnostic — surfaces what domain actually applies |

### Oracle Directory

Setup: these are the user's own NotebookLM notebooks, so their IDs only work on the user's account. Make your own at https://notebooklm.google.com and put each one's ID in place of `<your-notebook-id>`, because an oracle can only predict from the material you load into it.

1. **IX Operating Mind — Principles Vault** (`<your-notebook-id>`) — 15 sources
   Best for: "Does this approach align with how we work?" "What principles apply here?" "What patterns have we established?"

2. **Jonathan Check v2 — User Response Predictor** (`<your-notebook-id>`) — 45 sources
   Best for: "Would the user accept this?" "What would the user challenge?" "What's missing from the user's perspective?"
   **Default oracle** — broadest coverage, use when uncertain which oracle applies.

3. **Agent Skill Pattern Oracle** (`<your-notebook-id>`) — 2 sources
   Best for: "Which skills should I invoke?" "What's the right skill sequence for this scope?"

4. **IX Codebase Insights — Session Observations** (`<your-notebook-id>`) — 1 source
   Best for: "What have agents observed about this codebase area before?"

5. **Operational Audit & Strategic Launch Roadmap** (`<your-notebook-id>`) — 5 sources
   Best for: "Is this strategically aligned with launch priorities?" "What's the business context?"

6. **The Silver Grail** (`<your-notebook-id>`) — 1 source
   Best for: "How does this connect to unit economics and ROAS?" Revenue-related decisions.

7. **Claude Certified Architect** (`<your-notebook-id>`) — 1 source
   Best for: "What's the right Claude API pattern for this?" Technical architecture with Claude.

8. **The Sentinel Protocol** (`<your-notebook-id>`) — 6 sources
   Best for: "How should this agent system be architected?" Self-replicating agent firm design.

### Selection Rules

- **Default (uncertain)**: Query Operating Mind first — it's principles-based and domain-agnostic. What it surfaces will tell you which oracle to query next.
- **Agent infrastructure**: Always both Operating Mind AND Jonathan Check v2. Operating Mind catches principle violations; Jonathan Check v2 catches user alignment gaps.
- **Business/revenue decisions**: Always both Silver Grail AND Jonathan Check v2. Silver Grail catches unit economics misalignment; Jonathan Check v2 catches strategic framing gaps.
- **Skill sequencing**: Agent Skill Pattern Oracle only — the other oracles don't have skill registry coverage.
- **Agent system architecture**: Sentinel Protocol + Operating Mind — not Jonathan Check v2 (it defaults to product UX patterns for architecture questions).

---

## Step 1: Run /reflect on the SCOPE

Before answering the schema, run /reflect on what you're about to ask the oracle to evaluate. The reflection must be about the SCOPE — not about the process of querying the oracle. Do not inject hints about what the oracle should or shouldn't say.

## Step 2: Answer the Pre-Query Schema

```yaml
oracle_pre_query:
  domain: "[product-ux | agent-infrastructure | data-pipeline | business-strategy | content | other: ___]"
  audience: "Who experiences the result of this work?"
  success_looks_like: "One sentence — what does 'working' look like to that audience?"
  perfect_looks_like: "What does 10/10 realization look like? Nuance proportional to task complexity AND gravity."
  does_not_touch: "Explicit list of what this work does NOT affect"
  failure_modes: "The specific failures being designed against"
  similar_past_work: "Prior sessions or patterns this resembles"
  intent_declaration: "Robust intent statement — nuanced relative to complexity AND gravity of the task"
```

## Step 3: Compose the Oracle Query

Include the schema output as PREAMBLE to your oracle query. The schema fields become the first section of the query, followed by whatever you're asking the oracle to evaluate.

## Step 4: Print EVERYTHING

Print the FULL query verbatim to the conversation BEFORE sending it. Print the FULL response verbatim AFTER receiving it. Never summarize oracle interactions. The user must be able to see exactly what was asked and exactly what came back.

## Step 5: Tag Each Challenge

For each challenge the oracle raises:
- **DOMAIN-RELEVANT**: references agent behavior, hook correctness, skill file quality, session state, or whatever domain you declared
- **POTENTIALLY-MISAPPLIED**: references patterns from a different domain than what you declared

## Step 6: Handle Disagreement (Governer-Gated)

If the agent disagrees with the oracle AND the task's governer score is high enough:
1. **Round 1**: Send a correction query: "You raised [challenge]. This work is in [domain] and does not touch [boundary]. Given that constraint, what [domain]-specific challenge would you raise instead?"
2. **Round 2**: If oracle maintains its position, send one more clarification with specific evidence
3. **After 2 rounds**: If still disagreeing, escalate to the ORCHESTRATOR (not the human). The orchestrator reads both positions + evidence and makes the call. Decision is logged with reasoning.

If the task's governer score is LOW (below the threshold for human review), the agent makes the call directly and logs the reasoning.

## What Bad Looks Like

- Sending an oracle query without running this protocol first
- Running /reflect on "how to query the oracle" instead of on the actual scope
- Injecting the answers into the reflection (cheating the test — the reflection must derive domain context naturally)
- Summarizing the oracle response instead of printing it verbatim
- Accepting all oracle challenges without tagging domain relevance
- Escalating to the human instead of the orchestrator on disagreements
