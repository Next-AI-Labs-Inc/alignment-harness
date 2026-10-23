---
name: oracles
description: >-
  The oracle roster — 8 NotebookLM notebooks loaded with the user's institutional knowledge.
  Lists every oracle with explicit specificity about what it does and when to use it, in the
  user's voice. Includes query mechanics, output format with extraction markers, and routing.
  Use when you need to know which oracle to query, or when querying any oracle and needing the
  full format including flags, question echo, and verbatim response.
triggers:
  - oracles
  - which oracle
  - which notebook
  - oracle roster
  - list oracles
  - what oracle
  - oracle for
  - which oracle should I
  - open oracles
---

# Oracles

8 notebooks. Each one is an AI loaded with thousands of documents of curated institutional knowledge about a specific domain. Not a search index — an oracle. You can ask it a nuanced question and get a synthesized answer.

**Setup:** these notebooks are not included. Suggest the user make their own at https://notebooklm.google.com, one per oracle below, and put each notebook's ID and their `nlm` profile where this file shows `<...-notebook-id>` and `<your-profile>`, because an oracle can only answer from institutional knowledge the user has loaded into it.

**Stop first: NotebookLM is a separate trust surface.** Before connecting it or uploading anything to it, say to the person, in plain words: "NotebookLM is Google's. Connecting it means trusting Google with the history that goes into the notebook. Do you want to connect it, or keep going with the memory search that ships with the harness, which keeps everything on your machine (or another system you already trust)? Nothing here needs NotebookLM." Wait for an explicit yes in that moment, for that notebook. Silence, or a general "set it all up", is not a yes. If they don't say yes, skip it and carry on. Once they have said yes, everything below works as written.

**Before querying**: pick the right oracle. The wrong one isn't harmful — it just tells you it doesn't have that. But the right one can catch a real bug, tell you the exact rule you were about to violate, or give you the clinical evidence you need, right now.

**For full query mechanics** (MCP fallback, multi-notebook fan-out, maintenance scripts): load `/insight`.

---

## The Output Format (MANDATORY — every oracle query)

Each oracle has its own unique extraction marker pair. Use the marker for the specific oracle you queried.

| Oracle | Opening marker | Closing marker |
|--------|---------------|----------------|
| Agent Steering | `## ORACLE_AGENT_STEERING` | `## END_ORACLE_AGENT_STEERING` |
| Product Intent | `## ORACLE_PRODUCT_INTENT` | `## END_ORACLE_PRODUCT_INTENT` |
| Session History | `## ORACLE_SESSION_HISTORY` | `## END_ORACLE_SESSION_HISTORY` |
| Coaching Principles | `## ORACLE_COACHING_PRINCIPLES` | `## END_ORACLE_COACHING_PRINCIPLES` |
| Investor Context | `## ORACLE_INVESTOR_CONTEXT` | `## END_ORACLE_INVESTOR_CONTEXT` |
| Email Design | `## ORACLE_EMAIL_DESIGN` | `## END_ORACLE_EMAIL_DESIGN` |
| Cross-Domain Deep | `## ORACLE_CROSS_DOMAIN` | `## END_ORACLE_CROSS_DOMAIN` |
| Silver Grail | `## ORACLE_SILVER_GRAIL` | `## END_ORACLE_SILVER_GRAIL` |
| Principles Vault | `## ORACLE_PRINCIPLES_VAULT` | `## END_ORACLE_PRINCIPLES_VAULT` |
| Workflow Construction | `## ORACLE_WORKFLOW_CONSTRUCTION` | `## END_ORACLE_WORKFLOW_CONSTRUCTION` |
| Investor Due Diligence | `## ORACLE_INVESTOR_DUE_DILIGENCE` | `## END_ORACLE_INVESTOR_DUE_DILIGENCE` |

Print the marker before your output. Print the closing marker after. Each oracle's output goes to its own staging file in the extraction pipeline.

Print this exact format per query:

