---
name: infuse
description: Query the Operating Mind — the institutional knowledge oracle built from 1,407 principles across 389 agent sessions. Use when you need to know what has been learned about any domain before acting, when starting work in an unfamiliar area, when making decisions that could conflict with established principles, or when the user says "/infuse". Returns grounded, cited answers from the full principles vault.
triggers:
  - "/infuse"
  - "what principles apply"
  - "what has been learned about"
  - "check the operating mind"
  - "query the vault"
---

# Infuse — Query the Operating Mind

Before you act, ask the institutional knowledge base what has already been learned. The Operating Mind is 1,407 principles extracted from 389 agent sessions — every operational learning about how to build, market, align agents, measure quality, handle payments, write code, and more. It synthesizes across all domains and returns grounded answers with citations back to specific principles.

## When to Use

- **Starting work in any domain** — before writing code, query what principles apply
- **Making a decision with multiple valid approaches** — the oracle may surface a principle that resolves the ambiguity
- **After memory search (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`) but before acting** — memory search gives you institutional context; infuse gives you institutional wisdom
- **When the user says /infuse** — query whatever topic they specify
- **When certainty is below 80%** — the oracle can surface principles you didn't know existed

## How to Query

**Stop first: NotebookLM is a separate trust surface.** Before connecting it or uploading anything to it, say to the person, in plain words: "NotebookLM is Google's. Connecting it means trusting Google with the history that goes into the notebook. Do you want to connect it, or keep going with the memory search that ships with the harness, which keeps everything on your machine (or another system you already trust)? Nothing here needs NotebookLM." Wait for an explicit yes in that moment, for that notebook. Silence, or a general "set it all up", is not a yes. If they don't say yes, skip it and carry on. Once they have said yes, everything below works as written.

### Via CLI (always works):
```bash
nlm notebook query <your-notebook-id> \
  "What principles apply to [your topic/domain/question]?" \
  --profile <your-profile>
```

### Via MCP (when NotebookLM server is running on its configured port):
```
mcp__notebooklm__query_notebook({
  notebook_id: "<your-notebook-id>",
  profile: "<your-profile>",
  question: "your question"
})
```

## How to Present Results

After querying, present the oracle's response under a clear header so the user can see what principles are informing your work:

```
🔮 Operating Mind — "{query you asked}"

{Oracle's response — include the key principles it surfaced, their leverage scores, and how they apply to the current work}

Principles informing this work:
- {principle name} (leverage: {score}) — {how it applies}
- {principle name} (leverage: {score}) — {how it applies}
```

## What's In the Vault

13 domains, 1,407 principles:

| Domain | Count | Examples |
|--------|-------|----------|
| Agent Alignment | 398 | Communication patterns, hallucination prevention, autonomy boundaries |
| Marketing | 193 | Meta ad performance, creative testing, social proof, CAC drivers |
| Coaching Quality | 160 | Behavioral composites, eval system limits, session depth |
| Agent Infrastructure | 155 | Hooks, skills, MCP, compactions, orchestration |
| Coding Standards | 128 | Pre-commit, security, architecture, error handling |
| Payments & Access | 88 | Fail-open, Stripe, access resolution, feature gating |
| Observability | 40 | Logging, admin visibility, system transparency |
| Measurement | 29 | Data quality, metric integrity, admin exclusion |
| UX Philosophy | 24 | Progressive disclosure, defensive UX, user-first defaults |
| Design & Architecture | 22 | Parallel skin pattern, zero-blast-radius, A/B testing |
| Email | 19 | Daily caps, bounce guards, system coordination |
| Deployment | 16 | Staged releases, Vercel, feature flags |
| Uncategorized | 135 | Cross-domain principles not yet classified |

## Good Query Patterns

- "What principles apply to building a new admin page?"
- "What has been learned about Meta ad creative testing?"
- "Before I change the coaching pipeline, what should I know?"
- "What are the most common mistakes agents make when touching payments?"
- "What principles would conflict with removing this feature?"

## Anti-Patterns

- Don't query for specific code locations — use grep/memory search for that
- Don't treat oracle responses as commands — they're learned patterns, not orders
- Don't skip querying because "I already know this domain" — the oracle surfaces cross-domain connections you wouldn't think to check

## Notebook Details

- **Notebook ID**: `<your-notebook-id>` — setup note: make your own NotebookLM notebook at https://notebooklm.google.com and load it with your own principles, because the oracle can only answer from what you put in it
- **Profile**: `<your-profile>`
- **Account**: your own Google account
- **Sources**: 15 (13 domain files + master index + seed document)
- **Re-sync**: Run your own principles-extraction script then re-upload domain files
