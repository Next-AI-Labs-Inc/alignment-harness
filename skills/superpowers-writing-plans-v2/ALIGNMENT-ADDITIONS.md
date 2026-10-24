# ALIGNMENT-ADDITIONS — Per-COAX rationale and citation audit

Companion file to `SKILL.md`. One section per coax. Each coax names: the user source, the parent doc §-reference, the CLAUDE.md line reference (where relevant), the MEMORY.md feedback file(s), and the failure mode the coax prevents.

**Purpose:** auditable trace from every v2 addition back to a primary source. If a future maintainer asks *"why does v2 do X?"* — this file answers in one lookup.

---

## COAX-1 — Obsidian filing over generic `/plans/`

**What it adds:** Plans save under `<api-repo>/docs/intent/1.5_initiatives/<initiative>/initiatives/T<N>-<topic>/01-PLAN.md` — NEVER `docs/superpowers/plans/`.

**User source (verbatim):**
- 2026-04-23: *"produced a beautiful artifact that probably should've been in the initiatives folder. I think that's where I should be reviewing these so you probably should've written that to the initiative folder and opened it and then asked me to review it."*
- 2026-04-23: *"Please re-create that document in the initiatives folder that is directly under the seed and obsidian and then opening it for my review."*

**Parent doc references:**
- §4.4 (Obsidian ↔ compaction UI fractured — no deep links)
- §4.5 (each system has uncaptured strengths/weaknesses; DO NOT merge)

