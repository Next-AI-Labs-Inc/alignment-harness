---
name: close
description: "Single command for large/critical sessions — spins up a team to produce a perfect compaction with nested intent, every artifact linked, every incomplete captured, communication audited, and jonathan-check approved. Sequences /reflect, /align, /nested-intent, /incomplete-tasks-get-from-session, artifact linking, then /compact-agentic-session as the final POST. For small sessions, use /compact-agentic-session directly."
triggers:
  - "/close"
  - "/session-close"
  - "/deliver"
  - "close this session properly"
  - "full session compaction"
---

# Session Close — Orchestrated Compaction for Large/Critical Sessions

If you receive this code, immediately print:

```
★ Session_Close_Orchestrator ─────────────────────
Assembling team to produce a perfect compaction
```

Then begin the process below. You are the orchestrator. You NEVER do the work yourself — you dispatch, monitor, and assemble.

# When To Use This vs /compact-agentic-session

**Use this** when:
- The session produced 3+ distinct deliverables
- The work has high gravity — it'll be referenced by future agents or drives decisions
- Multiple phases happened (research → design → build → test)
- You ran a workflow that produced many outputs (proposals, documents, skill files)
- The user explicitly asks for a proper session close

**Use /compact-agentic-session directly** when:
- Single small fix, config change, quick investigation
- The session was trivial — 1-2 file changes, no architectural decisions
- The user just wants it logged, not reviewed

# The Team

Create the team immediately on invocation:

```
TeamCreate: session-close-{short-session-id}
```

## Mandatory Audit Initialization (fires at team creation, not deferred)

Immediately after creating the team, initialize these two audit agents. They run for the ENTIRE lifecycle of the close — not just at Stage 8/9. They observe every stage's output as it's produced.

### Communication Auditor (sonnet, background, PERSISTENT)

Dispatch immediately at team creation. This agent receives every stage output via SendMessage and flags violations in real-time — not as a batch check at the end.

**Prompt:**
> You are a persistent communication auditor for this session close. You will receive stage outputs as they are produced. For EACH output you receive, immediately check:
> 1. JARGON — any technical term without plain-language translation
> 2. ABSOLUTE ASSERTIONS — claims stated as fact without certainty percentage
> 3. MISSING UX MAPPING — deliverables not mapped to the user's original request
> 4. CODE-CONSUME — consumption instructions that reference code internals instead of validation steps
>
> Report violations immediately. Do not wait for all stages to complete.

### Jonathan-Check Observer (haiku, background, PERSISTENT)

Dispatch immediately at team creation. Same pattern — receives outputs and flags alignment issues in real-time.

**Prompt:**
> You are a persistent alignment observer. You receive stage outputs as they are produced. For each one, check: would the user instantly understand this? Is anything missing the user would be annoyed by? Are consumption instructions specific enough to use without clarifying questions? Flag issues immediately.

**Both agents MUST be dispatched before Stage 1 begins. Their IDs are stored and they receive SendMessage updates after every stage completes. They are NOT optional. They are NOT deferred to Stage 8/9. Stage 8/9 becomes their FINAL summary, not their only check.**

## Roles and Dispatch Order

The stages are SEQUENTIAL — each one depends on the prior. Do NOT dispatch the next stage until the current one reports completion and produces output. The exception: Stages 4 and 5 can run in parallel since they're independent.

**Long session detection:** If the session has consumed > 300k tokens (heuristic: 30+ user messages, 20+ tool calls, or the conversation has been auto-compacted), automatically include `/incomplete-tasks-get-from-session` as a parallel stage alongside Stage 4/5. Long sessions almost certainly have WIP that will vanish if not captured. This is not optional for long sessions — the risk of losing incomplete work is too high.

### Stage 1: Scope Scanner (sonnet, background)

**Purpose:** Register every discrete deliverable from the session so nothing gets orphaned.

