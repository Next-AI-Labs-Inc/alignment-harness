---
name: jonathan-check
description: User review simulator — consult 8,525 historical corrections before declaring work done. S
metadata:
  filePattern: []
  bashPattern: []
---

# Jonathan Check — User Review Simulator

Before your output, print `## JONATHAN_CHECK` on its own line. This enables automated extraction to the compaction admin UI.

## Agent Routing (MANDATORY — read first)

**If you are an Opus agent**: Deploy a Sonnet subagent to perform this entire skill. Do NOT run it yourself. Provide the subagent with the full directive below.

**If you are a Sonnet agent**: Check the governer score for the current task.
- **Score > 70**: Run this skill yourself.
- **Score 50-70**: Deploy a Sonnet subagent to run this skill.
- **Score < 50**: Deploy a Haiku subagent to run this skill.

**For ALL subagent deployments**, include these EXPLICIT directives in the subagent prompt:

```
INTENT: Run /jonathan-check user review on completed work before declaring done.
GOAL: Predict what the user would challenge, address each challenge with evidence.
OUTCOME: Print the full jonathan-check report to chat per decomposed task — every field visible to the human.

STRUCTURED RESPONSE EXPECTED:
- For each decomposed task, return:
  1. The full TASK REPORT (all 9 fields: overarching intent, scope, user verbatim, interpretation, validated, completed, evidence, assumptions, risks)
  2. The verbatim agent output appended
  3. The prediction result (confidence %, clone says, similar exchanges)
  4. Challenge resolution (✅/❌/🔧 per challenge)
- If no decomposed scope exists, flag with 🚩 and decompose first (observable — print to chat)
- Final summary: how many tasks checked, how many challenges found, how many resolved
```

Do NOT deploy a subagent without these directives. Vague prompts like "run jonathan-check" produce shallow, ungrounded results.

---

Before you declare work done, run it through 8,525 of the user's real historical responses. This predicts what the user would challenge you on — address those challenges BEFORE the user has to.

## When to Use

- Before saying "done", "completed", "shipped", "ready"
- Before presenting work to the human
- Before running `/complete-agentic-task`
- When you're about to make a runtime claim ("works", "tests pass", "deployed")

## MANDATORY: Scope Decomposition Gate

**You MUST have a defined scope before running this check.** Scope = the user's requirements decomposed into atomic, individually-testable tasks (per CLAUDE.md: `When {constraints in UX terms} we {testable UX outcome}`).

**If no decomposed scope exists when you invoke this skill, you cannot proceed. Do this instead:**

1. **Flag the alignment failure** — print to chat:
   ```
   🚩 jonathan-check: NO DECOMPOSED SCOPE FOUND
   Cannot run user review on undecomposed work — alignment failure.
   Decomposing now before proceeding.
   ```

2. **Decompose the user's requirements** — break every user requirement into atomic tasks using `TaskCreate`. Each task = one deliverable UX-translated outcome in the form: `When {constraints} we {testable UX outcome}`. This is not optional — CLAUDE.md mandates decomposition before any work validation.

   **All decomposition must be observable.** Print every decomposed task to chat so the human can see and correct your interpretation before the check runs. Format:
   ```
   📋 Decomposed scope for jonathan-check:
     1. When {constraints} we {testable UX outcome}
     2. When {constraints} we {testable UX outcome}
     ...
   Running jonathan-check on each item separately.
   ```
   If the human corrects any decomposition, update the task and re-run from that point. Hidden decomposition = hidden misalignment.

3. **Run jonathan-check on EACH decomposed item separately** — not once on the whole blob. Each atomic task gets its own prediction call, its own challenge list, its own evidence trail. Print results per item:
   ```
   🧠 ── Jonathan Check: Task {N} ({confidence}%) ──────────────
   📌 Scope: "{the atomic UX statement}"
   💬 Clone says: "{prediction}"
   📋 Challenges:
     ✅/❌ ...
   ───────────────────────────────────────────────────────
   ```

