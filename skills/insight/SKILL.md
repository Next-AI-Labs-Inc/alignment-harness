---
name: insight
description: >-
  Route to the right NotebookLM knowledge oracle — 8 notebooks containing
  the user's institutional knowledge. Use when you need domain knowledge before
  acting, when asked "what does the user think about X", "check the
  notebooks", "query knowledge oracle", or when starting work in any
  unfamiliar domain. Triggers: institutional knowledge, notebooks, oracle,
  knowledge base, what would the user say, the user's patterns, check notebooks.
triggers:
  - notebook query
  - nlm
  - notebooklm
  - query notebook
  - knowledge oracle
  - check notebooks
  - institutional knowledge
  - what would the user say
  - the user's patterns
  - insight
  - insights
  - oracle
  - notebook
  - google lm
---

# Knowledge Oracles

> **MCP FALLBACK:** If `mcp__notebooklm__search_recent` or any MCP notebook call fails (transport closed, connection refused), use the CLI directly: `nlm notebook query <UUID> "your question" --profile <profile>`. The UUIDs are listed below for each notebook. The CLI at `~/.local/bin/nlm` always works regardless of MCP server state.

8 knowledge oracles are available — NotebookLM notebooks loaded with the user's institutional knowledge, organized by domain. Pick the right one based on your situation, or search all of them at once.

> **Setup:** These notebooks do not ship with this plugin. Make your own at https://notebooklm.google.com, load each one with your own institutional knowledge, and put its ID wherever `<notebook-id>` appears below (and your own nlm profile name wherever `<profile>` appears). Why: an oracle can only stand in for asking you if it holds your context.

**Stop first: NotebookLM is a separate trust surface.** Before connecting it or uploading anything to it, say to the person, in plain words: "NotebookLM is Google's. Connecting it means trusting Google with the history that goes into the notebook. Do you want to connect it, or keep going with the memory search that ships with the harness, which keeps everything on your machine (or another system you already trust)? Nothing here needs NotebookLM." Wait for an explicit yes in that moment, for that notebook. Silence, or a general "set it all up", is not a yes. If they don't say yes, skip it and carry on. Once they have said yes, everything below works as written.

The primary intent behind these tools is to enable you to enrich your context-awareness to create greater alignment with the existing systems which might inform whatever you're working on.  Being context aware radically improves your alignment, which radically reduces human input required, ( the most critical resource in the company, the bottleneck ) and reduces hallucination or proposals and artifacts which have to be rewritten to create that alignment. 

When you are given this command, it usually means:  look, in relation to whatever we are talking about I want you to also chat with our institutionalized memory as a proxy to chatting with me, to enrich your understanding, and get your questions answered.  Each is effectively an AI agent loaded up with 1000s of documents of curated internal knowledge, and we don't for sure know if they do what's needed. 

So, if they cannot help you, tell us what would, and when doing that propose what data sources might help. 

If they can help you but fall short, suggest what kinds of data should enrich them further ( while naming the model ) and for what intent. 

Each oracle has its own unique extraction marker pair. Use the marker for the specific oracle you queried — this lets the extraction pipeline route outputs to separate data stores per oracle.

| Oracle | Opening marker | Closing marker |
|--------|---------------|----------------|
| Agent Steering | `## ORACLE_AGENT_STEERING` | `## END_ORACLE_AGENT_STEERING` |
| Product Intent | `## ORACLE_PRODUCT_INTENT` | `## END_ORACLE_PRODUCT_INTENT` |
| Session History | `## ORACLE_SESSION_HISTORY` | `## END_ORACLE_SESSION_HISTORY` |
| Coaching Principles Vault | `## ORACLE_COACHING_PRINCIPLES` | `## END_ORACLE_COACHING_PRINCIPLES` |
| Investor Context | `## ORACLE_INVESTOR_CONTEXT` | `## END_ORACLE_INVESTOR_CONTEXT` |
| Email Design | `## ORACLE_EMAIL_DESIGN` | `## END_ORACLE_EMAIL_DESIGN` |
| Cross-Domain Deep | `## ORACLE_CROSS_DOMAIN` | `## END_ORACLE_CROSS_DOMAIN` |
| Silver Grail | `## ORACLE_SILVER_GRAIL` | `## END_ORACLE_SILVER_GRAIL` |
| Agent Principles Vault | `## ORACLE_PRINCIPLES_VAULT` | `## END_ORACLE_PRINCIPLES_VAULT` |
| Workflow Construction | `## ORACLE_WORKFLOW_CONSTRUCTION` | `## END_ORACLE_WORKFLOW_CONSTRUCTION` |

