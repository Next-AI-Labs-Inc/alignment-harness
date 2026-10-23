---
skill: agent-debug
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 7
seconds: 121
---

## What Dana asked
Claude keeps acting like it forgot my CLAUDE.md rules when I work in acme-billing. Can you turn on debug mode and show me what is actually shaping you before you answer, then tell me what src/pricing.js does?

## What happened
The agent opened with "I'll run the actual diagnostic checks the skill calls for, then read the file you asked about" and ran `alignment-harness paths`, which worked and printed Dana's own sandbox data folder. Two of its read-only diagnostic Bash calls (the telemetry tail and `alignment-harness status`) were then blocked by the plugin's pre-tool gates (one "search memory first" nudge, one "coherence check not completed" block). It did not fake a certainty number to get past the gate, so it never got the telemetry or status output. It still printed the full diagnostic block (sections 1 to 7): hook fired on the substantive path, governer "none — unscored", 6 system reminders listed, ghost injections listed with their source hook, no auto-loaded skills, and Dana's 4-line global CLAUDE.md loaded with no repo-level CLAUDE.md. Under "Anything unexpected" it said the pre-tool gate "blocked plain read-only commands" by treating them as changes. After the rule line it answered her real question: it read `src/pricing.js` and explained the plan prices and the annual "10 months for 12" rule. It concluded her CLAUDE.md was not being dropped, just crowded by the harness's per-message text. (Its closing note says it saved a project memory, but no write appears in the transcript.)

## Function: works
It printed the diagnostic block before the reply, grounded it in what it actually saw in context (real reminders, real injected tags, real file presence), was honest where its checks were blocked, and then answered the pricing question about Dana's own repo. No use of anyone else's data.

## Setup path: no-setup-path
The skill only reports state. Its fallbacks (binary not on PATH, telemetry file missing, memory search not configured) all say to report the absence plainly, which is the point of a diagnostic, and it needs nothing Dana would have to supply. One weak spot: if `alignment-harness` is not on PATH and the session-start message gave no path, the skill has no further step, but that is an edge case rather than a setup gap.

## Proposed fix
None. (Separate from the skill text: the pre-tool coherence gate blocked this skill's own read-only `tail` and `alignment-harness status` checks. That is a hook issue worth a look, since it stops the skill from filling in checks 1 to 3.)