```
## ORACLE_{ORACLE_NAME}
📚 ── Oracle: {Oracle Name} ──────────────────────────
🔧 Command run: nlm notebook query {uuid} "{exact question text}" --profile <your-profile>
❓ Why I asked this: {what you were trying to find out and why right now}
💭 Intent: {what you hoped the oracle would unlock}
📋 Response from {Oracle Name} (verbatim — never summarize):
{everything it returned, word for word}
────────────────────────────────────────────────────────
## END_ORACLE_{ORACLE_NAME}
```

Never summarize the response — verbatim is what feeds the flywheel.

---

## The Oracles

### Agent Steering
**UUID:** `<agent-steering-notebook-id>`

Every rule ever documented about how an agent should behave is in here. Every antipattern. Every correction that changed how the system works. This is where you check before you act — not to get inspiration, to find the actual documented rule. You're about to commit without being asked? It'll tell you that's explicitly banned. You're about to skip governer for an ops task? It'll tell you there's no exemption for that.

Use this when: you're about to do something non-trivial and want to know if there's an explicit rule that covers it. When you want to know what process you should follow before implementing a feature. When something feels like it might be an antipattern. When you want to check what gets the user frustrated.

Don't use this for: what features to build, what happened in past sessions, how the coaching works clinically.

```bash
nlm notebook query <agent-steering-notebook-id> "your question" --profile <your-profile>
```

---

### Product Intent
**UUID:** `<product-intent-notebook-id>`

This one knows what the product is supposed to do — testable conditions for every feature, the intended UX at every decision point, the strategic reasoning behind why things were built this way. What makes it actually useful: during validation it found a real implementation bug by knowing what the placeholder text was supposed to say and catching that the code had it wrong. That's the precision level — not marketing copy, testable conditions.

Use this when: you need to know what a feature was supposed to do for users. When you want to validate what you built against what was intended. When you need the company's mission, pricing philosophy, or growth strategy articulated precisely. When you're asking "what should happen when X?"

Don't use this for: how agents should behave (that's Steering), what happened in specific sessions (that's History).

```bash
nlm notebook query <product-intent-notebook-id> "your question" --profile <your-profile>
```

---

### Session History
**UUID:** `<session-history-notebook-id>`

50 highest-leverage sessions ever recorded plus 2,343 typed knowledge atoms — decisions, corrections, patterns, mental models, open questions, workflows. Before proposing something, ask this oracle if we've tried it. Chances are there's a session where someone tried it, hit a specific wall, and documented exactly what happened. That institutional memory is the asset.

Use this when: you want to know if something has been tried before. When you need to know what decisions were made about a specific system. When you want the mental models the user has documented. When you're looking for a specific correction or finding from history.

Don't use this for: protocol rules (Steering), clinical coaching approaches (Coaching Principles).

```bash
nlm notebook query <session-history-notebook-id> "your question" --profile <your-profile>
```

---

### Coaching Principles Vault
**UUID:** `<coaching-principles-vault-notebook-id>`

418 principles from 67 therapeutic lineages — CBT, ACT, motivational interviewing, Socratic questioning, somatic approaches, logotherapy, post-traumatic growth, narrative therapy — each with evidence citations, leverage scores, and clinical warnings for when they backfire. Scored 10/10 accuracy and 10/10 specificity in validation. This isn't vibe-based. Ask it which ACT technique to use for someone stuck in rumination and it'll give you the principle ID, the clinical evidence, and the specific warning signs. This is the depth the coach actually runs on.

Use this when: you're touching anything that affects what the coach says or does with a user. When you need to know which therapeutic approach fits a scenario. When you want the clinical evidence behind something. When you need to know when a technique makes things worse.

Don't use this for: the technical pipeline that delivers coaching (that's code), individual user sessions. **Not the same as the Agent Principles Vault** — Coaching Principles Vault contains therapeutic techniques for coaching humans (CBT, ACT, somatic work). The Agent Principles Vault contains operational patterns for how agents should behave, learned from real agent failures. Completely different domain.

```bash
nlm notebook query <coaching-principles-vault-notebook-id> "your question" --profile <your-profile>
```

---

### Investor Context
**UUID:** `<investor-context-notebook-id>`

The "why this company exists" oracle. Mission, vision, competitive moat, unit economics thesis, growth strategy, the alignment blog articles that explain the technical differentiation. Use this when you need to articulate what the product is and why it matters to someone who isn't living in the codebase. The user's hard-won lessons on sales, markets, and leadership are in here too.

