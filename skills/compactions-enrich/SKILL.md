---
name: compactions-enrich
description: "Enrich session compactions with structured reflection, intent alignment, leverage scoring, and incomplete task extraction. Use when enriching existing compactions post-hoc, when running batch enrichment across all sessions, or when a compaction needs deeper analysis than the mechanical Haiku field-extraction pass provides."
triggers:
  - "enrich compactions"
  - "enrich a compaction"
  - "compaction enrichment"
  - "run enrichment pipeline"
  - "/compactions-enrich"
---

# Compaction Enrichment Pipeline

> "each of those steps do in fact have a function right and without them your work product will be a pile of smoking horse" — the user, 2026-04-08
>
> Every step below exists because skipping it produces garbage. On 2026-04-08 an agent read this skill file, skipped every sub-skill invocation, and wrote the output from its own head. The user audited it, found zero skills were actually invoked, and called it out. That is why every step below says INVOKE — not "produce output like the skill would." INVOKE means use the Skill tool. If you write the output yourself instead of invoking the skill, you are hallucinating — you are hallucinating that your output is equivalent to the skill's output. It is not.

## What This Is NOT

This is NOT the mechanical Haiku bulk field-extraction. This skill runs a **deep enrichment** using the actual reasoning skills — you MUST INVOKE `/reflect`, `/align`, `/compact-agentic-session`, and `/incomplete-tasks-get-from-session` via the Skill tool.

**Writing output that resembles what these skills would produce, without invoking them, is a HALLUCINATION. Do not do it.**

## When To Use

- Enriching compactions that have no leverage score
- Enriching compactions that have leverage scores but no reflection or alignment analysis
- Enriching the most significant compactions with deeper insight than Haiku can provide
- Batch enrichment of all unenriched compactions (dispatch as parallel subagents on Max subscription)

## COST RULE — NEVER USE THE ANTHROPIC API KEY

**NEVER write scripts that import `@anthropic-ai/sdk` and call the user's API key.** The user pays a fixed monthly price for Max subscriptions. All enrichment work runs on Max via subagents dispatched from Claude Code. Zero extra API cost. Using the API key for batch work is unauthorized spending of the user's money.

## Pipeline Steps (MANDATORY — in this order, skip none)

### Step 0: Read the compaction and all attached items

