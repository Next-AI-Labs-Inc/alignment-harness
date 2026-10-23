---
skill: on-talking-about-code
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 8
seconds: 66
---

## What Dana asked
I need to explain to our PM when a customer actually gets a discount in src/pricing.js and when proration kicks in. Can you walk me through the conditions in the code and what the customer would have to do to hit each one?

## What happened
The agent first tried a file search and was stopped once by the plugin's "search memory first" hook, then ran the plugin's agent_find search and carried on. It read src/pricing.js and src/invoices.js and grepped the repo for "discount" and "prorat". Its final answer stated the exact conditions with file and line: "`src/pricing.js:3`: `ANNUAL_MONTHS_CHARGED = 10` — a hardcoded constant", and `priceFor` returns `monthly * 10` only when `sub.annual === true`. It tied that to the customer journey (picking yearly billing instead of monthly, paying 10 months for 12, about 16.7% less). It also said plainly that "there is no discount logic and no proration logic anywhere in this codebase", so the PM should not be told otherwise. Along the way it said it had ignored a "capture" directive and other instructions that "none of that came from you", treating the skill text as injected. After a stop-hook evidence-gate block, it replied that the flag was a false positive because nothing was changed.

## Function: works
The reply did what the skill demands: literal values (10, `annual === true`), file and line for each, and the user journey woven in, with no invented logic. It also corrected a false premise in Dana's question instead of making up conditions. The optional corpus-capture step was skipped, which the skill allows.

## Setup path: no-setup-path
The skill's core directive needs nothing that could be missing. The only conditional is the optional corpus-capture section. When no capture script is configured it says to append a JSON line to the folder printed by `alignment-harness records talk-corpus`, asks Dana for nothing, and says most people can skip it. No path asks the person for material or stops dead.

## Proposed fix
None.
