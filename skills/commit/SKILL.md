---
name: commit
description: "Handle git commits with structured messages and staged file control. Use when asked to commit, stage, or push changes."
triggers:
  - "git commit"
  - "commit"
  - "commit message"
  - "commit changes"
  - "stage and commit"
---

# Commit Workflow

**Default scope:** Unless otherwise expressed, "commit" means commit across all of your main repos — plus the **parent repo** as a bonus check (hooks, CLAUDE.md, .mcp.json, submodule pointers, skills-mcp-server, etc.).

**Default end state:** The `commit` skill is always responsible for checking all of these locations and driving them to a clean working tree before it considers the job complete, unless the user explicitly narrows the scope. That means:

- inspect each of your main repos and the parent repo every time
- identify what changed in each repo
- split work into single-responsibility commits as needed
- **governer-score each batch** before committing (this is always-on, not optional)
- for batches scoring >= 40, call `/insight` to confirm risk profile against institutional knowledge
- validate code changes before committing — browser checks for user-facing UX, code review for backend, with evidence logged proportional to governer score
- keep fixing post-commit warnings until the affected repo is clean
- only stop with a dirty repo if the user explicitly scoped the request away from it, the repo is outside git, or you hit a real blocker and report it

Do not silently treat "commit" as "commit whatever repo I happened to touch." The default contract is all-repo cleanliness (main repos + parent).

## 0. Intent Preservation Gate (MANDATORY — runs before any blocker response)

Before saying a repo "cannot" be committed, run this alignment loop:

1. `stated_intent`: what outcome did the user actually ask for?
2. `current_obstacle`: what fact in the environment appears to block that outcome?
3. `assumption_being_frozen`: what am I incorrectly treating as fixed?
4. `alignment_preserving_next_step`: what is the smallest safe change that moves the environment toward the stated intent?

If your response only explains the obstacle but does not move the user closer to `stated_intent`, you are deviating from intent.

Never substitute:

- current environment state for the requested outcome
- repo absence for a hard blocker
- explanation of constraints for progress toward the task

The job is to align the environment to the user's stated outcome when it is safe and local to do so.

### Missing Git Repo Is A Setup Step, Not A Dead End

If the user asks to commit changes in a directory and that directory is not yet a git repo, treat that as a recoverable setup condition by default.

Default path:

1. Confirm the directory is the intended scope.
2. If it is not a git repo, propose or execute `git init` as the next alignment-preserving step.
3. Continue the commit workflow after initialization.

Do not stop at:

- "this directory is not a git repo"
- "these files cannot be committed from here"

unless one of these is true:

- the user explicitly does not want a repo initialized
- initializing git would affect a location outside the requested scope
- there is a real safety or permission blocker you cannot resolve locally

Canonical example:

- User intent: "commit the skill fixes"
- Obstacle: `~/.codex` is not a git repo
- Wrong response: "those changes cannot be committed"
- Right response: "initialize `~/.codex` as a git repo, then commit the skill changes"

## 0.5 Intent-Articulation Gate (MANDATORY — runs on every file before it is staged)

The user's directive, VERBATIM (2026-07-04) — apply to the code you are about to commit:

> "make sure my near verbatim intent statements are articulated. the intent of the system not the
> code but how I talk about it, commented in the code so agents know what REALITY it should produce.
> code is map of intent, intent statements are map of target reality, then commit it. no agent
> should have ambiguity over the intent of the code you are committing. No variable names should be
> ambiguous, no code should be written without clear enough comments that agents know exactly what
> the original intent was. avoid assumptions or assertions when documenting intent or comments,
> assertions indicate not to check if code performs its intent. intent reveals possible gaps worthy
> of testing so they steer agents towards what to test when issues arise."

Operationalize this before staging each file you authored or changed in this session:

1. **Intent present, in the user's terms** — every non-trivial function/module/schema field carries
   a comment stating the REALITY the code is meant to produce (the system's intent, how the user
   talks about it), not a paraphrase of what the code literally does. When the user's words exist for it,
   quote them verbatim and date them, rather than restating in "cleaner" form.