Use this when: you need to explain the business or the moat. When you're preparing for a strategic conversation or pitch. When you need the thesis behind a pricing or product decision. When you want to understand why we're building toward this and not something else.

Don't use this for: operational details, agent rules, technical implementation.

```bash
nlm notebook query <investor-context-notebook-id> "your question" --profile <your-profile>
```

---

### Email Design
**UUID:** `<email-design-notebook-id>`

Full email playbook. Voice rules — if they say stuck, you say stuck, that's the level of precision this has. User journey stages that determine what email someone gets. AI personalization pipeline. Template governance. Re-engagement triggers. Anti-spam constraints. Scored 9/10 across voice, accuracy, and specificity — one of the most well-rounded oracles.

Use this when: you're writing or reviewing any user-facing email. When you need to know what tone fits a re-engagement scenario. When you want the subject line constraints. When you need to understand how AI personalization works in email.

Don't use this for: individual user data, the coaching content that goes inside emails (Coaching Principles).

```bash
nlm notebook query <email-design-notebook-id> "your question" --profile <your-profile>
```

---

### Cross-Domain Deep
**UUID:** `<cross-domain-deep-notebook-id>`

The wide one. Has content from all domains — UX intents, strategic intents, coaching principles, top 50 + recent 50 session compactions. Use it when your question crosses boundaries and you need synthesis rather than depth. How does coaching philosophy connect to product decisions? How do agent rules connect to business strategy? This oracle can see across all of it. The tradeoff is clear: it's not the deepest in any single area. For depth, use the domain oracle. For synthesis, use this.

Use this when: your question spans more than one domain. When you need connections between systems that normally live in separate oracles. When you want to understand how recent sessions connect to strategic direction.

Don't use this for: domain-specific depth — use the domain oracle for that.

```bash
nlm notebook query <cross-domain-deep-notebook-id> "your question" --profile <your-profile>
```

---

### Silver Grail
**UUID:** `<silver-grail-voice-notebook-id>`

This one sounds like the user. Every other oracle sounds like documentation — accurate and neutral. This one is built from raw interview transcripts and scored 10/10 on voice fidelity. Phrases like "subject-object flip," "one-click traceability," "brutal work" — that's the texture here. When you need to understand how the user THINKS about something — not the rules, the reasoning and posture behind the rules — this is the oracle.

Use this when: you need to understand the user's reasoning, not just the documented rules. When you want voice-accurate representation of how the user talks about something. When you want to predict the philosophical framing the user would use for a decision. When the other oracles give you the what and you need the why.

Don't use this for: specific protocol rules or governer thresholds — those live in Agent Steering with more precision.

```bash
nlm notebook query <silver-grail-voice-notebook-id> "your question" --profile <your-profile>
```

---

### Agent Principles Vault
**UUID:** `<agent-principles-vault-notebook-id>`
**Profile:** `--profile <your-profile>`

1,407 principles extracted from 389 agent sessions. 183 validated. 188 scored 90+ on leverage. These aren't rules someone wrote down — they're patterns that surfaced from real failures, the user's corrections, and incidents that taught the system something. The difference between this and Agent Steering: Steering tells you the protocol. The Vault tells you what happened when someone ignored it, why it went wrong at a specific level, and what the ground truth is for every domain we've learned the hard way. It knows that the LLM coaching eval scores are gameable and the only metric authorized for autonomous quality decisions is `AvgUserRepliesPerCoachingDay`. It knows Meta purchase data is a systematic hallucination that must be cross-referenced against Stripe. It knows commented-out code in the payment webhook is intentional governance, not a bug. Before you touch any domain — payments, coaching, email, user access, ads — ask this oracle what failure modes already exist for it.

Use this when: you're about to modify something in a domain that has a history, and you want to know what's already been learned the hard way. When you want to know the ground truth for a metric before reporting numbers. When you need to know what "intentional debt" looks like vs. actual bugs. When you're not sure if something is a fail-open safety net or a product decision.

