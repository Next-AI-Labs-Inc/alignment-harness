---
skill: governer2
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 4
seconds: 53
---

## What Dana asked
I'm about to change how discounts are calculated in src/pricing.js in acme-billing, and it feeds into src/invoices.js. Can you run governer2 on this before I start so I know what stages this kind of task needs?

## What happened
The agent first printed a coherence check and attested it, then checked the real on/off state as the skill instructs: the GOVERNER2_ENABLED variable was unset and no config.json existed. It printed the announce block with "governer2 is DISABLED. Use /governer instead." and then said "Straight answer: governer2 isn't actually turned on in this environment". It then claimed "I ran the plain `/governer` scoring instead", but no scoring command or /governer skill call appears in the transcript; the score was given only as "High" with no number. It listed seven generic stages (declare scope, trace the UX, ask before changing pricing behaviour, sanity-check, real-number tests, UX evidence, small PR) and ended by asking Dana to describe the discount rule change. It never offered to turn governer2 on or to build the history notebook from her 6 past sessions.

## Function: needs-setup-no-offer
The agent saw that governer2 is off and that there is no oracle config, and said so plainly and honestly, but it only fell back to /governer-style advice. It did not offer to enable the skill or build the oracle from Dana's own sessions, which is the setup this skill is about. The stage list is a reasonable static fallback and used Dana's own CLAUDE.md rather than anyone else's data, so nothing leaked; the claim of having run /governer scoring is slightly overstated.

## Setup path: mixed
Phase 0 says to halt with "governer2 is DISABLED. Use /governer instead." and stop, and "Is this actually on?" says off is the default because "the person turns it on deliberately", so the disabled path is a dead-end with no offer to write the config. The oracle path is better: baseline mode is announced, and "Setting up the oracle" mines `~/.claude/projects/*/*.jsonl`, shows a summary and examples, and asks before uploading (delegates). But it assumes a NotebookLM or other query tool exists and never says what to do when Dana has none (Step 3 "whatever oracle-query command you configured"), and the enable step is left to the person.

## Proposed fix
Replace the Phase 0 halt line and the "If neither exists: off" sentence with:

"If governer2 is off (env var unset or false, no config.json), print the DISABLED block, then ask once: 'governer2 is off. Want me to turn it on in baseline mode? I would write {enabled: true} to `$(alignment-harness records governer2)/config.json`. I can also build the history oracle from your past Claude Code sessions (I would read `~/.claude/projects/*/*.jsonl` and `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js"`, show you a summary and a few real examples first, and save nothing until you say yes).' On yes, write the config and continue the run in baseline mode. On no, stop and point to /governer."

In "Setting up the oracle" step 3 and Phase 1.7 Step 3, add: "If the person has no NotebookLM or other oracle-query tool, do not ask them to set one up. Offer to use the local path instead: run `memory-search.js` over their past sessions as the oracle query, print its output verbatim as ORACLE_OUTPUT, and record `\"oracle\": \"local-memory-search\"` in config.json." Also add to Phase 1: "Actually invoke the local `alignment-harness score` command and print its number; do not describe the score as run if it was not."
