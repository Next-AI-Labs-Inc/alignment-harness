---
name: governer2
description: "EXPERIMENTAL clone of /governer with FORCED workflow stages, A/B-tested oracle enrichment, and full observability. Each required skill returned by the oracle becomes a TaskCreate item agents cannot skip. Every invocation announces variant + WHEN it runs in /speak-human form, prints full oracle input/output transcript, and logs any forced-stage violations. Behind GOVERNER2_ORACLE_ENRICH and GOVERNER2_FORCED_STAGES flags — both default off. Created by Lattice 2026-04-23 under L-SEED-001 + L-G2-001."
triggers:
  - "governer2"
  - "experimental governer with forced stages"
  - "ab test governer oracle enrichment"
  - "forced workflow stages"
  - "governer with oracle a b test"
---

# Governer2 — Experimental Forced-Stage Variant of /governer

> **Status:** Experimental. Default OFF. Master kill switch: `GOVERNER2_ENABLED=false` (env var) — when false, this skill REFUSES to run and tells the agent to use `/governer` instead. Currently `GOVERNER2_ENABLED=false` until the user explicit greenlight.
>
> **Difference from /governer:** Same scoring + routing core, plus four additive layers:
> 1. **Variant announce** — every invocation prints in /speak-human form which A/B variant is active and WHEN this stage runs
> 2. **Oracle enrichment A/B** — Variant A queries the new `governer2-training-corpus` NotebookLM oracle (when notebook ID configured); Variant B skips it (baseline)
> 3. **Forced workflow stages** — every required skill the oracle returns becomes a TaskCreate item the agent cannot mark the task complete without invoking
> 4. **Full observability** — `ORACLE_INPUT`, `ORACLE_OUTPUT` (full transcript, no summarization), `DECOMP_DELTA` (changes vs static rules), `VIOLATIONS` (any forced stage skipped) — all printed to session
>
> Source of truth for /governer baseline: `~/.claude/skills/governer/SKILL.md`. Diverging from baseline behavior requires a §17 update log entry in the auto-calibrating-agent-os parent doc.
> If the auto-calibrating-agent-os parent doc does not exist, create it as `$(alignment-harness records governer2)/auto-calibrating-agent-os.md` with a §17 update log section.

Before your output, print `## GOVERNER2_SCORE` on its own line. This enables automated extraction. After your governer2 output is complete, print `## END_GOVERNER2_SCORE` on its own line.

---

## Phase 0 — Variant Announce (NEW, mandatory first action)

Before scoring, print this exact block in /speak-human style. The block tells the user which variant they're seeing and at what stage of the pipeline this fires.

### Variant assignment

Read these env vars (or config file `~/.claude/governer2-config.json` if env not set):

- `GOVERNER2_ENABLED` — master switch. If `false` or unset → halt with: `🛑 governer2 is DISABLED. Use /governer instead.` and stop. Default `false`.
- `GOVERNER2_ORACLE_ENRICH` — A/B variant flag.
  - `true` → **Variant A** (oracle enrichment fires)
  - `false` → **Variant B** (baseline, oracle skipped)
  - `random` → 50/50 hash of session id (deterministic per session)
  - unset → defaults to `false` (Variant B)
- `GOVERNER2_FORCED_STAGES` — forced-stage enforcement flag.
  - `true` → required skills become TaskCreate items + completion gate
  - `false` → required skills are advisory only (legacy /governer behavior)
  - unset → defaults to `false`

### Required announce block (verbatim format)

```
═══════════════════════════════════════════════════════════════════════════════
GOVERNER2 — VARIANT ANNOUNCE
═══════════════════════════════════════════════════════════════════════════════

This run uses: {Variant A — Loading automatic skill file enrichment | Variant B — Loading session without automatic skill file oracle enrichment}

WHEN ACTIVE: GOVERNER2_ORACLE_ENRICH={true|false|random→true|random→false}
             GOVERNER2_FORCED_STAGES={true|false}
             Selection method: {env var | config file | random session-hash}
             Session ID: {short id}

WHEN IT RUNS: This variant fires at Phase 1.7 (between scoring complete and skill prediction gate).
              Oracle query happens BEFORE the static skill-prediction tables are consulted.
              In Variant A, oracle output is REQUIRED (forced stages) when GOVERNER2_FORCED_STAGES=true.
              In Variant B, no oracle query happens — pipeline proceeds with /governer's static logic only.

Master kill switch: GOVERNER2_ENABLED — currently {true|false}. Set to false to revert to /governer.
═══════════════════════════════════════════════════════════════════════════════
```

