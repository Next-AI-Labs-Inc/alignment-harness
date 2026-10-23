---
skill: instinct-harvest
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: asks-to-configure
setup-path: mixed
turns: 19
seconds: 208
---

## What Dana asked
I've got six past Claude Code sessions on my acme-billing repo where I confirmed or corrected a few of the agent's plans. Can you go through them and pull out what they say about how I like to handle pricing and invoice changes, so future agents lean the right way?

## What happened
The agent printed the skill header, did the harness coherence check and governer scoring, then listed the plugin's scripts and Dana's six transcript files and read all six. It ran the extractor and mining-status scripts and found no check pairs in her six sessions. The only pair captured was the coherence check from the test session itself. It then stopped before writing anything and said: "It found **zero** formal check-pairs in the six past sessions you meant." It showed a table of the four pricing/invoice sessions with Dana's replies (for example the reply about changing the test to match the bug), proposed three instincts (fix the code not the test; run tests before saying a fix is done; no drive-by renames in a pricing refactor), and asked: "Want me to go ahead and file those three, or would you rather see them written out first before anything hits the ledger?" Nothing was written, so the ledger stayed empty. No account-skill noise and no leakage of anyone else's data.

## Function: asks-to-configure
The skill's pipeline needs check-and-reply pairs that Dana's history does not have. The agent said so plainly and offered to build the instincts from her plain corrections in those sessions, with consent, as a deliberate deviation. It did not wait on her to produce material. The offer came from the agent's own judgment, not from the SKILL.md, and the extractor's own session capture slightly muddied the "what was found" count.

## Setup path: mixed
"Starting with nothing yet" (SKILL.md) tells the agent to run the extractor and, if nothing turns up, say "there's nothing to mine yet — this fills in as you use checks and confirm or correct them." That is a dead-end: it waits for the person to generate material when past sessions already hold plain corrections and confirmations. Other paths are fine: Step 2 logs unanswered pairs for batch confirmation (a judgment ask), health reports "waiting for input" honestly, and the voice calibration skill it points to exists in the plugin. The domain-layer note is optional and describes a short file, not an ask.

## Proposed fix
In "Starting with nothing yet", replace item 2 with: "If the extractor finds no check pairs, say so plainly, then offer once: 'Your past sessions have no formal checks, but they do hold your plain corrections and confirmations (for example a reply like "fix the code, not the test"). Want me to mine those instead?' On a yes, read the person's own messages and the agent message right before each one from `~/.claude/projects/*/*.jsonl` (user entries whose content is text), keep only replies that correct or confirm something the agent just did, write proposed items from them with the provenance line 'seeded from a plain reply, not a formal check', run `verify-instinct-quotes.js`, and show the items to the person for a yes or no before any are marked confirmed. The ledger still says 'no ledger yet (collecting)' until they say yes." Also add `--exclude-current-session` (or have the agent note) so the running session's own check is not counted as history.
