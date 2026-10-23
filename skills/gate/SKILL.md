---
name: gate
description: "Real-time scope listener + skill router. Spawns a persistent team where a listener agent watches conversation for actionables, shows its interpretation, and routes to the right existing skill. Use when starting any substantive session."
triggers:
  - "gate"
  - "/gate"
  - "start listening"
  - "watch for scope"
---

# /gate — Real-Time Scope Listener + Skill Router

When invoked, create a team and spawn a persistent listener agent (Opus) that runs alongside the conversation. The lead agent forwards every human message to the listener. The listener's job:

1. **Detect** — notice when an actionable emerges (an intent, desired outcome, gap, correction, new requirement)
2. **Announce** — quote the raw text, say "Scope detected: {quote}"
3. **Translate** — show interpretation in human language: "My interpretation: {what this means as a UX outcome}" OR "Skipping because: {reason}"
4. **Route** — propose which existing skill handles this: "Route to: /declare-scope because {reason}"
5. **Wait** — do NOT act until the human confirms

## How to Create the Team

```
TeamCreate({ team_name: "gate-{short-session-id}", description: "Scope listener + execution team" })
```

Then spawn persistent roles:

- **listener** (Opus) — detects scope, translates, proposes routing
- **scope-guardian** (Sonnet) — tracks declared scope, prevents drift
- **compliance-auditor** (Sonnet) — watches for unverified claims, self-heals

When implementation is needed, the LEAD spawns per-task agents (implementer, cross-verifier) within the SAME team. One team per session — no nested teams.

## Constraints (Tested 2026-04-21)

- **One team per session.** TeamCreate fails if a team already exists. The gate team IS the only team.
- **Teammates cannot spawn agents or create teams.** Only the lead can. The listener routes via SendMessage to the lead, who spawns.
- **Teammates CAN:** invoke Skills, use Bash/Read/Write/Edit/Grep/Glob, SendMessage to each other.
- **Routing mechanism:** listener detects → SendMessage to lead → lead invokes skill or spawns agent.

## Detection: What Counts as Scope

Use the /declare-scope auto-mining triggers:

| Pattern | Example |
|---------|---------|
| "users should never..." | "users should never see a blank screen after paying" |
| "users should always..." | "users should always know their trial status" |
| "when X happens, they should see Y" | "when they upgrade, they should see a confirmation" |
| "never show X when Y" | "never show upgrade CTA to a paying user" |
| "this is broken because..." | "this is broken because free users see paid features" |
| Statement of desired outcome | "I want them to be able to see what the field is doing" |
| Gap between current and desired state | "right now it doesn't do X but it should" |
| Correction of prior interpretation | "that's not what I meant, I meant..." |
| New requirement mid-conversation | "and we should probably also have..." |

When NOT to detect (noise filtering):
- Human is exploring, thinking out loud, not stating a requirement
- Human is asking a question, not declaring intent
- Human is providing context, not requesting action
- When uncertain: DON'T announce. Only detect at >= 75% confidence it's an actionable.

## Routing: Which Skill Handles What

Read /agentic-init at startup for the full catalog. Core routes:

| What was detected | Route to | Why |
|---|---|---|
| New intent, desired outcome, or gap | /declare-scope | Needs to be captured as testable UX statement |
| Scope confirmed, needs scoring | /governer | Determines validation depth and routing |
| Complex scope, multiple parts | /decompose | Break into atomic tasks |
| Misalignment detected | /align | Re-establish shared understanding |
| Implementation tasks ready | Spawn implementer teammate | Build within this team |
| Voice/tone/copy correction | /founder-voice-email-writing | Apply voice preservation |
| Human says "skip" or "not now" | Log skip with reason | Observable non-action |

## Pipeline State Tracking

The listener tracks where each piece of scope is in the lifecycle:

```
detected → declared (/declare-scope) → scored (/governer) → decomposed (/decompose) → planned (/plan) → implementing → verified → complete
```

When proposing a route, the listener checks: has this scope already been through earlier stages? If /declare-scope already ran, propose /governer next, not another declaration.

## Listener Prompt Template

When spawning the listener agent, include this in the prompt:

```
You are the scope listener for this session. You receive forwarded human messages via SendMessage from the lead agent.

Your ONLY job: detect actionables, show your interpretation, and propose which skill should handle it.

For each detection, send back to the lead:

"SCOPE DETECTED
Raw: {exact quote from the human}
Interpretation: {what you think this means as a UX outcome — human language, no code}
Route: {skill name} — because {reason}
Confidence: {%}
Pipeline state: {where this scope is in the lifecycle}"

Rules:
- NEVER act on detected scope. Only propose.
- NEVER invoke skills yourself. Only the lead can.
- If confidence < 75%, DON'T announce — hold it and watch for more signal.
- If you'd skip something, say why: "Skipping: {quote} — this is context/exploration, not a requirement."
- Use /speak-human principles — no code, no jargon.
- Track what's been declared, scored, and implemented so you don't propose redundant steps.
```

## The Lead Agent's Role

The lead agent (the one talking to the human) does:
1. Forward every human message to the listener via SendMessage
2. Surface the listener's detections naturally in conversation
3. Get human confirmation before acting on a detection
4. Invoke the routed skill or spawn the needed agent
5. Keep the conversation flowing — don't block on listener responses

## Reconstituted /execute Pipeline (within this team)

When implementation is needed, the lead spawns per-task agents within the gate team following /execute's 8-stage pipeline:

1. Governer score (lead reads state)
2. Evidence baseline (haiku agent)
3. Implement (sonnet agent)
4. Evidence after (haiku agent)
5. Cross-verify (sonnet agent, independent)
6. Adversary (haiku agent)
7. Oracle gate (jonathan-check2)
8. Convergence + consumption (lead synthesizes)

All agents are teammates in the ONE gate team. No nested TeamCreate.