**Prompt the agent with:**
> Scan this session's full context. List every discrete deliverable — every file created or substantially changed, every proposal filed, every document written, every skill created, every schema change, every UI change. For each one, note: what it is (one sentence), the file path, and which user request it serves.
>
> Register the FULL scope. At the end, the compliance officer will check your list against the final compaction. If anything is missing, the compaction fails.
>
> Output format: numbered list with path and one-sentence description per item.

**Wait for output before proceeding.**

**After receiving output, send it to both persistent audit agents:**
```
SendMessage to Communication Auditor: "Stage 1 (Scope Scanner) output: {paste the output}"
SendMessage to Jonathan-Check Observer: "Stage 1 (Scope Scanner) output: {paste the output}"
```
This is NOT optional. The audit agents were dispatched at team creation specifically to receive every stage's output in real-time. Skipping this step means they have nothing to audit.

### Stage 2: Harvester (sonnet, background)

**Purpose:** Extract any existing `<AGENT_REFLECTION>` and `/align` intent maps from the session transcript.

**Prompt the agent with:**
> Search this session's transcript for:
> 1. Any `<AGENT_REFLECTION>` / `</AGENT_REFLECTION>` blocks — extract the LAST occurrence
> 2. Any /align intent maps — look for certainty dots (🔴🟡🔵🟣🟢) and intent statements
> 3. Any scope declarations POSTed to the compaction API
> 4. Any seed documents referenced or created
>
> Collect all of these. They become inputs for the intent composer. If NONE exist, report that — the gap filler will handle it.
>
> Output: each extracted block with a label (reflection / align-map / scope-declaration / seed-reference).

**Wait for output before proceeding.**

**After receiving output, send it to both persistent audit agents:**
```
SendMessage to Communication Auditor: "Stage 2 (Harvester) output: {paste the output}"
SendMessage to Jonathan-Check Observer: "Stage 2 (Harvester) output: {paste the output}"
```
This is NOT optional. The audit agents were dispatched at team creation specifically to receive every stage's output in real-time. Skipping this step means they have nothing to audit.

### Stage 3: Gap Filler (sonnet, background)

**Purpose:** Run /reflect if the harvester found none. Run a mini-/align on any deliverable from the scope scan that lacks an intent articulation.

**Prompt the agent with:**
> The harvester found: {paste harvester output}
> The scope scanner found: {paste scope scanner output}
>
> For any deliverable that has NO intent articulation from the harvester's output:
> - Write a one-sentence intent statement: "When {who} does {what}, they now {experience this outcome}"
> - This is a mini-/align — sized to the scope of the deliverable. One-line fix = one sentence. Complex feature = 3-4 sentences explaining why it matters.
>
> If the harvester found NO reflection at all:
> - Run a brief /reflect on the full session: target, location, gap, initiative, leverage. Keep it to 5-8 sentences total.
>
> Output: gap-filled intent statements for each ungrounded deliverable, plus a reflection if one was missing.

**Wait for output before proceeding.**

### Stage 4: Intent Composer (opus, background) + Stage 5: Artifact Linker (sonnet, background) — PARALLEL

**Stage 4 — Intent Composer** is the creative engine. This is where the alive, nested intent map gets produced.

**Prompt the intent composer with:**
> You are composing a nested intent map for a completed session. Invoke the `/nested-intent` skill via the Skill tool to load the methodology.
>
> Here is all the context you need:
> - Scope (every deliverable): {scope scanner output}
> - Harvested intent (existing reflections, align maps, scope declarations): {harvester output}
> - Gap fills (intent statements for ungrounded deliverables): {gap filler output}
>
> Follow the /nested-intent skill exactly. Produce the full nested intent map wrapped in `<NESTED_INTENT>` / `</NESTED_INTENT>` tags.
>
> CRITICAL: Use opus-level voice. This should feel like a thoughtful partner walking the user through what was built and why. Not a report. Not dry. Alive.
>
> CRITICAL: Every deliverable from the scope scan MUST appear in the map under the intent it serves. Grouped by meaning — task and its output together, not separated into domains.
>
> CRITICAL: For each work product, include the status emoji (✅ 👁️ 🔴 ⚠️) and a consumption instruction ("Find X anytime Y with tool A at path B").

