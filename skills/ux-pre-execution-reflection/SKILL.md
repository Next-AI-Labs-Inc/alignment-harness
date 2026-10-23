---
name: ux-pre-execution-reflection
description: Structured pre-execution reasoning that agents run BEFORE building, triggered when ux-criticality-measurement returns a score
triggers:
  - "pre-execution reflection"
  - "ux reflection"
  - "before building"
  - "delivery chain analysis"
  - "what could break the intent"
  - "self-reflection before code"
---

# UX Pre-Execution Self-Reflection

## When to Use

This skill is triggered by the `ux-criticality-measurement` skill when the criticality score is **4 or higher** (moderate to high). Do NOT skip this step when triggered.

**Trigger conditions:**
- `ux-criticality-measurement` returned `reflectionRequired: true`
- You are about to build something with a criticality score >= 4
- You suspect a delivery chain issue but haven't mapped it yet

**Depth:**
- `reflectionLevel: "light"` (score 4-6): Answer all 9 questions, brief answers acceptable
- `reflectionLevel: "full"` (score 7-10): Answer all 9 questions with thorough reasoning and specific examples

## The 9 Reflection Questions

Answer ALL of these before writing any implementation code.

### 1. What is the target intent in plain UX terms?

Format: "When {user} does {action}, they experience {outcome}"

This forces you to articulate what success looks like from the user's perspective, not from the code's perspective.

**Good**: "When a coached user receives this email, it feels like a personal note from their coach and they open it in their Primary inbox"
**Bad**: "Send an email using the V2 pipeline with brandedCoachingTemplate"

### 2. What is the full delivery chain from code to user eyeballs?

Map every single layer between your code and the moment the user experiences the result. Include third-party systems, classifiers, and environmental factors.

Example:
```
Code -> V2 Pipeline -> brandedCoachingTemplate -> Mailgun transport -> Mailgun ESP -> Gmail classifier -> inbox tab -> user opens email
```

### 3. For each layer: does this layer SERVE or FIGHT the intent?

Go through your delivery chain and honestly assess each layer. If ANY layer fights the intent, that is a red flag that must be resolved before building.

Example:
| Layer | Serves/Fights | Note |
|-------|--------------|------|
| V2 Pipeline | Serves | Produces 9.5/10 coaching content |
| brandedCoachingTemplate | FIGHTS | HTML marketing wrapper triggers Promotions tab classification |
| Mailgun transport | Neutral | Adds bulk headers by default |
| Gmail classifier | FIGHTS | HTML + multiple links + bulk headers = Promotions |

### 4. What could break fulfilling this intent?

List failure modes, especially **silent** ones where the code "works" but the user never experiences the intended outcome.

Example failure modes:
- Email lands in Promotions tab (silent — code reports "sent successfully")
- Auth token expires mid-flow (user sees generic error, not helpful recovery)
- Feature flag misconfigured (feature silently hidden from target users)

### 5. What are the exact requirements to hit the nail on the head?

Not code requirements — **UX requirements**. What must be true about the user's experience?

Example:
- Must land in Primary inbox (not Promotions, not Spam)
- Must look like a human wrote it (no HTML chrome, no marketing footer)
- Maximum 1 link in the email body
- From name must be coach's name, not company name

### 6. In what ways could fulfilling this intent cause more harm than good?

Think about second-order effects. Sometimes a well-intentioned feature actively damages trust or creates negative associations.

Example: "A marketing-looking email from 'your coach' is WORSE than no email — it trains the user to ignore future coaching touches and erodes the personal relationship the product is built on."

### 7. What assumption am I making that is most likely to be wrong?

Name it explicitly. The most dangerous assumptions are the ones you don't realize you're making.

Example: "I assumed 'email sends successfully' equals 'email reaches user'. The delivery layer between send and receive was invisible to me."

### 8. What question should I be asking myself that I haven't asked?

This is the meta-question — force yourself to find the blind spot.

