---
name: pipeline-cross-verify
description: "Stage 5 of the observable pipeline: independent cross-verification of Stage 4 (Verify) output. Receives ONLY the verification contract and code diff/file references — NOT the Stage 4 reasoning. Independently runs its own commands, grades each claim PASS or FAIL with evidence, and writes 05-cross-verify.md. The evaluator's finding stands even when it contradicts the verifier's conclusion."
triggers:
  - "/pipeline-cross-verify"
  - "cross-verify stage 4"
  - "independent verification of verify output"
  - "run evaluator on stage 4"
  - "cross-check the verify stage"
---

# /pipeline-cross-verify — Stage 5: Independent Cross-Verification

> Full pipeline design: `<project-repo>/docs/intent/experiments/process-actionables/README.md`
> This skill is Stage 5 of the observable pipeline. It is INDEPENDENT — it grades Stage 4 output without access to Stage 4 reasoning.
> Output: `05-cross-verify.md` in the run directory.

---

## Why this stage exists

In v1 of the pipeline, cross-verification happened by accident — two agents occasionally processed the same item and their outputs were compared informally. This caught some hallucinations but was unreliable and untracked.

In v2, cross-verification is a **designed role**. A dedicated evaluator agent:
- Receives the Stage 4 verification contract only — not Stage 4's reasoning chain
- Runs its own independent commands against the codebase
- Grades each claim on its own evidence
- Reports discrepancies between what Stage 4 concluded and what the evaluator found

The evaluator's job is not to audit Stage 4 for process compliance. It is to independently verify the facts Stage 4 claimed to verify. If Stage 4 said "confirmed" and the evaluator finds different evidence, the evaluator's finding stands — and the discrepancy is the most important output of this stage.

---

## What the evaluator receives

The evaluator receives ONLY:

1. **The verification contract** — the set of claims Stage 4 checked, in this format:
   ```yaml
   evidence_summary:
     - assumption: "..."
       verdict: confirmed|disproven|inconclusive
       evidence: "..."
       certainty: "🟣 N%"
   ```

2. **File references** — the specific files and line numbers Stage 4 referenced. No commentary about what they mean.

3. **The diff** (if Stage 4 made code changes) — the actual code diff, nothing else.

The evaluator does NOT receive:
- Stage 4's reasoning chain or narrative
- Stage 4's conclusions about what the evidence means
- Stage 1/2/3 context (unless a file reference points there)
- Any prior agent's framing of the issue

This information boundary is intentional. The evaluator must form its own view from raw evidence, not audit Stage 4's interpretation.

---

## Execution protocol

### Step 0: Orientation — without Stage 4 context

Before running any commands, read each claim in the verification contract and ask:
- What would I need to find in the code to independently confirm or deny this?
- What command would produce the relevant output directly from the source?
- What would I expect to see if this claim were FALSE?

Write this pre-read orientation as a brief section in the output. It shows your independent framing BEFORE you look at the files Stage 4 referenced.

### Step 1: Verify each claim independently

For each claim in the verification contract:

1. Run a command that would confirm OR deny the claim — independently of what Stage 4 ran.
   - If Stage 4 used `grep -n "X" file.js`, consider using `grep -n "something else"` that would catch the same behavior from a different angle.
   - If Stage 4 read lines N-M, read a broader range that includes context Stage 4 may have excluded.
   - If Stage 4 used `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`, run a different query that probes the same domain.

2. Report the actual command and actual output — never a summary. Format:
   ```
   Command: <exact command run>
   Output:
   <verbatim output, truncated only if over 40 lines>
   ```

3. Grade the claim:
   - **PASS** — evaluator's independent evidence confirms Stage 4's verdict
   - **FAIL** — evaluator's evidence contradicts Stage 4's verdict or cannot reproduce Stage 4's evidence
   - **PARTIAL** — evaluator confirms the claim exists but at a different scope, line, or severity than Stage 4 stated
   - **CANNOT VERIFY** — the referenced file/line does not exist or the command produces no output

### Step 2: Run the v1 failure mode checklist

