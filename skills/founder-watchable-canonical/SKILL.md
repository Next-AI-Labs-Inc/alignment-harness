---
name: founder-watchable-canonical
description: "CANONICAL entry for founder-watchable browser testing with screen recording. Pins the walkthrough doc, the recording command, the cohort definitions, and the append-only Instincts the user has taught across sessions. Use when the user wants to watch an agent test the UX live, or when learning a new instinct that should never be forgotten."
aliases:
  - "founder watchable canonical"
  - "canonical founder watch test"
  - "watchable browser test canonical"
  - "instincts canonical"
  - "agent instincts file"
  - "the user taught instinct"
  - "live watch with recording"
  - "screencapture browser walkthrough canonical"
triggers:
  - "watch me test"
  - "the user watch the funnel"
  - "watch the walkthrough"
  - "record the walkthrough"
  - "founder watchable"
  - "add to canonical instincts"
  - "update instincts"
  - "new instinct"
discoverability-keywords:
  - "founder watchable canonical"
  - "screen recording browser walkthrough canonical"
  - "instincts append only canonical"
  - "agent instincts the user taught"
  - "screencapture -v walkthrough"
  - "loom alternative agent driven"
  - "narrated browser test with overlay and recording"
  - "watch agent test UX live with mov recording"
tags:
  - canonical
  - founder-watchable
  - browser-testing
  - chrome-devtools-mcp
  - screen-recording
  - instincts
  - agent-behavior
---

# Founder-Watchable Walkthrough — CANONICAL

> **Status:** CANONICAL. This is the single entry point for ALL UX-validation walks. ~10 prior overlapping skills are referenced below — use them ONLY when their specialty applies; otherwise this canonical is the front door.

> **Lifecycle:** Active. Last verified 2026-05-12.

---

# 📋 MENU — what's in this file (read first)

| Section | What you get | When you need it |
|---|---|---|
| 🎯 **INTENT** | The 3 things this skill exists to do | First read — orient on purpose |
| 🧠 **INSTINCTS** | Append-only behavioral rules the user has taught (currently 27+) | Read BEFORE asking the user anything OR proposing a fix |
| 📚 **Source-of-truth doc** | Full 8-step recipe + overlay-injection JS | When you need the exact mechanical sequence |
| 🧪 **Launch command** | Bash + MCP sequence to start a walk | First-time launch of a new walk |
| 🔧 **Agent tools** | (a) Resume from checkpoint, (b) Side-panel overlay variant | Resuming a mid-walk OR the user requests side-panel layout |
| 🎭 **Test accounts** | `yourname+<number>@gmail.com` format + login institutional knowledge | Any walk needing a fresh signup |
| 🚫 **Anti-patterns** | What NOT to do (auto-browser, Playwright `--headed`, `sleep` pacing, etc.) | Before reaching for a tool you "remember" worked |
| 🗺️ **Supersession map** | Which prior skills are subsumed by this one + when to use them anyway | When you almost reach for an old skill — check here first |

# 🧩 HOW THIS SKILL IS MODULAR — read this if you find yourself reinventing

This canonical is a **growing menu of reusable modules**, not a static document. The pattern:

1. **You discover a new technique during a walk** (a better recording flag, a clearer overlay layout, a new checkpoint format, a way to detect a specific failure class)
2. **You add it to this file** — either as a new instinct (behavioral rule) or a new agent-tools entry (reusable mechanical capability)
3. **Future walks load this file and inherit your module** — they don't reinvent the wheel, they stack on top

If you're about to write a one-off helper, ask first: *"Does this belong in the canonical so the next walk has it?"* If yes, add it here. If it's truly walk-specific, write it inline.

The same applies to the user's feedback: every correction the user gives → instinct here → next session inherits the lesson, no re-teaching.

---

# 🎯 INTENT — what this skill exists to do

- autonomous testing with full visibility to admin
- detection and proposed fixes of bugs for admin to approve with `/sanity-check`
- *(reserved — the user may add)*

# 🧠 INSTINCTS — append-only, user-taught

> Every entry below is a behavioral rule the user has stated. Append-only. Date-stamped. Newest at bottom.
>
> **Confirm before acting:** When the user gives feedback, repeat it back verbatim (or close paraphrase) before changing behavior. This is the hallucination-detection surface — if I misquote, the user catches it before the wrong lesson lands in this file.
>
> **Read this section BEFORE asking the user anything.** If the answer is already here, act.