2. **Intent, not assertion** — a comment must NOT assert the code is correct ("this returns the true
   population", "this guarantees X"). Assertion tells the next agent NOT to verify. Write the intent
   and name the gap worth testing: "INTENDED to return the full eligible population — verify against
   getQueueWithBusinessLogic's total when the queue looks wrong." Intent reveals what to test.
3. **No ambiguous variable names** — if an agent could hallucinate a second meaning for a name,
   qualify it with domain context (per `/how-to-name-things` and its banned-bare-words list).
4. **Only your own work** — apply this to files THIS session authored/changed. Do NOT rewrite or sweep
   up another agent's in-flight uncommitted work to meet this bar; commit your files, leave theirs.

This gate does not block on pre-existing comments in untouched code — it governs what YOU commit.

## 1. Obey Wording Exactly

| User says | Action |
|-----------|--------|
| **"prep a commit"** | Stage files, output the message — do NOT run `git commit` |
| **"commit"** or **"and commit"** | Stage + commit locally |
| **"push to [branch]"** | Push only when they explicitly name the target branch |

**Never push to main/production unless explicitly told.**

## 1.05. Commit Intent (MANDATORY — interpret BEFORE batch selection)

The intent of the commit workflow is not merely "make a commit." It is to force the agent to understand the real concern boundaries before staging anything.

### Core interpretation

- A good commit is **decision-sized**, not feature-sized
- Each commit must represent **one precise reversible outcome**
- The large-commit guard is **not** the primary tool for sizing commits
- If you hit the large-commit guard, treat that as proof that decomposition already failed earlier

### Required sizing question

Before staging a batch, ask:

> If this exact commit were reverted in isolation, what single user/admin/system outcome would disappear?

If the answer contains more than one meaningful outcome, the batch is too broad and must be split again.

### Required decomposition test

Before every commit batch:

1. Read the full diff first
2. Name the distinct concerns in plain language
3. For each concern, state the single reversible outcome
4. Stage only the files required for that one outcome
5. Reject any batch whose commit message needs to describe two outcomes joined by "and"

Never treat "all these files relate to the same broad feature family" as sufficient reason to bundle them into one commit.

### Practical meaning of the large-commit guard

- The guard exists to catch reasoning failure late
- The agent's job is to avoid needing the guard by decomposing earlier
- A commit process that repeatedly reaches the guard is not following this skill correctly

## 1.06. Governer Scoring Per Batch (MANDATORY — ALWAYS ON)

Every commit batch gets governer-scored before committing. This is **always-on default behavior**, not conditional on the user attaching `/governer`. The user does not need to ask for it — you do it automatically as part of the commit workflow.

For each proposed batch:

1. Run `/governer` on that batch's exact concern — score 0-100
2. Evaluate the risk profile of that batch
3. Ask what could go wrong if this batch is wrong or under-validated
4. Decide whether the available evidence is sufficient **relative to the batch's governer score**
5. Use that as the final commit gate

The question is not "did I run some tests." The question is:

> Given this batch's governer score, do I have enough evidence that it is actually done?

If the answer is no, do more validation before committing.

### `/insight` Risk Profiling (MANDATORY for scores >= 40)

For any batch scoring **>= 40**, call `/insight` to cross-reference the change against institutional knowledge. The purpose is to surface:

- prior incidents or regressions in the same area
- the user's corrections that apply to this type of change
- alignment patterns that this batch should follow but might not

This is the "did the user already tell us something about this exact kind of change?" check. It catches the category of errors where the code is mechanically correct but violates an institutional pattern that only shows up in session history.

**For scores >= 60**, also check for evidence of alignment between:
- the code change and the documented intent (Intent DB or company intent)
- the code change and the actual runtime behavior (browser check, curl, or test run)

**For scores < 40**, `/insight` is optional but encouraged for user-facing changes.

### Evidence Depth Scaled to Governer Score

| Score range | Evidence required |
|-------------|-------------------|
| 0-19 | Governer stamp only — lightweight, commit freely |
| 20-39 | Governer stamp + code review (read the diff, confirm intent alignment) |
| 40-59 | Above + `/insight` risk profile + assumption documentation |
| 60-79 | Above + runtime validation (browser/curl/test) + compaction record |
| 80-100 | Above + independent evaluator (subagent or `/jonathan-check2`) |

This replaces the previous binary "validated / not validated" with a continuous scale. Low-risk docs commits don't need browser checks. High-risk payment changes need everything.

### UX-impact verification rule

If a commit batch impacts UX, and the batch has a plausible chain of the form:

- if X is wrong
- then Y breaks or misleads
- and Y is severe, trust-damaging, or income-impacting

then the batch should be checked in the browser unless there is a stronger reasoned form of evidence.

Do not skip that check.
Do not perform that check without leaving a record that it was done.

The evidence record must say what was opened, what action was taken, what was observed, and which intent was confirmed or still uncertain.

## 1.065. Defensive-Code and Semantic-Intent Audit Per Batch (MANDATORY — runs on every batch, not incidentally)

The user's correction (2026-07-05): a batch presented as sanity-checked and governer-scored can still ship code with silent failure paths, load-bearing assumptions nobody validated, or comments that describe what the code does without ever stating the intent behind it. Checking for these informally — because a file happened to be read closely enough to notice — is not the same as checking for them. This section makes both checks a required, explicit step per batch, not a byproduct of however carefully a file was read.

Before presenting or committing any batch, walk every file in it and answer these, in writing, as part of the batch's evidence:

### Defensive-code check (per file, per batch)

For each failure-capable operation in the batch (a DB call, an external API call, a parse, a lookup that can return null/undefined, a network request):

1. **Does a failure here degrade gracefully, or does it break something?** Name the specific breakage if it's not graceful — not "might not be robust," but the actual downstream consequence (a crashed request, a silently-empty result treated as success, a paying user losing access, a person never getting an email with no trace).
2. **Is the failure direction correct** — does it fail toward the safer outcome for the user (fail-open where openness is safe, fail-closed only where security demands it), per this repo's standing rule that agents never let a code failure reduce what a user is entitled to?
3. **Are load-bearing assumptions validated, or just asserted?** An assumption is load-bearing if downstream code trusts it without re-checking (e.g., "the scan and the claim reference the same population," "this field is always populated," "this list is never empty"). For each load-bearing assumption in the batch: is there a test, a runtime check, or a fail-soft fallback that catches the case where the assumption is wrong? If not, name it as an open risk — do not silently let an unvalidated assumption ride into a commit message that implies the batch is fully proven.
4. **Surface every gap found** — even gaps that don't block the commit. A batch can still be commit-worthy with a named, honest gap (per the Evidence Depth Scaled to Governer Score table above); what it cannot have is a gap that existed and wasn't surfaced.

### Semantic-intent documentation check (per file, per batch)

For each new or substantively changed function, module, or non-trivial block in the batch:

1. **Does a comment state the intent — the reality this code is meant to produce — in terms an agent with zero session context could act on?** Not "what the code does" (the code already shows that), but why it exists and what it's supposed to guarantee.
2. **Is that intent falsifiable, not just asserted?** Per Section 0.5's Intent-Articulation Gate above, an intent comment must never assert correctness ("this guarantees X") — it must state the intent and name what's worth testing if the intent doesn't hold. A comment that only asserts correctness tells the next agent not to verify, which is itself a defensive-code gap.
3. **If the comment is missing or is a what-not-why description**, that is a finding — write it, and either fix it before committing (preferred, since Section 0.5 already requires this for anything the current session authored) or name it explicitly as a gap in the batch's sanity-check output if it's pre-existing code the batch only touches incidentally.

### Where this surfaces

Findings from both checks go into the batch's `/sanity-check` output — not as a separate report, but woven into the existing "Decisions surfaced" and "Assumptions" sections (per the sanity-check skill's own format). A batch with a real, named gap can still commit at the evidence depth its governer score requires; a batch presented as clean when this audit would have found a gap cannot.

