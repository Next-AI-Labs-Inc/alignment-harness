---
name: info
description: Summarize the session's UX intent in one sentence and evaluate compaction value.
triggers:
  - "info"
  - "session info"
  - "what are we doing"
  - "summarize session"
---

# Session Info

Before your output, print `## INFO_SUMMARY` on its own line. This enables automated extraction to the compaction admin UI.

## 1. UX intent (one sentence)

Eval and discern what the exact specific UX change will be if the full intent of this session — articulated and/or deduced from the user's words — is realized. State it in one nuanced sentence.

**Keep it high-level and purposeful. Not a list of everything done — the WHY behind it all.**

WRONG: "When a portfolio visitor — specifically an Anthropic hiring evaluator — lands on the user's site, they encounter a unified research portfolio where 17 articles (4 featured foundational writings + 13 technical alignment deep dives) live under a single /alignment-blog with a 'Currently building on Claude' callout..."

RIGHT: "Fully optimize the portfolio with specific upgrades targeting the optimal experience for a hiring manager, demonstrating evidence of efficacy with AI"

## 2. Compaction value

On the next line, state:

> Compaction Gains: {num}%

Calculate by evaluating the quantity of new discernments, progress, insights, principles, and outcomes generated since the last compaction in this session. If no compaction has happened yet this session, rank as 100%.

## Auto-Persist Signal (MANDATORY)

After printing the one-sentence intent and the `Compaction Gains: N%` line, you MUST emit this IX_SIGNAL on its own line. The Session Compass hook reads it to auto-save your output without requiring manual compaction.

Replace ALL placeholders with actual values:
- `ACTUAL_SESSION_ID` → the real Claude Code session UUID. Use the canonical resolver: `alignment-harness session-id`. The resolver returns a per-process answer that is safe across concurrent agents. Do NOT read from any shared file like `current-session-id.txt` — singleton shared files return the wrong UUID when multiple agents are running.
- `ACTUAL_INTENT` → exact text of the one-sentence UX intent you stated above (escape any double quotes as \")
- `ACTUAL_GAINS` → integer 0-100, same number as your Compaction Gains line

```
<!-- IX_SIGNAL {"type":"intent_update","sessionId":"ACTUAL_SESSION_ID","intent":"ACTUAL_INTENT","gains":ACTUAL_GAINS} -->
```

This line is invisible in most terminal rendering but captured by the Stop hook. Do not skip it. Do not put it in a code block — emit it as literal text.
