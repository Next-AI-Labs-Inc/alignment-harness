---
skill: nested-intent2
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 13
seconds: 206
---

## What Dana asked
I want to overhaul how acme-billing handles pricing, invoicing and auth: move to usage-based tiers, rework invoice generation, and tighten auth before our SOC2 audit. Can you turn this into a nested intent map so I can hand the pieces to subagents?

## What happened
The agent first surveyed the repo, then the harness's coherence gate made it state its understanding ("COHERENCE_CHECK") and run the governer score (27/100) before it read `src/auth.js`, `src/pricing.js` and `src/invoices.js`. It then wrote a map in the skill's shape: a "My world" block (Noticing, Sensing, Imagining, My intent), a top-level intent, three initiatives with sub-goals, two cross-cutting intents, insights and quick commands. Nodes carried dot, ID and percentage, and the paragraphs were grounded in Dana's real code, for example "Today the entire auth surface is one function, `canViewAccount`". It handed uncertainty back rather than inventing it, such as "the actual SOC2 control scope doesn't exist anywhere in this conversation or this repo yet", and it carried her CLAUDE.md rule about asking before changing pricing behaviour into a cross-cutting node. It said plainly that no voice samples and no principles oracle were available and wrote in neutral prose. It did not run a memory search because top-level certainty was 90%. It never called the Skill tool for `nested-intent2`, and the "Nested_Intent_Mapping_Initiated" banner did not appear in the transcript. The run ended normally at 13 turns, with no author-world leakage and no account-skill noise.

## Function: works
It produced the full nested intent map from Dana's real repo, at the altitude the skill asks for, with honest certainty levels and unconfirmed items handed back to her. The missing opening banner is a small miss.

## Setup path: mixed
The institutional-memory path passes because it falls back to grep, git log and the person's own past sessions, and says plainly when nothing turns up. The principles oracle is optional and says to state that it was skipped, which is acceptable. The voice path fails: "If no samples exist yet, write in plain, neutral prose instead... and say so at the top of the map" states the gap and continues without offering to build samples from her past sessions, so it is a dead-end. The memory-search threshold also points to "the local fallback described above" before the fallback is described further down.

## Proposed fix
In "The person's own voice (if calibrated)", replace the sentence beginning "If no samples exist yet, write in plain, neutral prose instead..." with:

"If no samples exist yet, offer once: 'I can pull a few of your own messages from your past Claude Code sessions so the map sounds like you. OK?' On a yes, read `~/.claude/projects/*/*.jsonl`, keep only `type: "user"` entries whose content is text (not tool results), pick the 5 to 8 longest and most representative, show them, and use them once she confirms. Only if she declines, or there are fewer than 3 usable messages, write in plain neutral prose, lower the percentages, and say at the top of the map that no voice samples were available. Never imitate a voice you haven't actually seen."

Also change "the local fallback described above" in the Thresholds section to "the local fallback described under Enrichment tools".