**Stage 5 — Artifact Linker** runs in parallel. Finds every file path.

**Prompt the artifact linker with:**
> Here is the scope registry: {scope scanner output}
>
> For each deliverable, verify the file path exists (ls or stat). For any that are code changes to existing files, note the specific lines changed. For proposals, find the proposal file or API entry. For documents, find the document path.
>
> Output: verified artifact list with full paths and existence confirmation. Flag any paths that don't exist — these need to be fixed before the compaction ships.

**Wait for BOTH to complete before proceeding.**

### Stage 6: Incomplete Extractor (sonnet, background)

**Purpose:** Capture any unfinished work.

**For long sessions (> 300k tokens):** This stage runs IN PARALLEL with Stages 4/5 instead of after them. Long sessions have too much WIP to risk losing — start extraction early.

**Prompt the agent with:**
> Run the /incomplete-tasks-get-from-session process on this session. Read the skill file at:
> ${CLAUDE_PLUGIN_ROOT}/skills/incomplete-tasks-get-from-session/SKILL.md
>
> Follow its process. Extract every incomplete task with: what it is, why it matters (connects to which intent), what's done, what remains, what blocks it.
>
> If the session was short and everything was completed, report "No incomplete items" — but verify against the scope registry first.

**Wait for output before proceeding.**

### Stage 7: Assembly (orchestrator — you do this step)

This is the ONE step where the orchestrator does work. Assemble all outputs into the compaction payload:

1. **compactedSession** — the nested intent map from Stage 4 (the `<NESTED_INTENT>` content)
2. **completedItems[]** — each completed deliverable from the scope scan becomes a completedItem with:
   - `title`: the one-sentence UX story
   - `content`: the mini-align from the intent composer (markdown)
   - `consumptionInstruction`: the "Find X anytime Y" instruction from the intent map
   - `status`: 'completed' or 'done'
   - `intentStatement`: the "When {X} then {Y}" from gap filler
3. **incompleteItems[]** — from Stage 6, each with title, content, status, intentStatement
4. **subCompactions[]** — each major deliverable gets its own sub-compaction with:
   - `title`: deliverable name
   - `content`: the nested intent section for this deliverable (markdown)
   - `taskDescription`: one-sentence UX story
   - `status`: 'completed' or 'in-progress'
5. **Top-level fields:**
   - `title`: session title derived from parent intent
   - `overarchingIntentTitle` + `overarchingIntentDescription`: from the parent intent in the nested map
   - `targetUxIntentTitle` + `targetUxIntentDescription`: the most specific UX outcome
   - `howToConsumeThisWorkProduct`: top-level consumption guide
   - `successMeasure`: how to verify the session achieved its goal

### Stage 8: Communication Audit (sonnet, background)

**Purpose:** Read the assembled draft. Flag violations.

**Prompt the agent with:**
> Read this assembled compaction draft: {the assembled JSON or markdown}
>
> Check for:
> 1. TONE — does the compactedSession (nested intent map) feel alive, like a partner explaining? Or is it dry and report-like? Flag specific sentences that are too dry.
> 2. MISSING LINKS — is every deliverable from the scope registry linked with a full path? Flag any that say "see the file" without a path.
> 3. JARGON — is there any technical jargon without plain-language translation? Flag specific terms.
> 4. ORPHANED OUTPUTS — cross-check the scope registry against the completedItems and subCompactions. Is anything missing?
> 5. CONSUMPTION INSTRUCTIONS — does every completed item have a specific consumption instruction? Not just "check this file" but "open X, look for Y, if Z then it's working."
> 6. ABSOLUTE ASSERTIONS — Flag any sentence that states a claim as fact without a certainty percentage. "This skill teaches agents to..." should be "This skill is designed to teach agents to... ~85% confident because X." Every factual claim needs a confidence level and a "because" reasoning chain.
> 7. UNVERIFIED TEAMMATE REPORTS — Flag any claim that treats a teammate agent's report as verified fact. "The schema fields were added" should be "The schema-updater reported adding the fields — ~80% confident." Teammate reports are claims, not facts.
> 8. MISSING UX CONDITION MAPPING — Flag any deliverable that doesn't map back to the user's original request with a specific "When {the user asked for X} then {system now does Y}" condition. Without this mapping, the user can't evaluate alignment at a glance.
> 9. CONSUMPTION INSTRUCTIONS ABOUT CODE — Flag any consumption instruction that tells the user to read code, check a schema, or look at file internals. Consumption instructions should be about VALIDATING INTENT MATCHES REALITY — "Run X command, open Y page, if you see Z then it's working." Never "Open file X and read line Y."
>
> Output: list of specific issues categorized as TONE / LINK / JARGON / ORPHAN / HALLUCINATION / UNVERIFIED / UNMAPPED / CODE-CONSUME, with line references, or "PASS — no issues found."