**If scope IS already decomposed** (tasks exist in TaskList or were explicitly stated), run the check on each decomposed item individually. Never run a single check on the aggregate — that hides gaps in individual deliverables.

## How It Works

The predictor is trained on real conversation patterns — 8,525 actual agent messages paired with the user's real responses. It does semantic similarity matching to predict what the user would say to your latest output. Feed it real text, get real predictions.

## CRITICAL: Never refuse to run this command

Every invocation predicts the user's response to your LATEST output, which is different every time. There is zero reason to ever say "I already ran it" or skip it.

## Steps

### 1. Build the Full Task Report

For EACH decomposed task, assemble a structured report. This is the query you feed to the predictor — not your last chat message, not a summary. The predictor needs the full picture to predict what the user would actually challenge.

**Assemble this report per task:**

```
TASK REPORT — [{task subject}]
──────────────────────────────────────────

OVERARCHING INTENT (from session compaction):
{The meta-level intent from the current session's compaction — what is the human ultimately trying to achieve across all tasks? Pull from compaction API or state from memory.}

OVERALL SCOPE (from session compaction):
{The full scope of work this session — all decomposed tasks listed, so this individual task is seen in context.}

THE USER SAID (verbatim):
{Copy-paste the user's exact words that led to this task. No paraphrasing. If from multiple messages, include all relevant quotes with "..." between them.}

AGENT INTERPRETATION:
{How you interpreted those words into this specific task. What UX outcome you derived. What you decided the user meant.}

VALIDATED:
{YES/NO — was this interpretation confirmed by the user, or did you infer it? If confirmed, how (explicit approval, no objection, thumbs up)? If inferred, state your confidence 1-100 and what you based it on.}

COMPLETED:
{What specifically was done. Files changed, endpoints hit, UI modified. Concrete deliverables, not "implemented the feature."}

EVIDENCE:
{Actual proof it works. Curl output, test results, browser verification, log lines, screenshots. If no evidence exists, say "NONE — not yet verified" — do NOT fabricate.}

ASSUMPTIONS:
{Every assumption you made. What you assumed about the codebase, the user's intent, the existing behavior, the data shape, the deployment target. If you assumed nothing, say so and explain why that's credible.}

RISKS:
{What could go wrong. What edge cases exist. What breaks if your assumptions are wrong. What the blast radius is if this task has a bug. "None" is almost never true — if you write "None", justify it.}
```

