---
name: process-actionable
description: "Orchestrates the 5-stage process-actionables pipeline: Notice (/align) → Score (/governer) → Verify (/investigate-error) → Propose (/translate inline) → Heal. Accepts a raw signal string or an existing proposal ID. Checks for prior runs first. Writes observable output to a run directory. Does NOT contain any stage logic — it invokes canonical skills and captures their output."
triggers:
  - "/process-actionable"
  - "process this issue"
  - "run the pipeline on"
  - "triage this signal"
  - "re-analyze this proposal"
  - "pipeline on"
---

# /process-actionable — Pipeline Orchestrator

> Full pipeline design: `<api-repo>/docs/intent/experiments/process-actionables/README.md`
> This skill ORCHESTRATES. It calls `/align`, `/governer`, `/investigate-error`, and invokes `/translate` inline for Stage 4.
> It does NOT contain their logic. It calls them and captures their output.

---

## Input modes

```
/process-actionable "users are seeing blank screens after payment"
# → raw signal: runs the full pipeline from Stage 1

/process-actionable LP-003
# → existing proposal: reads the proposal file, re-verifies its claims, rewrites Stage 4 with new evidence
```

**Raw signal** — any plain-language description of a broken or missing experience, an error observation, a scan result, or a data anomaly.

**Proposal ID** — a proposal filename or ID that exists in `<api-repo>/docs/intent/proposed/` or `experiments/process-actionables/runs/`. The pipeline extracts its claims and runs them through Stages 1–3 before rewriting Stage 4.

---

## Before starting: check for prior runs

```
RUNS_DIR = <api-repo>/docs/intent/experiments/process-actionables/runs/
```

If the `RUNS_DIR` folder does not exist, create it.

1. Scan `RUNS_DIR` for any run whose topic or claim overlaps with the current input.
   - Use `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` with the signal keywords to check institutional memory first.
   - Also list `RUNS_DIR` and read any `01-notice.md` files whose directory name semantically matches.
2. If a prior run exists and its `03-verify.md` is dated within 7 days:
   - Surface it to the user: "Prior run found at `runs/{run-id}/`. Verification is recent — showing existing output instead of re-running."
   - Display the executive summary from `04-propose.md` (or `04-closed.md`).
   - Stop. Do not re-run.
3. If a prior run exists but is stale (> 7 days or no `03-verify.md`):
   - Note what was previously found: read `01-notice.md` and `02-score.md` from the prior run.
   - State: "Prior run found at `runs/{prior-run-id}/`. Stale — building on prior findings."
   - Create a new run directory and proceed. Reference the prior run in the compliance trail.
4. If no prior run:
   - Create `runs/{run-id}/` where `run-id` = `{slug-of-topic}-{YYYY-MM-DD}`.
   - Proceed with Stage 1.

---

## Run directory

Every run writes files to:
```
<api-repo>/docs/intent/experiments/process-actionables/runs/{run-id}/
├── 01-notice.md                      ← includes Stage 0 source verification + Stage 1.5 scope declaration
├── 02-score.md                       ← includes Stage 2.5 human translation section
├── 03-verify.md                      ← or a one-liner if score < 20
├── 03.5-sanity-check.md              ← cross-reference + logic check before proposing
├── 04-propose.md                     ← or 04-closed.md if claim disproven
├── 04.5-jonathan-check.md            ← oracle quality gate before admin review
├── 05-heal-{stageN}-{date}.md        ← only created when admin gives feedback
├── 05.5-cross-reference-update.md    ← only when parallel runs produce relevant findings
└── REPORT.md                         ← Obsidian-formatted summary for admin review
```

Each file is written immediately when the stage completes. The admin can read any file and see exactly what happened.

---

## Compliance trail (required in every stage output)

Each stage output must include a `## Compliance Trail` section at the bottom containing:

- What was searched (memory-search.js queries used)
- What skills were invoked (canonical names)
- Which README requirements were checked (R-numbers from the README's nested intent section)
- Whether all requirements relevant to this stage were honored (yes / partial / no, with explanation)

---

## Stage 1 — Notice

**Canonical skill:** `/align`

**What to do:**
1. Load the README (`<api-repo>/docs/intent/experiments/process-actionables/README.md`) as context.
2. If input mode is "existing proposal": read the proposal file first, extract its central claim as the signal to process.
3. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` on the signal keywords (at least once — more as needed to decompose sub-concerns).
4. Invoke `/align` applied to the signal. `/align` is frozen — invoke it exactly as-is, do not modify it.
5. The `/align` output surfaces what was observed vs imagined vs unknown. Capture it fully.
6. Write `01-notice.md` to the run directory. Structure:
   - Executive summary (1 paragraph): what is the claim, where did it come from, what would it mean for a real person if true
   - Source trace: exact artifact ID, file path, compaction shortId, or "agent observation — unverified" if no traceable source
   - memory-search.js results: query used + top results (brief)
   - Raw certainty: confidence BEFORE any verification (almost always 🔴 or 🟡)
   - Handoff block to Stage 2 (YAML, as specified in the README)
   - Compliance trail
7. When the signal has no traceable source, certainty ceiling is 🔴 30%.
8. Do NOT investigate. Do NOT score. Do NOT verify. Stage 1 is cheap — one paragraph, one source trace.

**Output:** `01-notice.md`

---

## Stage 2 — Score

**Canonical skill:** `/governer`

**What to do:**
1. Load `01-notice.md` + its handoff block.
2. Load the README as context.
3. Invoke `/governer` on the claim from the handoff block. The full governer output must be captured visibly — not summarized.
4. Before the score finalizes: run the `touchesUserState` gate. Does this affect what any user sees, receives, or experiences? If unsure between tiers, pick the higher one.
5. The score reflects "impact IF TRUE" not "impact BECAUSE TRUE." The claim has not been verified yet. State this explicitly.
6. Check for "found something worse": if the notice mentions ANY user-facing impact as a side observation, assess whether it's a SEPARATE higher-priority item. Flag it explicitly.
7. Run all three adaptive meta-assessment dimensions: Agentic Compounding, Hallucination Propagation, Existing Wins at Stake. Critical mass rule: 2 of 3 ≥ 8 → treat unified score as ≥ 80.
8. Determine verification depth from the unified score:

   | Score  | Depth    | What Stage 3 does |
   |--------|----------|-------------------|
   | < 20   | Skip     | Write one-liner in 03-verify.md |
   | 20–59  | Quick    | One targeted command, 5 minutes max |
   | 60–79  | Moderate | Main claim + 2 assumptions, memory-search.js, source code if referenced |
   | 80+    | Full     | Every claim, source code, production data where safe, negative cases |

9. Write `02-score.md` to the run directory. Structure:
   - Executive summary: score, reason, impact tier, recommended depth
   - touchesUserState assessment
   - Category + SILA scoring (full governer output)
   - Adaptive meta-assessment (all three dimensions)
   - Score-driven routing decision
   - Numbered list of assumptions to verify (what must be true for this claim to matter)
   - Handoff block to Stage 3 (YAML, as specified in the README)
   - Compliance trail

**Output:** `02-score.md`

---

## Stage 3 — Verify

**Canonical skill:** `/investigate-error`

**What to do:**
1. Load `02-score.md` + its handoff block.
2. Load the README as context.
3. Check the depth directive from the handoff block.
4. If score < 20: write one line to `03-verify.md` — "Score too low for investigation. Claim filed as low-priority observation." Stop here. Do not advance to Stage 4.
5. Otherwise: invoke `/investigate-error` at the prescribed depth. Do NOT build investigation logic yourself — invoke the skill and capture its full output.
6. Run actual commands. Report the actual command and the actual output — not a summary. Numbers must come from evidence, not memory.
7. For each assumption from the Stage 2 handoff: what was checked, the command run, the actual output, verdict (confirmed / disproven / inconclusive).
8. If disproven on the specific number but user-facing impact confirmed at different scope: mark as "confirmed at different scope" — NOT "false positive." False positive is ONLY when no user-facing impact was found at all.
9. Score 60+: run a negative check — "what would I expect to see if this claim were completely wrong?" Report what was found.
10. Score 80+: attempt browser verification through the actual product. Attach screenshot evidence if possible.
11. **Browser evidence gate** (touchesUserState=true only): Attempt actual browser verification via `/devtools-site-testing`. If cannot reproduce, cap certainty at 70% and state what was tried. If can reproduce, include evidence. NEVER substitute simulated state for browser evidence.
12. Emergent findings: if ANYTHING user-facing was observed during verification that wasn't in the original claim, it MUST be flagged as a new Stage 1 notice. Do not ignore it because "that's not what we're investigating."
12. State which environment was queried. MongoDB = Atlas (not localhost). Code = main branch (not worktree).
13. Write `03-verify.md` to the run directory. Structure:
   - Executive summary: claim was [confirmed / partially confirmed / disproven / inconclusive]
   - Per-assumption evidence (command + output + verdict for each)
   - Emergent findings (if any — each becomes a new Stage 1 notice)
   - Revised certainty (post-evidence)
   - Recommendation: advance to Stage 4 / re-score / close
   - Handoff block to Stage 4 (YAML, as specified in the README)
   - Compliance trail

**Output:** `03-verify.md`

---

## Stage 4 — Propose

**Canonical skill:** `/translate` (invoked inline — this stage IS the translation layer)

**Certainty inheritance rule:** The proposal's certainty CANNOT exceed Stage 3's verified certainty. If Stage 3 capped at 70% due to no browser evidence, the proposal states: "This finding is code-verified only — browser evidence was attempted but could not reproduce the issue. Certainty: 70%."

Stage 4 uses the verified evidence to produce a human-legible proposal. The README describes this as invoking `/translate` to "walk through every unique user journey affected." Since `/translate` operates as an inline reasoning mode (not a standalone file-based skill), apply its logic here directly: for each affected user journey, describe what the person does, what happens now, what the gap is, and what will happen after the fix — in the language of experience, not code.

**What to do:**
1. Load `03-verify.md` + its handoff block.
2. Load the README as context.
3. Load `<api-repo>/docs/intent/proposed/TEMPLATE.md` — the proposal format.
4. If recommendation was "close": write `04-closed.md` — explanation of what was found, why it doesn't warrant action, and what source signal should be updated to prevent re-flagging.
5. If recommendation was "advance":
   a. The proposal title and description MUST reflect the VERIFIED claim, not the original. If they diverged, state the divergence explicitly.
   b. Certainty in the proposal cannot exceed certainty from Stage 3 evidence.
   c. Walk through every unique user journey affected. For each: what the person does → what happens now → what the gap is → what will happen after the fix. Precision of code, language of experience.
   d. If the fix could fail, describe what a person would experience if it doesn't work — risk in UX terms, not technical terms.
   e. If the fix only addresses part of a systemic issue, explicitly state what's covered and what's NOT covered.
   f. Pre-answer admin questions: what does this fix, who does it affect, what could go wrong, how would I know it worked, what's not covered.
   g. `sources` frontmatter must include: paths to `01-notice.md`, `02-score.md`, `03-verify.md`, and the original source ID.
   h. Run `/align` on the draft as a quality gate before finalizing. Every sentence that describes a system action must also articulate the human reasoning — why this matters, for whom, what's at stake.
6. Write `04-propose.md` (or `04-closed.md`) to the run directory.

**Output:** `04-propose.md` or `04-closed.md`

---

## Stage 5 — Heal (on-demand, not sequential)

The Healer is available throughout the pipeline — not only after everything else finishes. When the admin gives feedback pointing at a specific stage:

**What to do:**
1. Quote the admin's feedback verbatim.
2. Read the current prompt for that stage (from `experiments/process-actionables/prompts/0{N}-{stage}.v{N}.md`).
3. Identify the specific instruction in the prompt that caused the failure — the root cause, not the symptom.
4. Show the updated prompt as a diff.
5. Rerun that stage with the same input using the new prompt. Show the new output.
6. Run the updated prompt against 2 other prior examples to check for over-correction regression.
7. If admin confirms: write the updated prompt to a versioned file: `experiments/process-actionables/prompts/0{N}-{stage}.v{N+1}.md`.
8. Write `05-heal-stage{N}-{YYYY-MM-DD}.md` to the run directory.

Invoke `/align` on the healer's output before finalizing — same quality gate as Stage 4.

**Output:** `05-heal-stage{N}-{date}.md`

---

## Existing proposal mode (input = proposal ID)

When input is a proposal ID (e.g., `LP-003`):

1. Locate the proposal file in `<api-repo>/docs/intent/proposed/` or `experiments/process-actionables/runs/`.
2. Extract all claims from the proposal. Each claim = a potential Stage 1 signal.
3. For the primary claim: run the full Stage 1 → 2 → 3 pipeline to verify whether it still holds.
4. For secondary claims: run at minimum Stage 1 + Stage 2. If Score ≥ 40, run Stage 3 as well.
5. Stage 4 rewrites the proposal using the newly verified evidence. The original proposal is NOT destroyed — the rewrite is a new file in the current run directory. State what changed.

---

## Context accumulation rule

Every stage receives ALL prior stage outputs plus the README. Context grows — nothing is compressed or dropped between stages. When loading context for Stage N, pass:

- The README
- `01-notice.md` through `0{N-1}-*.md` (all prior outputs in the run)
- The current input (signal or proposal)

This is not optional. It is how the pipeline prevents disconnected proposals and ensures the claim that exits Stage 4 is traceable back to the original signal.

---

---

## Stage 0 — Source Verification (pre-pipeline gate)

**Purpose:** Before entering the pipeline, verify the signal source actually exists and is readable. This catches hallucinated references before they compound through all stages.

**What to do:**
1. If the input references a compaction ID: run `alignment-harness store get compactions {id}` and confirm it returns content.
2. If it references a file path: confirm the file exists with `ls` or `Read`.
3. If it references a proposal ID: confirm the proposal file exists in `proposed/` or `runs/`.
4. If the source can't be found: the signal still enters Stage 1, but with certainty ceiling 🔴 20% and explicit note: "Source not found — this signal is ungrounded."

**Output:** No separate file. The source verification result is included in `01-notice.md` under the Source Trace section.

**Why this exists:** LP-003's "209 swallowed errors" claim came from a compaction where the number was never verified. By the time Stage 3 caught it, two stages of reasoning had already been built on a hallucinated number.

---

## Stage 0.5 — Check Known Decisions (pre-pipeline gate)

**Purpose:** Before entering the pipeline, check if the user has already reviewed and decided on this signal. Prevents wasting investigation cycles on dismissed findings.

**When to run:** After Stage 0 (source verified) and before Stage 1 (Notice). Run even if source is ungrounded — a dismissed signal is dismissed regardless.

**What to do:**
1. Extract 3–6 keywords from the signal: function names, file names, error types, domain terms. Skip generic words like "error", "found", "issue".
2. Call the Known Decisions Registry:
```bash
curl -s "<your-api>/gen3/admin/known-decisions/check?signal=keyword1,keyword2,keyword3" \
  -H "x-api-key: $DEVELOPER_API_KEY"
```
3. Read the response:
   - `matchCount = 0` → no prior decision, proceed to Stage 1 normally.
   - `decision = "dismissed"` AND `invalidatedAt = null` → **STOP.** Print: `Prior decision found: {reasoning} (dismissed {decidedAt} by {decidedBy})`. Do NOT proceed with the pipeline.
   - `decision = "dismissed"` AND `invalidatedAt` is set → proceed, but note: `Previously dismissed (reason: {invalidationReason}), proceeding because decision was invalidated.`
   - `decision = "approved"` or `"deferred"` → print the reasoning and proceed — this context informs Stage 1.

**Output:** Included in `01-notice.md` under a "Known Decisions Check" section. If dismissed and not invalidated: the file is written with just this section, and the pipeline stops.

**Why this exists:** Without this gate, each new agent session re-investigates signals the user already reviewed. The user has to dismiss the same finding repeatedly. This erodes trust and wastes investigation cycles.

---

## Stage 1.5 — Declare Scope (between Notice and Score)

**Purpose:** After the notice surfaces the claim, the pipeline declares what it's investigating and what's explicitly out of scope. This prevents scope creep during scoring and verification.

**What to do:**
1. Read `01-notice.md`.
2. Write a scope declaration in the Stage 2 handoff:
   - **In scope:** The specific claim being investigated, stated in UX terms (what a person experiences)
   - **Out of scope:** Adjacent issues noticed but not being pursued in this run
   - **Assumptions:** What must be true for this claim to matter
3. If Stage 1 surfaced side observations that look important, log them as future Stage 1 candidates in the handoff.

**Output:** Included in the `01-notice.md` handoff block as additional YAML fields:

```yaml
scope:
  investigating: "When a person requests a login code and the email send fails, they see nothing — no error, no retry prompt"
  not_investigating: "Whether Mailgun has reliability issues (separate concern)"
  side_observations:
    - "Coaching memory also fails silently — potential separate run"
```

**Why this exists:** Agents expand investigation scope mid-run, consuming tokens on tangents. The scope declaration is a contract — Stage 3 verifies ONLY what's in scope. Side observations become separate runs.

---

## Stage 2.5 — Speak-Human Translation (between Score and Verify)

**Purpose:** After governer scoring produces a technical score report, translate it to human-experience language before verification begins. This catches disconnects between score and actual human impact BEFORE tokens are spent on investigation.

**What to do:**
1. Read `02-score.md`.
2. For each SILA dimension score, add one sentence describing what it means for a real person using the product.
3. For the unified score and routing decision, translate: "Score 72, moderate depth" → "This matters enough to check the evidence, but not so urgent it needs browser-level proof. A person might hit this weekly, not hourly."
4. If the translation reveals the score doesn't match the human experience described, flag the mismatch.

**Output:** Appended to `02-score.md` as a `## Human Translation` section.

**Why this exists:** The prior session identified "summarizing the governer instead of including its actual mechanics" as a recurring misalignment. This stage forces the mechanics to be present AND translated.

---

## Stage 3.5 — Sanity Check (between Verify and Propose)

**Purpose:** After verification produces evidence, a quick sanity check catches obvious contradictions before the proposal is written. This is the "does this still make sense?" moment.

**What to do:**
1. Read `03-verify.md`.
2. Check: Does the verified claim still match the notice? If verification changed the picture significantly, note the divergence.
3. Check: Are there any emergent findings that are MORE important than the original claim? If so, flag them.
4. Check: Did verification disprove any assumption that the score relied on? If so, should the score be revised?
5. Check: Cross-reference against other runs in the `runs/` directory — has this claim or a related one been investigated before? What was found?

**Output:** Written as `03.5-sanity-check.md` in the run directory. Short — 1 paragraph + any flags.

**Why this exists:** LP-003's cross-reference update (`05-cross-reference-update.md`) revealed that LP-018 disproved a core LP-003 assumption. If this check had happened BEFORE the proposal, the proposal would have been correct from the start.

---

## Stage 4.5 — Jonathan-Check2 Oracle Gate (after Propose, before admin review)

**Purpose:** Before the proposal goes to the admin for review, run it through the jonathan-check2 oracle to predict what the admin will challenge, demand, or reject. Fix those issues before the admin sees the proposal.

**Canonical tool:** jonathan-check2 notebook (NotebookLM oracle with the user's patterns)

Setup note: this is your own NotebookLM notebook. If you don't have one yet, make one at https://notebooklm.google.com and load it with your own past corrections, because the oracle can only predict from what you put in it.

**What to do:**
1. Read the draft `04-propose.md`.
2. Compose a query to the jonathan-check2 oracle containing:
   - The proposal's executive summary
   - The evidence chain (abbreviated)
   - The assumptions made
   - What evidence was provided vs what's still missing
3. Send to the oracle notebook.
4. Parse the oracle's response for:
   - **Predicted challenges:** What would the admin push back on?
   - **Demanded evidence:** What would the admin want to see that isn't there?
   - **Jargon flags:** Where is the proposal using code language instead of human language?
   - **Missing consume format:** Can the admin verify this themselves in the product?
5. Address each challenge in the proposal BEFORE it goes to admin review.
6. Write `04.5-jonathan-check.md` with the oracle's response and what was fixed.

**Output:** `04.5-jonathan-check.md` in the run directory. The proposal (`04-propose.md`) may also be updated based on oracle feedback.

**Why this exists:** LP-003's jonathan-check revealed 5 challenges including "reading code is not verification — running code is verification" and "stop using variables to explain UX." Addressing these before admin review saves a correction cycle.

---

## Stage 5.5 — Cross-Reference Update (after Propose or after parallel runs)

**Purpose:** When multiple proposals exist or new evidence emerges from a related run, check whether it changes the assessment of this proposal.

**What to do:**
1. List all runs in `runs/` directory.
2. For each run with a completed `03-verify.md`, check if its findings affect THIS proposal.
3. If cross-reference reveals a change: write `05.5-cross-reference-update.md` with:
   - What was found in the other run
   - How it impacts this proposal
   - Whether the score should be revised
   - Whether the proposal needs rewriting
4. If the cross-reference is significant enough to change the proposal's validity, update the REPORT.md accordingly.

**Output:** `05.5-cross-reference-update.md` (only created when cross-reference produces relevant findings).

**Why this exists:** LP-018 verification discovered that `logger.js` globally overrides `console.error`, which directly contradicted LP-003's claim that errors were "invisible." Without cross-referencing, LP-003 would have gone to the admin with a false premise.

---

## Post-Pipeline — Open REPORT in Obsidian

After writing `REPORT.md`, open it in the user's Obsidian vault so they see it immediately (only the person has an Obsidian vault — check `~/.claude/CLAUDE.md` and the project for a vault name; otherwise print the path to REPORT.md):

```bash
open "obsidian://open?vault=<their vault name>&file=experiments/process-actionables/runs/{run-id}/REPORT&newtab=true"
```

Replace `{run-id}` with the actual run ID for this pipeline run. Do not include the `.md` extension in the URI.

---

## Post-Pipeline — Complete Agentic Task

**Purpose:** After the pipeline run is complete (proposal written or claim closed), file a structured completion report using `/complete-agentic-task`.

**What to do:**
1. Invoke `/complete-agentic-task` with:
   - What was asked for (the original signal or proposal ID)
   - What was done (stages completed, evidence found)
   - Progress (what's done vs incomplete)
   - How the admin can check it (read the REPORT.md, check the run directory)
2. File a compaction via `/compact-agentic-session` to preserve the run context.
3. Print the admin link for the compaction.

**Output:** No file in the run directory. The compaction is filed to the API.

**Why this exists:** The prior session identified 22 items where work was started but not finished, and the admin had to manually ask "what did you do?" This stage ensures every run produces an auditable completion record.

---

## Quick reference — what each stage invokes

| Stage | Canonical skill | Output file |
|-------|----------------|-------------|
| 0 — Source Verify | `alignment-harness store get compactions` / `ls` / `Read` | _(included in 01-notice.md)_ |
| 1 — Notice | `/align` | `01-notice.md` |
| 1.5 — Declare Scope | _(inline in handoff)_ | _(included in 01-notice.md handoff)_ |
| 2 — Score | `/governer` | `02-score.md` |
| 2.5 — Speak-Human | `/speak-human` inline | _(appended to 02-score.md)_ |
| 3 — Verify | `/investigate-error` | `03-verify.md` |
| 3.5 — Sanity Check | Cross-reference + logic check | `03.5-sanity-check.md` |
| 4 — Propose | `/translate` inline (+ `/align` quality gate) | `04-propose.md` or `04-closed.md` |
| 4.5 — Jonathan-Check2 | jonathan-check2 notebook oracle | `04.5-jonathan-check.md` |
| 5 — Heal | Stage prompt diff + `/align` quality gate | `05-heal-stage{N}-{date}.md` |
| 5.5 — Cross-Reference | Run directory scan | `05.5-cross-reference-update.md` _(if relevant)_ |
| Post — Complete | `/complete-agentic-task` + `/compact-agentic-session` | _(compaction API)_ |