- **2026-05-12 — Prefer autonomy over making the user decide arbitrary things.** Autonomous testing is visible to the admin. Take the most direct path to the stated goal. Do not offload arbitrary choices back to the user mid-run.
- **2026-05-12 — Prefer testing things that actually had code changes** to make sure those code changes worked, over random testing surfaces. The scope is defined by the diff, not by my urge to be thorough.
- **2026-05-12 — Prefer high-impact critical-path tests** over arbitrary tests. One end-to-end story over a buffet of unit-style cohort scans.
- **2026-05-12 — User feedback → update intent & instincts in THIS skill file.** Every correction the user gives me must update this file before I change behavior. Behavior-only correction = compounding loss.
- **2026-05-12 — Prefer localhost as default unless otherwise specified.** When testing code changes, the running local stack is the higher-fidelity target.
- **2026-05-12 — Persona-driven coaching, not "this is a test" strings.** When the test involves real coaching, simulate a high-LTV persona from `~/.claude/skills/critique-from-target-audience/personas/persona-{1..10}.md`. Stacks integration testing with coaching-quality data on the same compute spend.
- **2026-05-12 — One walk, one user, one watch.** Founder-watchable = integration-as-story, not unit-test-of-cohorts. Cohort matrix belongs in the retrospective, never in the plan.
- **2026-05-12 — Recording must survive shell exit.** Plain `&` in a single Bash call dies when the call ends. Use `run_in_background: true` or `nohup` + detached subshell.
- **2026-05-12 — Use `mcp__chrome-devtools__navigate_page` with generous timeout, NOT `evaluate_script` + `window.location.href`.** The latter kills the MCP page target on CRA dev. The canonical doc's persistent-connection warning extends to dev-mode navigation.

- **2026-05-12 — Existing institutional knowledge beats improvisation.** Before generating ANY test artifact (account, email, password, payload), search for an existing canonical skill that defines it. For login/test-accounts: `/<your-app>-local-login` is the source of truth. For personas: `~/.claude/skills/critique-from-target-audience/personas/`. If you don't know if a skill exists, search before improvising.
- **2026-05-12 — Test accounts MUST use `yourname+<number>@gmail.com` format.** Variable: the digits after `+`. Fixed: everything else. Reasoning: (1) Gmail plus-aliasing delivers to the user's real inbox so the user can verify the actual emails the system sends. (2) Trivial cleanup via `User.deleteMany({ email: /^yourname\+\d+@gmail\.com$/i })`. Never invent a test domain. Never use a non-user-owned email.

- **2026-05-12 — Never propose a fix without reading every named function in your causal chain.** If your diagnosis names a function (`handleLoginSuccess`, `issueRefreshToken`, `getIdToken`), open and read each one before claiming you know the bug. A bug story built on read-some-call-the-rest is a probable story, not a certain one. The user's bar for "go fix it" is certainty grounded in code you have read, not in network logs you have inferred from.
- **2026-05-12 — Reproduce a failure twice with clean state before believing it.** One observation is data, two with isolation is signal. A bug that fires once may be stale cookie, prior session JWT, browser state, or race. Re-test with a fresh `isolatedContext` and zero prior auth state before naming the root cause.
- **2026-05-12 — The user testing a different path successfully is evidence your diagnosis is incomplete.** When the user says "I just tested X and didn't see the error you described" — that is not a vibe check, it is a real datapoint. Surface the contradiction explicitly: "Your test of [path] passing means the bug is specific to [different path] OR [state condition], because [reasoning]." Then either close the gap or back off the diagnosis. Never wave the contradiction away.
- **2026-05-12 — Confidence-tag every fix proposal.** State the confidence level explicitly before asking to proceed: "Confidence: 60% — I have read N of M named functions, reproduced 1 of 2 needed times, ruled out X but not Y." The user grants permission based on the confidence, not on the proposal sounding plausible.

- **2026-05-12 — Programmatic fix ≠ UX fix. The test is "does the user reach the original intent?"** A try/catch that lets the user SEE the error is NOT a fix. The user's experience must actually succeed. For any error-path fix, the minimum bar is: (1) state resets so retry is possible, (2) the system auto-retries with backoff before surfacing failure to the user, (3) during retry, a soft human-language status message communicates "this is taking longer than expected, but we're working on it" rather than a dead spinner, (4) the user eventually reaches the original intent without ever knowing the path was rocky — OR if all retries truly fail, they get a clear "try again" button that works the second time, never a permanent dead state. Anything less is destruction-of-intent disguised as a fix.

