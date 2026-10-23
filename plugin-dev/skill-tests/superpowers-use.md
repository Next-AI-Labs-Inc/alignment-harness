---
skill: superpowers-use
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 14
seconds: 129
---

## What Dana asked
I need to add proration support to invoices in acme-billing, so mid-cycle plan changes produce a correct partial-month charge. Can you take this through your full workflow for me?

## What happened
The agent opened the skill's chain and checked its skill list before starting. It said: "The `superpowers` plugin isn't in my skill list, so I'll run the same phases using the harness-native fallbacks (`/align`, `/ask`, etc.) rather than pretending the real plugin skills ran." It then ran Phase 1 (brainstorm) by reading Dana's repo (README, src/pricing.js, src/invoices.js, the test file) and found there is no concept of billing dates or a previous plan. Because Dana's CLAUDE.md says to ask before changing pricing behaviour, it stopped with five concrete questions (daily-rate basis, credit plus charge vs one net line, tier vs seat changes, annual plans, rounding) and said it would write a short design doc for her sign-off before any code. It wrote no code, which is correct for a hard gate at the end of brainstorming. Along the way the plugin's own hooks blocked two commands (memory search first, coherence check) and the agent complied after some hesitation. That is hook behaviour, not this skill. The agent did not print the skill's "Phase 1/7" banner or the status bar, and it did not call the `/align` fallback as a skill; it did the brainstorm inline.

## Function: works
It did the right first part of the chain for a real coding request: it told Dana the original plugin was missing, used the named fallback approach, explored her actual repo, asked clarifying questions, and held at the approval gate. No author data or private servers showed up. Minor miss: the phase banner and status bar were not printed.

## Setup path: delegates
The skill has an explicit Availability Check that says so plainly when the `superpowers` plugin is missing, uses a harness-shipped fallback for every phase (all of the named fallback skills exist in the plugin except the two below), and offers to help install the original. Two fallbacks are conditional ("`/test-fixtures-and-mocking` if this harness's copy is installed", "`/superpowers-systematic-debugging` if a copy is installed elsewhere") and neither skill ships in the harness, but each also gives inline instructions (plain red-green-refactor; root cause before fix), so they are not dead ends. The remaining asks (approve the spec, choose the execution mode, choose an integration option) are decisions, not material.

## Proposed fix
None.
