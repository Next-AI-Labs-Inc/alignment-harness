---
skill: hallucination
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 9
seconds: 153
---

## What Dana asked
Earlier you told me src/pricing.js exports a calculateTax() helper and I wired src/invoices.js to call it, but there is no such function and the invoice tests are blowing up. Hallucination - trace why you thought it existed.

## What happened
The agent read src/pricing.js and src/invoices.js, grepped the repo for calculateTax, checked git history and the reflog, and looked in the project memory folder. The coherence-check hook blocked one call and the memory-search hook blocked another. The agent printed the coherence check, ran the plugin's agent_find search, attested, and carried on. It found no trace of calculateTax anywhere: pricing.js exports only `priceFor` and `PLANS`, the repo has one commit, and no memory or session record made the claim. It reported "Cannot identify one" under causes and "None to apply yet — fixing a cause I can't locate would itself be a fabrication, which is the exact failure mode this skill exists to catch." It closed by asking for the session ID or the real failing test output and the invoices.js version she wired.

## Function: works
It ran the skill's diagnostic against Dana's real repo, used the skill's Causes/Fixes output format, and refused to invent a cause, which is the skill's own principle. It used only Dana's repo and the plugin's own search, with no author-world leakage and no account-skill noise.

## Setup path: no-setup-path
The SKILL.md needs no configuration. It has one soft fallback: if you cannot point to the exact source, "you haven't finished the diagnostic". That leaves the agent to decide where else to look. Here the agent searched git history, the memory folder and agent_find unprompted, so nothing needs fixing.

## Proposed fix
None.