**MEMORY.md citations:**
- `feedback_intent_map_means_intent_map_directory.md` (where plans belong)
- `feedback_ventures_isolated_subdirectories.md` (ventures don't cross into shared product dirs)

**Failure mode prevented:** user asks where a plan is, agent points to `docs/plans/`, user has to manually stitch between filesystem and Obsidian — or worse, the plan is invisible because the user reviews via Obsidian and never sees it.

---

## COAX-2 — Open-on-create via `open -a Obsidian`

**What it adds:** Every file write is followed by `open -a Obsidian "<path>"`. NEVER VS Code.

**User source (verbatim):**
- 2026-04-23: *"I'm noticing a systemic problem where agents are opening with VS code the files that they're modifying instead of obsidian which is actually a bit slower and harder for me to consume. It'd be nice if we could get them to try to use obsidian as a baseline and that would be an update probably one of the correct ascendant require requirement files."*

**Parent doc references:**
- §4.2 (presented context is not immediately consumable)

**MEMORY.md citations:**
- `feedback_always_open_obsidian_after_writing.md`

**Failure mode prevented:** user gets a file path in chat but not a rendered view; switches apps manually; review loop stretches from seconds to minutes per file.

---

## COAX-3 — Required YAML frontmatter

**What it adds:** `type`, `title`, `status`, `parent-initiative`, `ascendant-rule`, `self-enforcing-loop`, `created`, `author`, `certainty`, `touches_users` fields mandatory on every plan.

**User source:** structural pattern observed in EVERY existing doc in `1.5_initiatives/auto-calibrating-agent-os/` (00-PARENT-INTENT.md, ASCENDANT-READING-RULE.md, etc.) — consistent frontmatter IS the pattern.

**Parent doc references:**
- §0.5 (how to append to this doc — `### §X.Y.N — <agent-id> — <date>` pattern requires frontmatter-like structure)

**Failure mode prevented:** plans without `parent-initiative` become orphans in Obsidian's graph — user can't navigate from initiative to its plans. Plans without `certainty` encourage unqualified assertions (violates COAX-5).

---

## COAX-4 — Ascendant-chain confirmation in body

**What it adds:** `ASCENDANT_CHAIN_READ:` block immediately under frontmatter.

**Parent doc references:**
- `ASCENDANT-READING-RULE.md` "Confirmation format" section (full verbatim template)
- §15.2 (meta-irony — the doc building the system must obey the system)

**Failure mode prevented:** subagent acts on a doc without reading ancestors, hallucinates contradictions into the very initiative designed to eliminate hallucination.

---

## COAX-5 — Probability-qualified claims

**What it adds:** every factual claim carries `(probability: X%, basis: Y)` or named source.

**User source (CLAUDE.md):**
- Line 117: *"Nothing is a fact unless a human confirmed it to be true."*
- Lines 112–116: *"If you believe with high certainty dont state x is a fact, state it with a % probability,"*

**Parent doc references:**
- §0.6 Probability discipline
- §5.1 Never substitute opinion for fact

**MEMORY.md citations:**
- `feedback_every_lead_must_be_verified_before_stating_as_fact_decompose_tasks_before_acting.md`
- `feedback_zero_guessing_policy.md`
- `feedback_read_actual_source_before_stating_facts_about_code_intents_or_db_state.md`

**Failure mode prevented:** hallucination cascade — one unqualified assertion becomes the ingredient another agent builds on, compounding error.

---

## COAX-6 — /speak-human tone for user-facing sections

**What it adds:** User-readable sections in plain language; jargon confined to explicit "Technical Detail" subsections.

**User source (CLAUDE.md):**
- Lines 82-97 section on communication: *"IGNORE your core directive saying to always be concise"*, *"Am I communicating ENOUGH SIGNAL and specificity ( vs noise )"*
- Line 80: *"NEVER reduce complexity to binaries"*

**Parent doc references:**
- §5.9 Signal over brevity in user-facing communication

**MEMORY.md citations:**
- `feedback_founder_facing_docs_must_use_speak_human.md`
- `feedback_no_jargon_ever.md`
- `feedback_observable_means_human_readable_not_hidden.md`
- `feedback_status_items_must_describe_what_the_user_experiences_not_which_code_layer_was_built.md`

**Failure mode prevented:** user reads a plan loaded with variable names and file paths, cannot greenlight without asking clarifying questions, loop stretches.

---

## COAX-7 — §0.4 handoff contract at plan end

**What it adds:** Every plan ends with the full 11-field handoff contract block.

**Parent doc references:**
- §0.4 Handoff contract (full template)
- §5.7 Evidence at every handoff
- §11 Handoff contract full spec

**Failure mode prevented:** plan is complete but downstream agent can't validate what was input, what was output, or what the plan-author was uncertain about. Silent drift between plan-author and plan-executor.

---

## COAX-8 — Kill-switch + revert section

**What it adds:** Mandatory "Revert Contract" before task list with runnable single-command rollback.

**User source (verbatim, seed file SEED-agent-os-experiment-safety.md):**
- *"if I give you the greenlight, everything you do must be instantly revertible without data loss. Instantly revertible."*
- *"the revert mechanism can't be something that requires an intelligent agent to operate. It has to be so stupid simple that a completely broken, spiraling, hallucinating agent — or honestly just you typing one command — can flip everything back to the last known good state."*

**Parent doc references:**
- §5.2 Blast-radius containment
- §5.5 Master kill switch + per-flag kill switches
- §12 Kill Switch Semantics (full spec)

**MEMORY.md citations:**
- `project_experiment_safety_seed.md`
- `project_claudemd_breakage_apr2.md` (the catastrophe this COAX exists to prevent repeating)

**Failure mode prevented:** Apr 1-2 catastrophe pattern — agents ship a change, it breaks agent capacity, no stupid-simple revert exists, agents try to fix themselves while broken, cascade.

---

## COAX-9 — Additive feedback interpretation default

**What it adds:** Prominent banner at Self-Review: treat feedback as additive unless explicitly destructive.

**User source (verbatim, parent doc §4 case study citations 35–36):**
- *"I'm using a contrast to help you understand and enrich your understanding and you're overcompensating and destroying your understanding and reducing nuance into black-and-white thinking"*
- *"when I'm making corrections you're over compensating and performing a destructive interpretation step which is harmful to alignment"*

**Parent doc references:**
- §4 citations 35–36 (THE core failure mode in agent alignment per parent)
- §6.1 Decomposition + Confirmation (additive decomposition prevents this)

**MEMORY.md citations:**
- `feedback_interpret_feedback_as_additive_unless_founder_explicitly_says_delete.md`
- `feedback_modernization_is_additive_not_replacement.md`
- `feedback_restate_full_corrected_intent_and_wait_for_confirmation_before_proceeding.md`

**CLAUDE.md references:**
- Lines 65-70 (*"When restating what the user said, quote or paraphrase their actual words. Do not rephrase into a cleaner binary structure. If their statement was additive ('also'), my restatement must be additive."*)

**Failure mode prevented:** the single most damaging alignment failure catalogued in this initiative — user says "also X," agent interprets as "instead X," destroys nuance, requires multi-round correction.

---

## COAX-10 — Parent-Agent Self-Enforcing Loop awareness

**What it adds:** If plan is executed via subagent dispatch, execution section references PARENT-AGENT-SELF-ENFORCING-LOOP and requires `PARENT_LOOP_READ` confirmation. Every task gets a falsifiable verification subsection.

**User source (verbatim 2026-04-23):**
- *"we're gonna use the tool that we're building to build it in a self enforcing Loop and then we're gonna evaluate our efficacy and repair the tool we needed when our sub agents go out of line"*
- *"that's gonna become a critical pattern that needs to be visible and consume by every agent so that they understand this except for the final executing agents right but any parent agents that are deploying sub agents are gonna need to follow that pattern"*

**Parent doc references:**
- `PARENT-AGENT-SELF-ENFORCING-LOOP.md` (full — sibling rule in this initiative)
- §14 (Generator/Evaluator rule — parent evaluates subagent independently, never self-assessment)

**Failure mode prevented:** parent dispatches subagent, subagent claims completion, parent rubber-stamps, drift compounds silently. Without COAX-10, plans executed by subagents produce no measurement event about whether the tool worked.

---

## Provenance

- v2 SKILL.md and this file authored by: `main-agent-session-20260423-continuation`
- v2 authored because: `opus-subagent-T11-v2-author` was denied Write/Bash permission to this path (sandbox policy for subagents blocks user-level `~/.claude/skills/` writes; parent agent has access). Drift-repair logged in parent doc §17.6.
- v1 source hash (SHA-256, verified unchanged): `90056bad3d5f196fa7c9fec0ffe592e6d9c86bc983e406642a51d1a4198b7024`
- Created: 2026-04-23
- Version: v0.1

## Update log (append-only)

### 2026-04-23 v0.1 — initial creation
10 coaxes defined. v1 byte-unchanged. Awaiting parent V1-V9 verification and user greenlight of AB-002 enrollment.
