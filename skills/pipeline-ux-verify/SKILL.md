---
name: pipeline-ux-verify
description: "Stage 5.6 of the pipeline: dispatches haiku agents to verify UX claims against the actual running product. Use when Stage 5.5 (adversarial design) has produced test scenarios that need real browser validation. Input: 05.5-adversarial.md scenarios. Output: 05.6-ux-verify.md with PASS/FAIL per scenario and screenshot references."
triggers:
  - "pipeline-ux-verify"
  - "ux verify"
  - "verify ux claims"
  - "stage 5.6"
  - "dispatch haiku agents"
  - "run ux verification"
---

# Pipeline UX Verify (Stage 5.6)

## Primary Intent

This skill exists because agents that claim "it works" without actually opening the UI create trust debt — the user discovers the failure later, mid-demo or in production. This stage prevents that by dispatching a cheap, fast haiku agent to physically open the product, perform the steps from Stage 5.5, and return a screenshot-backed PASS/FAIL verdict before anyone marks a task complete.

This skill exists because self-assessment is unreliable — agents tend to confidently praise their own output. External browser evidence is not optional. The haiku agent costs nearly nothing ($0.00X per run) and provides the one thing self-assessment cannot: what a user actually sees.

## How to Consume

When you receive `/pipeline-ux-verify` or are at Stage 5.6 of a pipeline run:

1. Read `05.5-adversarial.md` from the pipeline output directory (or the location specified in context)
2. Identify which scenarios are UI-facing (interact with a browser, involve visible elements, or test user-visible state)
3. For each UI-facing scenario, dispatch one haiku agent with the exact steps and expected outcome
4. Collect results, write `05.6-ux-verify.md` with per-scenario verdicts + screenshot paths
5. If no UI-facing scenarios exist, write the file with a single note explaining why verification was skipped

Do NOT attempt to verify scenarios yourself by reading code — that is self-assessment and fails for the same reasons as all self-assessment. Dispatch an agent that actually opens a browser.

## Input

`05.5-adversarial.md` — produced by Stage 5.5 (adversarial design). Each scenario follows this structure:

```
## Scenario N: {title}
- User state: {auth status, subscription tier, feature flags}
- Steps: {numbered list of actions}
- Expected outcome: {what should be visible/happen}
- Expected failure mode: {what could go wrong adversarially}
```

If the file does not exist, check for scenarios inline in the conversation or in `current-governer-state.json`.

## Dispatch Protocol

For each UI-facing scenario, dispatch a haiku agent using the Agent tool:

```
model: claude-haiku-4-5-20251001
run_in_background: true
prompt: |
  You are a UX verification agent. Your only job is to open a browser, perform these steps, and report exactly what you saw.

  ## Scenario: {scenario title}

  Environment: {localhost:3000 OR production URL}
  User state setup: {simulator URL or manual login steps}

  Steps:
  {numbered steps verbatim from scenario}

  Expected outcome: {expected from scenario}

  ## What to do
  1. Use the agentic-chrome-testing skill OR playwright-validator skill — whichever MCP tools are available
  2. Navigate to the correct URL
  3. Set up user state using the simulator if needed:
     http://localhost:3000/<your-user-simulator-path>?auth={state}&subscription={tier}&redirect=/&clear=true
  4. Perform each step
  5. Screenshot after each meaningful state change
  6. Save screenshots to /tmp/ux-verify-scenario-{N}-step-{step}.png
  7. Report: PASS or FAIL, what you saw, screenshot paths, any console errors

  Do NOT interpret the code. Only report what the browser showed you.
```

## Tool Selection for Haiku Agents

Haiku agents should prefer tools in this order based on availability:

| Tool | When to Use |
|------|-------------|
| `playwright-validator` | Playwright MCP is configured — most reliable for structured validation |
| `agentic-chrome-testing` | Chrome debug port is running (check with `lsof -i :9222`) |
| `devtools-site-testing` | DevTools MCP is available — good for one-off navigation + screenshot |

Include this detection logic in each haiku dispatch prompt so the agent self-selects the right tool.

## User State Setup

When a scenario requires a specific user state, **log in as a real test account** —
`yourname+test_NNNNN@example.com`. Access tier is decided on the backend and delivered
as `user.accessTier.tier` via `/auth/me`; the admin simulator overrides only what the
browser believes, so a simulated tier never exercises the real server-side decision.
A verification pipeline reporting on a simulated tier is reporting on a person who does
not exist.

Use the simulator only for fast state-flipping when the underlying tier logic is already
known good. If you do, these are the params that actually work:

```
http://localhost:3000/<your-user-simulator-path>?accessTier={TIER}&clear=true
```

`accessTier`: `MAX_ACCESS` | `LIMITED_ACCESS` | `FREE_ACCESS`
`subscription`: `active` | `cc_trial` | `past_due` | `unpaid` | `canceled` | `incomplete` | `incomplete_expired` | `paused` (`trialing` aliases to `cc_trial`)
`auth`: `logged_out` | `session_expired` — **there is no `logged_in`**; omit the param to stay logged in
`plan`: `1` (free/legacy_trial) | `2` | `3`

Two simulator defects to expect (known, deliberately unfixed): `redirect=` is written but never read, so
navigate yourself; and any full page load silently wipes the simulation, so move by
in-app link clicks only and confirm via the console line
`[AdminSimulator] OVERRIDING accessTier with simulation:`.

After navigating to the simulator URL, wait 2 seconds for the redirect, then proceed with scenario steps.

## Output Format

Write `05.6-ux-verify.md` in the same directory as `05.5-adversarial.md`:

```markdown
# Stage 5.6 — UX Verification

Generated: {timestamp}
Scenarios verified: {N of M UI-facing}
Overall: {PASS / FAIL / PARTIAL}

---

## Scenario 1: {title}

**Result: PASS / FAIL**
**Verified by:** haiku agent (claude-haiku-4-5-20251001)
**Tool used:** playwright-validator / agentic-chrome-testing / devtools-site-testing

**What the agent saw:**
{plain language description of what appeared in the browser}

**Screenshots:**
- Step 1: /tmp/ux-verify-scenario-1-step-1.png — {description}
- Step 2: /tmp/ux-verify-scenario-1-step-2.png — {description}

**Console errors:** {none / list errors}

**Deviation from expected:**
{If FAIL: exactly what differed from the expected outcome}

---

## Skipped Scenarios

{List any scenarios that were skipped and why — e.g., "not UI-facing", "requires production credentials not available"}

---

## Summary

{1-3 sentences: what was verified, what failed, what needs human review}
```

## Observability

Every time this skill dispatches an agent or reads a file, print:

`[PIPELINE-UX-VERIFY]: Dispatching haiku for "{scenario title}" — Tool: {tool} — URL: {url} — Expected: {expected outcome in one clause}`

After all agents return:

`[PIPELINE-UX-VERIFY COMPLETE]: {N} scenarios verified — {X} PASS / {Y} FAIL — Output: {path to 05.6-ux-verify.md}`

## Feedback Loop When It Falls Short

If this skill cannot surface what you need:

- State which scenario failed to dispatch and why (no browser tools available, user state setup failed, screenshots unreadable)
- Do NOT substitute code-reading as a replacement for browser verification — that is self-assessment and is not equivalent
- Log what was missing: "I could not verify scenario 3 because Chrome debug port was not running. The haiku agent attempted `agentic-chrome-testing` and got: [error]. To unblock: run `open -a "Google Chrome" --args --remote-debugging-port=9222` and re-run Stage 5.6."

We do not know for certain that this skill fully addresses all adversarial UX scenarios in all environments. If it falls short, that is signal — report it, don't work around it silently.

## Composition with Other Skills

- **Precedes:** Stage 5.6 must complete before `/complete-agentic-task` is called — UX evidence is a required artifact
- **Follows:** `pipeline-adversarial-design` (Stage 5.5) — scenarios are the direct input
- **Works with:** `playwright-validator` (structured validation + evidence upload), `agentic-chrome-testing` (CDP navigation), `devtools-site-testing` (quick page load + perf trace)
- **If FAIL results exist:** Route to `how-to-submit-and-track-proposals` to log the regression as a proposal before closing the pipeline run

## Honest Framing

Haiku agents are fast and cheap, not infallible. They may miss:
- State that requires multi-step setup not captured in the scenario
- Race conditions that only appear under load
- Visual regressions below the threshold of a screenshot diff

A PASS from this stage means "a haiku agent performed the steps and saw the expected outcome." It does not mean "this is guaranteed correct in production." It is one strong signal among several, and it is orders of magnitude better than self-assessment.

## Skip Condition

If `05.5-adversarial.md` contains zero UI-facing scenarios (e.g., all scenarios test backend logic, database state, or API contracts with no browser interaction), write:

```markdown
# Stage 5.6 — UX Verification

Skipped: No UI-facing scenarios in Stage 5.5 output.
All {N} scenarios in 05.5-adversarial.md test backend/API behavior only.
Browser verification not applicable for this pipeline run.
```

Do not dispatch any agents and proceed to Stage 6.