After printing, immediately log a telemetry event:

If the `.claude/logs/` folder does not exist, create it.

```bash
echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"Governer2VariantAnnounced\",\"variant\":\"{A|B}\",\"oracleEnrich\":{true|false},\"forcedStages\":{true|false},\"sessionId\":\"{id}\"}" >> .claude/logs/agent-telemetry.jsonl
```

Do not skip the announce. If you skip, the user loses observability of which variant they got — that defeats the entire A/B test.

---

## Phase 1 — Score (identical to /governer Phase 1)

Run the same scoring logic from `~/.claude/skills/governer/SKILL.md` Phase 1 — including:
- Category overrides
- `touchesUserState` gate (mandatory)
- IX-SILA 9 questions
- Score call (`alignment-harness score`)
- Print: `Pipeline: {feature} scored {N}/100`

Do NOT diverge from /governer Phase 1 logic in this clone. The clone differs ONLY in Phase 0, Phase 1.7, and the Forced-Stage section.

---

## Phase 1.5 — Adaptive Meta-Assessment (identical to /governer)

Run the same meta-assessment from /governer Phase 1.5 — `ac`, `hp`, `ew` self-scoring; critical-mass rule; unified score.

Memory persistence labels — same exact descriptive labels:
- `degreeToWhichThisTaskAffectsWhatUsersExperience`
- `degreeToWhichAgentMistakesWouldCompoundAcrossFutureSessions`
- `degreeToWhichGettingThisWrongWouldSpreadToOtherSystems`
- `degreeToWhichThisCouldBreakSomethingAlreadyWorking`
- `overallGovernerScore`

Telemetry log (additionally tag `via:"governer2"`):
```bash
echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"GovernerScored\",\"via\":\"governer2\",\"score\":{N},\"feature\":\"{name}\",\"ac\":{ac},\"hp\":{hp},\"ew\":{ew}}" >> .claude/logs/agent-telemetry.jsonl
```

## Phase 1.6: UX-Breakage Reasoning Gate (MANDATORY — runs AFTER Phase 1.5, BEFORE Phase 1.7)

> **Primary gate.** The static category scores are a backstop. This reasoning task is the actual gate on the autonomous-commit lane. It must be performed every single time — no exceptions, no pre-computed answers, no inherited conclusions from a previous invocation.

Before proceeding to Phase 1.7, the agent MUST write prose answers (not yes/no) to the following four questions and print them under the heading `## UX-Breakage Reasoning Gate`:

### Q1 — Would breakage change or break any user's experience?

> "If this code as staged were broken or had a hallucinated bug introduced, would that change or break the experience of any of our users?"

Answer in prose. Consider every execution path that the modified code participates in — not just the obvious "happy path." Think about what calls this code, what depends on its return values, what fails silently if it throws.

### Q2 — What UX outcomes could break?

> "If yes, in what way? Describe every user-facing UX outcome that could break."

Answer in prose. Be specific about what the user would see, fail to see, or experience incorrectly. Use the user's perspective, not the code's perspective. Example: "avatar upload could fail silently — user submits the form, appears to succeed, but their image is not stored or displayed."

### Q3 — What is the risk profile per item?

> "What is the risk profile per item — frequency × severity?"

For each item from Q2, rate it. Frequency: how often does this path execute (every session, on first login, only on avatar upload)? Severity: if it breaks, how bad is the UX consequence (user blocked from core feature vs cosmetic glitch)?

### Q4 — The comprehensive broken-UX list

> "What is the comprehensive broken-UX list — every concrete user-facing thing that could go wrong?"

