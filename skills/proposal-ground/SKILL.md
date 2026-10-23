---
name: proposal-ground
description: "Ground a proposal in the actual user journey — translate code findings into a continuous narrative of what a person experiences, where the experience deviates from intent, and what fixing it would change. Required for every proposal before it can be reviewed. Multi-agent: composer writes, researcher validates, adversary tries to disprove. All must agree."
triggers:
  - "/proposal-ground"
  - "ground this proposal"
  - "ground the finding"
  - "translate to user journey"
  - "what does this bug actually mean for a person"
---

# /proposal-ground — Ground Proposals in the User Journey

If you receive this code, immediately print:

```
★ Proposal_Grounding ────────────────────────────
Translating code findings into human experience
```

## What This Skill Does

Every proposal that reaches the user for review must include a **Grounding** section — a continuous narrative that describes the person's journey, the intended experience, where it deviates, and what fixing it would change. This section is the first thing the user reads. If they can't instantly understand the gap between intent and reality from this section alone, the proposal fails.

This is not a summary. This is not a code walkthrough. This is the actual sequence of events a person goes through, told with the precision of the code but in the language of experience.

## Why This Exists — The LP-008 Lesson

A pipeline run (LP-008) produced a report claiming "3 stacked bugs block ALL trial conversions." The report listed line numbers, function names, and boolean logic. The user read it and couldn't tell whether it was right. Not because it was wrong — but because the report never described what a person would see, do, or experience differently because of these bugs.

When asked to fix this, agents produced three progressively wrong versions before getting it right. Each failure teaches something specific about how NOT to ground a proposal.

### Failure 1: Code Objects as Subject

The agent described what functions return and what variables contain. It said things like "`isLatestTrialExpired()` returns `false` because `trial.used` is never set to `true`." This is technically accurate and completely useless for a decision. There's no person in the story. The user has to mentally simulate the entire chain from "function returns wrong value" to "person doesn't see upgrade prompt" — and that simulation is exactly where errors hide.

**Why it's wrong:** The subject of every sentence is a code object. The person is absent. The user can't evaluate whether the gap reaches the screen.

### Failure 2: Separated Sections

The agent split the content into "The Promise Made to the Person" and then separately "Where the experience deviates." This looks organized but it forces the reader to mentally stitch together two narratives — the intended journey and the actual journey — and find the deviation themselves. Nobody talks like that. When you tell someone a story about what went wrong, you don't tell the happy version first and then re-tell it with the sad parts. You tell one story and note where things go sideways.

**Why it's wrong:** The journey is one continuous sequence. Splitting it into "what should happen" and "what does happen" obscures the exact moment of deviation — which is the only thing the user needs to see.

### Failure 3: Almost Right but Still Structured Like a Report

The agent described the lifecycle correctly — grant, experience, expire, mark consumed, transition — and identified that the "mark consumed" step never happens. But it still separated the code evidence from the journey narrative, and it still used section headers to partition what should be one flowing story. Close, but the user still had to do mental assembly.

**Why it's wrong:** The precision was there but the format was still structured for an agent audience, not a human one. The user said: "you're articulating the code, not the intent of the code."

### The Correct Version

The agent told one continuous story:

> A person clicks an ad for the app. They sign up, and the system provisions a 7-day legacy trial — no card, full access. A record gets written to their user.trial[] array with startDate set to now, trialDuration: 7, and used: false. That used: false means "this trial is live, it hasn't been consumed yet."
>
> For the next 7 days, every time this person opens the app, the system checks whether they're inside their trial window. isUserOnLegacyTrial() looks at the calendar — is today between the start date and start date plus 7 days? If yes, they're on trial, they get full access, they see a banner that says "3 days left." This part works. The person coaches, it's good.
>
> Day 8. The person opens the app again. The same calendar check correctly says "no, you're outside the window now." The trial banner disappears. So far, still correct.
>
> But here's where things go sideways. There's a second question the system is supposed to answer at this moment: "has this person's trial been formally completed?" That's isLatestTrialExpired() in subscriptionUtils.js. This function is called every time the person loads their profile, and its answer gets sent to the frontend as has_completed_trial. The intent is that on day 8, this returns true — "yes, the trial is done." But the function checks trial.used before it checks the dates. used is still false — because nothing, anywhere in the entire codebase, ever sets it to true. So the function sees used: false and returns "no, the trial hasn't expired." It never even looks at the calendar.
>
> Now — and this is where certainty drops — I don't know what happens next in the person's experience because of this. The value arrives in the frontend, but when I searched for anything that reads it to decide what to show the person, I only found it being reset to false in one component. I couldn't find a component that says "if this is true, show the upgrade prompt." So either something reads it and I missed it, or nothing reads it and the bug is real but doesn't touch what the person sees.

**Why it works:** One continuous journey. The person is the subject. Code references are woven in as evidence for why the experience is the way it is. The moment of deviation is clearly marked. Unknown gaps are stated explicitly with their certainty. The user can read this once and know exactly what the agent understands, what it doesn't, and where the claim might be wrong.