Example: "Does every layer of my implementation serve the stated intent, or does any layer fight it?"

### 9. What is the answer to that question?

Answer your own meta-question honestly.

Example: "No — the HTML template actively fights the intent by making a personal note look like marketing. The template must be removed or replaced with plain text."

## Output Format

The reflection produces this JSON object, stored on the session compaction record (`$(alignment-harness records compactions)/<sessionId>.json`) under the `preExecutionReflection` field:

```json
{
  "targetIntent": "When a coached user receives this email, it feels like a personal note and they open it in their Primary inbox",
  "deliveryChain": [
    { "layer": "V2 Pipeline", "servesOrFights": "serves", "note": "Produces 9.5/10 coaching content" },
    { "layer": "brandedCoachingTemplate", "servesOrFights": "fights", "note": "HTML marketing wrapper triggers Promotions tab classification" },
    { "layer": "Mailgun transport", "servesOrFights": "neutral", "note": "Adds bulk headers" },
    { "layer": "Gmail classifier", "servesOrFights": "fights", "note": "HTML + multiple links + bulk headers = Promotions" }
  ],
  "failureModes": [
    "Lands in Promotions tab",
    "User never sees it",
    "Coaching voice undermined by marketing chrome"
  ],
  "uxRequirements": [
    "Must land in Primary inbox",
    "Must look like a human wrote it",
    "Max 1 link"
  ],
  "harmPotential": "A marketing-looking email from 'your coach' is WORSE than no email — it trains the user to ignore future coaching touches",
  "riskyAssumption": "I assumed 'email sends successfully' = 'email reaches user'. The delivery layer was invisible to me.",
  "metaQuestion": "Does every layer of my implementation serve the stated intent?",
  "metaAnswer": "No — the HTML template actively fights the intent by making a personal note look like marketing"
}
```

## How This Would Have Caught the Email Deliverability Issue

The email deliverability failure is the canonical example this skill was designed to prevent:

1. **Criticality measurement** would have scored 8.5 (silentFailure: 10, deliveryChain: 8, firstImpression: 9, harmIfWrong: 7)
2. **Question 2** (delivery chain mapping) would have surfaced the `brandedCoachingTemplate` layer
3. **Question 3** (serves or fights) would have flagged that the HTML template **fights** the intent of a personal coaching note
4. **Question 4** (failure modes) would have identified "lands in Promotions tab" as a silent failure
5. **Question 7** (risky assumption) would have caught the assumption that "sent = received"

Without this reflection, the agent jumped straight to code, produced 9.5/10 coaching content, wrapped it in a marketing template, and the email landed in Promotions — defeating the entire purpose.

## Storing on Compaction

Include the `preExecutionReflection` field when creating a compaction:

```bash
alignment-harness record compactions --name "<sessionId>.json" <<'EOF'
{
    "sessionId": "...",
    "title": "...",
    "preExecutionReflection": {
      "targetIntent": "When {user} does {action}, they experience {outcome}",
      "deliveryChain": [
        { "layer": "Layer Name", "servesOrFights": "serves", "note": "Why" }
      ],
      "failureModes": ["Silent failure 1", "Silent failure 2"],
      "uxRequirements": ["Must X", "Must Y"],
      "harmPotential": "How this could cause more harm than good",
      "riskyAssumption": "The assumption most likely to be wrong",
      "metaQuestion": "The question I should be asking",
      "metaAnswer": "The answer to that question"
    },
    "compactedSession": "..."
}
EOF
```

## Cross-References

- **Criticality Measurement**: `ux-criticality-measurement` skill (triggers this reflection)
- **Session Compactions**: `agentic-session-compactions` skill (stores both outputs)
- **Model**: `$(alignment-harness records compactions)/<sessionId>.json` — `preExecutionReflection` field
- **Admin UI**: `$(alignment-harness records compactions)` — delivery chain visualization with serves/fights indicators