- **2026-05-12 — Production data > one browser observation. Query the funnel before believing a single-walk bug claim.** When a walk surfaces a bug that looks like "everyone is broken," dispatch a subagent to query the last 7-30 days of real production conversion data for the affected funnel step. If conversion is at normal levels, the bug is environment-specific (your browser, your state, your race condition) and should NOT be shipped as a production fix — investigate further first. If conversion is at zero or dramatically depressed, the bug is universal and the fix is urgent. Real data tells you which one.

- **2026-05-12 — Every bug-fix proposal MUST include the optimal UX, not just the programmatic fix.** Forgetting to think about what the user experiences is a CRITICAL error in agent thinking. The product IS the experience, not the code. Every backend failure is a frontend opportunity to curate: a 500 becomes "we're working on it — your data is safe," a timeout becomes "hang tight, this is taking a moment," a 401 becomes a silent re-auth the user never sees, a 403 becomes a clear "log in again" with one-click action. Before proposing ANY bug fix, ask: "What does the user see at each moment along the failure path, and how do we curate that into a graceful experience that still gets them to their original intent?" If you only describe what the code does, you have failed the proposal. If a fix proposal causes no harm in the happy path AND curates the failure path gracefully, it is safe to ship even without root-cause certainty — defensive UX is strictly additive value.

- **2026-05-12 — Stale Chrome DevTools MCP profile cookies are a known false-positive bug source.** The chrome-devtools-mcp profile at `~/.cache/chrome-devtools-mcp/chrome-profile/` persists cookies across walks even with `isolatedContext`. A failed walk that left a partial-auth state can corrupt the next walk's signup flow. Always confirm: did this bug reproduce in a fresh-profile run? If you only have one observation in the MCP browser and production data refutes universality, the MCP profile is the most likely culprit. Mitigation: kill the entire profile (not just the SingletonLock) between walks that involve auth state.
- **2026-05-12 — The most important lesson of 2026-05-12: query production data BEFORE building the bug story.** The cost of one subagent query (~30 seconds) is dramatically less than the cost of writing a 15-minute diagnosis based on one observation that turns out to be environment-specific. If a walk surfaces what looks like a "100% broken" funnel bug, the FIRST action is the production-data query, not the code-reading diagnosis. The diagnosis is for AFTER you've confirmed the bug is real.

- **2026-05-12 — The 5-message anonymous signup gate is INTENDED product behavior, not a bug.** Anonymous users get 4 free coaching exchanges, then on attempt-5-send the signup modal fires ("Explore the Frontiers of Your Own Potential"). This is the designed conversion mechanism: prove value in 4 messages, ask for signup at msg 5. Do NOT flag this as a finding or a bug in a walk report. The DIFFERENT, post-signup gate at ~16 messages in `middlewares/checkUsage.js` is the legacy-trial gate, which is a separate mechanism for trial-using authenticated users. An E2E walk to validate the legacy-trial gate must traverse BOTH: anonymous → 4 msgs → signup gate (intended) → register → continue coaching authenticated → ~16 msgs → legacy-trial gate (the actual test target).

- **2026-05-12 — "Test reached the goal" means the original test target fired, not "everything except the goal worked."** Stopping at "I validated the path but didn't drive to the actual gate the test was designed to verify" is a failure of completion disguised as strategic prudence. If the user asked "does the gate fire at msg 16," done = you saw the gate fire at msg 16. Until then, the test is in-progress, period. Compute-budget rationalizations for stopping early are a tell that you forgot the test target.
- **2026-05-12 — Walks MUST support resume-from-checkpoint.** Every walk writes a checkpoint file at `/tmp/founder-watch-checkpoint-<slug>.json` after each substantive milestone (signup gate fired, registration succeeded, authed dashboard reached, msg N completed). A resume command (`/founder-watchable-canonical resume <slug>`) re-opens the browser to the dashboard session ID, re-injects the overlay, and continues from the last checkpoint message count — no re-driving from msg 1. The checkpoint file MUST contain: sessionId (URL path segment), test account email, last completed user-message count, last coach-message preview, recording path if active, walk goal string.
- **2026-05-12 — Side-positioned overlay (when the user requests it) MUST be done via injected DOM only — zero risk to the app's UI code.** Strategy: create a wrapper `<div>` that becomes the new viewport for the app by transforming `document.body` width to `calc(100vw - 460px)` via inline style on `body`, with the overlay panel rendered at `position: fixed; right: 0; width: 460px; height: 100vh;`. ALL CSS lives in the overlay-injection JS — none in the app's source. The app sees a narrower viewport and naturally responsive-shrinks. If anything breaks, the user dismisses the overlay and `body` style is removed — the app's UI is untouched. Test the side-panel variant against the dashboard, coaching surface, and at least one modal before declaring it safe. If ANY UI breakage detected, fall back to the top-right overlay variant.
- **2026-05-12 — Substantive findings → Obsidian report in `<api-repo>/docs/intent/Intent-Map/quality-testing/browser-testing/walk-reports/`.** When a walk produces substantive findings — bugs found, fixes shipped, instrumentation gaps, coaching-quality observations, UX moments worth fixing for users — write a markdown report into the Obsidian intent vault at the path above with filename `walk-YYYY-MM-DD-<slug>.md`. If the `walk-reports/` folder does not exist, create it. Use the user's voice (load `/how-to-talk-like-the-founder` first). Open in Obsidian via `obsidian://open?vault=intent&file=<url-encoded-relative-path>&newtab=true`. The walk-report is the durable artifact; the .mov is supporting evidence. Without the report, the work evaporates after the session ends.

