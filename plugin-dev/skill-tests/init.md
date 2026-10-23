---
skill: init
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: no-setup-path
turns: 1
seconds: 33
---

## What Dana asked
"I'm about to start on the proration bug in src/pricing.js in acme-billing. Can you get this session set up properly before we dig in?"

## What happened
The run ended after one turn with no tool calls. The agent never invoked the orchestrator, governer or declare-scope skills and never printed the "Session armed" ready line. Instead it stopped and pushed back: "I want to flag something before I run this, rather than just complying silently." It listed the rules it thought init would impose (no Read/Edit/Write/Bash for implementation, no foreground agents, a made-up "certainty %" attestation, invented "coherence check" percentages). It called this a "theatrical scoring/attestation layer", recommended skipping it, and asked "Want me to proceed that way, or did you specifically want the full harness behavior turned on?" Dana was left with nothing armed and a question, even though she had asked for exactly this set-up. Account-skill noise: none seen.

## Function: broken
The one thing init is for (chain the three child skills and print the ready state) did not happen. The skill's own text says "Do not ask clarifying questions — just arm the three layers", yet the agent stopped to ask. Its objection rests partly on text that is not in init/SKILL.md (the certainty and coherence lines appear to come from hook output and the child skills), so a new user meets the ABSOLUTE no-implementation-tools rules and the made-up scoring with no plain explanation of what she is opting into.

## Setup path: no-setup-path
init itself needs nothing that could be missing. Its only fallback line ("if a layer's own storage isn't set up yet, that layer says so honestly ... see each child skill") hands the question to the child skills and points to `/alignment-harness:harness-setup`, which exists. The child skills were not reached in this run, so their setup paths were not judged here.

## Proposed fix
None.