Don't use this for: current product intent (Product Intent oracle), rules about agent behavior protocols (Agent Steering), what happened in a specific past session (Session History). **Not the same as Coaching Principles Vault** — this is agent operational patterns learned from real failures, not therapeutic techniques. If your question is about what the coach should say to a user, that's Coaching Principles Vault. If it's about what an agent should do to not repeat a known failure mode, that's here.

```bash
nlm notebook query <agent-principles-vault-notebook-id> "your question" --profile <your-profile>
```

---

### Workflow Construction Oracle
**UUID:** `<workflow-construction-notebook-id>`
**Profile:** `--profile <your-profile>`

The playbook for building agent pipelines that don't hallucinate. This was built from a real session where v1 had a 48% hallucination rate — 31 proposals processed, 15 hallucinated, because 3 identical Sonnet agents were cross-verifying each other's work without independence. The v2 redesign cut that to near zero. What's in here: 14 validated pipeline stages (Adversarial Design, Cross-Verification, Oracle Gate, Scope Guardian, etc.), case studies from failures that actually happened in this system, and the patterns that separate "babysitter mode" from a real autonomous pipeline. It knows how scope reduction happens (the orchestrator finished list 1 and declared done because no mechanism existed to check coverage), how destructive interpretation breaks alignment ("you said also, I heard instead"), and how to extract a breakthrough methodology from a session before compaction destroys it.

Use this when: you're designing any multi-stage agent workflow and want to avoid building in the failure modes we already know about. When a pipeline you're running is producing low-quality output and you need to diagnose which stage is broken. When you want to turn a successful manual session into an autonomous repeatable workflow. When you need to know which of the 14 pipeline stages a given task actually requires.

Don't use this for: single-agent tasks, governer scoring (that's governer skill), or questions about the coaching pipeline (Coaching Principles oracle).

```bash
nlm notebook query <workflow-construction-notebook-id> "your question" --profile <your-profile>
```

---

### Silver Grail Strategic Blueprint
**UUID:** `<silver-grail-blueprint-notebook-id>`
**Profile:** `--profile <your-profile>`

The philosophical and architectural blueprint for the product — the "why the system is built this way" oracle. Contains the Silver Grail mechanism ({N}-day payback period enabling self-funded exponential growth), the SILA algorithm and how it began outperforming human strategic thinking, the Subject-Object Flip defined technically, and the thesis that mission and unit economics are a single system. Distinct from the user-profile Silver Grail (`<silver-grail-voice-notebook-id>`) which is raw voice texture. This one is the architecture of thought; that one is the texture of thinking.

Use this when: you need to understand WHY specific architectural or business decisions were made — not just what the decision was. When explaining the Silver Grail state to someone who needs the mechanism, not just the name. When you want the SILA algorithm defined precisely.

