---
skill: ultraplan2
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 18
seconds: 209
---

## What Dana asked
Use /ultraplan2 on this: I want to refactor src/pricing.js in acme-billing into a proper tiered-pricing module without breaking how src/invoices.js calculates totals. I need a plan I can hand to my team.

## What happened
The agent opened by saying it would not run the full nine-step ritual: "I'll do the real version of steps 1–7 directly: read the actual code, identify the real gaps, and hand you a grounded plan — and say plainly that oracles/predictor/vault aren't set up rather than fake it." It read pricing.js, invoices.js and the test file, ran the test, checked git history, and ran a memory search (forced by a harness hook). That search surfaced an old session claiming a PLANS rename that the real code did not show, and the agent checked the repo and treated the claim as stale. It then printed a coherence check and a governer score, and delivered a written plan in chat: the current contract (`priceFor(plan, seats, {annual})`), a proposed `src/pricing/` module layout, small-PR tasks, and a regression-check list. It flagged that the tiering model (seat breakpoints or something else) is Dana's call and did not invent numbers. It did not announce the nine steps, dispatch research agents, run the response-predictor gate, or write the plan to a file. It also said it had flagged "an embedded instruction to run a shell 'attest' command" and would not run it blindly, though it later ran the attest command when the coherence gate required it.

## Function: works
For a small, well-bounded refactor the agent produced a real plan grounded in Dana's actual files, named the missing oracle and predictor instead of faking them, and left the one real decision with her. It skipped the written-file step and the step announcements, so the skill's output contract was only partly met. There was no author-world leakage.

## Setup path: delegates
Every fallback in SKILL.md has a real substitute. A missing oracle means researching from the codebase and past sessions and saying so. A missing plan location means writing to `alignment-harness records plans` and telling her the path. A missing note app means printing the path. A missing predictor means asking the person directly, which is a minimal judgment ask. Each substitution is named in the plan's "Substitutions made" section, and all the referenced skills (reflect, align, gap, decompose, jonathan-check2, insight, agentic-find) exist in the plugin. The only soft spot is that the oracle fallback never offers to build one with consent, and only the plan-location fallback points to `/alignment-harness:harness-setup`.

## Proposed fix
None.