These are the specific failure modes that caused false verdicts in v1 runs. Check each one:

#### LP-005 class: Stale data — claim was true when filed, code has since changed

For any claim that references file:line combinations:
```bash
git log --oneline -5 -- <file>
```
Check whether the file was modified AFTER the Stage 4 notice date. If yes, Stage 4 may have verified old code. Flag as STALE RISK.

#### LP-014 class: Wrong file/line reference — Stage 4 cited lines that don't contain what was claimed

Read the exact lines Stage 4 cited. Do those lines actually contain the behavior claimed?
- If Stage 4 said `file.js:47 — missing null check on req.user` — read line 47. Is `req.user` accessed there without a null guard?
- If the code doesn't match the description, grade FAIL regardless of whether the underlying claim might be true elsewhere.

Stage 4 must be graded on what it actually cited, not on whether something similar exists somewhere else in the file.

#### LP-008/011/015/016/019/021/022 class: Feature already exists — claim says something is missing that is actually present

For any claim in the form "X is not implemented," "Y is missing," or "Z doesn't exist":
```bash
grep -r "relevant_term" /relevant/directory/ --include="*.js" | head -20
```
Search broadly. If the feature exists somewhere other than where Stage 4 looked, grade PARTIAL and explain where it lives.

#### Rubber stamp detection: Stage 4 confirmed everything

If Stage 4's evidence_summary has all `verdict: confirmed` and certainty >= 90% on every claim, treat this as a yellow flag. The expected confirmation rate across the pipeline is 40-70%. A 100% confirmation rate in Stage 4 could mean the claims were genuinely correct — or it could mean Stage 4 rubber-stamped its own prior reasoning.

For the highest-certainty confirmed claims, run an explicit negative check:
```
What would I expect to see if this claim were FALSE?
```
Then look for that. Report what you found.

### Step 3: Evaluate for discrepancies

After grading each claim, evaluate the overall pattern:

- **No discrepancies** — evaluator's evidence matches Stage 4's verdicts. Note which claims were cross-confirmed.
- **Partial discrepancies** — some claims verified at different scope or with different line refs. List each discrepancy with the evaluator's evidence vs Stage 4's evidence side-by-side.
- **Material discrepancy** — evaluator's evidence contradicts Stage 4's verdict on a claim that materially affects the proposal (a "confirmed" becomes "FAIL," or a "disproven" becomes "PASS"). This is the most critical output. When this happens:
  - State the discrepancy explicitly in a prominent section
  - Do not attempt to reconcile Stage 4's view with yours — report what you found
  - Flag whether the discrepancy affects the proposal's recommendation

### Step 4: Check /sanity-check + /reflect criteria

Before finalizing, self-audit:

**Sanity check:**
- Did I actually run the commands, or did I summarize what I expected to find?
- Is every grade backed by a verbatim command output in this document?
- Did I check the v1 failure modes for every claim?
- Did I treat Stage 4's certainty assertions as claims to be verified, not as established facts?

