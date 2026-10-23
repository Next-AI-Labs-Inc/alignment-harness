---
skill: trace-the-ux
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 12
seconds: 195
---

## What Dana asked
Walk me through what a customer actually experiences in acme-billing when they sign in and their invoice gets generated. Customers are saying some invoices show the wrong total, so stop at the first place it goes wrong.

## What happened
The agent printed the coherence check, then searched memory once (a hook required this before code search) and moved on. It read auth.js, invoices.js, pricing.js, the README and the test, then ran a small script against the real pricing code. It printed the "UX_Trace" banner and told one continuous story: sign-in access check, invoice built from plan and seats, annual price multiplied by 10. Each story paragraph was followed by a one-line code address, with certainty dots and IDs. It stopped at the first break: "it's asking 'is this value here anything at all'", so a string "false" for the annual flag bills ten months instead of one (1800 instead of 180). It said plainly "I haven't seen where `sub.annual` actually comes from", marked that claim low certainty, and ended with the quick-commands list.

## Function: works
It followed the skill's format (two-track paragraphs, single break point, separate claims with dots and IDs, quick commands) using only Dana's repo, and it reproduced the bug by running the code. Minor slip: it marked its own reproduced claim as green (100%), though the skill says only the human confirms green. No account-skill noise or author-world leakage.

## Setup path: no-setup-path
The skill needs nothing that could be missing. The only conditional is "If you have a `/translate` skill... this plugin does not ship one", and the skill states the discipline inline, so nothing stalls. `/align` and `/speak-human` exist in the plugin.

## Proposed fix
None.
