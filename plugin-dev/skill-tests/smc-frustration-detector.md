---
skill: smc-frustration-detector
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 20
seconds: 168
---

## What Dana asked
I keep getting short with Claude when it reworks the tests around src/pricing.js in acme-billing the wrong way, and I'd like to catch that pattern. Can you set up something that notices when I'm getting frustrated in my messages and logs it for me?

## What happened
The agent read the reference script, ran `calibrate` against Dana's own past sessions ("Scanned 14 of your own past messages across 7 session file(s). Suggested baseline: 0.1429"), and set that baseline. It copied the script into `acme-billing/.claude/hooks/`, wrote a `UserPromptSubmit` hook into `.claude/settings.json`, and ran the skill's own verify loop: six frustrated test messages produced exactly one `FrustrationSpikeDetected` event, which it then cleaned up. Its summary said "Verified it fires" and warned "The baseline is thin" (14 messages) and that the detector is topic-blind, so it cannot single out pricing.js. One early tool call was blocked by the harness coherence gate and had to be retried; that is harness behaviour, not this skill. It also wrote two memory notes Dana did not ask for. No author-world data was used.

## Function: works
It did the real job for Dana's repo: calibrated from her own history, wired the hook, proved it fires once per session, and was honest about the thin baseline and the topic-blindness. It did not ask for consent before editing settings.json, but the request was an explicit "set something up".

## Setup path: mixed
Baseline is handled well: the skill says to run `calibrate`, which mines the person's own past sessions, and it states plainly that it runs observe-only until a baseline is set (no silent dead end). But the skill is written as instructions to the person ("you decide whether and where to run it", "edit the marker list in the script to match how you actually write", "add a call to check mode from your project's hook") and never tells the agent to offer to do the wiring or the marker tuning itself, with consent, from sources it can reach. The wiring snippet (`cat "$HOOK_INPUT_JSON" | ...`) is also misleading, since hook input arrives on stdin. The agent worked around both, but only because the request was explicit.

## Proposed fix
Replace the "Wiring it in" and "Markers" instructions with agent-directed text:

"If the person asks for this (or agrees when you offer), do the setup yourself, asking consent once before editing any settings file. (1) Run `calibrate` (it reads their own past Claude Code sessions for this project) and show the suggested baseline and message count; on approval run `set-baseline`. If fewer than about 30 messages, say it is thin and offer to recalibrate later. (2) Copy `scripts/frustration-detector.js` into the project's `.claude/hooks/` and add a `UserPromptSubmit` command hook in the project's `.claude/settings.json` (merge with any existing hooks) that runs `node "$CLAUDE_PROJECT_DIR/.claude/hooks/frustration-detector.js" check`. The hook payload arrives on stdin, so do not pipe a file into it. Show the diff before saving. (3) To tune markers, scan the person's own past messages (`~/.claude/projects/*/*.jsonl`, user text entries only) for repeated annoyed phrases, show the top candidates, and ask them to keep or drop each (a yes/no judgment, not writing a list). (4) Run the To Verify loop and report the result, then delete the test event."
