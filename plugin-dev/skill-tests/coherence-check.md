---
skill: coherence-check
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 10
seconds: 111
---

## What Dana asked
Our invoices in src/invoices.js are coming out a cent off whenever a discount is applied, and I think it is the rounding in src/pricing.js. Can you find where it goes wrong and fix it, and also tidy up the auth.js token check while you are in there?

## What happened
The agent first tried a Bash call to list the repo. The plugin's pre-tool hook stopped it once with "WAIT — search memory first (once per session)", so it ran agent_find, then read pricing.js, invoices.js, auth.js, the test file and the git log. It then printed a full COHERENCE_CHECK with every section (intent with certainty %, what she wants, calibration, communication style, new scope, governer decision, pending scope, ANY_NEW_SCOPE_INDICATED = TRUE). The check caught that her premise did not match the code: "zero matches, anywhere" for "discount", integer-dollar math in `priceFor`, and no token logic in auth.js. It declined to invent a patch ("I'd rather tell you that now than invent a plausible-looking patch"), listed the two grievances with quotes, said why it skipped the governer (no edit to gate), and ended by asking her for the right branch or the discount code. The run finished in 10 turns with no errors. It printed a line of text before its first tool call and put the check after the reading, not as the very first output of the reply. The agent_find results also surfaced the session's own slash-command invocation as a past session hit, which is harmless.

## Function: works
It did the skill's real job: a per-message header that shows her what it understood and caught a misunderstanding (the bug does not exist in this repo) before any edit. The ordering (investigate, then header) bends the "first thing in your reply" rule slightly, but the header was complete and specific to her message.

## Setup path: no-setup-path
The skill needs nothing that can be missing. The only fallback is "If < 60%, search memory for context", which the harness answers with its own agent_find tool, and the skills it references (/governer, /decompose, /how-to-talk-like-the-founder) all ship in the plugin. The Enforcement section only lists config switches.

## Proposed fix
None.