This check applies per batch, every time — it is not satisfied by having done it once earlier in a session, and it is not satisfied by noticing a fail-open pattern incidentally while reading code for some other reason. Do the check, on purpose, and show that you did.

## 1.07. Orchestrated Commit Research (MANDATORY for non-trivial commit evaluation)

When commit evaluation is token-intensive, uncertain, or spans multiple repos/concerns, use `/orchestrator` to coordinate the commit gate.

The orchestrator role here is:

- define the outcome for each candidate commit batch
- route cheap evidence gathering to research agents
- evaluate those results at a higher reasoning level
- decide whether implementation fixes, extra tests, or browser checks are still required
- remain accountable for the final commit/no-commit decision

### Required orchestration pattern

For non-trivial commit review:

1. Use cheap research agents first (mini / haiku equivalents) to gather:
   - current repo state
   - diff summaries
   - likely concern boundaries
   - prior compactions / intent context
   - existing evidence for validation
2. Evaluate those research results with a stronger reasoning model (sonnet-level equivalent)
3. If more implementation, testing, or validation is needed, dispatch agents at the minimum intelligence tier that can do the work correctly
4. Attach logs of these actions to `/compact-agentic-session`
5. Use the resulting provenance as part of the commit evidence gate

This means the commit workflow is not only about staging files. It is also about proving that the batch was investigated, risk-scored, and validated to the degree its governer score requires.

## 1.1. Governer Evidence Gate (MANDATORY — RUNS BEFORE STAGING ANYTHING)

This gate fires the moment "commit" is invoked. **No files are staged. No commit is created. Nothing proceeds until this gate passes.**