This is the definitive list used by the binary rule below. It must be numbered. Include items from Q2 plus any additional items discovered while answering Q1-Q3.

### Required output format

Print the answers under this exact heading before proceeding:

```
## UX-Breakage Reasoning Gate

**Q1 — Would breakage affect users?**
{prose answer}

**Q2 — What UX outcomes could break?**
{prose answer}

**Q3 — Risk profile per item**
{prose answer}

**Q4 — Comprehensive broken-UX list**
1. {item}
2. {item}
...
(or: "None — this change has no execution path that reaches any user-facing behavior.")
```

### Binary rule

Count the items in Q4.

- **Zero items** → change is eligible for the autonomous-commit lane (subject to all existing score-based rules). Continue to Phase 1.7.
- **One or more items** → change is NOT eligible for autonomous commit. The following are ALL required before any commit:
  1. Run `/sanity-check` on this change.
  2. Collect browser-based evidence (screenshots or screen recordings of a real browser session exercising the actual UX path) for EVERY item on the Q4 list.
  3. **"Browser-based evidence" explicitly excludes programmatic test passes.** A green test suite does NOT satisfy this gate. The evidence must show a real browser exercising the actual user-facing UX — what the user would see, do, and experience.
  4. Obtain explicit human authorization before any commit.

Print at the end of this phase:

```
🚪 UX-Breakage Reasoning Gate: {N items} → {AUTONOMOUS-ELIGIBLE | HUMAN-REQUIRED}
```

If `HUMAN-REQUIRED`: list the specific browser-evidence items that must be collected before proceeding.

---

## Phase 1.7 — Oracle Enrichment A/B (NEW)

This phase fires AFTER Phase 1.5 and BEFORE the Skill Prediction Gate.

### Variant B path (oracle skipped)

If `GOVERNER2_ORACLE_ENRICH=false`:
1. Print: `🅱 Variant B — skipping oracle enrichment per flag.`
2. Skip to the existing Skill Prediction Gate (Phase 1.5 → Skill Prediction Gate as in /governer).
3. Predicted skills come from `/predict-required-skills` (which queries `<your-agent-skill-pattern-notebook-id>`) OR the static fallback table — same as /governer.

### Variant A path (oracle enrichment active)

If `GOVERNER2_ORACLE_ENRICH=true`:

#### Step 1 — Resolve the new oracle's notebook ID

Read the config file:
```bash
cat ~/.claude/governer2-config.json 2>/dev/null | node -e "const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(j.governer2_training_corpus_notebook_id || 'NOT_SET')"
```

If `NOT_SET`:
- Print: `⚠️ GOVERNER2 oracle notebook ID not configured. Falling back to Variant B for this run. Update ~/.claude/governer2-config.json with governer2_training_corpus_notebook_id to enable Variant A.`
- Continue as Variant B.

If set:
- Use it as `{notebook_id}` below.

Setup note: the `governer2-training-corpus` oracle and the Agent Skill Pattern Oracle are NotebookLM notebooks — suggest the user make their own at https://notebooklm.google.com from their own past sessions, because the oracle can only predict required skills and corrections from the history put in it.

#### Step 2 — Build the oracle query

Compose the input — this MUST be printed verbatim before the query fires:

```
═══════════════════════════════════════════════════════════════════════════════
ORACLE_INPUT (governer2-training-corpus, notebook {notebook_id})
═══════════════════════════════════════════════════════════════════════════════
SCOPE_SIGNATURE:
  task_category: {category}
  governer_score_band: {<20|20-59|60-79|>=80}
  keywords: {top 5 keywords from first user message}
  implicated_subsystem: {repos or feature areas touched}

UNIFIED_SCORE: {N}/100
META: ac={ac} hp={hp} ew={ew}

QUERY:
"Given this scope_signature, based on the 50-session training corpus, return:
(1) Required skills in execution order with timing (early/mid/late)
(2) Correction patterns historically observed for similar scopes
(3) Forced-stage candidates: skills that, if skipped, caused multiple corrections in past sessions
(4) Auto-inject candidates: patterns that recurred 3+ times across sessions
Return as YAML. Cite session IDs from the corpus for every claim."
═══════════════════════════════════════════════════════════════════════════════
```