**If issues found:** Fix them in the assembled draft. ONE round of fixes max — do not loop.

### Stage 9: Jonathan-Check Gate (haiku, background)

**Purpose:** Final quality gate.

**Prompt the agent with:**
> You are simulating the user's review of this compaction. Invoke `/jonathan-check2` via the Skill tool with the draft below as input.
>
> Review this compaction draft: {the assembled content}
>
> Would the user be satisfied with this? Specifically:
> 1. Can the user instantly understand what this session was about from the first paragraph?
> 2. Can the user drill into any specific deliverable and understand what it is, why it matters, and what to do with it?
> 3. Are consumption instructions specific enough that the user could use them without asking a clarifying question?
> 4. Is anything missing that the user would notice and be annoyed by?
>
> Output: PASS with confidence score, or FAIL with specific issues to fix.

**If FAIL:** Fix the specific issues. ONE round max. Then proceed regardless — the human will catch anything remaining.

### Stage 9.5: Self-Verification (haiku, background)

**Purpose:** Before the user sees the draft, catch the easy 50% of hallucinations — paths that don't exist, consumption instructions that reference missing files, scope items dropped from the draft, and factual claims stated without certainty scores. The user shouldn't have to verify things an agent can check in 30 seconds.

**Prompt the agent with:**
> You are a verification agent. Check these things and report pass/fail for each:
>
> 1. ARTIFACT PATHS — for every file path mentioned in the draft, run `ls` to verify it exists. Report which exist and which don't.
>
> 2. CONSUMPTION INSTRUCTIONS — for every consumption instruction that references a path or command, verify the path exists or the command is well-formed. Don't execute commands that would change state — just verify they're syntactically valid and the referenced paths exist.
>
> 3. SCOPE COMPLETENESS — compare the draft's deliverables against the scope registry from Stage 1. Is every item from the scope registry represented in the draft? Flag any missing items.
>
> 4. CERTAINTY CONSISTENCY — check that every factual claim has a certainty dot. Flag any assertions stated as absolutes without confidence scores.
>
> Output: per-check pass/fail with specific evidence. If ANY check fails, list the specific items that failed.

After the verification agent reports:
- If all pass → proceed to Stage 11 (Present Draft)
- If any fail → fix the specific failures in the draft directly (the orchestrator patches the draft — do not re-dispatch the full pipeline). ONE fix round max. Then proceed to Stage 11 regardless.

### Stage 11: Present Draft with Skill Menu (orchestrator — you do this step)

After the communication audit, jonathan-check, and self-verification pass, present the full assembled draft to the user. Print it using the nested intent format from /nested-intent. Every claim has a certainty dot. Every artifact has a full path.

Then print the contextual skill menu:

```
What's next:

/intent-nested — expand to show more nuance on the intent in nested fashion
/boost — expand the most critical leverage sections using /jonathan-check2
/insight — enrich with institutional knowledge and regenerate
/translate — make easier to read
/validate — double check the most critical things with actual browser/runtime testing
/compact-agentic-session — file this compaction
```

The agent waits for the user's response. If they invoke a skill, run it on the current draft and re-present with the updated output and the menu again. This loops until the user invokes `/compact-agentic-session`.