- **2026-05-12 — Resume-from-checkpoint requires explicit auth-restoration when Chrome MCP profile cycles.** The original resume protocol assumed cookies survive across `new_page` calls. They don't — killing the Chrome MCP profile (which we do to clear stale-cookie pollution) drops the auth cookie. Resume protocol must: (1) clear MCP lock only, NOT the whole profile if auth-continuity matters, OR (2) accept the profile kill AND add a login-form step before navigating to the session URL. Use the existing `/<your-app>-local-login` skill for the credentials, or the persona's test account if signup flow is being tested.
- **2026-05-12 — When a backend rejection is correct but the frontend doesn't render its response (e.g. modal that should fire doesn't), that IS the UX bug — not a "send button broken" bug.** During walk-2 resume, the send button appeared to silently swallow click events. The user manually verified send works for non-gated messages; the rejection was firing correctly per `checkUsage.js`; the failure was the frontend handler not catching the rejection and opening the NewPitch upgrade modal. Future diagnostic instinct: if a button appears non-responsive at a specific user state (gate, limit, error), first verify the backend response — the bug is likely "frontend doesn't handle this response shape" not "frontend can't fire the request."
- **2026-05-12 — Walk reports go in `<api-repo>/docs/intent/Intent-Map/quality-testing/browser-testing/walk-reports/YYYY-MM-DD-<slug>.md`.** Frontmatter must include `session-date`, `walks-covered` (array), `test-target`, `verdict`, `recording-files` (array), `related-canonical`. If the `walk-reports/` folder does not exist, create it. Body in the user's voice (load `/how-to-talk-like-the-founder` first). Body sections: (1) what the session was for in plain language, (2) one section per walk, (3) findings numbered + severity-tagged, (4) durable artifacts produced, (5) what's still open as a table. Open the report in Obsidian via `obsidian://open?vault=intent&file=...&newtab=true` immediately after writing.
- **2026-05-12 — Score 80+ critical-path UX bugs use `/governer2` invocation, not direct fixes.** When a UX bug surfaces that affects the conversion gateway, payment flow, or any code path where a wrong fix could regress every user, escalate to `/governer2 {description}`. The pipeline produces: variant announce, score, meta-assessment, UX-Breakage Reasoning Gate (Q1-Q4), required skill sequence, autonomous-commit verdict. Q4 item count > 0 means HUMAN-REQUIRED — sanity-check + browser-evidence-per-item + explicit user authorization before commit. Demonstrated 2026-05-12 on legacy-trial gate-modal handoff at score 82/100 with 10 Q4 items.
- **2026-05-12 — Skill hygiene is recurring, not one-off.** Run the biweekly supersession audit agent (`skill-supersession-audit-agent.md` in the browser-testing domain) every 14 days. It scans `~/.claude/skills/` for new overlap clusters, produces a proposal in Obsidian, waits for user approval. Proposes-never-executes. Without this loop, the cleanup compounds and the canonical front-doors get muddier over 90 days.

- **2026-05-12 — Safety-critical paths fail open, not closed. "Give them the coaching and log it" is the default for ANY error in any gate-handling, paywall-handling, or trial-handling chain.** A trial user blocked from coaching due to a bug at the conversion moment is the single most expensive failure mode in the entire product — company-ending bug class. Coaching delivered + bug logged to high-severity telemetry = recoverable. Coaching blocked = lost user + invisible bug. The asymmetry is so steep that fail-open MUST be the default. Architecture: (1) backend never JUST rejects on internal error — returns a response shape the frontend can handle that includes the coaching content if anything in the gate-check itself errors; (2) frontend gate-handling has its own try/catch that on failure calls back to the backend to generate the coaching response anyway; (3) every error path in the chain terminates at "user gets coaching" with high-severity admin-diagnostics log entry. Block-on-bug is acceptable ONLY when the cost of false-allow exceeds the cost of false-block — for trial coaching the cost of false-block is catastrophic. Applies to gates, paywalls, auth checks, every "can the user do this thing" decision in the conversion path.