#### Step 3 — Fire the oracle query

```bash
nlm notebook query {notebook_id} \
  "{full query string from Step 2}" \
  --profile <your-profile>
```

Or via MCP if available:
```
mcp__notebooklm__query_notebook({
  notebook_id: "{notebook_id}",
  profile: "<your-profile>",
  question: "{full query string from Step 2}"
})
```

#### Step 4 — Print full transcript (NEVER summarize)

```
═══════════════════════════════════════════════════════════════════════════════
ORACLE_OUTPUT (verbatim, no summarization)
═══════════════════════════════════════════════════════════════════════════════
{paste the full oracle response here, verbatim, including citations}
═══════════════════════════════════════════════════════════════════════════════
```

If the oracle response was empty, errored, or timed out:
- Print: `⚠️ Oracle returned {error|empty|timeout}. Falling back to /predict-required-skills (Agent Skill Pattern Oracle <your-agent-skill-pattern-notebook-id>) for this run.`
- Run `/predict-required-skills` as the Variant B fallback.
- Tag this run as `oracle_fallback: true` in the telemetry log so the A/B test results can exclude these runs.

#### Step 5 — Compute decomposition delta

Compare the oracle's required-skill list to the static fallback table from /governer:

```
═══════════════════════════════════════════════════════════════════════════════
DECOMP_DELTA (changes from static /governer skill list to oracle-enriched list)
═══════════════════════════════════════════════════════════════════════════════
ADDED by oracle (not in static):    [/skill-1 — reason from oracle, /skill-2 — reason]
REMOVED by oracle (in static, dropped): [/skill-3 — reason]
REORDERED (timing changes):           [/skill-4 moved from late→early]
UNCHANGED:                             [count: N skills agreed]
ORACLE_CONFIDENCE:                     {high|medium|low based on oracle citations}
═══════════════════════════════════════════════════════════════════════════════
```

If DECOMP_DELTA is non-empty (oracle changed something), this is the actionable signal — the oracle is doing real work.

If DECOMP_DELTA is empty (oracle agreed entirely with static), still print it — that's also a signal (the oracle adds no value for this scope class, useful for future calibration).

---

## Skill Prediction Gate (extended for forced stages)

This gate fires after Phase 1.7. Use the same threshold rules as /governer (FIRE if blast_radius>=2 OR user_facing OR complexity>=5 OR score>=40; SKIP otherwise).

### When FIRE

Combine sources in order of authority:
1. **Variant A oracle output** (if Phase 1.7 produced one) — highest authority for domain-specific skills
2. **`/predict-required-skills` static rules** — authority for ALWAYS skills (governer, declare-scope, etc.)
3. **/governer fallback table** — authority for category-default skills if neither above produced output

The merge rule (per session-artifact 11429 Proposal 6 + Lattice §17.2):
- Oracle output WINS for domain-specific (overrides static for those keys)
- Static ALWAYS rules WIN for foundational (governer, declare-scope cannot be overridden)
- If conflict not resolvable: print as `CONFLICT:` line in the Required Skill Sequence section, do not silently pick one

### Required Skill Sequence (oracle-grounded, with FORCED-STAGE markers)

Print this format:

```
## Required Skill Sequence (governer2 — oracle-grounded)

The following skills are REQUIRED for this scope based on historical patterns from the 50-session training corpus.
Each is a forced workflow stage when GOVERNER2_FORCED_STAGES=true.

1. /[skill] — [why, from oracle citation] [EARLY] [FORCED]
2. /[skill] — [why] [MID] [FORCED]
3. /[skill] — [why] [LATE] [FORCED]
N. /consume — admin-consumable output [LATE] [FORCED]
N+1. /commit [LATE] [ADVISORY]

Skipped-skill risk (oracle-flagged): [skills the oracle said are commonly skipped + corrections that resulted]
Skill source: oracle | static | fallback (per skill)
```

`[FORCED]` markers mean: see the Forced Stage Enforcement block below.