### Step 1: Check for Existing Governer Evidence

Look for evidence in this priority order:

1. `.claude/commit-evidence/pending.json` in any repo being committed — written by the agent that did the work
2. `current-governer-state.json` at any repo root — governer output from this session
3. A compact session ID visible in the current conversation with governer output attached

**If valid evidence exists** and it covers the changes about to be committed → read it, confirm coverage, skip to Step 4 (stamp it and proceed).

**If NO evidence exists** → Step 2 is mandatory. The commit does not proceed until evidence is created.

### Step 2: Batch-Scoped Governer via Orchestrated Research (when no prior evidence exists)

When `/governer` is attached to the commit request, or when the batch is non-trivial, do NOT jump straight to a single monolithic self-eval. First use cheap research/orchestration to understand the batch.

Required flow:

1. Use `/orchestrator`
2. Send cheap research agents to gather evidence on the candidate batch:
   - repo state
   - exact staged/unstaged files
   - likely concern boundary
   - what could go wrong
   - what existing validation already exists
   - whether past compactions or intent records clarify the intended behavior
3. Synthesize those results into the batch definition
4. Then run the sonnet-level batch scoring step below on the now-bounded concern

The batch score must correspond to **one committable concern**, not the whole feature family.

### Step 2A: Self-Rank Via Sonnet Subagent (after the batch is bounded)

Dispatch a subagent using model `claude-sonnet-4-6` to score the changes:

```
Subagent prompt:
  "You are scoring code changes for governer ranking before commit.
   
   Diff summary: {summarize the staged/unstaged diff}
   Files changed: {list files}
   Branch: {current branch}
   Repo: {repo name}
   
   Tasks:
   1. Run /governer on the exact commit batch concern below. Score 0-100 on the IX-SILA scale.
   1b. Explain what exact single reversible outcome this batch represents. If it represents more than one outcome, reject the batch as too broad.
   2. For each concern scoring >= 20:
      a. State every assumption made explicitly — do not say 'assumed to work', say WHAT was assumed
      b. List gaps: places where intent was stated but not fully validated in code
      c. Mark user_facing: true if ANY user could encounter this change in their session
      d. Mark playwright_required: true if user_facing is true
      e. Mark evidence_sufficient_for_score: true only if the observed validation is strong enough for the governer score
   3. CRITICAL: Your entire response must be ONLY the JSON block below. No introduction. No explanation. No markdown. No prose before or after. Start your response with { and end it with }. Any text outside the JSON block will cause the gate to fail."
```

The subagent must return a JSON block. **If the response contains any prose outside the JSON, treat it as a parse failure.** Extract the JSON block if possible (look for `{` ... `}`), otherwise retry once with the instruction "Your previous response contained prose. Return ONLY the JSON block, starting with { and ending with }. No other text." If it fails twice, write the evidence block manually with `governer_ran_by: 'agent-self-incomplete'` and proceed — but flag it in the commit message.

**Output format the subagent must return:**
```json
{
  "scored_at": "<ISO timestamp>",
  "governer_ran_by": "sonnet-subagent",
  "session_context": "<one sentence: what was built and why>",
  "concerns": [
    {
      "label": "<concern name>",
      "score": 0,
      "user_facing": false,
      "assumptions": ["explicit assumption text"],
      "gaps_identified": ["gap description or N/A"],
      "playwright_required": false,
      "playwright_evidence": null,
      "playwright_skipped_reason": null,
      "evidence_sufficient_for_score": false
    }
  ],
  "compact_session_id": null,
  "all_assumptions_validated": false,
  "ready_to_commit": false
}
```

### Step 3: Playwright Validation (required for every `user_facing: true` concern)

For each concern where `user_facing: true` AND `playwright_required: true`:

1. Run browser verification (Playwright, Chromium headless, or documented manual steps)
2. Record the **exact observed behavior** — not "it works" — describe what was seen:
   - What page/state was opened
   - What action was taken
   - What the UI/API returned
   - Which UX intent was confirmed or not
3. Fill `playwright_evidence` in the concern block with that description
4. POST the evidence to `/compact-agentic-session` (run `/compact-agentic-session` skill) — capture the returned `shortId`
5. Set `compact_session_id` in the evidence block to that `shortId`

Also append the browser-validation log to `/compact-agentic-session` so future agents can see that the check happened and what was observed.

**If playwright is unavailable**, set `playwright_skipped_reason` to a description of the manual verification performed. "Not available" alone is not acceptable — state what manual steps were taken and what was observed.

