---
name: ux-criticality-measurement
description: Measures how critical it is to get an initiative right from a UX perspective.
triggers:
  - "ux criticality"
  - "criticality measurement"
  - "how critical is this"
  - "user-facing impact score"
  - "should I reflect before building"
  - "ux risk assessment"
---

# UX Criticality Measurement

## When to Use

Run this skill BEFORE building anything that touches the user experience. The output tells you whether to engage the `ux-pre-execution-reflection` skill.

**Always run when:**
- The work produces something a user will see, receive, or interact with
- The work changes how an existing user-facing feature behaves
- The work touches a delivery chain (email, push notification, SMS, webhook)

**Skip when:**
- Pure backend refactoring with no UX surface
- Internal tooling used only by agents
- Documentation-only changes

## Measurement Dimensions

Answer each dimension honestly. Examples are provided to calibrate scoring.

### 1. Is This User-Facing? (yes/no)

If **no**, the criticality score is **0** and you skip reflection entirely.

Examples:
- **Yes**: Email to user, React component, onboarding flow, notification, pricing page
- **No**: Database migration script, internal admin-only API, CI/CD config, agent skill file

### 2. Silent Failure Degradation (1-10)

"If this fails silently, does the user experience degrade?"

| Score | Example |
|-------|---------|
| 1-2 | Tooltip slightly misaligned, admin dashboard column too wide |
| 3-4 | Settings page loads slowly, non-critical feature hidden behind wrong flag |
| 5-6 | Notification arrives but with wrong formatting, email subject line truncated |
| 7-8 | User receives email but it looks spammy/impersonal, checkout flow has confusing step |
| 9-10 | Email lands in spam/Promotions (user never sees it), payment silently fails, auth token expires without re-auth prompt |

### 3. Delivery Chain Length (1-10)

"How many layers between your code and the user's eyeballs?"

| Score | Example Chain |
|-------|---------------|
| 1-2 | Code -> React component -> user sees it |
| 3-4 | Code -> API -> React component -> user sees it |
| 5-6 | Code -> API -> background job -> database -> React component -> user |
| 7-8 | Code -> API -> email service -> ESP -> email client classifier -> inbox tab -> user |
| 9-10 | Code -> API -> third-party webhook -> partner system -> partner notification -> end user |

### 4. First Impression Weight (1-10)

"Is this a first impression or a repeat touchpoint?"

| Score | Example |
|-------|---------|
| 1-2 | Settings page tweak for power users, admin dashboard refinement |
| 3-4 | Updated tooltip on frequently-used feature, minor copy change |
| 5-6 | New feature announcement for existing users, monthly summary email |
| 7-8 | First email after signup, onboarding step 1, pricing page for prospects |
| 9-10 | First coaching email after 60-day absence, first impression of product for new visitor, recovery email after churn |

### 5. Harm If Wrong (1-10)

"If wrong, does this cause more harm than not doing it at all?"

| Score | Example |
|-------|---------|
| 1-2 | Slightly misaligned tooltip — no harm, just imperfect |
| 3-4 | Feature behind wrong flag — user doesn't see it, but no negative impression |
| 5-6 | Email with wrong name — feels impersonal but not harmful |
| 7-8 | Marketing-looking email from "your coach" — erodes personal trust |
| 9-10 | Broken checkout charges wrong amount, coaching email triggers spam report, password reset sends to wrong email |

## Formula

```
criticalityScore = (silentFailureDegradation + deliveryChainLength + firstImpressionWeight + harmIfWrong) / 4
```

## Thresholds

| Score | Level | Reflection Action |
|-------|-------|-------------------|
| 0 | Not user-facing | Skip reflection entirely |
| 1-3 | Low criticality | Reflection optional (use judgment) |
| 4-6 | Moderate criticality | Reflection RECOMMENDED — run `ux-pre-execution-reflection` |
| 7-10 | High criticality | Reflection REQUIRED — run `ux-pre-execution-reflection` with full depth |

## Reflection Level Mapping

- Score 0: `reflectionLevel: "none"`
- Score 1-3: `reflectionLevel: "none"` (optional — agent decides)
- Score 4-6: `reflectionLevel: "light"` (answer all reflection questions, brief answers acceptable)
- Score 7-10: `reflectionLevel: "full"` (answer all reflection questions with thorough reasoning)

## Output Format

The measurement produces this JSON object, which is stored on the session compaction record under the `uxCriticality` field:

```json
{
  "criticalityScore": 8.5,
  "isUserFacing": true,
  "dimensions": {
    "silentFailureDegradation": 10,
    "deliveryChainLength": 8,
    "firstImpressionWeight": 9,
    "harmIfWrong": 7
  },
  "reasoning": "This is a coaching re-engagement email. If it lands in Promotions, the user never sees it. The delivery chain is long (code -> pipeline -> Mailgun -> ESP -> Gmail -> inbox). First coaching email after 60 days = high first impression weight. A marketing-looking email from 'your coach' actively erodes trust.",
  "reflectionRequired": true,
  "reflectionLevel": "full"
}
```

## Storing on Compaction

When creating a session compaction via `alignment-harness compaction put`, include the `uxCriticality` field in the request body:

```bash
alignment-harness compaction put --json '{
    "sessionId": "...",
    "title": "...",
    "uxCriticality": {
      "criticalityScore": 8.5,
      "isUserFacing": true,
      "dimensions": {
        "silentFailureDegradation": 10,
        "deliveryChainLength": 8,
        "firstImpressionWeight": 9,
        "harmIfWrong": 7
      },
      "reasoning": "...",
      "reflectionRequired": true,
      "reflectionLevel": "full"
    },
    "compactedSession": "..."
  }'
```

## Integration with Pre-Execution Reflection

After running this measurement:
- If `reflectionRequired` is `true` (score >= 4), proceed to the `ux-pre-execution-reflection` skill
- If `reflectionLevel` is `"full"` (score >= 7), answer every reflection question with thorough reasoning
- If `reflectionLevel` is `"light"` (score 4-6), answer all questions but brief answers are acceptable
- Store both outputs on the compaction when the session ends

## Cross-References

- **Pre-Execution Reflection**: `ux-pre-execution-reflection` skill (triggered by this measurement)
- **Session Compactions**: `agentic-session-compactions` skill (stores both outputs)
- **Model**: `alignment-harness records compactions` — `uxCriticality` field
- **Admin UI**: `alignment-harness compaction get` — criticality badge + dimension display