`[ADVISORY]` markers mean: included for completeness but not blocking — agent can skip without violation.

---

## Forced Stage Enforcement (NEW — only fires when GOVERNER2_FORCED_STAGES=true)

This is the difference from /governer that the user explicitly named. Each `[FORCED]` skill becomes a TaskCreate item the agent CANNOT mark the parent task complete without invoking.

### Step 1 — Create TaskList items

After printing the Required Skill Sequence, immediately call `TaskCreate` for each `[FORCED]` skill not already in the task list:

```
TaskCreate({
  subject: "FORCED: Run /[skill-name] — [oracle reason]",
  description: "Required pipeline stage per governer2 oracle (notebook governer2-training-corpus). Must be invoked and marked completed before parent task can be claimed done. Why: [oracle reasoning + citation]. Timing: [early|mid|late]. Skipping logs a VIOLATIONS event."
})
```

Print after creation:
```
🔒 Forced stages registered: {N} TaskCreate items added. Each must be marked complete before this scope is claimed done.
```

### Step 2 — Pre-completion verification (agent must run this before claiming done)

Before any "task complete" / "I'm done" / "verification passing" claim, the agent MUST run this self-check:

```
VIOLATIONS_CHECK:
  required_forced_stages: [list of /[skill] from Required Skill Sequence]
  invoked_in_session: [list of /[skill] actually invoked in transcript]
  missing: [forced stages NOT yet invoked]
  status: {PASS — all forced stages invoked | FAIL — N missing}
```

If `status: FAIL`:

```
═══════════════════════════════════════════════════════════════════════════════
VIOLATIONS — forced stages skipped
═══════════════════════════════════════════════════════════════════════════════
Skipped:
  - /[skill-1] — [oracle reason] — [why this matters]
  - /[skill-2] — [oracle reason]

This run is NOT eligible for completion claim. Either:
  (a) Invoke the missing stages now and re-run VIOLATIONS_CHECK, OR
  (b) File a §17 update log entry in the auto-calibrating-agent-os parent doc with TYPE: NEEDS_USER_GREENLIGHT explaining why this scope justifies skipping the forced stage(s), and wait for explicit greenlight.

Logging violation event...
═══════════════════════════════════════════════════════════════════════════════
```

Then log:
```bash
echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"Governer2ForcedStageViolation\",\"sessionId\":\"{id}\",\"scope\":\"{scope-summary}\",\"missing\":[{skills}],\"score\":{N}}" >> .claude/logs/agent-telemetry.jsonl
```

The Stop hook (`hooks/stop.js`) already blocks unverified completion claims — the VIOLATIONS print above gives the agent the specific stages to address. The agent can then either invoke them, or file the §17 entry.

### Step 3 — Successful completion path

If `status: PASS`:

```
✅ All forced stages invoked. Scope eligible for completion claim.
```

Then proceed to /governer Phase 3 Summary as normal.

---

## Phase 2 — Execute Steps (identical to /governer)

Same as /governer Phase 2: iterate the steps array, run inline actions (`confidence-check`, `ground-check`, `evidence-grounded-analysis`, `phantom-scan`, `completion-reflection`), trace each step.

The only difference: when Variant A is active and the oracle returned forced stages, those forced stages take priority over any conflicting step in the static `steps` array.

---

## Phase 3 — Summary (extended)

Print the same summary table as /governer, plus an A/B test row:

```
| Feature: {name} | Score: {N}/100 |
| degreeToWhichThisTaskAffectsWhatUsersExperience: {N} |
| degreeToWhichAgentMistakesWouldCompoundAcrossFutureSessions: {N} |
| degreeToWhichGettingThisWrongWouldSpreadToOtherSystems: {N} |
| degreeToWhichThisCouldBreakSomethingAlreadyWorking: {N} |
| overallGovernerScore: {N} |
| GOVERNER2 VARIANT: {A|B} | Oracle enrich: {true|false} | Forced stages: {true|false} |
| Forced stages required: {N} | Invoked: {N} | Skipped: {N} | Violations logged: {N} |
| Step | Certainty | Status | Notes |
| ... | ... | ... | ... |
```

