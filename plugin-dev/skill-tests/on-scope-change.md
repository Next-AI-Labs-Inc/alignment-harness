---
skill: on-scope-change
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 2
seconds: 71
---

## What Dana asked
I'm in the middle of refactoring the discount logic in src/pricing.js for acme-billing, and I just noticed invoices.js is rounding totals wrong, so I'm going to drop into fixing that first. Then I'll get back to the pricing refactor. Keep track of where we are as I bounce between these.

## What happened
The agent recognised the detour from the pricing refactor into the invoices.js bug and printed the two-line marker exactly as the skill specifies. Line 1 was "📍 Focus Updated:" and line 2 was "fix invoices.js rounding bug < pricing discount refactor < acme-billing". It then said "(No session chapter-mark tool is available in this environment, so I'll just keep using this chat marker going forward — noting that once, as the skill asks.)" That matches the skill's missing-tool fallback. It also used Dana's own CLAUDE.md, flagging that rounding touches money and it would show the change before applying it. It closed by offering to flip the breadcrumb back to the pricing refactor when she is done. A coherence-check preamble and an attest call came from the plugin's other gate, not from this skill. It used no author-world data.

## Function: works
It did the skill's core job for her request: a correct nested breadcrumb for a descend, in the required two-line format, with the chapter-mark gap disclosed once and no fake mark. The root it chose (acme-billing) is reasonable for her repo.

## Setup path: no-setup-path
The skill needs nothing buildable that could be missing. Its only fallback is the optional chapter-mark tool, and the SKILL.md says to still print the marker and tell the person once that table-of-contents entries are unavailable. That is neither a dead end nor a request for material. The on/off switch mention points to `/alignment-harness:harness-setup` and is optional.

## Proposed fix
None.
