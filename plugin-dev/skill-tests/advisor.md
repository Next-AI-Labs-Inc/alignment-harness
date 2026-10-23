---
skill: advisor
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 18
seconds: 397
---

## What Dana asked
I've had a few Claude Code sessions going on acme-billing this week and I've lost track of where things stand. Can you brief me on what my recent sessions were working on and which ones still need attention?

## What happened
The agent read the skill's utils.py, then sent a Haiku subagent to run the session-scan script. That came back empty because the coherence hook blocked the call. The agent noticed ("That came back empty, which is surprising given the session history"), checked that 7 transcripts really exist, printed its coherence check, and tried to run the scan itself. That failed because the sandbox has no python3. It then read the six small transcripts directly and checked each one against the real code (pricing.js, invoices.js, auth.js, the test file) and ran the test. Its final briefing opened with "One honest flag before the briefing: none of these 6 sessions are actually from this week", since the dates were June to July. It gave a per-session table with verdicts checked against the code, and named the enterprise invoice session as the one worth worrying about because "'fixed' was asserted without test proof and still has no test proof today". It did not record anything without asking: "I'm not recording these as tracked follow-ups automatically — say the word". It ended with a NEXT 6 list as the skill requires. No account-skill noise.

## Function: works
It produced a real, evidence-based briefing of Dana's own sessions and repo, avoided calling missing compactions "incomplete", asked before recording, and used nothing from outside her machine. It worked by improvising around two breakages (the subagent hook block and the missing python3), not by following the skill's script.

## Setup path: mixed
The compaction-record lookup is a good local fallback: it reads `alignment-harness records compactions`, treats "none" as normal, and needs no setup. That part is fine. But the scan and scoring steps hard-require `python3` with no fallback or instruction to tell the person, and line 508 still says to use a "Compaction API" with `?fields=...`, which a new user does not have.

## Proposed fix
1. Under "Orchestrator Step 1", add: "If `python3` is not installed (`command -v python3` fails), do not stop and do not ask the person to install it. Run the same scan in Node instead: read `~/.claude/projects/*/*.jsonl`, keep the person's own text messages (`type: user`, not sidechain, not starting with `<`), and report uuid, age, message count, first message as intent and last message. Say once that you used the fallback."
2. Replace the Rules line "Compaction API: always use `?fields=scopeDeclaration.intent,title` — never fetch the full document" with "Compaction records: read only the intent and title fields from the local record (`alignment-harness records compactions`); if this project has its own tracking system, fetch only those two fields from it."
