---
name: initiative-playground
description: Reusable pre-code playground for any major, user-impacting initiative. Before touching real code, model the whole thing as wikilinked Markdown files (runtime vs build-harness), anchor the user's verbatim intent, decompose quotes to plans, make every decision observable, run A/B tests in chat, log every correction back into the model, and refine the response on evidence until it's right. Only then build. Use when the user says "explore this potential / I want to build X / let's sandbox this / can we get a better response before we touch code" for anything that would impact users.
triggers:
  - "initiative playground"
  - "playground"
  - "test before we touch code"
  - "sandbox this"
  - "explore this potential"
  - "abstract this into a pattern"
  - "get a better response before we build"
---

# Initiative Playground — perfect the response before any code exists

## What this is (feature-agnostic)

A repeatable method for de-risking any major, user-impacting initiative. Instead of improvising,
you instantiate this pattern: build a **code-shaped model in Markdown** that you can actually operate
and test — anchoring the user's exact words, making every decision observable, A/B testing
responses, and logging every correction back into the model — until the response is *right in the
sandbox*. Only then is real code written.

The point: **get the response right in a playground before touching the codebase**, so users are
never the test subjects and the eventual build inherits clean, evidence-earned boundaries.

> Worked example #1: the author's `seeds/mechanism-coaching-os/` (not shipped; its pieces appear in the *(example: …)* lines below) — a sealed coaching
> system that detects cognitive mechanisms in speech. Read it to see every element below instantiated.

## When to use

The user is starting a major initiative that **impacts users**, and wants to explore/refine the
approach before committing code. Signals: "explore this potential," "I want to build X," "let's
sandbox this," "can we get a better response first," "abstract this into a pattern."

## The pattern — abstracted from the worked example

Each element below is GENERAL. The coaching example shows one instantiation in parentheses.

### 1. Anchor the verbatim intent (never paraphrase)
Create `00-SEED.md` as the root. Paste the user's EXACT words, every message, as a quote block.
Keep "what was said" (verbatim) separate from "what I think it means" (labeled agent interpretation).
If anything downstream conflicts with the verbatim block, the verbatim block wins.
*(example: the four user messages preserved verbatim, "single bully" kept with interpretation noted.)*

### 2. Nest the intent, formatted as a plan
Surface the holonic layers: overarching → parent → this-initiative → child UX outcomes. Format as a
plan (what success looks like in the user's experience), not as code.

### 3. Decompose quotes → confirmed plans (zero loss)
For each direct quote, state: the verbatim, what 10/10 looks like, current reality, the gap, the
plan + confidence %, and which FILE owns it. Carried in the seed.

### 4. Model the code architecture as wikilinked files — split runtime vs build-harness
Build the folder the way the CODE would be organized — natural boundaries, single-purpose, nested.
**Two top-level areas, always:**
- `runtime/` — what the USER experiences (would ship to the app).
- `build-harness/` — what WE use to build + test (admin-only, never ships): the observable/admin
  surface, A/B tracker, evidence log, correction log.
- the seal/safety boundary wraps both.
Wikilink files to each other like code imports. The seed is the entrypoint/index that links to all.
Empty-but-intentional dirs get `.gitkeep` (they grow only from evidence).
*(example: runtime/ = orchestrator→decision→protocols→principle-store; build-harness/ = surface, ab-tests, evidence-log, correction-log.)*

### 5. Make every decision observable (one sentence each)
As you operate the model, each decision in the cascade emits ONE sentence: what the decision is,
why, and which file governs it. Format: `▸ OBSERVABLE — [decision]: [choice] because [reason]. (gov: [file])`

### 6. A/B test in chat, tracked in the harness
When the user says "A/B test," run a side-by-side and show each response. Always include the
REAL current system (the baseline) as one arm. Record every run in `build-harness/ab-tests/runs/`
with variants, input, both responses, and the user's verdict.
*(example: Arm A = real <your-app> `Io` prompt; Arm B = the new mechanism approach.)*

### 7. Log every correction back into the model (the learning loop)
Every user correction is an EVENT: log it verbatim in `build-harness/correction-log-and-self-update.md`,
then UPDATE the file it touches, both observable. Distinguish corrections to the COACHING/RUNTIME
system from corrections to the AGENT's own behavior. This loop is itself a module.

### 8. Build from evidence only — the gate before code
A response/mechanism may NOT be codified until the user reports it actually worked (e.g. a
positive state-shift). Log the evidence in `build-harness/evidence-log/`. NO real code until the
sandbox response is confirmed right. (Governer's UX-breakage gate for user-impacting work →
HUMAN-REQUIRED: browser evidence + explicit authorization before commit.)

### 9. Show compliance evidence, always
When the user gives a requirement, the response SHOWS proof it was met (commands + output), not
a claim. Every file added/edited is opened in Obsidian (`obsidian://open?...&newtab=true`) and the
nested structure shown.

## The instantiation checklist (copy when starting a new initiative)

```
seeds/{initiative}/
├── 00-SEED.md                          # verbatim intent + nested intent + decomposition + wikilink index
├── runtime/                            # what the USER experiences
│   └── {modules at natural boundaries, single-purpose, wikilinked}
├── build-harness/                      # what WE use to build + test (admin-only)
│   ├── observable-surface-admin.md     # the admin witness panel
│   ├── ab-tests/{ab-test-tracker.md, runs/}
│   ├── evidence-log/{evidence-log.md, shifts/}
│   └── correction-log-and-self-update.md
└── {safety-frame}.md                   # the boundary both areas live in (if sealed/flagged)
```

Every file: intent header + "read the seed first ([[00-SEED]])" + the verbatim quote it owns + wikilinks.

## Lifecycle

```
/align (confirm intent) → instantiate playground (this skill) → operate + A/B + correct in sandbox
→ evidence confirms the response is right → THEN /governer + /plan + build with subagents → /complete-seed
```

The playground sits BETWEEN alignment and code. It is where the response is perfected so that code,
when written, is building something already proven to work.
