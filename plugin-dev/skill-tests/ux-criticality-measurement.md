---
skill: ux-criticality-measurement
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 1
seconds: 39
---

## What Dana asked
I am about to change the invoice email that goes out when a payment fails in acme-billing (src/invoices.js) so it includes a retry link. How critical is it that we get this right from a UX perspective before I start building?

## What happened
The agent answered in one turn, scoring the work with the skill's four dimensions and averaging them. It opened with "Quick assessment using the skill's framework — no code changes yet, just answering your question." It then said "Criticality: ~7.5/10 — high. Run `ux-pre-execution-reflection` before you start building." and gave a table with a score and reason for each dimension (silent failure 8-9, delivery chain 7, first impression 6-7, harm 8-9). It added concrete risks for her invoice email: the link must match the right invoice, token expiry and double-click behaviour, and phishing-lookalike tone. It closed by offering: "Want me to run the fuller pre-execution reflection next, or do you just want to go ahead". It did not print the JSON object or store anything on a compaction, which is reasonable since no session was being compacted. No account-skill noise seen.

## Function: works
It applied the skill's dimensions, formula and thresholds to Dana's real change, reached the correct "high, reflection required" level, and pointed to the next skill. It used only her repo context and her own CLAUDE.md, with no author-world leakage.

## Setup path: no-setup-path
The skill is a pure scoring rubric and needs no data or config. The only external reference is the optional compaction storage, which defers to `/compact-agentic-session` and the local records folder, so nothing can be missing for a new user.

## Proposed fix
None.
