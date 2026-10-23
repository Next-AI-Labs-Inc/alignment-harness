---
skill: smc
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 19
seconds: 130
---

## What Dana asked
I've had to tell Claude three times in a row now to actually run the tests in acme-billing before saying the pricing.js change is done, and it keeps skipping it. Can you check whether this session is drifting from what I asked and look for whether I've corrected this kind of thing before?

## What happened
The agent ran the skill's local fallback. It checked for a memory index (none), searched the plugin's memory tool, and grepped Dana's past project sessions for corrective language. It found only the current session, read that transcript, and saw that her message was the first turn, so there was no drift to report yet. Its summary: "This session hasn't drifted (yet)" and "No prior correction is actually on record." It noted her CLAUDE.md already says to run tests and that nothing enforces it. It closed by offering: "I'll actually run the test suite and show you the output before calling any pricing.js change done." Along the way it wrongly called a real directory listing "fabricated" after confusing the project folder with the empty memory subfolder, and it hit two harness hook gates (search-memory-first, coherence attestation) that it satisfied. No author-world leakage, and no account-skill noise.

## Function: works
It did the skill's real job for her request: named the repeated-correction signal, searched her own past sessions for a prior correction, and said plainly that nothing turned up instead of inventing a match. It did not offer to start a corrections store, and the "fabricated listing" claim was the agent's own misreading, not the skill's fault.

## Setup path: mixed
The local fallback delegates well: the agent does the grep itself over `~/.claude/projects`. But the missing corrections store is left as "Keep a small store of past corrections... build this yourself", and step 3 of the fallback ("If nothing turns up, say so and proceed carefully") stops there. It never offers to mine her past sessions for earlier corrections and seed the store with her consent, so the path is a dead-end when the store does not exist.

## Proposed fix
Replace step 3 of "Local fallback" with: "3. If nothing turns up, say so. Then offer once: 'I can scan your past Claude Code sessions (`~/.claude/projects/*/*.jsonl`, your messages only) for times you corrected me, and draft a short corrections list. Want that?' On a yes, extract user-text messages containing corrective language ('test', 'verify', 'check', 'did you', 'no, ...'), group repeats, draft each as name / trigger / directive, show them for a yes or no per item, and save the approved ones with `alignment-harness records corrections`. Until then, proceed carefully." Also change general-method step 1 from "Keep a small store" to "If there is no store yet, offer to build it from past sessions as above."