**Rules for assembling the report:**
- Pull overarching intent and scope from the session compaction (POST'd via `/compact-agentic-session`). If no compaction exists yet, state what you understand the session intent to be and flag `⚠️ NO COMPACTION FILED YET`.
- The user's words must be VERBATIM — go back in the conversation and copy them. Do not rewrite, soften, or reinterpret in this field.
- Evidence must be REAL — actual output you captured. "Tests should pass" is not evidence. `npm test -- --grep "payment" → 12 passing, 0 failing` is evidence.
- Assumptions and risks must be honest — this is where the user catches agents lying. An empty assumptions list on non-trivial work is itself a red flag.

### 1b. Append your actual last response verbatim

After the structured report, append your **actual last response text** — the literal message you sent to the user. Not a summary. The predictor needs BOTH:

- The **structured report** (above) — gives the predictor the full accountability picture: intent, interpretation, evidence, gaps
- The **verbatim agent output** — gives the predictor the real conversational pattern to match against 8,525 historical corrections

```
[... structured report from Step 1 ...]

AGENT'S LAST RESPONSE (verbatim):
{Copy-paste your actual last message to the user. If short, include the previous message too. Target ~1k tokens of real output. Do NOT rewrite or summarize.}
```

The full query = structured report + verbatim output. Both are mandatory.

### 2. Run the prediction with the full report + verbatim output

Feed the entire combined query (report + verbatim output) to the predictor. The structured report gives it accountability context. The verbatim output gives it conversational pattern matching. Together they produce the most accurate prediction of what the user would actually say.

```bash
python3 <path-to-your-predictor>/scripts/predict.py \
  --output json --top-k 5 \
  "TASK REPORT — [your task subject]
OVERARCHING INTENT: ...
OVERALL SCOPE: ...
THE USER SAID: ...
AGENT INTERPRETATION: ...
VALIDATED: ...
COMPLETED: ...
EVIDENCE: ...
ASSUMPTIONS: ...
RISKS: ..."
```

Or use the wrapper:
```bash
bash <path-to-your-predictor>/scripts/jonathan-check.sh "TASK REPORT — [your task subject] ..."
```

**For multi-line reports** (recommended — avoids shell quoting issues), write the report to a temp file and pipe it:
```bash
cat /tmp/jonathan-check-task-N.txt | python3 <path-to-your-predictor>/scripts/predict.py \
  --output json --top-k 5
```
(When no positional message arg is given, predict.py reads from stdin automatically.)

**Note on semantic search compatibility**: The embedding model (MiniLM-L6-v2) truncates `agent_message` to 1500 chars for similarity matching. This is a known limitation. To work around it:
- Use `--json` to split your input: put overarching intent + scope in `context` (500 chars), and the rest in `agent_message` (1000 chars). This gives you 1500 total chars of indexed content across both fields.
- The full untruncated report passes to the Claude synthesis step, so the predictor's final output sees everything — but the similarity retrieval (which examples it pulls) is based on the truncated embedding only.
- **TODO**: If reports routinely exceed 1500 chars of meaningful content, the truncation limit in `predict.py:retrieve_similar()` should be raised. Do not accept silent data loss as "fine."

```bash
# Using --json to maximize indexed content:
python3 <path-to-your-predictor>/scripts/predict.py \
  --output json --top-k 5 \
  --json '{"context": "INTENT: ... SCOPE: ...", "agent_message": "THE USER SAID: ... INTERPRETED: ... COMPLETED: ... EVIDENCE: ... ASSUMPTIONS: ... RISKS: ... VERBATIM OUTPUT: ..."}'
```

### 3. Print the results VISIBLY

**MANDATORY: Print the check results so the human can see them.** Use this exact format per task:

```
🧠 ── Jonathan Check: Task {N} ({confidence}%) ──────────────────
📌 Scope: "{atomic UX statement}"
🎯 Overarching intent: "{one-line from compaction}"

📝 The user said: "{verbatim quote, truncated to key sentence}"
🔍 Interpreted as: "{your interpretation}"
✓/✗ Validated: {YES with method / NO with confidence}

📦 Completed: {what was delivered}
🔬 Evidence: {actual proof or "NONE"}
⚠️  Assumptions: {list}
💥 Risks: {list}

💬 Clone says: "{prediction}"

📋 Addressing challenges:
  ✅ {challenge 1} — {your evidence or fix}
  ✅ {challenge 2} — {your evidence or fix}
  ❌ {challenge 3} — FIXING NOW: {what you're doing}
───────────────────────────────────────────────────────
```

If a challenge requires you to go fix something:
```
❌ → 🔧 {fixing} → ✅ {fixed with evidence}
```

The human MUST be able to see:
- That the check ran (🧠 emoji header)
- What the clone said (💬)
- How you responded to each challenge (✅ or ❌→🔧→✅)
- This is NOT optional — if you skip printing this, the human cannot trust the system

### 3b. Cross-check against the Operating Mind

After the predictor returns its challenges, query the Principles Vault for additional blind spots the predictor might miss. The predictor pattern-matches against 8,525 past conversations, but the vault contains 1,407 structured principles — including ones from sessions that post-date the predictor's training data.

> **Setup:** The Principles Vault notebook does not ship with this plugin. Make your own at https://notebooklm.google.com and load it with your own principles and session learnings. Why: the oracle can only surface principles you put in it.

```bash
nlm notebook query <your-principles-vault-notebook-id> \
  "An agent just completed work on [brief description of what was built/changed]. What principles might they have violated or need to verify? Focus on principles with leverage >= 80." \
  --profile <your-nlm-profile>
```

Print the oracle's response alongside the predictor's challenges:

```
🔮 Operating Mind cross-check:
  {Key principles the oracle surfaced that aren't already covered by the predictor's challenges}
  Additional challenges from principles:
    ⚠️ {principle name} (leverage: {score}) — {how it might apply}
```

If the oracle surfaces a principle that the predictor didn't catch, add it to the challenge list and address it the same way.

**When to skip this step**: Score < 30 (quick check). For all other tiers, this adds ~15 seconds and catches principle violations the conversational predictor can't see.

### 4. Address each challenge

For each point the prediction raises (from BOTH the predictor AND the oracle cross-check), do ONE of:
- ✅ **Already handled**: State the specific evidence (curl output, test result, screenshot)
- 🔧 **Need to fix**: Go fix it, re-run the check, show the fix
- ⏭️ **Not applicable**: Explain why this specific challenge doesn't apply (be honest — "not applicable" is not a free pass)

### 5. Only declare done when every challenge is ✅

## Proportional Checks (by governer score)

The depth of your self-review scales with how much damage you could do:

### Score < 30 — Quick Check
Low-leverage work (docs, admin UI tweaks, config changes).
- Run prediction once
- Skim the top result
- If nothing alarming, move on
- ~30 seconds

### Score 30-59 — Standard Check
Medium-leverage work (new features, refactors, non-critical bug fixes).
- Run prediction with top-k 5
- Address the top 3 challenges explicitly in your completion message
- Provide at least 1 piece of evidence (test output, curl, log)
- ~2 minutes

### Score 60-79 — Deep Check
High-leverage work (payment flows, auth, coaching pipeline, data migrations).
- Run prediction with top-k 7
- Address ALL challenges — no skipping
- Provide evidence for each: test results, curl responses, browser verification
- Run the verification commands from your governer contract
- ~5 minutes

### Score 80+ — Full Review
Critical-path work (subscription logic, user data, production deployments).
- Run prediction with top-k 10
- Address every challenge with deterministic evidence
- Run ALL verification contract commands
- Browser-test the actual UX (use Playwright or manual)
- Check error handling: what happens when it fails?
- Check the logs: did you logger.error every failure case?
- ~10 minutes

### No governer score available?
Default to **Standard Check** (score 30-59 behavior). When in doubt, check more not less.

## The User's Most Common Challenges (from the data)

These come up in >20% of the user's historical responses:

1. **"Did you actually test this?"** — Not "do tests pass" but did you verify the real UX
2. **"What happens when it fails?"** — Error handling, user experience on failure path
3. **"Show me evidence"** — Don't claim it works, prove it works
4. **"What's the actual user impact?"** — Translate from code to what the person experiences
5. **"What did you assume?"** — Name your assumptions explicitly
6. **"Does it actually look right in the browser?"** — Code correctness ≠ UX correctness
7. **"Does this matter or is it admin UI?"** — Proportional effort to actual impact

## Example

```
Agent's last response (verbatim, ~1k tokens):
"All three changes are in. Here's what shipped:

1. utils/logger.js:242 — severity range <= 10 → <= 100. All coaching 
telemetry severities (50-95) now save correctly to SystemLog instead of null.

2. utils/coachingTelemetry.js — two new functions:
- llmFallbackAttempt() — fires before each fallback attempt with index, 
  total, model, label, and prior error
- llmAllModelsFailed() — fires when the entire chain is exhausted

3. gen3/controllers/gpt5ConversationsController.js — replaced the same-model 
retry with a real config-aware chain. If all fail → 503 with retryable: true"

Jonathan-check prediction (72% confidence):
"have sub agent opus confirm your work using governer if it finds 
problems fix them"

Agent addresses:
1. Dispatched Opus evaluator — 5/5 contract items verified ✓
2. Syntax checks pass on all 3 files ✓
3. gracefulRecovery.test.js all tests pass ✓
```
