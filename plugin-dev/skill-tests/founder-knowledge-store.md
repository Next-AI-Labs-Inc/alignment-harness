---
skill: founder-knowledge-store
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 5
seconds: 689
---

## What Dana asked
"Before I start on the discount logic in src/pricing.js, check whether you have any stored notes on how I like to make pricing calls. Also save this one: I never want us to retroactively change an invoice that's already been sent."

## What happened
The agent looked for the MCP founder tools (none), then ran `alignment-harness records personal-knowledge` to get the local folder and listed it: empty. It wrote one JSON entry (category operations, tags billing/invoices/pricing, confidence 10) for the no-retroactive-invoice rule. It told Dana: "the personal knowledge store is empty — this is its first entry. So I have no established rules of thumb from you yet on how you like to make pricing calls." It did not invent any preferences, and it used the local file store with no author data. It closed with "If you want to seed a few more entries (how you like discounts framed, negotiation style, etc.) before you start on `src/pricing.js`, just tell me and I'll add them." The run ended normally after 5 turns. Because the store was empty it did not show a "last fed" age (no entries existed before this one).

## Function: works
It read the store, said plainly that it was empty instead of guessing, and saved the new rule in the documented format in the right folder. No author-world leakage and no account-skill noise.

## Setup path: mixed
The local-file default and the "ships empty, say so" rule are sound. But the empty-store path in SKILL.md tells the agent to "offer to seed it — a handful of short questions (how do you like deals framed? what do you never want said on your behalf? ...)". That makes the person write raw material from scratch, when their past Claude Code sessions and CLAUDE.md usually already hold pricing, tone and "never do X" preferences the agent could mine (with consent) and show for approval. The MCP path and the stale-entry reporting are fine.

## Proposed fix
In "When to reach for it", replace "Then offer to seed it — a handful of short questions (...) turned into a few first entries." with:

"Then offer to seed it yourself: 'I can scan your past Claude Code conversations (~/.claude/projects/*/*.jsonl, your own messages only, via `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<pricing|discount|never|always|prefer>"`) and your CLAUDE.md for rules of thumb you've already stated, and draft a few entries for you to approve. OK?' On a yes, extract candidates, show them as short lesson/category lines, and save only the ones the person approves. Only if nothing turns up, ask one or two short questions (what do you never want said or done on your behalf?) and keep it to answers they can give in a sentence."