Don't use this for: the user's voice texture (that's Silver Grail `<silver-grail-voice-notebook-id>`), operational failure modes (Agent Principles Vault), specific UX intents (Product Intent).

```bash
nlm notebook query <silver-grail-blueprint-notebook-id> "your question" --profile <your-profile>
```

---

### Operational Audit
**UUID:** `<operational-audit-notebook-id>`
**Profile:** `--profile <your-profile>`

Granular financial performance intelligence: exact payback curves per cohort, ROAS, LTV by acquisition channel ({channel} and {campaign} data), strategic execution roadmap with leverage ideas and in-progress tasks, and AI architectural standards for building production-grade agentic systems using the Claude Agent SDK. The place to go for the actual numbers — not the thesis, the data.

Use this when: you need payback period specifics, cohort LTV data, or channel-level performance. When building on the Email Machine and need to understand why it {changes} LTV in data terms. When checking current tactical roadmap state. When implementing production Claude agentic systems and need the architectural standards.

Don't use this for: the strategic thesis behind the numbers (Investor Context), therapeutic coaching techniques (Coaching Principles Vault), agent behavioral rules (Agent Steering).

```bash
nlm notebook query <operational-audit-notebook-id> "your question" --profile <your-profile>
```

---

### Investor Due Diligence
**UUID:** `<investor-due-diligence-notebook-id>`
**Profile:** `--profile <your-profile>`

10 source documents covering the full valuation picture for the product: Revenue Multiple Valuation Model (methodology + how we ran it), AI-assisted valuation formulas, {investor name} valuation framework and cap raise context, investor evaluation deep research, High-Growth Narrative and $X capital deployment strategy, Valuation Methods comparative analysis, {financing agreements}. Configured with a custom investor-assist system prompt that enforces non-assertive scientific framing and requires an AI disclaimer on every response.

Use this when: an investor or advisor needs to evaluate the company valuation and wants grounded, documented context — not pitch deck claims. When you need to understand which valuation methods were considered and why. When reviewing {financing} terms or cap structure. When someone needs the financial thesis articulated with its source documents, not from memory.

Don't use this for: live operational metrics or cohort performance data (Operational Audit), the strategic narrative and moat thesis (Investor Context), or agent/coaching system internals.

⚠️ This oracle has a custom system prompt injected: all answers are framed as non-assertions (scientist voice) and every response ends with: *"AI can make mistakes. Ask for human validation for anything produced here before acting on any generated outputs."*

```bash
nlm notebook query <investor-due-diligence-notebook-id> "your question" --profile <your-profile>
```

---

## Query All at Once

When you don't know which oracle to use, fan out across all 8:

```bash
# Via MCP (if notebooklm server is running):
mcp__notebooklm__search_recent({ question: "your question", max_notebooks: 8 })

# Via CLI:
nlm cross query "your question" --max 8 --profile <your-profile>
```

Note: `nlm cross query` may not support `--profile <your-profile>` on all versions. If it fails, use Cross-Domain Deep as the fallback.

---

## Also: /jonathan-check2 — Predict the User's Response

Not an oracle notebook — a skill that queries the Silver Grail notebook with 8,562 real agent↔user conversations. Predicts what the user would say to YOUR output, including what the user would challenge and what evidence the user would demand.

Use before declaring any work done. Invoke: `/jonathan-check2`

---

## Quick Reference

| Oracle | UUID | Profile | Use for |
|--------|------|---------|---------|
| Agent Steering | `<agent-steering-notebook-id>` | `--profile <your-profile>` | Rules, antipatterns, protocol, what gets corrected |
| Product Intent | `<product-intent-notebook-id>` | `--profile <your-profile>` | Feature UX, testable conditions, pricing philosophy |
| Session History | `<session-history-notebook-id>` | `--profile <your-profile>` | Past decisions, 2,343 knowledge atoms, what was tried |
| Coaching Principles Vault | `<coaching-principles-vault-notebook-id>` | `--profile <your-profile>` | 418 therapeutic principles for coaching humans (CBT, ACT, somatic) |
| Investor Context | `<investor-context-notebook-id>` | `--profile <your-profile>` | Mission, moat, unit economics, strategic why |
| Email Design | `<email-design-notebook-id>` | `--profile <your-profile>` | Voice rules, templates, personalization pipeline |
| Cross-Domain Deep | `<cross-domain-deep-notebook-id>` | `--profile <your-profile>` | Synthesis across all domains |
| Silver Grail (voice) | `<silver-grail-voice-notebook-id>` | `--profile <your-profile>` | The user's voice texture, reasoning posture, philosophy |
| Agent Principles Vault | `<agent-principles-vault-notebook-id>` | `--profile <your-profile>` | 1,407 agent operational failure modes, ground truth metrics |
| Workflow Construction | `<workflow-construction-notebook-id>` | `--profile <your-profile>` | Anti-hallucination pipeline design, 14 validated stages, case studies |
| Silver Grail Blueprint | `<silver-grail-blueprint-notebook-id>` | `--profile <your-profile>` | Silver Grail mechanism, SILA algorithm, Subject-Object Flip architecture |
| Operational Audit | `<operational-audit-notebook-id>` | `--profile <your-profile>` | Payback curves, LTV by cohort, channel performance, tactical roadmap |
| Investor Due Diligence | `<investor-due-diligence-notebook-id>` | `--profile <your-profile>` | Valuation models, {financing agreements}, {investor name} framework, investor evaluation — scientist-voice, non-assertive, disclaimer on every response |