**This step cannot be skipped for user-facing changes.** A concern with `playwright_required: true` and `playwright_evidence: null` and no `playwright_skipped_reason` means `ready_to_commit` stays `false`. The commit cannot proceed.

### Step 4: Set `ready_to_commit: true` — the unlock condition

`ready_to_commit` flips to `true` only when ALL of the following are true:

- Every concern has a `score` (not 0 by default — actually scored)
- Every concern with `user_facing: true` has either `playwright_evidence` filled OR `playwright_skipped_reason` filled with actual observations
- Every concern scoring >= 50 has at least one explicit `assumption` and one `gaps_identified` entry (not just "N/A")
- Every concern has `evidence_sufficient_for_score: true`
- If any concern scores >= 50, `compact_session_id` is filled with a real session ID

**`ready_to_commit: false` = hard stop.** Do not proceed. Resolve what's blocking it.

### Step 5: Write the Evidence Stamp

Write the completed evidence block to: `docs/commit-evidence/pending.json`

> **Why `docs/commit-evidence/`?** `.claude/` is gitignored in all IX repos. Evidence must be in a tracked path to become part of the permanent git history.

```bash
# Create the directory if missing (only needed once per repo)
mkdir -p docs/commit-evidence

# Write the evidence block (substitute your actual JSON)
cat > docs/commit-evidence/pending.json << 'EOF'
{ ... evidence JSON ... }
EOF
```

### Step 6: Stage the Stamp WITH the Code

The evidence file is **part of the commit**. It must be staged alongside the code it validates:

```bash
git add docs/commit-evidence/pending.json
```

Add these lines to the commit message body:

```
Evidence: docs/commit-evidence/pending.json  # governer score + assumptions + playwright evidence
Compact: <compact_session_id>                # full paper trail in compaction system
```

If `compact_session_id` is null (low-score, non-user-facing changes only), omit the `Compact:` line.

### What "Cannot Be Skipped" Means in Practice

| Change type | Governer required | Playwright required | Compact session required |
|-------------|-------------------|---------------------|--------------------------|
| User-facing feature | ✅ yes | ✅ yes | ✅ yes (score >= 20) |
| User-facing bug fix | ✅ yes | ✅ yes | ✅ yes (score >= 20) |
| Admin-only UI | ✅ yes | ✅ recommended | if score >= 50 |
| Backend-only, no user exposure | ✅ yes | ⬜ no | if score >= 50 |
| Infra / config / docs | ✅ yes | ⬜ no | ⬜ no |
| Score < 20 | ✅ yes (stamp still written) | ⬜ no | ⬜ no |

**This gate applies to agent commits.** Humans may commit freely. When an agent commits, a missing `Evidence:` line in the commit message is the audit trail that the gate was bypassed. Reviewers will see it.

---

## 1.5. Pre-Commit Quality Gate Compliance (MANDATORY — DO NOT SKIP)

The pre-commit hook runs 16 checks in non-blocking advisory mode. **Non-blocking means humans can commit freely. It does NOT mean you can ignore failures.** You are an agent — you fix what the hook finds. This is literally your job at this step.

**After EVERY `git commit`:**

1. **Read the pre-commit output in the Bash result.** Look for any line containing `⚠` or `AGENT:`.
2. **If failures exist (`⚠ ... AGENT: fix in your NEXT commit`)**:
   - STOP. Do not proceed to the next batch, next concern, or any other work.
   - Read what each failing check flagged. Understand the root cause.
   - Fix the issues in the code.
   - Create a follow-up fix commit for those issues.
   - Only THEN proceed to the next concern.
3. **If the PostToolUse hook injects `additionalContext` with `❌ POST-COMMIT QUALITY GATE`**: same rule — fix before proceeding.
4. **If all checks pass (`✅`)**: proceed normally.

**Why this exists:** The pre-commit hook is non-blocking so the human can always commit. But agents previously read "commit succeeded" and moved on, ignoring yellow warnings that indicated admin security gaps, intent coverage holes, and data-destroying Mongoose update patterns. Those warnings are not informational — they are fix orders.

**What "fix" means:** Read the check's output, understand the violation, fix the code, commit the fix. Not "acknowledge and move on." Not "I'll do it later." Fix. Now. Then proceed.

### Alignment Failure Classification (MANDATORY — name the failure, don't blur it)

When a linter, scanner, hook, or gate complains, classify the failure before fixing it. Do not summarize everything as "lint issues."

Use one of these labels in your own reasoning and in any follow-up commit summary:

- `hallucinated-intent`: The code was written as if an intent existed, but the actual user request, skill, or repo rule does not support it.
- `undocumented-intent`: The change may be valid, but the intent is not documented in Intent DB, the skill contract, or nearby code comments/tests strongly enough to trust it.
- `gate-skipped`: The code or workflow bypassed a required check, security gate, verification contract, or environment rule.
- `implementation-bug`: The intent was correct, but the code is mechanically wrong.
- `scanner-false-positive`: The code is correct and the rule is wrong; fix the rule instead of deforming the code.

Examples:

- A localhost-only feature checked `window.location.hostname` even though repo policy requires canonical environment helpers: `gate-skipped`.
- A commit introduces behavior that "feels right" but no user request, skill, or Intent DB entry supports it: `hallucinated-intent`.
- A UX-visible change is committed without the required verification evidence: `gate-skipped`.
- A fix references an intent slug that does not exist yet: `undocumented-intent`.

### Evidence Required For Each Failure

Every post-commit warning you fix must produce evidence of why it happened and how you resolved it. That evidence can live in the next commit message, the staged evidence file, or both, but it must exist.

Capture:

- `signal`: the exact warning, gate output, or rule name
- `classification`: one of the labels above
- `source_of_truth`: what you checked to determine the real intent or rule
- `resolution`: whether you fixed code, fixed the scanner, or documented intent

Minimum examples:

- `signal: ENV_DETECT_SPOOFABLE`
- `classification: gate-skipped`
- `source_of_truth: CLAUDE.md security rule + canonical config helper`
- `resolution: replaced hostname sniffing with shared environment helper`

- `signal: missing intent coverage`
- `classification: undocumented-intent`
- `source_of_truth: commit diff + Intent DB lookup`
- `resolution: mark Intents as PROPOSED or add the missing intent before continuing`

If you cannot produce `source_of_truth`, you do not understand the warning yet and must not proceed.

### Commit-Skill Handling Standard

When navigating any linter or gate failure during `/commit`, follow this exact loop:

1. Quote the warning text precisely.
2. Classify it using the labels above.
3. Identify the governing contract you checked: user request, skill text, CLAUDE.md rule, Intent DB entry, test, or scanner source.
4. Fix the right layer.
   If the code violated a real contract, fix the code.
   If the warning came from a bad rule, fix the scanner.
   If the behavior is valid but undocumented, document the intent instead of hand-waving.
5. Re-run the relevant check and confirm the signal is gone or intentionally reclassified.

Never write or imply:

- "just a lint issue"
- "pre-existing warning"
- "ignored because commit succeeded"
- "probably intended"

Those phrases erase alignment evidence and hide the real failure mode.

### Outcome Alignment Test (MANDATORY — catch self-deviation in the moment)

Before returning any blocker explanation, ask:

- Does this response make the user's original goal closer to done?
- Or does it merely describe why the current environment does not already satisfy the goal?

If it is only the second, stop and find the next setup, repair, or alignment step.

Use this compact test:

- `goal_closer`: yes/no
- `environment_modified_toward_goal`: yes/no

If both are `no`, you are about to substitute narration for alignment work.

## 2. Single Responsibility Commits (MANDATORY)

Your job is to split changes into single-responsibility commits. Each commit should do ONE thing so it can be reverted independently if it harms the code.

**How to split:** Group files by the concern they address, not by repo or directory. If one change fixes X and another fixes Y, they are separate commits — even if both touch the same repo.

**Nuance that matters:** "same feature" is not the sizing rule. "same reversible outcome" is the sizing rule. If reverting the batch would remove two meaningful outcomes, it is still too broad even when all files live under one feature area.

**What counts as one responsibility:**
- Adding test IDs to 16 files → one commit (one concern: testability)
- Fixing a bug in auth + adding a new admin page → two commits (unrelated concerns)
- Adding a model + its backfill script + its API routes → one commit (one feature end-to-end)
- Vector store quality improvements + pulse JSON stripping → two commits (unrelated systems)

**Process:**
1. Read all diffs across repos
2. Identify distinct concerns (list them)
3. For each concern, stage only its files and commit
4. Repeat until all changes are committed

**Why:** Large multi-concern commits hide regressions. If one change breaks production, a single-responsibility commit lets us `git revert` just that change. A bundled commit forces us to revert everything — including the 5 things that worked.

## 3. Stage Only What You Changed

- Stage only the files you actually modified for this request
- If the user mentions specific paths, include them even if untouched

## 4. Lead with UX Intent (ALWAYS)

