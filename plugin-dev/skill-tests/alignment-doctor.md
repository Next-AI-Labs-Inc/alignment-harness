---
skill: alignment-doctor
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 4
seconds: 70
---

## What Dana asked
I am working in ~/work/acme-billing on the pricing.js rounding bug. Can you run the alignment doctor and tell me whether memory search actually got injected on my last turn, and if not why?

## What happened
The first Bash call (the skill's script) was blocked by the coherence gate hook. The agent printed COHERENCE_CHECK, stated its understanding at 95% ("a read-only diagnostic, not a request to touch `pricing.js` yet"), attested, and re-ran the script. The script printed "No memory-search event has been recorded on this install", followed by the two-branch explanation (configured vs not configured) and the pointer to /alignment-harness:harness-setup. The agent then printed the skill's closing block verbatim. It did not check whether a memory-search command was configured, did not say which branch applied to Dana, and did not offer to set one up. No account-skill noise observed.

## Function: needs-setup-no-offer
The skill ran correctly and gave an honest "no event" answer with a reason, but Dana is left to work out for herself which branch applies and to go run harness-setup on her own. The agent never offered to connect memory search for her.

## Setup path: mixed
The "no memory-search event" path tells the person to inspect the config path themselves and, if nothing is configured, to run another skill or carry on without it; it does not delegate the check or the setup, and the closing text says "name it and I'll add a check here", which asks the person to supply the work. The "no telemetry log" path simply states the fact and stops (dead-end). Pointing at harness-setup is acceptable only if that skill itself delegates; this skill does not make the offer.

## Proposed fix
Replace the two hand-off lines inside the "no memory-search event" branch (and add a line after the "no telemetry log" message) with an instruction to the agent, printed after the script output:

"After the output above, run `alignment-harness config path` and read `understanding.memorySearchCommand` yourself. If it is empty, tell the person plainly that memory search is not connected on this machine, and offer once: 'Want me to connect it? I can index your past Claude Code conversations (~/.claude/projects/*/*.jsonl, your messages only) and your repo's README and git log, using scripts/memory-search.js, and show you a sample search before saving anything.' On a yes, follow /alignment-harness:harness-setup's memory-search step and show the result for approval. If it is set, say the command is configured and ask her to send one message of 3+ words, then re-run this check. For the 'no telemetry log' case, say the plugin has not recorded a turn yet and offer to re-run after her next message." Also change the closing line "name it and I'll add a check here" to "tell me which protocol and I'll look up how it is logged and add the check myself."