<!-- APPEND NEW INSTINCTS BELOW THIS LINE — one per line, newest at bottom, date-stamped, user-verbatim where possible -->

---

## The 30-second summary

Open a real Chromium window on the user's Mac via Chrome DevTools MCP. Start `screencapture -v` recording the screen. Drive the funnel anonymously via `isolatedContext`. Inject a glass overlay top-right that narrates every thinking/action/result. The user watches live and scrolls the overlay log at the user's own pace. On completion (or visible break), kill recording — `.mov` lands on Desktop.

## Source-of-truth doc

[`<api-repo>/docs/intent/Intent-Map/quality-testing/browser-testing/founder-watchable-funnel-walkthrough.md`](<api-repo>/docs/intent/Intent-Map/quality-testing/browser-testing/founder-watchable-funnel-walkthrough.md)

Read it for the full 8-step recipe and the overlay-injection JS. This canonical skill points at it; the doc owns the recipe.

## The launch command

```bash
# 1. Start recording BEFORE opening the browser
TEST_NAME="<short-slug-for-this-test>"
RECORDING_PATH="$HOME/Desktop/${TEST_NAME}-$(date +%Y%m%d-%H%M%S).mov"
screencapture -v -k -D 1 "$RECORDING_PATH" &
RECORDING_PID=$!
echo "Recording PID: $RECORDING_PID → $RECORDING_PATH"
```

Then via Chrome DevTools MCP:
1. `mcp__chrome-devtools__new_page({ url, isolatedContext: TEST_NAME })`
2. Inject overlay (snippet in source-of-truth doc, Step 4)
3. Snapshot → log thinking → action → log result, looped per step
4. On done: `kill -INT $RECORDING_PID`

## Default target — INSTINCT: localhost unless told otherwise

For any test of code in `middlewares/`, `controllers/`, route handlers, or any backend logic, the default target is **`http://localhost:3000`** talking to **`localhost:<your-api-port>`** (or whatever ports the running dev stack uses — verify with `curl -s -o /dev/null -w "%{http_code}\n"`).

Test against production ONLY when explicitly asked, or when the test is about deployed-experience verification (e.g. "does the ad-to-landing flow work on the real site").

## Test accounts and login — institutional knowledge

**Existing login skill (source of truth):** [`/<your-app>-local-login`](~/.claude/skills/<your-app>-local-login/SKILL.md)

**Pre-existing test account (logged-in walks):**
- Email: `<yourname>@gmail.com`
- Password: `<your-test-password>`
- Local: open `http://localhost:3000/dev/auto-login` to skip the form
- Production: use the form

**New test account (signup-flow walks ONLY):**
- Format: `yourname+<unix-timestamp-or-random-digits>@gmail.com` — e.g. `<yourname+1715537281>@gmail.com`
- Why: Gmail plus-aliasing → emails actually arrive in the user's inbox so the user can verify what the system sends. Trivially cleanable via regex query on the `email` field.
- NEVER use synthetic test domains like `*@ixtest.dev`, `*@example.com`, etc — they create noise and the user can't observe the emails.
- Password convention: use the standard test password above OR a memorable variation noted in the test run.

**Cleanup query** (for the user, after testing):
```js
db.users.deleteMany({ email: /^yourname\+\d+@gmail\.com$/i })
```

## How a single walk is structured

One user. One path. One watch. Drive coaching with a persona from `~/.claude/skills/critique-from-target-audience/personas/`. The persona reacts authentically each turn — no canned test strings. Hit the code-change-relevant moment (e.g. the gate threshold), observe what happens, continue past it (reject pitch, continue coaching, fill survey, try circumvention). Cohort matrix only enters the **retrospective** report, not the plan.

## Anti-patterns (from prior failures — see source doc)

- Do NOT use auto-browser / noVNC
- Do NOT use Playwright `--headed` for human watching
- Do NOT chain `sleep` commands to pace the walkthrough — harness blocks long sleeps. **Plow through. Overlay log accumulates. The user scrolls.**
- Do NOT auto-login or pre-seed the session when testing new-user flow
- Do NOT skip `isolatedContext` — cookie bleed corrupts the test
- Do NOT use `navigate_page` with persistent connections (Stripe/Pusher) open — use `evaluate_script` + `window.location.href` + `wait_for`