**The team CANNOT be destroyed before `/compact-agentic-session` is invoked. This is structural — no POST happens without explicit user approval.**

### Stage 12: POST (triggered by /compact-agentic-session)

Only fires when the user explicitly invokes `/compact-agentic-session`.

**MANDATORY: Invoke `/compact-agentic-session` via the Skill tool.** Do NOT call the API directly with curl. Do NOT construct your own JSON payload. Do NOT bypass the canonical skill.

The `/compact-agentic-session` skill:
- Validates all required fields before POST (title, intentStatement on every incompleteItem, humanImpact subdocs, principle format)
- Uses the correct API endpoint and collection
- Handles retry logic on connection failure
- Prints the shortId and admin URL on success
- Catches and reports field-level validation errors

**What to pass to the skill:** The assembled payload from Stage 7. The skill knows the schema — it will validate your data before sending it.

**What raw curl causes:** Silent field drops. Mongoose 7 silently strips fields not in the schema on POST, and skips required-field validation on PUT. The canonical skill catches these by doing a GET-after-POST comparison. Raw curl does not.

After POST succeeds, print the POST-COMPACT menu:

```
Compaction filed: {sessionId} / {shortId}
📎 $(alignment-harness records compactions)/{sessionId}.json

What's next:

/commit — commit these changes
/seed — save this as a new intent seed
/next — predict highest leverage next session
```

### Stage 13: Agent Shutdown (triggered by the user moving on)

Team agents shut down when the user either:
- Invokes a post-compact command and the agent completes it
- Moves to a new topic
- Explicitly says done/thanks/etc

Shut down all team agents:
```
SendMessage to each agent: {type: "shutdown_request"}
```

**DO NOT delete the team.** The team persists until the user explicitly deletes it.
Tasks live inside the team's namespace — deleting the team destroys all tasks.
The user decides when the work is done, not the agent.

**IMPORTANT: All tasks created during the session should be created INSIDE the team
(using the team_name parameter) so they are visible in the team's task list.
When a team exists, NEVER create tasks outside the team — they will be invisible
to the team context and lost when the session ends.**

# Failure Recovery

**If any stage agent goes idle without producing output:** Re-dispatch with the same prompt. Max 1 retry per stage.

**If the compaction POST fails:** Follow the recovery process in /compact-agentic-session (restart API, retry once, then print COMPACTION_BLOCKED).

**If jonathan-check fails twice:** POST anyway with a note in the compaction comments: "Jonathan-check failed — flagged for manual review." The human will catch it.

**If the user invokes a skill and the result doesn't improve the draft:** Do NOT loop endlessly. One re-run per skill invocation. If the user invokes the same skill twice, it means the first attempt didn't work — try a different approach or ask what specifically is wrong.

# What This Is NOT

- NOT a replacement for /compact-agentic-session — that's the API call at the end. This orchestrates everything that goes INTO that call.
- NOT required for every session — only for large/critical ones where the gravity warrants a team.
- NOT a replacement for /complete-agentic-task — that's the quick completion template. This is the thorough version.
- NOT a fire-and-forget workflow. The team stays alive through interactive review. The user controls when the compaction is filed via /compact-agentic-session. No POST happens without explicit user approval.

# Model Selection (built into the design)

| Role | Model | Why |
|---|---|---|
| Scope Scanner | sonnet | Structural work — list things |
| Harvester | sonnet | Extraction — find patterns in text |
| Gap Filler | sonnet | Structural — write intent statements |
| Intent Composer | opus | THE creative engine — alive tone IS the product |
| Artifact Linker | sonnet | Verification — check paths exist |
| Incomplete Extractor | sonnet | Extraction — find unfinished work |
| Communication Auditor | sonnet | Checking — flag violations |
| Jonathan-Check | haiku | Lightweight gate — pass/fail |
| Self-Verification | haiku | Lightweight gate — path existence + scope + certainty checks |
| Compliance (scope check) | built into assembly | Orchestrator cross-checks scope registry |