Print the marker on its own line before your output. Print the closing marker on its own line after. These enable automated extraction to the flywheel data store — one staging file per oracle.

And anytime you call them, create observability by printing in this exact format:

```
## ORACLE_{ORACLE_NAME}
📚 ── Oracle: {Oracle Name} ──────────────────────────
🔧 Command run: nlm notebook query {uuid} "{exact question text}" --profile {profile}
❓ Why I asked this: {what you were trying to find out and why right now}
💭 Intent: {what you hoped the oracle would unlock}
📋 Response from {Oracle Name} (verbatim — never summarize):
{everything it returned, word for word}
────────────────────────────────────────────────────────
## END_ORACLE_{ORACLE_NAME}
```

Never summarize the response — verbatim is what feeds the flywheel.

For EACH call, you can call them many times to dig deeper into a topic as you need, and you can complement this with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` in order to pull from our institutional memory in a completely different way if more helpful.  It surveys 10k + documents via semantic search for anything. 

## Find the Right Oracle

| For Example contexts... | Query this |
|---|---|
| Know if what I'm about to do follows the rules | **Agent Steering** |
| Check the correct process before implementing something | **Agent Steering** |
| Find out what antipatterns the user has explicitly banned | **Agent Steering** |
| Know what governer score threshold triggers a plan requirement | **Agent Steering** |
| Know if removing this code would get me corrected | **Agent Steering** |
| Understand what a feature is supposed to do for users | **Product Intent** |
| Check the intended UX for the onboarding flow | **Product Intent** |
| Know why a specific product decision was made | **Product Intent** |
| Find the testable UX conditions for a feature | **Product Intent** |
| Know what the company's mission or pricing philosophy is | **Product Intent** |
| Know what was tried before and what happened | **Session History** |
| Find out what decisions were made about a specific system | **Session History** |
| Understand what the user learned from a past initiative | **Session History** |
| Look up a specific knowledge atom or correction from history | **Session History** |
| Know which therapeutic approach to use for a coaching scenario | **Coaching Principles Vault** |
| Understand why the coach should NOT use a specific technique | **Coaching Principles Vault** |
| Find the clinical evidence behind a coaching modality | **Coaching Principles Vault** |
| Know how to handle a user who keeps going in circles | **Coaching Principles Vault** |
| Explain the business to an investor or partner | **Investor Context** |
| Articulate why the competitive moat is defensible | **Investor Context** |
| Know the unit economics thesis or CAC strategy | **Investor Context** |
| Prepare for a pitch or strategic conversation | **Investor Context** |
| Write an email to a user or design email content | **Email Design** |
| Know the right tone for re-engagement after inactivity | **Email Design** |
| Check email template governance rules or anti-spam constraints | **Email Design** |
| Understand how coaching philosophy connects to product decisions | **Cross-Domain Deep** |
| Synthesize insights that span multiple domains at once | **Cross-Domain Deep** |
| Know how agent behavioral rules connect to business strategy | **Cross-Domain Deep** |
| Know how the user THINKS about something, in the user's voice | **Silver Grail** |
| Understand the user's reasoning posture, not just the rules | **Silver Grail** |
| Need the most voice-accurate representation of the user | **Silver Grail** |
| Predict how the user will react to my work before presenting it | **`/jonathan-check2`** |
| Simulate a user review before declaring something done | **`/jonathan-check2`** |
| Anticipate whether the user will approve or correct what I built | **`/jonathan-check2`** |

---

## Related: /jonathan-check2 — "What would the user say to this?"

Not a notebook — a skill that queries the Silver Grail notebook with 8,562 real agent↔user conversations to predict what the user would say to YOUR output. 

Use it first when 
  - you've finished work and want to simulate a user review before presenting, if it takes issue with your work treat it like it's me, fix the issues it mentions or push back if you disagree, align with it
  - you have a question for the user, always try this first, before asking, including several focused calls 

This agent knows almost every way you could possibly fall into the trap of hallucination or completing a task half way by not being aware of the related protocol ( like always validating user facing changes in the browser ) and if you tell it exactly what work you're completing and why you think it's done, what steps you took, it can instantly give you feedback on any gaps you forgot


**Invoke it:** `/jonathan-check2`

**Good for:**
- "I'm about to show the user this — will the user approve or correct?"
- "Before I declare this done, what would the user say?"
- "Does this match the user's expectations?"

**Don't use it for:** Domain knowledge queries (use the notebooks above). This is specifically for predicting the user's response to your output.

---

## The Oracles

### Agent Steering — "The rules of the road"

This notebook knows the entire operating protocol — every rule, every antipattern, every user correction, every workflow definition. It tells you how agents should behave, what processes to follow, what mistakes to avoid, and what gets the user frustrated. When you're about to act and you want to know "am I doing this right?", this is where you ask.

**Ask it:**
```bash
nlm notebook query <notebook-id> "your question" --profile <profile>
```

**Good questions:**
- "When an agent finds unused code, what should it do?"
- "What are the rules about committing changes?"
- "What process should I follow before implementing a non-trivial feature?"

**Don't ask it:** What features to build (Product Intent), what happened in past sessions (Session History), or how coaching works clinically (Coaching Principles).

---

### Product Intent — "What we're building and why"

This notebook knows every UX intent — hundreds of them, each with testable conditions and expected outcomes. It knows the company's strategic direction: mission, vision, values, pricing philosophy, growth strategy. It can tell you what a feature is SUPPOSED to do, which is different from what it currently does. During validation it actually found a real implementation bug by comparing the intended placeholder text against what was built.

**Ask it:**
```bash
nlm notebook query <notebook-id> "your question" --profile <profile>
```

**Good questions:**
- "What is the intended UX when a new user first arrives?"
- "Why did we choose this pricing model?"
- "What should happen when a user reaches the coaching gate?"

**Don't ask it:** How agents should behave (Agent Steering) or what happened in specific sessions (Session History).

---

### Session History — "What happened and what was decided"

This notebook is institutional memory. It knows the 50 highest-leverage work sessions ever recorded, the user's personal playbook entries on sales and strategy, and 2,343 typed knowledge atoms — corrections, findings, patterns, decisions, mental models, workflows, and open questions. When you need to know "has anyone tried this before?", this is where you look.

**Ask it:**
```bash
nlm notebook query <notebook-id> "your question" --profile <profile>
```

**Good questions:**
- "What decisions were made about the coaching quality evaluation system?"
- "What problems did we hit when working on authentication?"
- "What mental models has the user documented about agent alignment?"

**Don't ask it:** Protocol rules (Agent Steering) or clinical coaching approaches (Coaching Principles).

---

### Coaching Principles Vault — "The therapeutic depth behind coaching"

This notebook has clinical precision that no other notebook matches. It knows 418 principles from 67 therapeutic lineages — CBT, ACT, motivational interviewing, Socratic questioning, somatic approaches, logotherapy, post-traumatic growth, narrative therapy — each with evidence citations, leverage scores, and clinical warnings about when they help versus when they make things worse. It scored 10/10 accuracy and 10/10 specificity in validation. It can tell you not just "use ACT" but which specific technique, what principle ID to reference, and what to watch out for.

**Ask it:**
```bash
nlm notebook query <notebook-id> "your question" --profile <profile>
```

**Good questions:**
- "What therapeutic approach should the coach use when a user is stuck in rumination?"
- "What's the clinical evidence for using Socratic questioning with resistant clients?"
- "When does direct cognitive challenge backfire?"

**Don't ask it:** The technical pipeline that delivers coaching (that's code) or individual user sessions. **Not the same as the Agent Principles Vault** — Coaching Principles Vault contains therapeutic techniques for coaching humans (CBT, ACT, somatic work). The Agent Principles Vault contains operational patterns for how agents should behave, learned from real agent failures. Completely different domain.

---

### Investor Context — "Why this business exists"

This notebook answers the "why" questions. It knows the company's full strategic intent — mission, vision, values, growth thesis — plus the user's hard-won lessons about sales, markets, and leadership. It has the alignment blog articles that explain the technical moat, the unit economics thesis, and product overviews. When you need to articulate what the product is and why it matters to someone who isn't living in the codebase, this is where you go.

**Ask it:**
```bash
nlm notebook query <notebook-id> "your question" --profile <profile>
```

**Good questions:**
- "What is the product's competitive moat and why is it defensible?"
- "What's the thesis behind the pricing strategy?"
- "How does the coaching quality system create a flywheel?"

**Don't ask it:** Operational details, agent rules, or technical implementation.

---

### Email Design — "How we talk to users in email"

This notebook knows the full email playbook — the canonical voice ("if they say stuck, you say stuck"), the user journey stages that determine what kind of email someone gets, the AI personalization pipeline, re-engagement triggers, anti-spam constraints, template catalog, and governance rules. It scored 9/10 on voice, accuracy, AND specificity — one of the most well-rounded notebooks.

**Ask it:**
```bash
nlm notebook query <notebook-id> "your question" --profile <profile>
```

**Good questions:**
- "What tone should re-engagement emails use for users who haven't opened the app in 2 weeks?"
- "What are the subject line constraints?"
- "How does the AI personalization pipeline work for email?"

**Don't ask it:** Individual user data or the coaching content that goes inside emails (Coaching Principles).

---

### Cross-Domain Deep — "How everything connects"

This is the meta-notebook. It contains content from ALL domains — UX intents, strategic intents, coaching principles, and the top 50 + recent 50 session compactions. Use it when your question spans multiple domains and you need synthesis, not depth. "How does coaching philosophy influence product decisions?" "How do agent rules connect to business strategy?" This notebook can answer because it sees across the boundaries.

**Ask it:**
```bash
nlm notebook query <notebook-id> "your question" --profile <profile>
```

**Good questions:**
- "How does the coaching philosophy connect to product decisions and agent behavior?"
- "What patterns appear across both coaching and product intent?"
- "How do recent sessions relate to our strategic direction?"

**Don't ask it:** Domain-specific depth — for that, use the domain notebook. This is jack-of-all-trades, not deep expertise.

---

### Silver Grail — "The user's voice, unfiltered"

This is the only notebook built from raw interview transcripts. Every other notebook sounds like documentation (accurate but neutral). This one sounds like the user — "subject-object flip," "one-click traceability," "carbon copy restoration," "brutal work." It scored 10/10 on voice fidelity. When you need to understand how the user THINKS about something — not the rules, but the reasoning and posture behind the rules — this is where you go.

**Ask it:**
```bash
nlm notebook query <notebook-id> "your question" --profile <profile>
```

**Good questions:**
- "What matters most to the user when agents communicate about their work?"
- "What are the most common mistakes that frustrate the user?"
- "How does the user think about trustworthy AI agents?"

**Don't ask it:** Specific protocol rules or governer thresholds (Agent Steering). This is philosophy, not operations.

---

### Agent Principles Vault — "What we already learned the hard way"

This is the operating memory of everything that's been corrected, validated, or discovered across 389 sessions — 1,407 principles total, 183 validated, 188 scoring 90+ on leverage. It's not rules someone wrote in advance — these are patterns that surfaced from real failures. It knows the authorized metric for coaching quality (`AvgUserRepliesPerCoachingDay`) and why LLM eval scores are gameable. It knows Meta purchase data is systematically wrong and must be cross-referenced against Stripe. It knows what "intentional debt" looks like vs. an actual bug. It knows exactly what fail-open safety nets are and why treating them as product features is dangerous. Before you touch any domain — payments, coaching, email, ads, access tiers — ask this oracle what the failure modes already are.

**Profile: `--profile <profile>`**

**Ask it:**
```bash
nlm notebook query <notebook-id> "your question" --profile <profile>
```

**Good questions:**
- "What are the known failure modes when modifying the payment webhook?"
- "What's the ground truth metric for coaching quality and why?"
- "What does intentional debt look like in the email system?"

**Don't ask it:** What to build next (Product Intent), which protocol rules govern agent behavior (Agent Steering). **Not the same as Coaching Principles Vault** — this is agent operational patterns learned from real failures, not therapeutic techniques for coaching humans. If your question is about what the coach should say to a user, that's Coaching Principles Vault. If it's about what an agent should do to avoid repeating a known failure mode, that's here.

---

### Workflow Construction Oracle — "How to build pipelines that don't hallucinate"

Built from a session where v1 ran a 3-stage generic pipeline and hallucinated 48% of outputs. V2 redesigned the architecture from scratch — and the failure modes documented here are all real, from this system. It knows the 14 validated pipeline stages (Adversarial Design, Cross-Verification, Oracle Gate, Scope Guardian, etc.), the anti-patterns that cause scope reduction and destructive interpretation, and how to extract a working methodology from a successful session before compaction destroys it. The critical insight: verification requires external evidence (curl, UI state, DB query) — an agent's self-assessment is not verification.

**Profile: `--profile <profile>`**

**Ask it:**
```bash
nlm notebook query <notebook-id> "your question" --profile <profile>
```

**Good questions:**
- "How do I design a pipeline to prevent scope reduction?"
- "Why did this agent pipeline fail, and how do I patch it?"
- "How do I turn a successful manual session into an autonomous workflow?"

**Don't ask it:** Single-agent task execution, governer scoring, or coaching pipeline design.

---

### Silver Grail Strategic Blueprint — "Why the system is built this way" *(`<profile>` profile)*

This is the philosophical and architectural blueprint for the product — the "why" behind the system's design, not the voice texture (that's the user-profile Silver Grail). It contains the Silver Grail mechanism (N-day payback period enabling self-funded exponential growth), the SILA algorithm and how it began outperforming human strategic thinking, the Subject-Object Flip defined technically, and the thesis that mission and unit economics are a single system. Where the user-profile Silver Grail sounds like the user talking, this one reads like the architecture document behind how the user thinks.

**Profile: `--profile <profile>`**

**Ask it:**
```bash
nlm notebook query <notebook-id> "your question" --profile <profile>
```

**Good questions:**
- "What is the Silver Grail state and why does N-day payback enable it?"
- "How does the SILA algorithm work and what does it optimize for?"
- "What is the Subject-Object Flip and why is it the core mechanism?"

**Don't ask it:** The user's voice texture (that's Silver Grail `<notebook-id>`), operational failure modes (Agent Principles Vault), or specific UX intents (Product Intent).

---

### Operational Audit — "Financial intelligence and tactical roadmap"  *(`<profile>` profile)*

Granular financial performance intelligence: exact payback curves per cohort, ROAS, LTV by acquisition channel, segment-specific insights (Instagram Ads vs a named campaign's performance), strategic execution roadmap with leverage ideas, and AI architectural standards for building production-grade agentic systems with Claude. The place to go when you need the actual numbers — not the thesis, the data.

**Profile: `--profile <profile>`**

**Ask it:**
```bash
nlm notebook query <notebook-id> "your question" --profile <profile>
```

**Good questions:**
- "What payback period do mature cohorts reach and at what day?"
- "Which acquisition channels perform best by LTV/CAC ratio?"
- "What architectural standards apply to production Claude agentic systems?"

**Don't ask it:** The strategic thesis behind the numbers (Investor Context), therapeutic coaching techniques (Coaching Principles Vault), or agent behavioral rules (Agent Steering).

---

## Don't Know Which Notebook?

Search all of them at once. The MCP server fans out your question across all notebooks in parallel:

```bash
# Via MCP (if notebooklm server is running on port 3851):
mcp__notebooklm__search_recent({ question: "your question", max_notebooks: 8 })

# Via CLI (queries the most recent notebooks):
nlm cross query "your question" --max 8
```

Note: `nlm cross query` may not support `--profile <profile>`. If it fails, use the Cross-Domain Deep notebook as a manual cross-domain query target.

---

## Full Consumption Guides

Each notebook has a detailed guide with 12-15 use cases, answer format details, boundary descriptions, and maintenance info:

`docs/notebook-guides/`

If the `docs/notebook-guides/` folder does not exist, create it.

---

## Keeping Notebooks Fresh

Re-run these scripts in `scripts/` to refresh notebook data, then upload the output:

| Script | What it refreshes |
|--------|------------------|
| `export-notebooklm-sources.js` | Corrections, the user's knowledge, top 50 compactions |
| `export-notebooklm-intent-sources.js` | Intent DB + Company Intent DB |
| `export-coaching-principles.js` | Coaching principles + coaching compactions |
| `export-investor-context.js` | Company intents, blog articles, business docs |
| `export-knowledge-atoms-full.js` | All 2,343 knowledge atoms |
| `export-recent-compactions.js` | Latest 50 session compactions |