## How to Write a Grounding Section

### The Rules

1. **One continuous journey.** Start from the person's first action. Walk through each step chronologically. Note where the experience deviates from the intent. Do not separate "current" from "target" into different sections.

2. **The person is the subject.** Not the function. Not the variable. The person does something, and the system responds. When the system responds wrong, describe what the person sees (or doesn't see) as a result.

3. **Code references are evidence, not subject.** When you reference a function or file, it's to explain WHY the person's experience is the way it is. Example: "The system checks whether they're inside their trial window (isUserOnLegacyTrial() in resolvers/legacy_trial/)" — the function name is parenthetical evidence, not the topic of the sentence.

4. **Mark the moment of deviation explicitly.** Use language like "here's where things go sideways" or "this is where the experience breaks." The reader should be able to scan for this moment.

5. **Weave in the proposed fix.** After describing the deviation, continue the journey as it WOULD play out if the fix were applied. Same narrative format — "if we fixed this, then on day 8 the person would see..." Don't separate the fix into its own section.

6. **State what you don't know.** If you can't prove the gap reaches the person's screen, say so. Include your certainty. "I don't know what happens next" is infinitely more useful than a confident claim you can't back up.

7. **Certainty scores on claims.** Every factual claim must include an explicit numeric certainty percentage AND may optionally use the emoji scale for visual scanning. Example: "I believe used: false means the trial is live (certainty: 78% 🔵)." The numeric score is mandatory — emojis are optional visual aids. Use: green 🟢 (90%+, confirmed by human or test), purple 🟣 (80-89%, confirmed by code reading), blue 🔵 (70-79%, derived from code), yellow 🟡 (60-69%, inferred), red 🔴 (below 60%, predicted). The number makes drift measurable; the emoji alone does not.

8. **Never describe code without translating to experience.** If you mention that a function returns `null`, immediately follow with what that means for the person. "The function returns null — which means the system never recognizes that the trial ended, so the person is never transitioned to the upgrade path."

9. **Assertions vs interpretations — the hallucination boundary.** If you derived a meaning from reading code (e.g., "used: false means the trial is live"), that is an INTERPRETATION, not a fact. Write it as one: "I believe used: false means..." or "Based on the comment at line 597, used: false appears to mean..." NEVER write an interpretation as a definitional statement. When downstream agents read your grounding, they will treat definitional statements as established facts. If your interpretation is wrong, every agent that reads it inherits the error. This is the literal source of hallucination cascades. The certainty score helps but is not sufficient — the sentence structure must also communicate "this is what I believe" vs "this is what is true."

10. **Include the CONDITIONS.** Who reaches this state? What path did they take? What registration flow, what product variant, what prior actions? If you don't specify conditions, you're claiming the experience applies to ALL users — and that's almost never true. Name the specific funnel, the specific user type, the specific path. Example: "A person who registers directly on example.com (not through go.example.com) gets a legacy seven day trial under these conditions..."

11. **Articulate the RISK of getting this wrong.** Every grounding must include a risk statement: what happens if the grounding itself is inaccurate? What decisions would be made based on this grounding, and what would go wrong if those decisions were based on incorrect claims? This is not about the risk of the bug — it's about the risk of the grounding being wrong. Example: "If the meaning of used: false is wrong, then the proposed fix would flip the wrong flag and potentially lock active trial users out of their access."

12. **Question code behavior against intent.** When you observe what the code DOES, ask whether that matches what the code was INTENDED to do. If a banner disappears after trial expiry, check: does the banner component have an expired state? If yes, why would that state exist if the intent was to hide the banner? Code behavior is evidence, not intent. When they diverge, flag it — that's a potential bug, not a confirmed design decision.

13. **Check the Intent DB before writing the "intended" portion.** Before describing what the system was INTENDED to do, query the Intent DB for a relevant IX-### entry: `agent_find "intended behavior for [feature area]" --limit 5`. If an intent record exists, derive "intended" from that record — it's the ground truth. If no intent record exists, state explicitly: "No Intent DB record found for this feature area — the intended behavior below is derived from code reading and may not match the user's actual intent (certainty capped at 75%)."

14. **Check for WIP scaffolding before calling something a bug.** Code that appears broken or incomplete may be intentional WIP — a feature in progress that was never meant to be live yet. Before declaring something is broken, check: is there a recent commit message suggesting this was intentionally incomplete? Is it behind a staged release gate at 0%? Is there a TODO or WIP marker? If any of these are true, the grounding should frame it as "appears to be WIP scaffolding" not "is broken."

### Template Structure

The grounding section in a proposal should follow this shape:

```
## Grounding — The Person's Journey

[Person takes first action] → [system responds, explain how] → 
[person continues] → [system continues] → 
[HERE is where it breaks — explain what deviates and why, with code as evidence] → 
[what the person sees or doesn't see as a result] →
[what we don't know / can't prove] →
[if we fix this, the journey continues like THIS instead]
```

There are no rigid sub-headers within the grounding. It reads like a narrative with code precision.

## Multi-Agent Validation Protocol

The grounding step is not done until three roles agree on the result. This prevents the exact failure LP-008 demonstrated — an agent writing convincing-sounding claims that don't survive scrutiny.

### Role 1: Composer (primary agent)

Writes the grounding narrative following the rules above. Must read the actual code at every line number referenced. Must trace the journey from user action to system response to UX outcome.

**Output:** The grounding section draft.

### Role 2: Researcher (validation subagent)

Receives the grounding draft. For every factual claim:
- If it references a line number: reads the code at that line and confirms the claim matches
- If it says "nothing in the codebase does X": runs grep to verify
- If it says "the person sees Y": traces the frontend component that renders Y

**Output:** Per-claim verification. Each claim marked as: CONFIRMED (code matches), DISPUTED (code says something different — include what it actually says), or UNVERIFIABLE (can't determine from code alone).

### Role 3: Adversary (disproof subagent)

Receives the grounding draft. Actively tries to disprove the narrative:
- "What if there's another code path that handles this case?"
- "What if the function is called from somewhere else with different behavior?"
- "What if the frontend DOES read this value and the composer missed it?"
- "What if the bug was already fixed in a recent commit?"

The adversary searches for evidence that contradicts the grounding. If it finds any, it reports specifically what it found and why it contradicts the narrative.

**Output:** Adversarial findings. Either "no contradictions found after checking [list what was checked]" or specific contradictions with evidence.

### Role 4: Institutional Knowledge Check (THREE sources in sequence)

This role was validated empirically: in a blind test, no single knowledge store caught all errors. The combination of three sources caught 10 distinct errors — more than any pair. All three are required.

Setup: Steps 1 and 3 query NotebookLM notebooks that do not ship with this plugin. Make your own at https://notebooklm.google.com (a principles notebook loaded with your own operating principles, and a jonathan-check2 notebook loaded with your own past conversations) and put each one's ID and your own `nlm` profile where `<...>` appears below, because each check can only catch what its notebook holds.

**Step 1: Principles Vault (operational principles)**

```bash
nlm notebook query <your-principles-notebook-id> \
  "Given this grounding about [one-sentence topic], what principles apply? Specifically: are there known architectural hazards, intended user experiences, fail-open requirements, or staged release gates that this grounding should have mentioned? Are any claims interpretations stated as facts?" \
  --profile <your-profile>
```

Catches: fail-open violations, intended post-state experiences (like the Weasel Path), architectural hazards (like MAX_ACCESS shared between trial and paid users), and staged release gates.

**Step 2: agent_find (institutional knowledge — Intent DB, compactions, commits)**

```bash
node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" "[topic] conditions, who is affected, registration path, intended behavior" --limit 10
```

Catches: registration path conditions (beta19 vs beta50), vestigial vs actual code mechanisms, banner display contracts, and domain-specific intents the Principles Vault doesn't have.

**Step 3: jonathan-check2 (the user response predictor) — for governer score >= 70**

```bash
nlm notebook query <your-jonathan-check2-notebook-id> \
  "An agent produced this grounding about [topic]. What would the user say is wrong, missing, or misleading?" \
  --profile <your-profile>
```

Catches: assertions stated without evidence, UX claims not traced through frontend, missing conversion mechanisms, and misleading field semantics.

### Convergence

The grounding is complete when:
1. Composer has written the narrative
2. Researcher has verified every factual claim — no DISPUTED claims remain (either fixed or acknowledged as uncertain)
3. Adversary has attempted disproof and either found nothing or the findings have been incorporated into the narrative
4. Principles Vault check has been run, agent_find has been queried, and jonathan-check2 has been consulted (for score >= 70) — all surfaced issues incorporated

If the adversary finds a contradiction, the composer revises the narrative to incorporate it. If the researcher disputes a claim, the composer either fixes it or downgrades the certainty to reflect the dispute.

The final grounding section includes a brief validation stamp at the bottom:

```
---
Grounding validated: [date]
Claims verified: [N/M confirmed, K unverifiable]  
Adversarial check: [what was attempted, what was found]
```

## When This Step Fires in the Pipeline

This is a mandatory step in the proposal pipeline. It fires after Stage 3 (Verify) and before Stage 4 (Propose). No proposal can advance to Stage 4 without a completed grounding section. The grounding IS the translation layer that makes Stage 4 possible — without it, Stage 4 is just reformatting code findings, which is what LP-008 did and why it failed.

```
Stage 3 (Verify) → /proposal-ground → Stage 4 (Propose)
                    ↑ CANNOT SKIP
```

Agents cannot dismiss or skip this step. The grounding is written as a separate file (e.g., `groundings/LP-XXX-ground.md`) which serves as the canonical evidence artifact with its own provenance. When producing the final proposal, the grounding is ALSO included verbatim as the `## Grounding — The Person's Journey` section of the proposal file. This means the grounding exists in two places: as a standalone artifact (for evidence provenance and independent versioning) and inline in the proposal (for self-contained readability). The standalone file is the source of truth; the inline copy is derived from it.

If the `groundings/` folder does not exist, create it.
