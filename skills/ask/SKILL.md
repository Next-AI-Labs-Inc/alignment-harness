---
name: ask
description: Use BEFORE asking the user any clarifying question. Replaces naked questions with a SILA-gated decision flow — synthesize the context the question emerges from, predict the likely answer with a confidence number, score the question using IX-SILA (the canonical scoring system that's already run for the session), then route based on criticality. Trivial questions get answered by the agent and announced. Medium questions get an agent_find pass before reasking. High-criticality questions get the full briefing template and wait for greenlight. Communications use /how-to-talk-like-the-founder voice — no jargon, no menus, conveyed as a peer with advanced cognition speaking to another.
---

# /ask

Base directory: `${CLAUDE_PLUGIN_ROOT}/skills/ask/`

## When this fires

Any moment you're about to ask the user a clarifying question, present a multi-choice menu, request a decision, or otherwise pause work to wait on the user. This skill is the gate BEFORE the question lands.

**Includes:** "Should I proceed with X or Y?", AskUserQuestion tool calls, "Which approach do you want?", "Want me to do A?", "Do you mean X?", "Should I commit?"

**Excludes:** Status updates, progress reports, requests for explicit destructive authorization (those have their own gates). Direct technical announcements that don't actually require an answer.

---

## Phase 0 — Quick check: do you actually need to ask?

Before invoking the SILA gate, ask yourself: **could you make a reasonable call and continue?** If the session has the `work without stopping for clarifying questions` directive active, the answer is almost always yes — make the call, announce it, continue.

If you're still genuinely uncertain, proceed to Phase 1.

---

## Phase 1 — Internal scaffolding (think these, don't write them as prose yet)

Hold these four questions in mind:

1. **The overarching thing I'm working toward** — what is the scope-level goal of this session, and how does what the user asked for connect to it?
2. **The challenge that triggered this question** — what specific obstacle/fork/ambiguity inside that work made me reach for a question?
3. **What I predict the user would say** — based on what's in memory, what's in the session, what's been said, what's the most likely answer? State it as a specific predicted reply, not a category.
4. **My calibration** — how confident am I on a 0-100 scale that my predicted answer matches the user's actual intent?

---

## Phase 2 — SILA scoring (the canonical gate)

SILA is the IX scoring system already wired into /governer, /governer2, leverage-predictor, and the `alignment-harness score` command. It produces a normalized 1-100 score across four dimensions. We use it here so the /ask gate uses the same scoring substrate as every other decision gate in the system — no parallel formula.

### Step 2.1 — Check for existing session SILA score

```bash
# Resolve current session ID
STATUS_JSON=$(alignment-harness status --json 2>/dev/null | sed -n '/^{/,$p')
SESSION_ID=$(echo "$STATUS_JSON" | jq -r '.sessionId // empty')

if [[ -n "$STATUS_JSON" ]]; then
  EXISTING_SCORE=$(echo "$STATUS_JSON" | jq -r '.state.overallGovernerScore // empty' 2>/dev/null)
  EXISTING_FEATURE=$(echo "$STATUS_JSON" | jq -r '.state.governer.task // empty' 2>/dev/null)
fi
```

**If the existing score's feature/scope matches the scope the question is about** → reuse it. Print: `SILA score: {N}/100 (inherited from session governer run on {feature})`.

**If the question is about a NEW scope not yet scored** → run a fresh SILA scoring pass via `alignment-harness score`:

```bash
alignment-harness score --task "{question-scope}" --category {category} --touches-user-state {true|false} --impact-tier {config|product|critical} --ac {N} --hp {N} --ew {N}
```

Where `ac` = degree-mistakes-compound, `hp` = degree-affects-UX, `ew` = degree-spreads-to-other-systems. Each is 1-100.

**Fallback if command unavailable:** manually estimate the four SILA dimensions:
- `degreeToWhichThisTaskAffectsWhatUsersExperience`
- `degreeToWhichAgentMistakesWouldCompoundAcrossFutureSessions`
- `degreeToWhichGettingThisWrongWouldSpreadToOtherSystems`
- `degreeToWhichThisCouldBreakSomethingAlreadyWorking`

Average them (or use the highest if critical-mass rule applies — any one of them ≥80 escalates the overall).

### Step 2.2 — Compute criticality

```
SILA_GRAVITY = overallGovernerScore (0-100)
CONFIDENCE = how confident I am that my predicted answer matches the user's intent (0-100)
UNSURENESS = 100 - CONFIDENCE
CRITICALITY = (UNSURENESS × SILA_GRAVITY) / 100
```

Criticality scale: 0 = "I'm certain and it doesn't matter anyway" → 100 = "I have no idea and it matters a lot."

---

## Phase 3 — Route based on criticality

### Criticality < 30 — Just decide and continue

The question doesn't actually need to be asked. Make the call yourself. Announce it in one line so it's observable, then keep working.

**Format:**
```
[auto-decided, criticality={N}/100] {one-sentence decision}. Continuing.
```

Example: `[auto-decided, criticality=12/100] Proceeding with Test 1 first (TDD discipline requires RED phase before fix). Continuing.`

Do NOT actually present the question to the user. Do NOT use AskUserQuestion. Just decide and move.

### Criticality 30-60 — Run agent_find, then reassess

The question might matter, but you may be missing context that would resolve it. Run agent_find against the question itself OR against the scope it's inside.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "{the question or scope keywords}" --limit 5
```

Re-run Phase 2 with the new information. If criticality drops below 30, decide and continue. If it stays in 30-60 OR rises above 60, escalate to the full briefing format.

### Criticality > 60 — Present the full briefing template, wait for greenlight

This is where it actually matters that you pause and let the user weigh in. Use the template below.

---

## Phase 4 — The briefing template (for criticality > 60)

This is voiced as a peer-to-peer communication. Use `/how-to-talk-like-the-founder` style — no jargon, no menus, no headers screaming at the reader. It should read like one human with advanced cognition telling another what's going on and what they need a moment of input on.

**Template:**

```
Hey the user, running into a question here I want to share so we stay on the same page.

I'm working on {x — the immediate task} in service to {y — the overarching goal}, and to do that I'm doing {a — the specific approach I picked}, because {how a connects to x and y}.

But when doing {a} I'm seeing some options here, and my prediction is that you'd want {predicted answer} because {reason that prediction aligns with what I know about you / your prior stated intents}.

So here's the question, along with my prediction of your answer:

  {question, in plain language, one sentence}
  {predicted answer, one or two sentences}

My confidence on the prediction is {N}%. The gravity of getting this wrong is {N}% because {what would actually break / what intent it could violate / what UX could regress}. Combined criticality is {N}%.

Reply with "yes" or "looks right" if my prediction matches, or correct me if not.
```

After printing this, STOP. Do not start work on the predicted answer. Wait.

---

## Phase 5 — Telemetry

Every invocation logs to `.claude/logs/agent-telemetry.jsonl`:

If the `.claude/logs/` folder does not exist, create it.

```bash
echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"AskUserQuestionGated\",\"sessionId\":\"${SESSION_ID}\",\"silaGravity\":${SILA_GRAVITY},\"confidence\":${CONFIDENCE},\"criticality\":${CRITICALITY},\"route\":\"{auto-decided|agent-find-reassess|full-briefing}\",\"question\":\"$(echo \"$QUESTION\" | head -c 120)\"}" >> .claude/logs/agent-telemetry.jsonl
```

This lets us observe over time:
- How often the gate auto-decides vs escalates
- How often predicted answers turn out to match the user's corrections
- Whether the criticality formula is calibrated correctly (if the user frequently corrects auto-decided questions, threshold needs raising)

---

## Phase 6 — What NOT to do

- **Do not invent a parallel scoring system.** SILA is canonical. If the score feels wrong, fix SILA's category/dimension inputs, don't add new dimensions here.
- **Do not present a menu of options.** Either auto-decide or predict the answer. Never `(A) X (B) Y (C) Other` — that's the deduce-intent-before-presenting-choices rule.
- **Do not ask the question without predicting the answer first.** A naked question violates the predict-answers-then-validate-not-open-questions rule.
- **Do not use AskUserQuestion tool for criticality < 60.** That tool is for genuine forks. Auto-decide and announce.
- **Do not skip the connect-to-overarching-goal step.** The user needs to see WHY this question matters in the spine of the work — not just the question in isolation.
- **Do not write the four scaffolding questions out as prose to the user.** They're internal. Synthesize into the briefing template.

---

## Voice and tone

Every output of this skill speaks in the user's voice. Load `/how-to-talk-like-the-founder` voice samples before composing. The briefing template is not a form — it's a sentence from one person to another. Verb-led, present-tense, no agent-speak ("I will now process your request"), no corporate dress.

If you find yourself writing "Per the analysis," delete it. If you find yourself writing "I'd love to clarify," soften it. The user talks like a peer, you talk like a peer.

---

## Examples

### Example A — Auto-decided (criticality 12)

Agent context: working on a TDD-discipline task to fix hook injection. About to write Test 1 (RED phase). Realizes it could either write all three tests at once or just Test 1 first to honor RED-GREEN cycle strictly.

SILA: 72/100 (the parent task is high-leverage)
Confidence in prediction: 95% (the user explicitly invoked "TDD" — RED phase first is what TDD means)
Unsureness: 5
Criticality: (5 × 72) / 100 = 3.6 → well under 30

Agent prints: `[auto-decided, criticality=4/100] Writing Test 1 alone first per TDD RED-GREEN discipline. Test 2 comes after fix lands. Continuing.`

No question asked. Work continues.

### Example B — Full briefing (criticality 78)

Agent context: about to commit. Notices the commit would touch a file the user has historically guarded. Unclear whether scope authorization extends.

SILA: 88/100 (touches auth code)
Confidence in prediction: 30% (the user's prior stance is ambiguous)
Unsureness: 70
Criticality: (70 × 88) / 100 = 61.6 → above 60

Agent prints the full briefing template, waits.

### Example C — Agent_find reassess (criticality 45)

Agent: about to choose between two library options. Both look reasonable. No strong signal in memory.

SILA: 50/100
Confidence: 50%
Criticality: 25 → wait, that's under 30. Re-examining: actually unsureness is high (60), so criticality = 30. Right at the boundary.

Agent runs agent_find on "library choice {topic} institutional preferences". Surfaces a 9-month-old memory: the user prefers minimal dependencies. Confidence in prediction jumps to 85% → criticality drops to 7.5 → auto-decides → announces → continues.

---

## Discoverability

This skill is invoked:
1. Directly: `/ask` typed by the user or agent
2. By skill chains: any skill that's about to call AskUserQuestion should first invoke this
3. By self-recognition: any time agent thinks "I should ask the user about X" — that thought is the trigger

CLAUDE.md routing additions (proposed, requires the user's greenlight per the routing-table rule):
| Client Request | Action |
|---|---|
| "/ask" | Invoke /ask |
| "ask the user" | Invoke /ask |
| "should I ask" | Invoke /ask |
| "before you ask" | Invoke /ask |

---

## Why this skill exists

The user's pattern across 8,500+ historical agent corrections: agents over-ask. They pause for confirmation on things they could decide, present menus when they should predict, and when they DO need input, they ask the question in isolation without the spine of context that makes the question matter.

This skill replaces the binary "should I ask" decision with a calibrated one. It uses SILA — the canonical scoring system the user already trusts — so the agent's ask/decide threshold is tied to the same scoring substrate as every other gate in the system. And when the agent DOES ask, the briefing template forces it to surface the context, the prediction, and the gravity in one synthesized communication that takes the user 5 seconds to scan instead of 5 minutes to interpret.

Created 2026-05-13 per the user's directive in session mystifying-ishizaka-5b8da5.