---

## 🔧 Agent tools — continue-test + side-panel overlay

### Resume from checkpoint

**Checkpoint file shape** (`/tmp/founder-watch-checkpoint-<slug>.json`):
```json
{
  "slug": "legacy-trial-gate-fix-validation",
  "isoTimestamp": "2026-05-12T15:55:00Z",
  "url": "http://localhost:3000/dashboard/6a0000000000000000000b01",
  "sessionId": "6a0000000000000000000b01",
  "testAccount": "<yourname+1778626112>@gmail.com",
  "lastUserMessageCount": 6,
  "lastCoachReplyPreview": "Given your offerings and instincts, it might be useful to explore the perceived value...",
  "recordingPath": "~/Desktop/founder-watchable-walk-2-1778626112.mov",
  "goal": "Drive Angela to msg 16 to verify legacy-trial gate fires per checkUsage.js",
  "personaName": "angela-overwhelmed-business-builder",
  "overlayMode": "top-right" | "side-panel",
  "isCohort": "LEGACY_TRIAL_ACCESS"
}
```

**Resume protocol:**
1. Read checkpoint JSON
2. Clear stale Chrome MCP profile lock (NOT the whole profile — we want the auth cookies to survive)
3. `mcp__chrome-devtools__new_page({ url: checkpoint.url, isolatedContext: checkpoint.slug })` — the URL navigates directly to the in-progress coaching session
4. Take snapshot — confirm coaching surface loaded with prior messages visible
5. Re-inject overlay (same mode as checkpoint.overlayMode), log "RESUMED from checkpoint at msg N"
6. Start new recording with `-resume-` in filename so it doesn't overwrite the original
7. Continue driving the persona from message N+1

**Checkpoint write convention:** After every coach reply renders successfully, write/overwrite the checkpoint file via `evaluate_script` calling `fetch('/dev/checkpoint-write', ...)` — OR via the agent's own `Write` tool. Simpler: agent writes after every Angela turn that gets a coach reply.

### Side-panel overlay (alternative to top-right)

When the user requests "side-panel overlay so I can see the full UI", use this injection instead of the default top-right glass panel. **It modifies ONLY the injected DOM and a single inline style on `document.body` — zero changes to your app's source files.**

```js
() => {
  if (window.__agentOverlay) return 'already';

  // Compensate body width so the app UI shrinks to fit
  const SIDEBAR_WIDTH_PX = 460;
  document.body.style.width = `calc(100vw - ${SIDEBAR_WIDTH_PX}px)`;
  document.body.style.marginRight = `${SIDEBAR_WIDTH_PX}px`;
  document.body.style.boxSizing = 'border-box';
  document.body.dataset.agentSidePanelActive = '1';  // marker for cleanup

  const panel = document.createElement('div');
  panel.id = '__agent-overlay';
  panel.style.cssText = [
    'position:fixed','top:0','right:0',
    `width:${SIDEBAR_WIDTH_PX}px`,'height:100vh',
    'overflow-y:auto','z-index:2147483647','padding:18px 20px',
    'background:rgba(15,17,22,0.95)','color:#e8eef7',
    'border-left:1px solid rgba(255,255,255,0.12)',
    'font:13px/1.5 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif',
    'box-shadow:-12px 0 40px rgba(0,0,0,0.45)','pointer-events:auto',
    'box-sizing:border-box',
  ].join(';');
  panel.innerHTML = '<div style="font-weight:600;margin-bottom:12px;font-size:14px;opacity:.85">Agent log — side panel</div><div id="__agent-log"></div><button id="__agent-overlay-dismiss" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.08);border:0;color:#e8eef7;padding:4px 8px;border-radius:6px;font-size:11px;cursor:pointer">close</button>';
  document.documentElement.appendChild(panel);

  // Dismiss removes BOTH the panel AND the body style — the app UI returns to full width
  document.getElementById('__agent-overlay-dismiss').onclick = () => {
    document.body.style.width = '';
    document.body.style.marginRight = '';
    document.body.style.boxSizing = '';
    delete document.body.dataset.agentSidePanelActive;
    panel.remove();
    window.__agentOverlay = false;
    delete window.__agentLog;
  };

  const ICONS = { thinking: '🧠', acting: '👉', pass: '✅', fail: '❌', info: 'ℹ️', finding: '🔍', persona: '👤', target: '🎯', resume: '⏯️' };
  window.__agentLog = (text, status = 'info') => {
    const log = document.getElementById('__agent-log');
    if (!log) return;
    const row = document.createElement('div');
    const t = new Date().toLocaleTimeString([], { hour12: false });
    row.style.cssText = 'padding:10px 0;border-top:1px solid rgba(255,255,255,0.07)';
    row.innerHTML = '<div style="opacity:.5;font-size:11px;margin-bottom:3px">' + t + '</div><div>' + (ICONS[status] || 'ℹ️') + ' ' + text + '</div>';
    log.prepend(row);
  };
  window.__agentOverlay = true;
  window.__agentLog('Side-panel overlay active. App UI compressed to leave 460px sidebar. Click "close" top-right to restore full width.', 'info');
  return 'side-panel installed';
}
```