---

## Autonomous Commit Rule (extended for forced stages)

Same as /governer, plus:

| Condition | Commit? |
|---|---|
| UX-Breakage Reasoning Gate produced ANY items (Q4 non-empty) | **NO — Sanity-check required + browser evidence per item + explicit human authorization** |
| Score < 40 AND all tests pass AND zero forced-stage violations | **YES — commit autonomously** |
| Score 40–69 AND certainty >= 90% AND zero violations | **YES — commit + trace** |
| Score >= 70 | **Queue brief, continue. Human batch-approves.** |
| ANY forced-stage violation logged | **NO — fix violations first or queue brief with §17 entry** |
| Any test fails | **NO — fix first or queue brief** |
| Payment/auth/email code touched | **Queue brief regardless of score** |

---

## Kill switch + revert

To turn governer2 off entirely:
```bash
export GOVERNER2_ENABLED=false
# OR remove the config:
rm ~/.claude/governer2-config.json
```

To revert to legacy /governer behavior fully:
- `/governer2` skill is invoked only via explicit `/governer2` command. `/governer` remains the default.
- No CLAUDE.md auto-trigger uses `/governer2` until the user enrolls it.
- Removing `~/.claude/skills/governer2/` and `~/.codex/skills/governer2/` deletes the skill entirely.

To run a single one-off observation without enabling persistently:
```bash
GOVERNER2_ENABLED=true GOVERNER2_ORACLE_ENRICH=true GOVERNER2_FORCED_STAGES=true /governer2 {task description}
```

---

## Configuration file format (~/.claude/governer2-config.json)

```json
{
  "governer2_training_corpus_notebook_id": "<NOTEBOOK_ID_HERE>",
  "agent_skill_pattern_oracle_notebook_id": "<your-agent-skill-pattern-notebook-id>",
  "default_variant": "A",
  "ab_split_method": "random|env|always_a|always_b",
  "ab_seed_field": "sessionId",
  "violations_log_path": ".claude/logs/agent-telemetry.jsonl",
  "enabled": false
}
```

`enabled: false` is the master kill switch in config form (env var takes precedence).

---

## Discoverability

This skill is discoverable via:
1. Skill triggers (this frontmatter) — covers "governer2", "experimental governer", "ab test governer", "forced stages"
2. Direct invocation: `/governer2`
3. CLAUDE.md routing — DELIBERATELY NOT YET ADDED. Adding to CLAUDE.md requires the user greenlight per §17.5 PARENT-AGENT-SELF-ENFORCING-LOOP rules, since CLAUDE.md changes propagate globally to every project.

When the new oracle notebook is created and the ID is configured, run `/discoverability-audit-learnings-findable-by-agents` against this skill to verify all 5 discovery surfaces.

---

## Why this skill exists (for future agents reading this)

The auto-calibrating-agent-os initiative needed a way to test whether the new training oracle (built from 50 mined sessions) actually improves agent behavior, without disturbing the live `/governer` baseline. This clone lets the user run side-by-side comparisons:
- Variant A (this oracle, forced stages on) vs Variant B (baseline)
- Measure `correctionsPerSession` deltas between variants
- Promote oracle output from advisory → mandatory → load-bearing only when measurement substrate (T9) confirms the variant outperforms baseline

This is the operationalization of the user's directive 2026-04-23: *"each required skill that comes back becomes an actual forced workflow stage not something agents can skip"* and *"observability happens, what got sent to the oracle PRINTED, what got returned FULL TRANSCRIPT PRINTED, when printed, any actual changes in decomp printed, any agent failing to abide by it, caught and logged and printed to session automatically"*.

Created by Lattice (execution-branch c3f13140) on 2026-04-23 under claim L-G2-001. Master ascendant chain per ASCENDANT-READING-RULE.md applies.

---

*End of /governer2 SKILL.md. To run: `export GOVERNER2_ENABLED=true GOVERNER2_ORACLE_ENRICH=true GOVERNER2_FORCED_STAGES=true` then invoke `/governer2 {task}`.*