- **Title = IntentTitle**: the immediate "the user will get it if I say it this way" single sentence — triggers instant memory recall, connects what was done to the highest value part of the change
- **First paragraph = Intent**: the exact, precise, context-bound intended UX change — including the specific conditions under which it occurs, who experiences it, what they see, and what changes from today — no generalizing, no abstracting, no reducing nuance, no meaningless noise
- Be hyper specific about intent, not verbose, but nuanced enough to be instantly understood — replace jargon or variables with what they mean in UX
- Include steps to verify the changes you're discussing

## 5. Commit Message Format

### The sanity-check IS the commit body (the user's directive, 2026-07-17 — VERBATIM, non-negotiable)

The user, verbatim: *"your sanity check goes into the commit description always."*

The per-batch `/sanity-check` output — the numbered intent-contract statements written in the user's voice, plus the "Decisions surfaced" and "Assumptions/gaps" sections that skill produces — is NOT a separate artifact you show the user and then discard when you write a different commit message. It IS the commit description body. Write the sanity-check once, per batch, and that same text (statements + decisions + named gaps) becomes the body of the commit for that batch.

Concretely:
- Do NOT produce a sanity-check in chat and then author a fresh, differently-worded commit body. That splits one artifact into two and loses the user-reviewed intent statements.
- The numbered "if this is aligned, your intent must have been: when [condition] then [outcome] so that [why]" statements go into the commit body verbatim.
- The decisions-surfaced and named-gaps sections go into the body too (they map onto the Intent / Risks / RiskAbatement fields below — a surfaced decision's rejected-alternative becomes the Risk, the validation that settled it becomes the RiskAbatement).
- The user reads the commit description AS the sanity check. One read, one artifact, at the accept/reject moment.

The template below is the container the sanity-check text fills — Title is the IntentTitle line, Body opens with the numbered intent statements, then decisions/risks/verification follow.

```
Title: <type>(scope): <IntentTitle — the single sentence that triggers instant user memory recall for what this change does>

Body:

<Intent — the exact, precise, context-bound intended UX change. What specific conditions trigger it, who experiences it, what they see differently, what changed from before. Full nuance, no generalizing. This paragraph is the contract for what this commit delivers.>

How to verify it's right: <the specific check that proves this works — what to open, what to do, what to see>
Risks: <exactly what could go wrong if built incorrectly, in UX terms — e.g. users locked out when paying, agents failing silently, tokens wasted on automation that doesn't persist | null if no high-priority risks>
RiskAbatement: <for each risk, the specific test or requirement that prevents it — e.g. run browser test to confirm paying users can still access settings | null if Risks is null>

Intents: <intent-slug-1>, <intent-slug-2>   # Intent DB slugs addressed by this commit

Tags: Admin, User Facing, GPT5 Upgrade, Maintenance, Diagnostics, Coaching Quality, Priority:8/10   # pick the ones that apply; at least one canonical tag + Priority:x/10

Files: <frontend-repo>/docs/internal/index.html, <api-repo>/scripts/dev-docs-server.js   # update with the staged paths only

Change log links: <frontend-repo>/docs/internal/changelog.json   # include full relative links for every docs/issue file you touched

Task register: updated <api-repo>/docs/issues/INDEX-MAP.md   # omit this line if not touched
```

### Proposal Auto-Linking (MANDATORY)

Before writing the commit message, check if any changed files match open proposals:

```bash
# Get changed files for this commit group
CHANGED_FILES=$(git diff --cached --name-only)

# Query proposals API for approved/in-progress proposals matching these files
alignment-harness store list proposals --limit 100000 --json | python3 -c "
import json, sys
data = [p for p in json.load(sys.stdin) if p.get('status') in ('approved', 'in-progress')]
changed = set('''$CHANGED_FILES'''.strip().split('\n'))
for p in data:
    targets = set(p.get('targetFiles', []))
    overlap = targets & changed
    if overlap:
        print(f'Resolves-Proposal: {p[\"id\"]}  # {p[\"title\"][:60]}')
"
```

**If any proposals match**, add `Resolves-Proposal:` lines to the commit message body (after the Files line):

```
Resolves-Proposal: 6a00000000000000000000a1  # CoachingSessionHelper swallows usage limit errors
Resolves-Proposal: 6a00000000000000000000a2  # handleRegenerate swallows all errors silently
```

**Rules:**
- Only link proposals whose `targetFiles` overlap with actually-changed files in this commit
- The post-commit hook will parse these tags and auto-mark proposals as `implemented` with the commit hash
- If an agent was dispatched to fix specific proposals, those IDs MUST appear even if the file-match query misses them (proposal may have stale targetFiles)
- When dispatching subagents to fix proposals, ALWAYS include in their prompt: "When committing, include `Resolves-Proposal: <id>` for each proposal you fixed"

### Intent Integration

Commit messages MUST reference the Intent DB slugs addressed by the change. This creates a traceable link from code changes back to documented UX promises.

**Before writing the commit message**, query Intent DB for the feature area:

```bash
alignment-harness intent search "feature area keyword"
```

**Add the `Intents:` line** after the body paragraph, listing the relevant slugs:

```
fix(auth): users no longer silently lose refresh token on login

This commit aims to ensure the browser stores the httpOnly refresh token
cookie when a user logs in from the landing page, in the context of
cross-domain cookie authentication between app.example.com and www.example.com.
It will only take effect when login/register fetch requests hit the API,
because credentials: 'include' is required for Set-Cookie to be honored
cross-origin.

Intents: auth-api-credentials-include, registration-stores-both-tokens

Tags: User Facing, Priority:9/10
Files: <frontend-repo>/src/utils/authApi.js
```

**If no matching intent exists**, note the proposed intent:

```
Intents: PROPOSED:checkout-error-shows-human-message
```

This signals to reviewers that a new intent should be documented in the Intent DB.

## 6. Verification Requirements

**These are NOT programmatic tests.** Ask yourself:

> "What exact steps does the human admin need to take so that if anything broke or failed at its intended outcome, they will see it? What's the minimum steps for that?"

### Examples by Change Type

**Authentication changes** (e.g., increased cookie duration to 30 days):
```
- [ ] Log out, then log back in
- [ ] Paste `document.cookie` in browser console, check cookie duration is > 29 days
```

**Site-wide style changes**:
```
- [ ] Flip through all pages of the site quickly, look for anything broken
```

**AI reasoning changes** (admin-only feature):
```
- [ ] Go to /dashboard, turn on "view as non-admin", create 1 reply, check for reasoning trace — if none, mark done
- [ ] Go to /dashboard as admin, generate 1 coaching reply, check for X and Y — if present, mark done
```

**Payment changes**:
```
- [ ] Test the full payment flow before merging
```

### Format

```
To test this:

- [ ] <minimal verification 1>
- [ ] <minimal verification 2>   # mirror any validation steps you added to the changelog
```

Keep checkboxes so reviewers can copy/paste.

## 7. Changelog Task References

If you added tasks inside the internal changelog UI, list the affected entry IDs:
```
Tasks captured under entry 814b14b2
```

## 8. Follow-Up Prompt

After the commit body, always append:

```
(just reply with a number for me to take these steps, shortcuts are included)
1 Additional documentation (-docs)
2 A changelog entry for user awareness (-changelog)
3 An update of our internal or user facing docs (-userdocs)
4 An update of our roadmap (-roadmap)
5 A git issue from the `gh` CLI assigning the owner with test checklists (-issue)
6 Update internal changelog tasks (-doctasks)
7 Register/update intent in Intent DB (-intent)
```

### When to offer option 7

Option 7 is **conditional, not mandatory**. Offer it when the commit's `Intents:` line contains:
- `PROPOSED:slug` entries — these need to be created in Intent DB via `alignment-harness intent add --statement "When …" --status proposed`
- Existing slugs that resolved a known violation — the related systems (SystemLog, AgentProposal) may need updating

When invoked (-intent):
1. Parse the `Intents:` line from the last commit message
2. For each `PROPOSED:slug` — create the intent via `alignment-harness intent add`, which auto-assigns an ID
3. For existing intents — no action on the Intent itself (intents are reference material, not tasks). But if a violation or system log triggered this work, update those records with the commit hash.
4. Return the IDs — these can then flow into downstream systems (UX assignments, changelogs, etc.) via their `intentIds[]` fields

**Do NOT offer option 7 when:**
- The commit has no `Intents:` line (maintenance, refactoring, infra work)
- All referenced intents already exist and no violation triggered the work

## 9. Execution Rules

| Command | What to do |
|---------|------------|
| `prep a commit` | Output title + body exactly as you would run `git commit -m` — but don't execute |
| `commit` / `and commit` | Run the real command, confirm the commit hash in your answer |
| `push to <branch>` | Push only if explicitly requested with branch name |

## Notes

- **Tags line**: comma-separated, Title Case for canonical tags, `Priority:x/10` for urgency
- **Files**: if >3 files, you may list directories (`src/ui/**`) but be precise
- **Change log links**: exact Markdown-like paths for any docs you edited
- **Task register line**: only when you touched `/docs/issues/INDEX-MAP.md`