**Validation before relying on side-panel:** Take a snapshot after injection, confirm the dashboard buttons (Start New Session, Login, intent buttons, send button) are still clickable and the textbox is still focusable. If any of those return errors, dismiss the overlay and fall back to top-right mode.

## 🗺️ Supersession map — prior skills moved out of auto-load, kept as Obsidian reference

**As of 2026-05-12:** 14 previously-auto-loaded skills were moved to `<api-repo>/docs/intent/Intent-Map/quality-testing/browser-testing/superseded-skills/` in the Obsidian intent vault. They are NO LONGER auto-loaded by the Claude Code harness — they reclaim context-window budget. They remain fully accessible by `Read` tool or by clicking the `obsidian://` link below.

**When to read a superseded skill:** Only if the *specific legacy reason* in the third column matches your situation. Otherwise, use THIS canonical.

### Fully superseded — read on demand only

| Legacy skill (now in Obsidian) | What it did | When to still read it |
|---|---|---|
| [agentic-chrome-testing](obsidian://open?vault=<their-vault-name>&file=Intent-Map%2Fquality-testing%2Fbrowser-testing%2Fsuperseded-skills%2Fagentic-chrome-testing&newtab=true) | Chrome via AppleScript OR Playwright | **Almost never.** Read only if explicitly asked for AppleScript-driven Chrome WITHOUT MCP. |
| [connect-chrome](obsidian://open?vault=<their-vault-name>&file=Intent-Map%2Fquality-testing%2Fbrowser-testing%2Fsuperseded-skills%2Fconnect-chrome&newtab=true) | Chrome with gstack live feed | **Never for testing.** Read only for generic Chrome non-test browsing with observability. |
| [devtools-site-testing](obsidian://open?vault=<their-vault-name>&file=Intent-Map%2Fquality-testing%2Fbrowser-testing%2Fsuperseded-skills%2Fdevtools-site-testing&newtab=true) | Chrome DevTools MCP for sites | **Never separately.** This canonical IS the DevTools MCP workflow with overlay + recording + checkpoint + persona on top. |
| [test-actual-ux](obsidian://open?vault=<their-vault-name>&file=Intent-Map%2Fquality-testing%2Fbrowser-testing%2Fsuperseded-skills%2Ftest-actual-ux&newtab=true) | Real UX checks with DevTools | **Never.** Verbatim subset of this canonical. |
| [webapp-testing](obsidian://open?vault=<their-vault-name>&file=Intent-Map%2Fquality-testing%2Fbrowser-testing%2Fsuperseded-skills%2Fwebapp-testing&newtab=true) | Playwright for local web apps | **Only** for headless CI automation — never for watchable walks. |
| [playwright-validator](obsidian://open?vault=<their-vault-name>&file=Intent-Map%2Fquality-testing%2Fbrowser-testing%2Fsuperseded-skills%2Fplaywright-validator&newtab=true) | Playwright via MCP for screenshots | **Only** for UX-assignment screenshot collection where no human is watching. |
| [playwright-e2e](obsidian://open?vault=<their-vault-name>&file=Intent-Map%2Fquality-testing%2Fbrowser-testing%2Fsuperseded-skills%2Fplaywright-e2e&newtab=true) | Generic Playwright e2e patterns | **Only** for repeatable headless regression suites. |
| [autonomous-app-testing](obsidian://open?vault=<their-vault-name>&file=Intent-Map%2Fquality-testing%2Fbrowser-testing%2Fsuperseded-skills%2Fautonomous-app-testing&newtab=true) | Self-healing autonomous tests | **Never for watchable.** Read only if no human is in the loop AND you need full autonomy. |
| [validate-in-browser](obsidian://open?vault=<their-vault-name>&file=Intent-Map%2Fquality-testing%2Fbrowser-testing%2Fsuperseded-skills%2Fvalidate-in-browser&newtab=true) | Reusable browser validation orchestrator | **Never separately.** Decompose → preflight → run → cross-verify is folded into this canonical. |
| [feature-completion-ux-test](obsidian://open?vault=<their-vault-name>&file=Intent-Map%2Fquality-testing%2Fbrowser-testing%2Fsuperseded-skills%2Ffeature-completion-ux-test&newtab=true) | End-to-end after a ship | **Never.** This canonical handles end-to-end better with checkpoint resume. |
| [pre-ship-ux-scan](obsidian://open?vault=<their-vault-name>&file=Intent-Map%2Fquality-testing%2Fbrowser-testing%2Fsuperseded-skills%2Fpre-ship-ux-scan&newtab=true) | Pre-production UX scan suite | **Only** if goal is automated CI regression check, NOT a watchable walk. |
| [agent-ux-verification](obsidian://open?vault=<their-vault-name>&file=Intent-Map%2Fquality-testing%2Fbrowser-testing%2Fsuperseded-skills%2Fagent-ux-verification&newtab=true) | Screenshot evidence for UX assignments | **Only** for UX-assignment artifact collection without a watcher. |
| [agentic-ux-verification](obsidian://open?vault=<their-vault-name>&file=Intent-Map%2Fquality-testing%2Fbrowser-testing%2Fsuperseded-skills%2Fagentic-ux-verification&newtab=true) | UX screenshots without verification status | Same — UX-assignment artifact mode only. |
| [ux-evidence-testing](obsidian://open?vault=<their-vault-name>&file=Intent-Map%2Fquality-testing%2Fbrowser-testing%2Fsuperseded-skills%2Fux-evidence-testing&newtab=true) | (self-described as canonical-in-testing) | **Subsumed.** This canonical IS the live-watch + evidence + recording superset. |

**To read content of a superseded skill from an agent context:** Use `Read` tool with path `<api-repo>/docs/intent/Intent-Map/quality-testing/browser-testing/superseded-skills/<name>.md`

### Adjacent — different surface, keep both, use this canonical's references to find them

| Legacy/adjacent skill | What's different | When to use the adjacent one |
|---|---|---|
| `validate-against-live-data` | Validates code against real prod data (queries, not browser) | When the question is "does the data match the code" — no browser needed |
| `<your-app>-local-login` | Source of truth for login credentials | Always — this canonical points at it |
| `intent-lifecycle`, `intent-db`, `intent-validation-engine` | UX intent contracts and validation | When you're working WITH intents, not driving a browser walk |
| `verify-ux-assignment-state` | Per-assignment state verification | When you specifically have UX assignments to verify |
| `ux-testing-learnings` | UX testing learnings DB | When logging or searching past UX learnings |
| `ux-assignment-reasoning-protocol` | Required reasoning before UX assignment creation | When creating UX assignments, not walking |
| `agent-outcome-summary` | End-of-task outcome reports | When summarizing after a walk completes |

### Mechanism — how supersession actually reclaims context-window budget

The Claude Code harness scans `~/.claude/skills/*/SKILL.md` at every session start. Each match auto-loads as a skill registration in the agent's context, consuming budget per invocation. Removing the `SKILL.md` file from that path = removing from auto-load. The file content is preserved by relocating it; agents `Read` it on demand when a specific legacy reason applies.

**What was done (2026-05-12):** All 14 superseded `SKILL.md` files were moved to `<api-repo>/docs/intent/Intent-Map/quality-testing/browser-testing/superseded-skills/<name>.md` in the Obsidian intent vault. The original `~/.claude/skills/<name>/` directories were removed (where empty) or stripped of `SKILL.md` (where they contained other content). Next session start, the harness will not surface them. Context budget reclaimed: estimated ~10-30KB per session, plus 14 fewer "which one is the right one?" decision points.

**Reversal:** If a superseded skill needs to return to auto-load, copy `superseded-skills/<name>.md` back to `~/.claude/skills/<name>/SKILL.md`. One command, fully reversible.

---

## Related canonical references

- Source-of-truth recipe: `<api-repo>/docs/intent/Intent-Map/quality-testing/browser-testing/founder-watchable-funnel-walkthrough.md`
- Followup audit: `/discoverability-audit-learnings-findable-by-agents` (run after first successful walkthrough)
- Memory: `project_legacy_trial_gate_test_followups.md`
- Related skills (route here, not the other way around): `/agentic-chrome-testing`, `/devtools-site-testing`, `/feature-completion-ux-test`