Before any reasoning, load the full compaction record via DB query or API:
- `compactedSession` (the raw session text)
- All existing enrichment fields (don't overwrite what's already good)
- `principles`, `uxStoriesBroughtToReality`, `incompleteItems` (existing content to build on)
- `enrichmentHistory` (what's already been done)

**Idempotency check:** If `enrichmentHistory` already contains an entry with `enrichedBy: 'sonnet-enrichment-pipeline'`, skip this compaction unless `--force` is specified.

**PRINT what you loaded.** Show the shortId, title, content length, and which fields are already populated vs empty. This is auditable evidence that Step 0 happened.

### Step 1: INVOKE /reflect — Structured self-reflection on the session

**YOU MUST USE THE SKILL TOOL TO INVOKE `/reflect`.** Do not write reflect output yourself.

Pass the compaction content to the reflect skill. Treat the compaction text as if you are reflecting on work that was done.

**The reflect skill produces these sections — you do not produce them, the skill does:**
- **Target**: What was the specific intent in UX terms the human was trying to get?
- **Location**: Where did the session end up relative to that intent?
- **Gap**: What gap remains between intent and reality?
- **Initiative**: What overarching intent does this connect to? What would full realization look like?
- **Leverage**: What hasn't been considered? What UX problems or gaps could help or harm?
- **Questions to keep in mind**: What questions matter for staying connected to the intent?

**Output destination:** The synthesis goes into the `alignmentNote` field as markdown. Also informs `agentReasoning` fields.

**WRITE IMMEDIATELY AFTER THIS STEP.** Do not wait for all steps to complete. Write `alignmentNote` and `agentReasoning` to the DB NOW via mongoose updateOne. This prevents data loss if you run out of context or crash before Step 5. Every subsequent step also writes immediately after completing.

**PRINT the reflect output.** This is auditable evidence that Step 1 happened.

### Step 2: INVOKE /align — Derive nested intent from session content AND attach full markdown

**YOU MUST USE THE SKILL TOOL TO INVOKE `/align`.** Do not write align output yourself.

The align skill derives nested intent layers:

- **Overarching intent**: What company-level objective was this session serving? NOT "what did the session do" but "what business goal does this serve?" (goes into `overarchingIntentTitle` + `overarchingIntentDescription`)
- **Target UX intent**: The specific testable UX promise. Written as "When X, then Y" conditional. (goes into `targetUxIntentTitle` + `targetUxIntentDescription`)
- **Scope declaration**: Intent, certainty, decomposed UX outcomes, boundary, assumptions (goes into `scopeDeclaration`)

**CRITICAL — ATTACH THE FULL /ALIGN OUTPUT AS MARKDOWN:**
The complete /align output — the nested intent map with certainty scores, the full human-legible breakdown, every layer — MUST be stored in the `reflectionOnScope` field as markdown. This is not a summary. This is the FULL align document. The `reflectionOnScope` field exists specifically for this purpose (schema line 426: "full /reflect output text" — it holds the full reasoning document from both reflect and align).

The `reflectionOnScope` field should contain:
1. The full /reflect synthesis (from Step 1)
2. The full /align nested intent map (from this step)
3. Both as readable markdown, not JSON, not field values — the actual human-legible analysis

**Voice rules from /align apply:** Non-technical, human-legible, no variable names, no jargon.

**Certainty scoring:** Each intent statement gets a certainty dot per /align format. Max certainty 85% for post-hoc enrichment — never claim 100% without human validation.

**PRINT the full align output.** This is auditable evidence that Step 2 happened.

**WRITE IMMEDIATELY AFTER THIS STEP — THIS IS THE MOST COMMONLY SKIPPED WRITE.** 70% of agents skip writing `reflectionOnScope`. Do NOT be one of them. Use this EXACT code pattern:

```javascript
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const SC = require('./models/SessionCompaction');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const reflectOutput = \`YOUR FULL REFLECT OUTPUT HERE\`;
  const alignOutput = \`YOUR FULL ALIGN OUTPUT HERE\`;
  const fullMarkdown = reflectOutput + '\\n\\n---\\n\\n' + alignOutput;
  
  const result = await SC.updateOne(
    { shortId: 'TARGET_SHORT_ID' },
    { \$set: {
      reflectionOnScope: fullMarkdown,
      overarchingIntentTitle: 'YOUR VALUE',
      overarchingIntentDescription: 'YOUR VALUE',
      targetUxIntentTitle: 'YOUR VALUE',
      targetUxIntentDescription: 'YOUR VALUE',
      scopeDeclaration: {
        intent: 'YOUR VALUE',
        certainty: 80,
        decomposed: ['When X then Y'],
        boundary: 'YOUR VALUE',
        assumptions: ['YOUR VALUE'],
        updatedAt: new Date()
      }
    }}
  );
  console.log('Step 2 write:', JSON.stringify(result));
  mongoose.disconnect();
});
"
```

**Verify the write succeeded** by checking `result.modifiedCount === 1`. If it's 0, something went wrong — print the error and retry. The `reflectionOnScope` field is the MOST IMPORTANT field in the entire enrichment — it's the full human-readable analysis the user reads. If this field is empty, the enrichment failed.

**ESCAPING FIX:** If your `node -e` command fails due to template literal escaping (backticks inside backticks), write the script to a temp file IN YOUR API DIRECTORY (not /tmp — require() won't resolve from /tmp):
```bash
cat > <absolute path to your API directory>/tmp-enrich-SHORTID.js << 'SCRIPT'
require('dotenv').config();
const mongoose = require('mongoose');
const SC = require('./models/SessionCompaction');
// ... your update code here with no escaping issues ...
SCRIPT
cd <absolute path to your API directory> && node tmp-enrich-SHORTID.js && rm tmp-enrich-SHORTID.js
```
CRITICAL: The script MUST run from your API directory or require('./models/...') will fail. Always use the absolute path of your API directory for the script file.

### Step 3: INVOKE /compact-agentic-session field structure — Fill remaining fields

**YOU MUST USE THE SKILL TOOL TO INVOKE `/compact-agentic-session`.** Do not fill fields yourself.

The skill defines mandatory execution order and field requirements:

1. **agentReasoning** (informed by Step 1 reflect output)
2. **Leverage score** (0-100):
   - 80-100: Revenue-critical (payments, checkout, conversion, pricing, paid user experience)
   - 60-79: Core product (coaching quality, auth, onboarding, key UX flows)
   - 40-59: Infrastructure (agent systems, admin tooling, observability, deployment)
   - 20-39: Maintenance (error triage, test fixes, cleanup, documentation)
   - 0-19: Trivial (auto-compactions, config changes, one-off lookups)
3. **uxCriticality** — criticalityScore (0-10), isUserFacing, dimensions, reasoning
4. **preExecutionReflection** — targetIntent, failureModes, uxRequirements, harmPotential
5. **successMeasure** — 1-2 actual KPIs
6. **howToConsumeThisWorkProduct** — conversational framing ("Ok so this session was about..."), sanity check steps, full clickable admin URL

**Voice rules:** Conversational framing MANDATORY. No jargon-first formal language. All URLs must be full clickable links.

**Phase assignment (MANDATORY):** Match this compaction to the most similar roadmap phase. Available phases:
- "Immediate Launch - Main Funnel As 10X Better LTV"
- "Partner Application Flow"
- "Agentic Systemic Optimization"
- "Email System Activation"
- "Expand Coaching Models"
- "Radically Important Phase"
- "Power Up User Experience Quality"
- "Email System Augmentation - phase 2"
- "Get Marketing Budget Fully Optimized"
- "Main Funnel @ 2x 30day Rev ( Immediate Radical Scalability )"
- "Coaching Quality Boost"
- "Auto Measuring Coaching Quality Boosts"
- "Clean up failed payments issues and block access if unpaid"
- "Silver Grail Capture"
- "Use All Tokens"
- "Repair Users That have Broken UX"
- "SEO and AEO to 10/10"
- "Learn from Anthropic how to use Claude"
- "Fix all broken bugs from last launch"
- "Vision Analysis Capture optimization"

Pick the phase whose intent most closely matches this compaction's work. Set `roadmapPhaseId` to the phase's ObjectId. If none fit, leave null.

**Category assignment (MANDATORY):** Match to the most fitting category:
- "Self Healing Code" (id: <your category ObjectId>) — agents auto-healing code without hallucination
- "Personal Experiments" (id: <your category ObjectId>) — research, custom model training
- "Bug Fixes" (id: <your category ObjectId>) — bug fixes
- "Coaching Quality Improvements" (id: <your category ObjectId>) — coaching quality work
- "Roadmap Phase" (id: <your category ObjectId>) — roadmap-level initiatives

Set `categoryIds` to an array containing the matching category's ObjectId string. If none fit, leave empty.

**Parent compaction linking:** If this compaction's work is clearly a sub-task or continuation of another compaction that already exists, set `parentCompactionIds` to link them. Query by title similarity or sessionId references in the content. If no clear parent, leave empty.

**PRINT each field value including phase, category, and parent decisions with reasoning.** This is auditable evidence that Step 3 happened.

**WRITE IMMEDIATELY AFTER THIS STEP.** Write `leverageScore`, `leverageAssignedBy`, `leverageAssignedAt`, `uxCriticality`, `preExecutionReflection`, `successMeasure`, `howToConsumeThisWorkProduct`, `roadmapPhaseId`, and `categoryIds` to the DB NOW. Do not wait.

### Step 4: INVOKE /incomplete-tasks-get-from-session — Extract unresolved work

**YOU MUST USE THE SKILL TOOL TO INVOKE `/incomplete-tasks-get-from-session`.** Do not extract items yourself.

**Adaptation for post-hoc enrichment:** Extract incomplete work from:
1. The `compactedSession` text — look for "next step", "TODO", "planned but not built", "needs to be", "hasn't been", "not yet", "will need to"
2. Existing `incompleteItems` array — preserve and enrich, don't overwrite
3. The reflect output (Step 1) — gap and leverage sections surface what's unresolved

**For each incomplete item, produce the full required shape:**
- `title` — UX-first, under 80 chars. The human must instantly know the specific UX impact and its constraints. Lead with what changes for a real person, not what code to write. Example: "Paying users see full access even when entitlement check fails" not "Add fallback to getAccessTier()"
- `intentStatement` — "When {actor} does {action}, they experience {outcome}" MANDATORY
- `status` — pending (default)
- `priority` — 1-100 integer
- `domain` — searchable tag
- `humanImpact` — who is affected, current experience, fixed experience

**UX-FIRST WRITING RULE (applies to ALL written objects — incompleteItems, completedItems, proposedActions, principles, uxStoriesBroughtToReality, comments):**

Every object written to any array on a compaction MUST lead with human UX intent before any technical description. The user reads these. They must instantly understand:
1. **Who is affected** — which specific person in which specific moment
2. **What they experience now** — the current reality in their words
3. **What they should experience** — the intended reality
4. **What constrains it** — what condition or edge case makes this non-trivial

If an item says "Refactor accessTiers.js to emit LEGACY_TRIAL_ACCESS" — that is WRONG. Nobody knows what that means without reading the code.

If an item says "Free trial users currently look identical to paying subscribers to every downstream system, which means when we build trial-specific UX (upgrade prompts, usage limits, trial expiry warnings) nothing can distinguish them — so the entitlement system needs a separate state for legacy trial users" — that is RIGHT. The user knows exactly what's broken, who it affects, and why it matters, without opening a single file.

**Test before writing any item:** "If the user reads only this title and intentStatement, do they know the specific UX impact and its constraints?" If no — rewrite until yes.

**Merge rule:** Don't duplicate or overwrite existing items.

**PRINT new items extracted.** This is auditable evidence that Step 4 happened.

**WRITE IMMEDIATELY AFTER THIS STEP.** Write any new `incompleteItems` to the DB NOW via `$push` to the incompleteItems array. Also push the `enrichmentHistory` entry at this point. Do not wait.

### Step 5: Update the compaction

Write via direct MongoDB update (the POST compact endpoint requires a real session UUID which post-hoc enrichment won't have):

```javascript
// Use mongoose updateOne with $set and $push
// NEVER use the Anthropic API key — this is a DB write, not an LLM call
await SessionCompaction.updateOne(
  { shortId: TARGET_SHORT_ID },
  {
    $set: {
      reflectionOnScope,       // FULL /reflect + /align markdown document (Step 1 + Step 2)
      alignmentNote,           // from reflect (Step 1)
      overarchingIntentTitle,   // from align (Step 2) — ONLY if currently empty
      overarchingIntentDescription,
      targetUxIntentTitle,      // from align (Step 2) — ONLY if currently empty
      targetUxIntentDescription,
      scopeDeclaration,         // from align (Step 2)
      agentReasoning,           // from reflect (Step 1)
      leverageScore,            // from compact-agentic-session (Step 3)
      leverageAssignedBy: 'sonnet-enrichment-pipeline',
      leverageAssignedAt: new Date(),
      uxCriticality,            // from compact-agentic-session (Step 3)
      preExecutionReflection,   // from compact-agentic-session (Step 3)
      successMeasure,           // from compact-agentic-session (Step 3)
      howToConsumeThisWorkProduct, // from compact-agentic-session (Step 3)
      roadmapPhaseId,           // from phase matching (Step 3) — match to most similar phase
      categoryIds,              // from category matching (Step 3) — match to parent category
    },
    $push: {
      enrichmentHistory: {
        enrichedBy: 'sonnet-enrichment-pipeline',
        enrichedAt: new Date(),
        enrichedFields: [/* list every field you touched */],
        confidenceLevel: 'high',
        modelUsed: 'claude-opus-4-6' // or whatever model this agent is
      }
    }
  }
);
```

**Only update fields that are empty or clearly inferior.** If a field already has rich content, don't overwrite it.

**PRINT the update result** (acknowledged, modifiedCount). This is auditable evidence that Step 5 happened.

### Step 6: Verify and print audit report

After update, read back the updated record and print ALL of these:

1. **shortId and title**
2. **Admin link:** `<your compaction admin URL>/{shortId}`
3. **alignmentNote** — full content
4. **leverageScore** with reasoning
5. **overarchingIntentTitle** — the company-level goal
6. **targetUxIntentTitle** — the testable UX promise
7. **scopeDeclaration.intent** and **scopeDeclaration.decomposed**
8. **uxCriticality.criticalityScore** and **reasoning**
9. **successMeasure**
10. **howToConsumeThisWorkProduct** — full text
11. **incompleteItems** count and titles of any NEW items added
12. **enrichmentHistory** — latest entry showing what was touched

**THEN print this audit checklist:**

```
AUDIT CHECKLIST:
[ ] Step 0: Read compaction — printed shortId, title, content length, field status
[ ] Step 1: /reflect INVOKED via Skill tool — printed reflect output
[ ] Step 2: /align INVOKED via Skill tool — printed align output
[ ] Step 3: /compact-agentic-session INVOKED via Skill tool — printed field values
[ ] Step 4: /incomplete-tasks-get-from-session INVOKED via Skill tool — printed extracted items
[ ] Step 5: DB update — printed update result (acknowledged: true, modifiedCount: 1)
[ ] Step 6: Verification — printed all 12 items above
```

Mark each with [x] if actually done, [ ] if skipped. If ANY are [ ], the enrichment FAILED and must be redone.

## Batch Mode

For processing multiple compactions, dispatch parallel subagents (Max subscription, NOT API key). Each agent receives:
- The compaction shortId
- The full compactedSession text (pre-loaded — subagents can't access MCP)
- The full text of this skill file
- Explicit instruction: "INVOKE each skill via the Skill tool. Do not approximate."

**Max 5 concurrent subagents.** Rate limit 1.2s between DB writes.

## Quality Audit

After batch enrichment, verify quality on a sample:

1. Pick 3 compactions at random from the enriched set
2. For each, check:
   - Does the `alignmentNote` actually reflect on intent and unresolved risk?
   - Is the `overarchingIntentTitle` about the COMPANY goal, not the task?
   - Are `incompleteItems` real gaps, not padding?
   - Is `howToConsumeThisWorkProduct` conversational, with a clickable URL?
   - Does the `leverageScore` match the tier definitions?
   - Does the `enrichmentHistory` entry exist with all touched fields listed?
3. If 2+ fail quality check, stop and recalibrate before continuing

## Skills This Pipeline Depends On

| Skill | What it provides | How used | MUST INVOKE? |
|-------|-----------------|----------|--------------|
| `/reflect` | Structured self-reflection (target, gap, initiative, leverage) | Applied to stored session text | **YES — Skill tool** |
| `/align` | Nested intent derivation, certainty scoring, human-legible output | Applied to compaction content | **YES — Skill tool** |
| `/compact-agentic-session` | Field structure, execution order, voice rules | Canonical field specification | **YES — Skill tool** |
| `/incomplete-tasks-get-from-session` | Incomplete work extraction with full item shape | Extract from compaction text | **YES — Skill tool** |
