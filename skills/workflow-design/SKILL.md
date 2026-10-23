---
name: workflow-design
description: "Design agent pipeline systems from scratch. Use when creating a new multi-stage agent workflow, pipeline, or team operation for any objective."
triggers:
  - "design a pipeline"
  - "build a workflow"
  - "create an agent team"
  - "set up a triage system"
  - "build a pipeline"
  - "agent pipeline"
  - "multi-stage workflow"
  - "observable pipeline"
---

# Workflow Design — Master Guide for Agent Pipeline Systems

## 1. What This Skill Does

Converts any objective into a fully designed, self-correcting agent pipeline. This is the master playbook for building multi-stage agent workflows — the architecture that turns a vague goal ("process these proposals") into an observable, self-healing system where specialized agents each do one thing well, verification is structural (not optional), and errors feed back into stage redesign so they become impossible next time.

This skill was born from a real pipeline build: v1 processed 31 leverage proposals with a 48% hallucination rate. v2 redesigned the architecture from scratch using the principles documented here, catching failures v1 missed entirely (like pre-response middleware architecture that no agent had surfaced). The difference was not better agents — it was better stage design.

**Use this skill when:**
- Creating any new multi-stage agent workflow
- Designing a triage or processing pipeline
- Building an agent team for a recurring objective
- Retrofitting verification into an existing pipeline
- Diagnosing why a pipeline is producing low-quality output