**Reflect:**
- Am I grading based on the evidence I found, or am I deferring to Stage 4's framing?
- If this were a completely new agent seeing this for the first time, what would it find?
- Is my "CANNOT VERIFY" grade actually a "FAIL" in disguise (the file doesn't exist = Stage 4 cited something wrong)?

---

## Output format

Write to: `{runs-dir}/{run-id}/05-cross-verify.md`

If the `{runs-dir}/{run-id}/` folder does not exist, create it.

```markdown
# Stage 5: Cross-Verify — {LP-XXX title}
**Run ID:** {run-id}
**Date:** {date}
**Evaluator:** independent — did not read Stage 4 reasoning before running commands

---

## Pre-read orientation (before looking at Stage 4's referenced files)

{What you expect to find based on the claim descriptions alone. Written before Step 1.}

---

## Independent verification per claim

### Claim 1: {claim description from evidence_summary}
**Stage 4 verdict:** {confirmed|disproven|inconclusive} at {certainty}%

**Evaluator command:**
```
{command}
```
**Output:**
```
{verbatim output}
```
**Evaluator grade:** {PASS|FAIL|PARTIAL|CANNOT VERIFY}
**Evaluator finding:** {1-2 sentences on what the evidence shows}
**Discrepancy:** {none|describe discrepancy if grade contradicts Stage 4 verdict}

### Claim 2: ...

---

## v1 Failure Mode Checklist

| Failure mode | Checked | Finding |
|---|---|---|
| LP-005 (stale code — file modified after notice date) | yes/no | {git log output or "no recent changes"} |
| LP-014 (wrong file/line — cited lines don't match description) | yes/no | {finding or "lines match"} |
| LP-008/011/015/016/019/021/022 (feature already exists) | yes/no | {finding or "not applicable"} |
| Rubber stamp (100% confirmed, no negative checks run) | yes/no | {finding or "negative checks ran — see claims above"} |

---

## Discrepancy summary

**Overall agreement:** {full agreement | partial discrepancy | material discrepancy}

{If partial or material: list each discrepancy with Stage 4 verdict vs evaluator finding, side by side.}

{If material discrepancy: state explicitly whether it affects the proposal recommendation.}

---

## Self-audit

**Commands run (not summarized):** {yes/no}
**v1 failure modes checked for every claim:** {yes/no}
**Grade based on evaluator's own evidence (not Stage 4 framing):** {yes/no}

---

## Recommendation

{One of:}
- **ADVANCE TO PROPOSAL** — evaluator confirms Stage 4 verdicts. Proposal may proceed.
- **ADVANCE WITH CORRECTIONS** — evaluator found partial discrepancies. List corrections Stage 4 should incorporate before proposing.
- **RETURN TO STAGE 4** — material discrepancy found. Stage 4 must re-verify with evaluator's evidence before proposing.
- **CLOSE AS DISPROVEN** — evaluator's evidence contradicts Stage 4's confirmed claim and finds no user impact.
```

---

## Key rules

1. **The evaluator's finding stands.** If Stage 4 said "confirmed" and the evaluator finds different evidence, the evaluator's grade is the output — not a compromise between the two.

2. **Grade on what was cited, not what might be true.** If Stage 4 cited line 47 and line 47 doesn't contain what was claimed, that's FAIL — even if the behavior exists on line 83.

3. **Never access Stage 4's reasoning chain.** If you catch yourself using Stage 4's narrative to interpret your command output, stop. Return to the raw output and grade independently.

4. **CANNOT VERIFY is not neutral.** When a file reference doesn't resolve, that's a Stage 4 failure. Grade it accordingly. A claim grounded in a non-existent source is not inconclusive — it's ungrounded.

5. **The v1 failure modes are not optional checks.** They caught real hallucinations across LP-005, LP-008, LP-011, LP-014, LP-015, LP-016, LP-019, LP-021, and LP-022. Run every one for every claim.

6. **Material discrepancy is the most valuable output.** A clean "no discrepancy" report is useful. A "Stage 4 said confirmed but here's what the code actually shows" report is the reason this stage exists.

---

## Compliance trail (required in every output)

Every `05-cross-verify.md` must include:
- What `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js"` queries were run (if any) and why
- Whether git log was checked for file modification dates
- Which v1 failure modes were checked and for which claims
- Any requirements from `process-actionables/README.md` that were relevant and how they were honored

---

## Connection to pipeline health diagnostics

The `DIAGNOSTICS.md` tracks confirmation rate across all runs (target: 40-70%). This stage contributes a second signal: **cross-verification agreement rate**.

A cross-verification agreement rate above 90% across 5+ runs should be treated as a yellow flag — the same way a confirmation rate above 85% in Stage 4 is treated as rubber-stamp risk. When the evaluator agrees with Stage 4 almost every time, either the pipeline is producing genuinely reliable Stage 4 output, or the evaluator is unconsciously deferring to Stage 4 framing despite the information boundary.

Track and report this rate in the pipeline diagnostic alongside the existing metrics.

If `DIAGNOSTICS.md` does not exist, create it next to `process-actionables/README.md`.
