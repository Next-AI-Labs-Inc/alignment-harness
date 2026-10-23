---
skill: verification-gate
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 9
seconds: 77
---

## What Dana asked
Can you trace how discounts flow from src/pricing.js into src/invoices.js in acme-billing and write me a short summary with file:line citations? I am pasting it into a design doc, so every citation needs to be accurate.

## What happened
The agent opened with a coherence check saying it would "read both files directly, trace the actual call path, then run the verification-gate protocol (file exists → line exists → line content matches claim) on every citation before publishing." It checked line counts with `wc -l`, read both files, then grepped for "discount" and found nothing. A plugin hook asked it to search memory first; it ran the plugin's memory search (which only returned the current session) and then repeated the grep. Its final answer began with the required "VERIFICATION GATE RESULT" block (4 citations, 4 verified, 0 dropped, no fabrications). It then said plainly: "there is no "discount" concept in this codebase", and pointed to the annual-billing multiplier (`ANNUAL_MONTHS_CHARGED = 10` at src/pricing.js:3) as the closest thing, with the invoice call site cited too. A stop hook asked about tasks; the agent replied that no requirement needed tracking and offered to search for a coupon feature. Account-skill noise: none seen.

## Function: works
It produced the gate's required result prefix, kept only citations that matched real lines in Dana's files, and caught that her premise (a discount feature) did not match the code, which is the honest outcome the skill exists to protect. Verification was done mostly by reading the files and line counts rather than running each per-citation shell check, but the result was correct.

## Setup path: no-setup-path
The SKILL.md only needs the project's own files and standard shell tools. It mentions agent_find only as an example of a retrieval tool ("or whatever institutional-memory/code-search tool you use"), so nothing it relies on can be missing. The one gap is the line about compaction/intent-DB citations "need a separate corpus-validity check", which describes a limit of the gate and not a setup step.

## Proposed fix
None.