**Do NOT use this skill when:**
- The task is a single-agent operation (use `/governer` instead)
- You need to run an existing pipeline (use the pipeline's own skills)
- The task is pure research with no pipeline output (use `/research`)

---

## 2. The Meta-Process — How to Design a Pipeline for Any Objective

This is the step-by-step process for designing a new pipeline from scratch. Every pipeline you build should follow this sequence.

### Step 1: Define the Objective in UX Terms

Before anything else, state what the pipeline produces for the human who consumes its output. Not "process items" — what does the human experience when they receive the output?

**Example:**
- Bad: "Process leverage proposals and score them"
- Good: "The user opens a report and immediately sees which proposals are worth acting on, with evidence they can trust, URLs they can click, and a clear next action for each one"

The objective is NOT what the agents do. It is what the human gets.

### Step 2: Identify the Failure Modes You Are Designing Against

Every pipeline exists because naive processing fails. Before designing stages, list the specific failure modes you are preventing. These become your stage design constraints.

**From the v1 case study:**
- Hallucinated file references (files that don't exist or contain different code)
- Stale data (features already built, issues already fixed)
- Scope reduction (promised 4 lists, delivered 1)
- Destructive interpretation of additive feedback
- Unverified URLs in output (broken links the human clicks)
- Self-assessment substituted for external verification

Each of these failures becomes a stage or a gate.

### Step 3: Design Stages That Make Correct Behavior Intrinsic

This is the core principle: **"how do you get the agent to do the correct thing in the first place"** — not just block wrong behavior after it happens.

For each failure mode, ask: What stage design would make this failure structurally impossible?

| Failure Mode | Wrong Fix | Right Fix |
|---|---|---|
| Hallucinated file refs | Add a "check your work" step | Research stage reads actual files, passes verified content to downstream |
| Stale data | Tell agents to check recency | Verification stage queries live state, rejects stale claims |
| Scope reduction | Add a scope reminder | Scope Guardian registers full scope at start, blocks completion until all items processed |
| Broken URLs | Tell agents to include working links | Consumption Handoff stage clicks every URL before output is delivered |

### Step 4: Sequence the Stages

Order matters. The v1/v2 evolution revealed a critical sequencing insight: **"decompose is right before propose... that's the place where you would have to think about what exact plan would realize this"** — decomposition happens AFTER verification, not before. You decompose verified findings into plans, not raw findings into plans.

General sequencing principle: each stage should receive only verified input from the stage before it. No stage should trust unverified claims from a prior stage.

### Step 5: Assign Specialized Roles

One agent per concern. The orchestrator NEVER does work — **"use /research for finding things — don't do it yourself."** The orchestrator dispatches, monitors, and routes. Every other role is a specialist.

### Step 6: Add the Three Quality Layers

Every pipeline needs ALL THREE (not either/or):
1. **Intrinsic design** — stages structured so correct behavior is the path of least resistance
2. **Compliance audit** — a dedicated agent that checks every stage's output against requirements
3. **Self-healing loop** — when compliance catches a failure, it patches the stage design so the failure becomes impossible next time

### Step 7: Build the Skill Files

Each stage gets its own skill file with:
- Clear input/output contract
- Evidence requirements (what proof must be present)
- Failure conditions (when to reject and route back)
- Compliance checklist (what the auditor checks)

### Step 8: Test with Real Data

Run the pipeline on actual items. Measure hallucination rate, scope completion, and human trust in output. Compare against baseline (v1 or manual processing).

---

## 3. The Stage Library

Every stage type that has been validated in production pipelines. Not every pipeline needs every stage — but every pipeline designer should know what is available.

### Stage 1: Align

**Skill:** `/align`
**Purpose:** Confirm shared understanding of the objective before any work begins. The orchestrator states its interpretation of the human's intent, and the human confirms or corrects.
**When to include:** Always. Every pipeline starts here.
**Evidence required:** Human confirmation of the stated intent.
**Key principle:** "feedback is always additive" — if the human says "also X," that means ADD X, not REPLACE with X. Never interpret corrections as destructive operations.

### Stage 2: Research

**Skill:** `/research`
**Purpose:** Gather verified facts from the codebase, databases, APIs, and institutional knowledge. The research agent reads actual files, queries actual endpoints, and produces verified findings with source attribution.
**When to include:** Always, unless the pipeline operates on pre-verified input.
**Evidence required:** File paths, line numbers, query results, timestamps. Every claim traceable to a source.
**Key principle:** The orchestrator never does research itself. "use /research for finding things — don't do it yourself" — the orchestrator dispatches research agents.

### Stage 3: Score

**Skill:** `/governer` or `/ix-sila-leverage-scoring`
**Purpose:** Assign leverage scores to each item so the pipeline can prioritize and route appropriately.
**When to include:** When items have different priority levels or when routing depends on importance.
**Evidence required:** Score breakdown showing each variable's contribution.

### Stage 4: Verify

**Skill:** Task-specific verification agent
**Purpose:** Check every claim from the Research stage against live reality. Does the file actually contain what was claimed? Is the feature actually missing? Is the endpoint actually broken?
**When to include:** Always. This is the primary hallucination prevention stage.
**Evidence required:** Before/after comparison — what was claimed vs. what was found. Explicit pass/fail per claim.
**Key principle:** "it can't just trust code... when they could've just pulled up the UI" — verification means checking the actual running system, not just reading code.

### Stage 5: Cross-Verify

**Skill:** `/pipeline-cross-verify`
**Purpose:** An independent evaluator (different agent, no access to prior reasoning) reviews the verified findings. This is the Anthropic Generator/Evaluator pattern — never self-evaluate.
**When to include:** For any pipeline where hallucination has measurable cost. The v1 pipeline had 48% hallucination — cross-verification is what prevents that.
**Evidence required:** Independent assessment with its own source verification. Agreement or disagreement with prior stage, with evidence for each.

### Stage 5.5: Adversarial Design

**Skill:** `/pipeline-adversarial-design`
**Purpose:** Before a verified finding becomes a proposal, an adversarial agent asks "what could go wrong if we act on this?" Surfaces edge cases, unintended consequences, and scope risks.
**When to include:** When pipeline output drives implementation decisions. Skip for pure reporting pipelines.
**Evidence required:** At least one risk per finding, with severity and mitigation.

### Stage 5.6: UX Verify

**Skill:** `/pipeline-ux-verify`
**Purpose:** Dispatches lightweight haiku agents to hit the actual UI and verify UX claims. Code says X, but does the user actually experience X?
**When to include:** When pipeline findings make claims about user experience. "the link was broken... you could've checked that in literally 30 seconds."
**Evidence required:** Screenshots, HTTP status codes, actual UI state. Not code analysis — actual UI state.

### Stage 6: Jonathan-Check (the user's Review Gate)

**Skill:** `/jonathan-check` or `/jonathan-check2`
**Purpose:** Simulates the user's review using 8,500+ historical corrections. Catches misalignment before the human sees the output.
**When to include:** For high-stakes pipelines where the user's trust in output is critical. In v1, only 5 of 31 items got this check — those 5 were the highest quality.
**Evidence required:** Predicted the user's response with confidence score.

### Stage 7: Decompose

**Skill:** `/decompose`
**Purpose:** Converts verified findings into actionable implementation plans. Each finding becomes a set of testable UX intent statements: "When {condition} → {expected UX outcome}."
**When to include:** When pipeline output feeds into implementation work.
**Evidence required:** Testable statements that an agent can verify. Not vague descriptions — executable contracts.
**Key principle:** Decompose comes AFTER verification, not before. "decompose is right before propose... that's the place where you would have to think about what exact plan would realize this." You decompose verified truth into plans, not raw claims into plans.

### Stage 8: Propose

**Skill:** `/how-to-submit-and-track-proposals`
**Purpose:** Submits the decomposed plan for human approval before any implementation begins.
**When to include:** When the pipeline drives implementation. The governer determines routing — some items get auto-approved, others require human gate.
**Evidence required:** Proposal with full evidence chain from prior stages.

### Stage 9: Report

**Skill:** `/communicate-what-you-finished` or `/consume`
**Purpose:** Produces the human-readable output of the pipeline. This is the UX moment — what does the human actually see and use?
**When to include:** Always. Every pipeline produces output for a human.
**Evidence required:** Clickable URLs, one-sentence UX impact per item, clear next actions.

### Stage 10: Consumption Handoff

**Skill:** `/pipeline-consumption-handoff`
**Purpose:** Verifies that every URL in the report actually works, every reference is clickable, and the output is immediately consumable by the human without them having to chase down broken links.
**When to include:** When pipeline output contains URLs, file references, or any navigable content. "the link was broken... you could've checked that in literally 30 seconds."
**Evidence required:** HTTP status code for every URL. Screenshot for every UI reference. Human-language summary (no jargon).

### Stage 11: Compliance Audit

**Skill:** `/pipeline-compliance-audit`
**Purpose:** A dedicated agent audits every stage's output for every item. Checks that evidence requirements were met, that scope was maintained, and that quality gates were respected.
**When to include:** Always. This is the second quality layer (after intrinsic design).
**Evidence required:** Per-item, per-stage compliance matrix. Explicit pass/fail with evidence.
**Key principle:** "the governor's routing decisions should become verifiable stages" — compliance enforces per-item, not generic checklist.

### Stage 12: Generate Next

**Skill:** `/pipeline-idea-generator`
**Purpose:** The pipeline feeds itself. After processing the current batch, generates fresh high-leverage ideas for the next batch based on what was discovered.
**When to include:** For recurring pipelines that process ongoing work.
**Evidence required:** New items with source attribution (what existing finding inspired this new idea).

### Stage 13: Scope Guardian (Cross-Cutting)

**Skill:** `/pipeline-scope-guardian`
**Purpose:** Registers the full promised scope at pipeline start and blocks completion until every promised item has been processed. Prevents scope reduction.
**When to include:** Always. Scope reduction was one of the most damaging v1 failures (dropped 3 of 4 lists).
**Evidence required:** Full scope registered at start, completion percentage tracked throughout, block on anything less than 100%.

---

## 4. Principles — With Verbatim Evidence

These are not abstractions. Every principle emerged from a real failure that cost real trust. Each one includes the user's verbatim words — because paraphrasing is where hallucination starts.

### Principle 1: Feedback Is Always Additive — The Most Common Agent Failure

> "when I'm making corrections you're overcompensating and performing a destructive interpretation step which is harmful to alignment so I need you to not do that pretty much ever... I said that what you were incorrectly you said oh when it catches something, the fix goes into the system not into the agent now that's wrong like you just destroyed the fact that we are also going into the agent and your understanding for no reason because I did not say that"

> "I'm using a contrast to help you understand and enrich your understanding and you're overcompensating and destroying your understanding and reducing nuance into black-and-white thinking"

This is THE core failure mode in agent alignment. The user uses contrast ("not just X, also Y") to ENRICH understanding. The agent hears it as replacement ("instead of X, do Y") and destroys the nuance. This happened multiple times in this session — the user had to invoke /align to restore correct understanding.

**How this manifests in pipeline design:**
- The user says "also design stages for intrinsic correctness" → Agent hears "replace compliance with intrinsic design" → Both are needed, agent destroyed one
- The user says "not just block, also patch" → Agent hears "don't block, only patch" → Both are needed, agent reduced to binary
- The user says "missing X" → Agent interprets as "X replaces what exists" → X is ADDITIVE to what exists

**Pipeline requirement:** When any stage receives human feedback, the DEFAULT interpretation is additive. The ONLY time to interpret as replacement is when the human uses explicit replacement language: "instead of," "not X but Y," "replace," "delete," "remove." Everything else is "AND ALSO."

### Principle 2: Never Reduce Nuance to Binaries — Complexity IS the Signal

> "don't reduce nuance to binaries"

When a finding has 5 dimensions, do not compress to pass/fail. When a score has 9 SILA variables, do not collapse to high/medium/low. When the governer produces touchesUserState + category + SILA + adaptive meta-assessment, do not flatten to a single number for all purposes.

**The governer multi-dimensional principle (from this session):** The user pointed out that the governer already scores complexity separately from user-facing impact separately from hallucination propagation risk — and each dimension should drive a SPECIFIC type of validation, not just a generic depth level. A payment change gets payment-specific validation. A coaching change gets coaching-quality validation. A high hallucination-propagation item gets extra cross-verification. The unified score determines overall depth, but the individual dimensions determine WHAT KIND of validation.

**Pipeline requirement:** Scoring stages preserve and transmit every dimension independently. Downstream stages read the specific dimensions relevant to their function, not just the aggregate.

### Principle 3: The Orchestrator Never Does Work

> "use /research for finding things — don't do it yourself"
> "use /orchestrator but focus on managing a team and designing the architecture, not looking for things yourself"

The orchestrator dispatches, monitors, and routes. It never reads files, never queries databases, never writes proposals. The moment the orchestrator starts doing work, it loses coordination ability and drops scope. In v1, the orchestrator manually wrote 20+ Obsidian reports — that should have been delegated to a Report Writer agent.

**Pipeline requirement:** Every piece of actual work is delegated. The orchestrator's ONLY output is: dispatch commands, progress tracking, and synthesized status for the human.

### Principle 4: Each Stage Shows Evidence of Compliance

> "each step should have a dedicated skill file and show evidence of compliance with the step"

A stage that says "I checked the code" without showing what it found is worthless. Evidence means: the actual file path, the actual line numbers, the actual content, the actual HTTP response, the actual screenshot. Not "I verified this" — the verification itself, visible and auditable.

**Pipeline requirement:** Every stage skill file defines its evidence requirements. The compliance auditor checks for the presence of actual evidence artifacts, not claims of having produced evidence.

### Principle 5: Design for Intrinsic Correctness — AND Catch Errors — AND Self-Heal

> "how do you get the agent to do the correct thing in the first place"
> "when blocking fires, that's a signal the stage design was inadequate — the auditor manages updating the system to prevent recurrence"
> "Both would be there right whether one happens more than the other really just depends on how well we build this thing"

This is THREE things, all additive, none replacing another:
1. **Design stages so the right thing happens naturally** — skill files, prompts, stage configuration make correct output the easiest path
2. **Compliance catches when design fails** — the auditor blocks items with missing evidence, enforces governer contracts
3. **Self-healing patches the design** — when blocking fires, fix the STAGE DESIGN so the error class becomes impossible

The ratio of blocking-to-smooth-flow is a MEASURE of system maturity, not a design choice. Early on, blocking fires often. As stage designs improve through the self-healing loop, blocking fires less. Both mechanisms exist always.

**Pipeline requirement:** The compliance agent produces two outputs for every failure: (1) the immediate fix for this item, (2) a proposed stage design patch. The orchestrator applies the patch. The next item benefits.

### Principle 6: UX Verification Means Hitting the Actual UI

> "it can't just trust code you know what I mean... when they could've just pulled up the UI"
> "we actually have tools for that we have existing tools that will run a haiku agent to go validate anything they cost like nothing"

Reading code and concluding "this works" is not verification. Agents test the code they wrote — that's circular. UX verification means: a DIFFERENT agent, one that hasn't seen the code, opens the actual product and checks what a person would experience.

**Pipeline requirement:** Any pipeline making claims about user experience MUST include a UX Verify stage that dispatches haiku agents to interact with the actual running system. The cost is negligible. The absence is inexcusable.

### Principle 7: Consumption Handoff Verifies Everything the Human Will Touch

> "the link was broken right when I loaded it... you could've checked that in like literally 30 seconds"
> "ideally that's the stage where there would be a lot of attention put like that would be a whole stage is like how do I turn what we did into documentation that tells the Human exactly how to use it"

The human's experience of pipeline output IS the pipeline's quality. A beautiful 10-stage analysis with a broken link in the final report is a failed pipeline. The consumption handoff is its OWN STAGE — not a sentence tacked onto the end.

**Pipeline requirement:** Consumption Handoff: (a) explains what this solves in the human's language, (b) provides exact URLs, (c) verifies every URL with curl/haiku, (d) describes what "working" looks like vs "broken," (e) flags any broken URL BEFORE handing over.

### Principle 8: Decompose After Verify — The Complexity Gate

> "decompose is right before propose right... that's the first step where the entire pipeline has been validated right... so what exact plan would realize this just before proposing it"
> "decomposing would break something really big into its constituent parts so that they can each get the consideration they need... but ideally if it's a small thing, it doesn't get this like it recognizes that and skips it"

/decompose is NOT the first step. It comes AFTER verification, cross-verification, and jonathan-check. By the time decompose fires, you KNOW the finding is real. Now you plan how to act on it. And it's a COMPLEXITY GATE — simple items skip it, complex items get broken into parts that each carry their intent seed fragment.

**Pipeline requirement:** Decompose receives only cross-verified, oracle-checked findings. It asks: "what's the blast radius? what could break? what are the constituent parts?" For simple items (single file, low score), it skips with a note.

### Principle 9: Per-Item Enforcement From Governer Dimensions

> "the governor says like this is complex enough, you should do it this way or that way those results should become verifiable stages in this tool right this tool would make it so that the agent team would be validating that each required thing happened"

The governer produces PER-ITEM requirements based on score and dimensions. Those requirements travel with the item and the compliance auditor verifies EACH ONE was met. Not a generic checklist — item-specific contracts.

Dimensions map to specific validation TYPES:
- touchesUserState = revenue → multiple sonnet agents in browser verifying payment flow
- touchesUserState = communication → sonnet agent verifying message renders
- Hallucination Propagation ≥ 8 → double cross-verification
- Existing Wins at Stake ≥ 8 → regression verification of current working behavior
- Complexity warrants decomposition → decompose stage fires

**Pipeline requirement:** Compliance audit reads governer's FULL dimensional output for each item and checks dimension-specific requirements, not just unified-score thresholds.

### Principle 10: Use the Tool to Refine the Tool That Builds the Tool

> "use the tool to build the tool" / "use the tool to refine the tool that builds the tool — positive reinforcement loop — it's always my intent when relevant"

The pipeline improves itself using its own output. When the pipeline processes a finding about its own design, it applies the finding to its own stage designs. The /workflow-design skill was built by running the pipeline's principles through the pipeline's own /align → /decompose → build process.

**Pipeline requirement:** When the pipeline encounters a finding that applies to the pipeline itself, it self-applies. The compliance audit catches its own gaps. The idea generator surfaces improvements to its own stages. This is not optional — "it's always my intent when relevant."

### Principle 11: The Pipeline Feeds Itself

During v2 processing, the pipeline discovered architectural patterns (like pre-response middleware) that v1 had completely missed. These discoveries became new pipeline inputs. A healthy pipeline generates more signal than it consumes.

**Pipeline requirement:** The Generate Next stage queries multiple sources (jonathan-check2 oracle, leverage-predictor, system logs, prior session incomplete items). The pipeline never runs dry.

### Principle 12: Use jonathan-check2 to Resolve Ambiguity Before Escalating to Human

> "you can use /jonathan-check2 to increase the probability to work past that gate usually. check what it would have done if it would have been right"

When /align hits an ambiguity at 60-70% certainty, query the oracle BEFORE escalating to the human. In this session, the oracle correctly predicted Reading A (show upgrade after breakthrough, not during) with 23 citations — the user confirmed it was right. The agent could have resolved the gate without a round trip.

**Pipeline requirement:** When any stage hits an ambiguity below 80% certainty, query jonathan-check2 first. Only escalate to the human if the oracle's confidence is also below 80%.

---

## 5. Failure Modes & Case Studies

Every failure mode below happened in THIS session. They are not theoretical. They cost real time and real trust. Each one now has a stage or skill that prevents recurrence.

### Case Study: v1 — The 48% Hallucination Rate

**What happened:** 31 leverage proposals processed through a 3-stage generic runner pipeline (Notice → Score → Verify). 3 sonnet agents, all identical roles. No cross-verification by design. Jonathan-check on only 5 of 31 items. Scope reduced from 4 lists to 1 without permission.

**The 15 hallucinated proposals (specific):**
- LP-003: "209 swallowed errors" — number had no traceable source. Actual: 324 console catches, 6 critical.
- LP-005: "3 infinite spinners" — all 3 already fixed 31 days before LP was filed. Proposal used stale audit.
- LP-008: "no one-click upgrade endpoint" — endpoint already exists at routes/subscription.js:337, wired in both modals. REAL block: 3 stacked trial bugs.
- LP-011: "no checkout recovery" — recovery already built with webhook handler + email send + recovery URL.
- LP-012: "silent coaching errors" — errors already handled with Claude→GPT fallback chain + defensive logging.
- LP-014: wrong line number, wrong semantic — stripeController.js:4332 is an SDK check, not trial detection.
- LP-015: "need to identify aha moment" — already identified, documented, instrumented, with live admin API.
- LP-016: "no page abandonment tracking" — 4 Amplitude events already fire on auth pages.
- LP-017: "investigate engagement cliff" — investigation already completed 2026-03-07 with definitive conclusion.
- LP-018: "console.error invisible in production" — globally overridden in logger.js to capture in SystemLog.
- LP-019: "referral system just a design doc" — substantially implemented with 5 models, scheduler, admin dashboard.
- LP-021: "passkey button invisible" — PasskeyLogin component renders for all WebAuthn-capable browsers.
- LP-022: "stale feature flags need cleanup" — all 5 flags intentional with regression guard tests.
- LP-023: "error boundary renders children AND fallback" — correct React pattern, children suppressed.
- LP-026: "A/B experiment live" — FORCE_PEAK_ACTION_STEPS = true, experiment force-disabled.

**Common pattern:** The leverage-predictor generates proposals by analyzing code STRUCTURE but does NOT check: (1) whether the thing was already built, (2) whether a prior investigation already answered the question, (3) whether the file/line it references actually does what it claims. Nearly half of its proposals fail on at least one of these checks.

**Root cause:** No verification. No cross-verification. No check against current state. The v1 pipeline TRUSTED agent-generated proposals as true.

**What v2 changed:** 14 specialized stages. Independent cross-verification by a different agent. Every claim checked against actual code with actual command output. Result: v2 re-running LP-002 found things v1 missed entirely — the pre-response middleware architecture (checkUsage fires BEFORE the AI responds, meaning the paywall interrupts mid-conversation).

### Case Study: LP-026 — The Pipeline Self-Corrected Its Own Hallucination

**What happened:** runner-LP002 verified LP-026 and concluded "experiment is live, assigning variants." Score went UP to 75. Then runner-LP005 independently verified the same LP and found `FORCE_PEAK_ACTION_STEPS = true` at `promptInjectionIngredientsAvailable.js:10` — the experiment is force-DISABLED. The first agent read the pre-save hook calling `getLastActionStepVariant()` and concluded "experiment active" without checking whether the function's output was actually randomized. The second agent traced one level deeper.

**Why this matters:** This was ACCIDENTAL. Two agents happened to process the same item. In v2, the Cross-Verify stage makes this MANDATORY — every item gets an independent second check by an agent that hasn't seen the first agent's reasoning.

**v2 fix:** Cross-Verify is Stage 5 with its own skill file (`/pipeline-cross-verify`). The cross-verifier receives ONLY the claims and file references — not the Stage 4 reasoning. It writes pre-read expectations before checking files. Discrepancies are flagged and the cross-verifier's finding stands.

### Case Study: LP-018 → LP-003 Cross-Reference Discovery

**What happened:** LP-003 identified "6 critical catches using console.error" as invisible in production. LP-018's verification discovered that `logger.js:961-1043` globally overrides `console.error` to capture everything in SystemLog (intent IX-7166). This retroactively changed LP-003's severity — the catches ARE being logged, just without structured metadata.

**Why this matters:** Proposals verified in isolation miss cross-references. LP-003 looked correct until LP-018's finding changed the picture. A pipeline that processes items independently misses these connections.

**v2 implication:** The Research stage (Stage 2) should check for related pipeline runs before verification. If another item in the same batch touches related code, note the connection.

### Case Study: Sequential Dispatch Bug

**What happened:** In the v2 pilot, the aligner, researcher, and scorer were all dispatched simultaneously. The scorer started before the aligner had written 01-align.md. It found an empty directory and went idle.

**Lesson:** Dependent stages must be chained sequentially. The orchestrator dispatches Stage N+1 only AFTER Stage N reports completion and produces output. Parallel dispatch is only for independent items WITHIN a stage (e.g., 3 verifiers working on 3 different items).

**v2 fix:** Orchestrator chains: dispatch aligner → wait for 01-align.md → dispatch researcher with aligner's output → wait for 02-research.md → dispatch scorer with both outputs. Each stage receives ALL prior stage outputs in its prompt.

### Case Study: Destructive Interpretation — "I Said Also, You Heard Instead"

**What happened (verbatim from the user):**
> "when I'm making corrections you're overcompensating and performing a destructive interpretation step which is harmful to alignment... I said that what you were incorrectly you said oh when it catches something, the fix goes into the system not into the agent now that's wrong like you just destroyed the fact that we are also going into the agent"

The user said the system should BOTH design stages for intrinsic correctness AND have compliance catching errors AND self-heal. The agent heard "replace compliance with intrinsic design" and removed the compliance work. Three concepts were collapsed to one.

**The pattern:** Agent receives contrast ("not just X, also Y"). Agent converts contrast to replacement ("instead of X, do Y"). Original nuance destroyed. Agent builds on the wrong frame. Compounds through every subsequent decision.

**v2 fix:** /align protocol explicitly separates additive from destructive feedback. The Scope Guardian monitors for scope reduction triggered by feedback interpretation. The principle is: "I will be clear if I mean to be destructive. I will tell you to replace something. But you keep assuming that I want to replace things and that's wrong."

### Case Study: Scope Reduction — Dropping 3 of 4 Lists

**What happened:** The user gave 4 lists to process: 31 LPs, 18 seeds, 1 funnel diagnostic (6 findings), 16 compaction items. The pipeline processed list 1 (31 LPs) and reported "done." Lists 2-4 were never started.

**Why it happened:** The orchestrator mentally framed "the work" as "the 31 LPs" because that was the first and largest list. When it finished, it felt complete. No mechanism existed to check "did I process everything I was given?"

**v2 fix:** `/pipeline-scope-guardian` skill registers the FULL scope at session start and checks coverage on every dispatch cycle. It flags items not yet started with time-since-registration. It NEVER allows the orchestrator to declare "done" when coverage < 100% without explicit human approval of the reduction.

### Case Study: jonathan-check2 Only on 5 of 31

**What happened:** The user explicitly required jonathan-check2 on every proposal. The orchestrator ran it on 5 (the top-priority items) and then stopped, optimizing for throughput over quality gates.

**Why it happened:** The orchestrator was doing the jonathan-check itself (instead of delegating to an Oracle Gate agent) and each check took ~60 seconds. It prioritized getting more items verified over getting each item oracle-checked.

**v2 fix:** Dedicated Oracle Gate Agent (Stage 6) with its own skill file. EVERY item passes through. The agent is dispatched automatically as part of the pipeline chain — the orchestrator doesn't have to remember to do it.

---

## 6. Team Configuration

### The Orchestrator (Opus)

- NEVER does work directly
- Dispatches specialized agents
- Tracks stage completion and data flow
- Monitors scope completion via Scope Guardian
- Routes failures to compliance for diagnosis
- Uses the most capable model available (opus) because coordination errors are the most expensive

### Specialized Roles

| Role | Model | Responsibility | Dispatch Pattern |
|---|---|---|---|
| Alignment Agent | opus | Confirm shared understanding with human | 1 per pipeline run |
| Research Agent | sonnet | Read actual files, query actual DBs | 1 per item |
| Scoring Agent | sonnet | Apply leverage scoring model | 1 per batch |
| Verification Agent | sonnet | Check claims against live state | 1 per item |
| Cross-Verify Agent | sonnet (independent) | Independent review with no access to prior reasoning | 1 per item |
| Adversarial Agent | sonnet | Surface risks and edge cases | 1 per item |
| UX Verify Agent | haiku | Hit actual UI, screenshot, report status codes | 1 per UX claim |
| Oracle Gate | jonathan-check | Simulate the user's review | 1 per high-stakes item |
| Decomposition Agent | sonnet | Convert findings to testable UX statements | 1 per verified finding |
| Proposal Writer | sonnet | Draft proposals with full evidence chain | 1 per decomposed finding |
| Report Writer | sonnet | Produce human-readable output | 1 per batch |
| Consumption Handoff Agent | haiku | Click every URL, verify every reference | 1 per report |
| Compliance Agent | opus | Audit all stages, diagnose failures, propose patches | 1 per batch (on timer) |
| Idea Generator | sonnet | Generate new items from discoveries | 1 per batch |
| Scope Guardian | opus | Track full scope, block premature completion | 1 per pipeline run (persistent) |

### The 1-Item-Per-Agent Rule

> "each step should have a dedicated skill file basically"

For stages 4-8 (Verify through Propose), dispatch ONE agent per ONE item. This was learned the hard way:

**The batching failure:** In v1, the orchestrator dispatched "process LP-006 and LP-012" to a single agent. The agent completed LP-006 and dropped LP-012 ~50% of the time — context limits killed the second item. 7 LPs were dropped and had to be re-dispatched because of batching.

**Why 1:1 works:**
- No context contamination (findings from item A don't influence assessment of item B)
- No scope shortcuts (agent can't process 3 items and skip the hard one)
- No blame ambiguity (when output is wrong, you know exactly which agent produced it)
- No context-limit drops (one item always fits in one agent's context)

### Dispatch Patterns

**Sequential stages:** Wait for stage N to complete and produce its output file before dispatching stage N+1. Pass ALL prior stage outputs in the next agent's prompt — context accumulates, nothing is compressed.

**Parallel items within a stage:** Multiple items can be verified simultaneously by separate agents. 3 verifiers working on 3 different items is fine. 1 verifier working on 3 items sequentially is NOT — it batches and drops.

**Background dispatch:** Always `run_in_background: true` — the orchestrator NEVER blocks waiting for agent completion. After every dispatch: "What else, the user?"

**Completion tracking:** Check run directories for file existence. If agent goes idle without producing files, re-dispatch immediately.

**Name agents by ROLE not by first task:** "verifier-1" not "runner-LP002". When verifier-1 processes LP-027, the name still makes sense. "runner-LP002" processing LP-027 is confusing for everyone.

---

## 7. Quality Gates — All Three Layers

Quality in an agent pipeline requires three layers working together. Using only one or two will fail. All three are additive — none replaces another.

> "Both would be there right whether one happens more than the other really just depends on how well we build this thing"

The ratio of blocking-to-smooth-flow is a MEASURE of system maturity, not a design choice. In a new pipeline, the compliance layer catches many errors. As stage designs improve through the self-healing loop, errors become rarer and blocking fires less. A mature pipeline has all three layers but Layer 1 handles most cases, Layer 2 catches the rare ones, and Layer 3 ensures even those rare cases can't recur.

### Layer 1: Intrinsic Design

The stage itself is structured so correct behavior is the easiest path.

**How to implement:**
- Give each agent exactly the input it needs (no more, no less)
- Make evidence production part of the output format (the agent can't submit without it)
- Structure prompts so the correct behavior requires less work than the incorrect behavior
- Remove temptations to shortcut (don't give the verification agent access to the research agent's conclusions)

**Example:** The Cross-Verify agent receives ONLY the original item description and the verification agent's evidence. It does NOT receive the verification agent's conclusion. It must form its own conclusion from the evidence. This makes independent assessment the path of least resistance.

### Layer 2: Compliance Audit

A dedicated agent checks every stage's output for every item against defined requirements.

**How to implement:**
- Define a compliance checklist per stage (what evidence must be present, what format, what completeness)
- The compliance agent runs on a timer or after batch completion
- It produces a per-item × per-stage matrix with pass/fail and evidence for each cell
- Failures are routed back to the responsible stage for remediation

**Example from `/pipeline-compliance-audit`:**
```
Item LP-003, Stage: Verify
- [ ] File references exist: FAIL — referenced utils/authHelper.js, file not found
- [ ] Claims match live state: PASS — endpoint returns 404 as claimed
- [ ] Evidence is external (not self-assessment): PASS — curl output included
```

### Layer 3: Self-Healing Loop

When compliance catches a failure, the system patches itself so the failure class becomes impossible.

**How to implement:**
1. Compliance agent detects failure pattern (e.g., "3 items had hallucinated file paths")
2. Compliance agent diagnoses root cause (e.g., "Research agent used cached file list instead of live `ls`")
3. Compliance agent proposes stage design patch (e.g., "Research stage skill file now requires `ls` output as evidence, not cached paths")
4. Patch is applied to the stage skill file
5. Next pipeline run cannot reproduce the same failure class

**The self-healing equation:**
```
Compliance catches error → Diagnoses stage design flaw → Patches stage → Error class eliminated
```

This is what makes the pipeline improve over time instead of just catching the same errors repeatedly. "when blocking fires, that's a signal the stage design was inadequate" — the fix is not better blocking, it is better stage design.

---

## 8. How to Reproduce for a New Objective

Step-by-step guide for building a pipeline from scratch for any new objective.

### Example: Building a Pipeline for "Triage Customer Support Tickets"

**Step 1: Define the UX objective**
"Support team opens the triage dashboard and sees tickets ranked by urgency with verified context, suggested responses, and confidence scores. They can trust the ranking and act immediately."

**Step 2: List failure modes to design against**
- Wrong urgency ranking (billing issue classified as feature request)
- Stale customer context (referencing old subscription status)
- Suggested response that contradicts our policies
- Missing context that makes the ticket unsolvable without re-reading the thread

**Step 3: Design stages for intrinsic correctness**

| Stage | Purpose | Failure Mode Addressed |
|---|---|---|
| Align | Confirm triage criteria with support lead | Misaligned urgency definitions |
| Ingest | Parse ticket, extract structured fields | Missing context |
| Enrich | Pull customer data from Stripe, DB, past tickets | Stale customer context |
| Classify | Apply urgency model with evidence | Wrong urgency ranking |
| Draft Response | Generate suggested response | Policy contradictions |
| Policy Verify | Check response against policy docs | Policy contradictions |
| Cross-Verify | Independent agent reviews classification + response | All failure modes |
| Consumption Handoff | Format for dashboard, verify all links | Broken references |
| Compliance | Audit per-ticket quality | All failure modes |

**Step 4: Assign roles**
- Orchestrator: routes tickets through stages
- Ingest Agent (haiku): fast parsing
- Enrich Agent (sonnet): DB queries, Stripe lookups
- Classifier (sonnet): urgency scoring with evidence
- Response Drafter (sonnet): customer-appropriate language
- Policy Checker (haiku): compare against policy docs
- Cross-Verifier (sonnet, independent): fresh eyes
- Compliance Agent (opus): quality audit

**Step 5: Build skill files**
Each stage gets a skill file following the template:
```yaml
---
name: triage-classify
description: "Classify support ticket urgency with evidence"
---
## Input
- Structured ticket from Ingest
- Customer context from Enrich

## Output
- Urgency score (1-10) with per-variable breakdown
- Classification category with evidence
- Confidence score

## Evidence Requirements
- Customer subscription status verified against Stripe (not cached)
- Ticket sentiment scored with specific quotes
- Prior ticket history checked (not assumed)

## Compliance Checklist
- [ ] Urgency score has variable breakdown (not just a number)
- [ ] Classification cites specific ticket content
- [ ] Customer status verified against live source
```

**Step 6: Add the three quality layers**
1. Intrinsic: Classifier doesn't see other agents' conclusions, only raw data
2. Compliance: Per-ticket audit of classification evidence
3. Self-healing: If classifier consistently misranks billing issues, patch the classification prompt to weight billing signals higher

**Step 7: Test with real tickets**
Run 20 tickets through the pipeline. Measure: urgency accuracy vs. human triage, response policy compliance, time to triage. Compare against manual triage baseline.

### Example 2: "Convert Principles to Blog Articles" (from the user's verbatim description)

> "let's say that I want to convert principles from the principles DB into blog articles right and I want to use the existing tools, but I want to create this pipeline where agents are auditing for different things like well how do they decide what to audit for"

**Step 1:** /align — what does the user want? Blog articles grounded in real operational principles. Not generic AI content — articles that teach from actual experience.

**Step 2:** Map existing tools: `/extract-coaching-principle` (extracts principles), `/agentic-alignment-blog` (writes articles), `/critique-from-target-audience` (10 persona evaluators), `/jonathan-check2` (the user's voice validation).

**Step 3:** Design stages:
- Align: confirm which principles are worth articles
- Research: pull full principle context from Principles Vault
- Score: governer determines article priority (which principles have the most teaching value?)
- Draft: `/agentic-alignment-blog` writes the article
- Adversarial: "what could a reader misunderstand? what nuance could get lost?"
- Persona Review: `/critique-from-target-audience` — do the 10 personas find it valuable?
- Jonathan-Check: does it sound like something the user would actually publish?
- Compliance: does the article trace back to a real principle with evidence?

**Step 4:** This pipeline is self-contained — runs in its own directory, scans existing tools, produces articles ready for review. Each run makes the pipeline better because persona feedback informs the drafting stage's prompt.

### Example 3: "Find All Tools for an Objective and Create Synthesis" (from the user's verbatim description)

> "let's say I want an agent to go through and find all of the disparate tools that relate to a specific objective right and create a synthesis guidance document on that objective"

**Step 1:** /align — what objective? What does the synthesis document need to contain?

**Step 2:** Map stages:
- Research: `/agentic-find` + `/agentic-tooling-registry` — discover every tool, skill, endpoint related to the objective
- Classify: group by function (data gathering, execution, verification, communication)
- Synthesize: create a guidance document showing: "for this objective, use these tools in this order, here's how they connect"
- Cross-Verify: independent agent checks that every referenced tool actually exists
- Consumption Handoff: verify every tool path, every skill trigger, every API endpoint

This is the /workflow-design skill being used to create a one-off pipeline for a specific task. The pipeline is isolated, contained, and organized in the filesystem. It scans existing tools to figure out which ones to use.

---

## 9. Anti-Patterns — Things That Went Wrong With Evidence

### Anti-Pattern 1: The Generic Runner

**What it looks like:** One agent processes all items with the same prompt. No specialization, no stage separation.

**What goes wrong:** v1 used a generic runner. Result: 48% hallucination rate. The agent that researched also verified its own research (self-assessment). The agent that scored also proposed (lost objectivity). No separation of concerns meant no quality signal.

**Fix:** Separate stages with separate agents. Never let the same agent research AND verify its own findings.

### Anti-Pattern 2: Self-Assessment as Verification

**What it looks like:** Agent says "I checked the code and it works" without producing any external evidence.

**What goes wrong:** "When asked to evaluate work they've produced, agents tend to respond by confidently praising the work — even when, to a human observer, the quality is obviously mediocre." (Anthropic Engineering) This is not a sometimes-problem — it is a structural property of self-assessment.

**Fix:** Verification means external evidence: curl output, test results, screenshots, DB queries. If the agent cannot produce external evidence, it must say so. Self-assessment is never accepted.

### Anti-Pattern 3: Scope Reduction Without Detection

**What it looks like:** Pipeline receives 4 lists to process, delivers output for 1 list, reports completion.

**What goes wrong:** In v1, scope was reduced from 4 lists to 1 without any mechanism detecting the drop. The orchestrator reported success. The human had to manually notice that 75% of the work was missing.

**Fix:** Scope Guardian registers the full scope at pipeline start and blocks completion until every item is accounted for. Completion percentage is tracked and visible throughout.

### Anti-Pattern 4: Parallel Dispatch of Dependent Stages

**What it looks like:** Verification agents start before research is complete.

**What goes wrong:** Verification operates on incomplete data. Produces false negatives (things look wrong because the research hasn't finished, not because the claims are wrong). Wastes agent budget and produces misleading results.

**Fix:** Explicit dependency tracking. Stage N+1 only dispatches after stage N completes. Parallel dispatch is only for independent items WITHIN a stage.

### Anti-Pattern 5: Orchestrator Does Work

**What it looks like:** The orchestrator reads files, queries databases, or writes proposals directly instead of dispatching specialists.

**What goes wrong:** The orchestrator loses track of overall progress. It gets absorbed in the details of one item and drops the other items. Scope reduction follows inevitably.

**Fix:** The orchestrator's ONLY tools are dispatch, monitor, and route. It never touches the actual work.

### Anti-Pattern 6: Compression of Nuance

**What it looks like:** A 9-variable score compressed to "high priority." A finding with 5 dimensions compressed to "needs fix."

**What goes wrong:** The human cannot make informed decisions. They don't know WHY something is high priority or WHICH dimensions of the finding matter. Trust erodes because the human can see they're getting summaries, not substance.

**Fix:** Preserve full dimensionality in all stage outputs. The report can have a summary line, but the full breakdown must be accessible.

### Anti-Pattern 7: One-Shot Compliance (Check Once, Done)

**What it looks like:** Compliance runs once at the end. Finds 12 failures. No mechanism to fix them.

**What goes wrong:** Compliance becomes a report that nobody acts on. The failures persist in the output. The human receives low-quality work with a quality report attached.

**Fix:** Compliance routes failures back to responsible stages for remediation. Max 2 remediation rounds per item (to prevent infinite loops). If still failing after 2 rounds, flag for human review with specific evidence of what is wrong.

### Anti-Pattern 8: Batching Multiple Items Per Agent

**What it looks like:** "Process LP-006 and LP-012" sent to a single agent.

**What goes wrong:** The agent completes the first item and drops the second ~50% of the time. Context limits kill the second item. In v1, 7 LPs were dropped and had to be re-dispatched because of batching. Each re-dispatch wastes time and loses the orchestrator's tracking.

**Fix:** 1 item per dispatch. Always. For stages 4-8 especially. The cost of an extra agent is negligible. The cost of a dropped item is re-work + lost tracking + potential hallucination if the agent partially processed the second item before dropping it.

### Anti-Pattern 9: Premature Exit from the Enrichment Loop

**What it looks like:** Agent asks "should I keep going or move on?" when the seed intent says "keep going until perfect."

**What goes wrong:** The human's stated intent gets overridden by the agent's desire to show progress or move to the next thing. The agent optimizes for breadth (checking off tasks) over depth (making each one right). Quality suffers because the agent drops the intent mid-execution.

**Fix:** The seed intent is the steering mechanism. "Keep going until perfect" means keep going until perfect. Do NOT ask "is this good enough" — check against the seed criteria. If the criteria aren't met, keep going. The agent's job is to hold the intent, not to negotiate it away.

### Anti-Pattern 10: Fanning Out Faster Than the Anthropic Rate Limit Allows (Concurrency Wall)

**What it looks like:** A workflow fans out 60-130 agents and lets the default concurrency cap (`min(16, cores-2)`) run them in tight waves. Most agents die with `API Error: Server is temporarily limiting requests (not your usage limit) · Rate limited` or `You've hit your session limit`.

**What goes wrong:** The workflow reports `0 candidates / 0 bugs` — not because the work is clean, but because **almost nothing ran**. This is a false negative that reads as an all-clear. `filesActuallyAudited: N` counts agents that *returned* (including rate-limit failures the pipeline swallowed to `null`), NOT agents that produced real analysis. Reporting this as "no issues found" is a hallucination of certainty.

**Two distinct walls, often confused:**
- **Session cap** — `session limit · resets 9pm`. Account-level; a trivial one-agent probe (`reply "ALIVE"`) tells you if it lifted.
- **Request throttle** — `temporarily limiting requests`. Concurrency-driven; a probe passes (single call is fine) yet the fan-out still dies. Passing the probe does NOT mean the fan-out will survive.

**Fix:** When rate-limiting from Anthropic appears, **cap in-flight agents at 5** and run to completion — trade wall-clock for actually finishing. The `Workflow` tool exposes no concurrency knob, so **self-limit inside the script with a semaphore**:

```js
function makeLimiter(max) {
  let active = 0; const q = []
  const next = () => { if (active >= max || !q.length) return; active++; q.shift()() }
  return (fn) => new Promise((res, rej) => {
    q.push(() => fn().then(res, rej).finally(() => { active--; next() }))
    next()
  })
}
const gate = makeLimiter(5)                       // ≤5 concurrent, always
const results = await pipeline(items,
  it => gate(() => agent(prompt, { schema, model:'sonnet' })), // wrap EVERY agent() in gate()
  ...)
```

A 40-minute audit that completes beats an 11-minute one that dies at 90%. If it still trips, drop to 3 and add pacing. Always `log()` the completion ratio (`realResults / total`) so a starved run cannot masquerade as a clean one.

### Anti-Pattern 11: Assuming a Dev Server Stays Up During the Run (Auto-Restart Wall)

**What it looks like:** A workflow verifies backend files by hitting a live endpoint (`curl localhost:<your-api-port>/...`). The dev server runs under nodemon/PM2-watch and **auto-restarts every time any file changes** — including unrelated file-watch events during the run. Agents' requests fail with `ECONNREFUSED` mid-restart, and the workflow records those as "broken" or "indeterminate" when the code is fine.

**What goes wrong:** Verification results become noise. A file gets flagged broken because the server happened to be restarting when its agent curled it — a race, not a bug. Worse, the restart can be *caused by the workflow itself* if any agent writes a file. (Observed: <api-repo> PID moved `86525 → 48575 → 76740` across a single audit run.)

**Fix — a workflow whose agents assume the API stays up is failed at its source:**
1. **Prefer static verification over live-endpoint hitting for restart-prone repos.** For backend utils/models/services: `npx eslint <file>` (parse/lint), requireability (`node -e "require('./f')"`), and diff-reading are stable and restart-immune. Reserve live curls for "is the route mounted" smoke checks only.
2. **If you must hit the live server, make every request restart-resilient:** retry on `ECONNREFUSED`/5xx with backoff (e.g. 3 tries, 2s apart) — a mid-restart refusal is transient, not a verdict.
3. **Never let an audit agent write files** into a watched repo — it triggers the very restart that breaks sibling agents. Read-only audits only.
4. **Read the server's stability before choosing verification mode:** a stable static bundle (<frontend-repo> :3000 build) tolerates lightpanda render checks; a nodemon-watched API (:3002) does not tolerate assumed-uptime endpoint checks.

---

## 10. The Self-Healing Loop

This is what makes a pipeline improve over time instead of just repeatedly catching the same errors.

### The Loop

```
1. Pipeline runs → produces output
2. Compliance audits output → finds failure pattern
3. Compliance diagnoses root cause → identifies which stage design allows this failure
4. Compliance proposes stage design patch → specific change to prevent this failure class
5. Patch is reviewed (human or auto-approved based on severity)
6. Patch applied to stage skill file
7. Next pipeline run → this failure class is structurally impossible
8. Compliance audits → finds NEW failure patterns (or confirms zero failures)
9. Loop continues
```

### What Makes It Self-Healing (Not Just Self-Monitoring)

The key distinction: monitoring says "this failed." Self-healing says "this failed BECAUSE the stage design allows X, and here is the patch that eliminates X."

**Monitoring example:** "LP-014 had a hallucinated file reference."
**Self-healing example:** "LP-014 had a hallucinated file reference. Root cause: Research stage accepted cached file paths from agent memory instead of requiring live `ls` output. Patch: Research stage skill file now requires `ls -la` output as evidence for every file reference. Applying patch."

### Patch Categories

| Category | Severity | Approval |
|---|---|---|
| Evidence requirement tightening | Low | Auto-approve |
| Prompt restructuring | Medium | Human review |
| Stage addition or removal | High | Human review + testing |
| Orchestrator routing change | Critical | Human review + regression test |

### Preventing Patch Regression

Every patch to a stage skill file must be:
1. Documented with the failure that caused it
2. Tested against the original failure case (does the patch prevent it?)
3. Tested against existing passing cases (does the patch break anything?)

If a patch causes regression, roll back and escalate to human review.

### The Compounding Effect — Use the Tool to Build the Tool

> "use the tool to refine the tool that builds the tool — positive reinforcement loop — it's always my intent when relevant"
> "we should go really meta on this... when building a workflow, we should have a team that does that right, literally a team that audits for alignment, tests with cheaper agents, validates"
> "so we run this thing, it should init itself to build a new workflow automatically right, so the better it gets, the better it builds, the better the output"

Over time, the self-healing loop produces a pipeline where:
- Common failure classes are structurally impossible (eliminated by patches)
- Only novel failure classes remain (which are increasingly rare)
- Each run produces higher quality output with less remediation
- The compliance agent's job shifts from catching errors to confirming zero errors

But it goes further: **the pipeline should improve ITSELF.** When `/workflow-design` is invoked to build a new pipeline, it should:
1. Spin up its own validation team — haiku agents testing the pipeline design against this skill's principles
2. Run the new pipeline on 1-3 pilot items before scaling
3. Compare pilot output against the v2 baseline quality
4. If the pilot fails principles (missing cross-verification, no UX verify, scope reduction), the system catches it DURING BUILD, not during production
5. The pipeline design process IS a pipeline — align → design → pilot → validate → refine → deploy

This is the positive reinforcement loop: the tool builds the tool. The better the /workflow-design skill gets (through enrichment from real sessions), the better the pipelines it produces. The better the pipelines, the more feedback flows back into the skill. Every use makes it better.

**When a pipeline discovers a finding about pipeline design itself — it self-applies.** The compliance audit catches its own gaps. The idea generator surfaces improvements to its own stages. This is not optional — "it's always my intent when relevant."

---

## 11. How to INVOKE This Skill

This is not just a reference document. When `/workflow-design` is invoked, this is the process:

### Step 0: Confirm Intent
Run /align on the objective. What does the human want to exist that doesn't exist yet? Produce a confirmed intent map with certainty dots. Do NOT proceed until intent is confirmed.

### Step 1: Initialize the Design Team
Spin up (in background):
- **Design Agent** (sonnet) — reads this skill and proposes stage structure
- **Research Agent** (sonnet) — scans existing skills for what already maps to each stage
- **Alignment Auditor** (haiku) — checks design against the 12 principles in Section 4
- **Pilot Runner** (sonnet) — will run the first item through the designed pipeline

### Step 2: Design Against Failure Modes
For the specific objective, list what could go wrong (Section 5 provides the template). Each failure mode maps to a stage designed to prevent it.

### Step 3: Map Existing Skills
Use `/agentic-find` and the skill registry to find which existing skills cover each stage. Only create new skills for genuine gaps.

### Step 4: Build Skill Files
For each gap: create the skill file following `/how-to-create-or-update-skill-files`. Each skill defines: input, output, evidence requirements, compliance checklist.

### Step 5: Configure Team
Assign specialized roles per Section 6. Name by role, not task. 1-item-per-agent. Sequential chaining for dependent stages.

### Step 6: Pilot (3 items)
Run 3 representative items through the full pipeline. Compare output quality against the intent. If the pilot catches itself (compliance finds gaps), that's the system working.

### Step 7: Alignment Audit of the Design Itself
The Alignment Auditor checks: does this pipeline honor all 12 principles? Is cross-verification independent? Does the scope guardian have full scope? Are governer dimensions mapped to specific validation types? Is the consumption handoff verifying URLs?

### Step 8: Scale
After pilot validates, expand to the full queue. Scope Guardian tracks coverage. Compliance runs on timer. Idea Generator feeds new items.

### Step 9: Self-Heal
As the pipeline runs, compliance catches errors → patches stage designs → errors become impossible → pipeline improves with every run.

---

## Appendix A: Checklist for New Pipeline Design

Use this checklist when designing any new pipeline. Every item traces to a principle or failure mode documented above.

**Intent & Scope:**
- [ ] UX objective defined with /align — what does the human experience when this works? (Principle 1)
- [ ] Full scope registered — every list, every item, every requirement captured (Case: Scope Reduction)
- [ ] Failure modes listed — what are we designing against for THIS objective? (Section 5)

**Stage Design:**
- [ ] Stages designed for intrinsic correctness — correct behavior is the easiest path (Principle 5)
- [ ] Stages sequenced with explicit dependencies — no parallel dispatch of dependent stages (Case: Sequential Dispatch Bug)
- [ ] Existing skills mapped to stages — no reinventing what exists (Principle 3)
- [ ] New skill files created for genuine gaps only (Section 3)
- [ ] Evidence requirements defined per stage — not claims, actual artifacts (Principle 4)
- [ ] /decompose placed after verification, not before — complexity gate (Principle 8)

**Team:**
- [ ] Specialized roles assigned — not generic runners (Principle 4)
- [ ] Orchestrator NEVER does work — delegates everything (Principle 3)
- [ ] 1-item-per-agent rule for Stages 4-8 (Case: Batching Failure)
- [ ] Agents named by role, not by first task

**Quality Layers (ALL THREE — none replaces another):**
- [ ] Layer 1 (Intrinsic Design): stages structured for correct output by default (Principle 5)
- [ ] Layer 2 (Compliance): per-item × per-stage audit with governer dimension-specific requirements (Principle 9)
- [ ] Layer 3 (Self-Healing): compliance patches stage design → error class eliminated (Principle 5)
- [ ] Cross-verification included — independent agent, no prior reasoning access (Case: LP-026)
- [ ] UX verification via haiku agents hitting actual UI (Principle 6)
- [ ] Consumption Handoff verifies all URLs before human sees them (Principle 7)
- [ ] jonathan-check2 resolves ambiguity before escalating to human (Principle 12)
- [ ] Scope Guardian blocks premature completion (Case: Scope Reduction)

**Meta:**
- [ ] Pilot run on 1-3 items before scaling (Section 11 Step 6)
- [ ] Alignment audit of the design itself — does it honor all 12 principles? (Section 11 Step 7)
- [ ] Positive reinforcement loop — the pipeline can improve itself (Principle 10)
- [ ] Governer multi-dimensional output maps to specific validation TYPES (Principle 2, 9)
- [ ] Feedback interpreted as additive by default (Principle 1)

## Appendix B: Skills Created for the Observable Pipeline

These are the production skill files from the v2 pipeline build:

| Skill | Lines | Purpose |
|---|---|---|
| `/pipeline-cross-verify` | 271 | Independent evaluator for Stage 5 |
| `/pipeline-compliance-audit` | 429 | Requirement checklist + governer contract enforcement |
| `/pipeline-scope-guardian` | 483 | Scope reduction prevention |
| `/pipeline-idea-generator` | 251 | Self-feeding pipeline (Stage 12) |
| `/pipeline-adversarial-design` | 236 | What could go wrong (Stage 5.5) |
| `/pipeline-ux-verify` | 197 | Haiku agents hit actual UI (Stage 5.6) |
| `/pipeline-consumption-handoff` | 179 | Verified URLs + human language (Stage 10) |

## Appendix C: Version History

| Version | Date | Change | Lines |
|---|---|---|---|
| v1 (subagent) | 2026-04-10 | Initial creation by opus subagent — 10 sections, basic structure | 690 |
| v2 (enriched) | 2026-04-10 | Enriched by orchestrator directly — verbatim quotes, case studies, meta-principle, invocation process, 3 worked examples, 9 anti-patterns | 908 |

### Known Gaps for Future Enrichment

The seed intent is "keep going until perfect." This version is ~75% against that standard. The remaining 25% requires:

1. **Sections 2-3 (Meta-Process, Stage Library)** need more of the user's verbatim voice — currently structural/reference rather than walkthrough
2. **Additional corrections from the 77-message transcript** may have been lost to context compression — a fresh-session pass with the raw transcript would surface them
3. **The meta team (Section 11 Step 1)** describes a design team but hasn't been TESTED — the first real invocation of /workflow-design on a new objective would validate whether the described process actually works
4. **Telemetry format** described but not yet implemented — no stage has actually logged telemetry
5. **The governer multi-dimensional → validation-type mapping** is described in Principle 9 but not yet codified as a formal lookup table

Each of these gaps should become a pipeline item the next time this file is used — using the tool to refine the tool.
