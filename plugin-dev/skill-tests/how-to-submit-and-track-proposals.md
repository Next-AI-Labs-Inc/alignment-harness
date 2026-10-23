---
skill: how-to-submit-and-track-proposals
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 7
seconds: 71
---

## What Dana asked
I think we should refactor src/pricing.js so the proration logic is shared with src/invoices.js. Before I write anything up, are there any proposals already filed about billing, and is this one even worth proposing?

## What happened
The agent searched the machine for a proposals folder or an Obsidian vault and found neither, then said: "No proposals folder or vault exists yet in this environment — the store is empty, so there's nothing filed about billing to check." It then read src/pricing.js and src/invoices.js to ground the judgment and found there is no proration logic at all, and that invoices.js already imports priceFor from pricing.js. It answered both questions: no existing billing proposals, and the refactor is not worth proposing as described. It applied the priority formula and the "pure refactoring without user impact" anti-pattern. The Stop hook asked for task creation; the agent correctly said no requirements had been stated and finished. Account-skill noise: none observed.

## Function: works
It did both jobs the skill exists for: the lookup (reported the empty store plainly, as the skill instructs) and the propose/don't-propose judgment using the scoring formula and anti-patterns, checked against Dana's real code.

## Setup path: no-setup-path
The only missing-thing path is an empty proposals store, and the skill handles it by saying "no proposals filed yet" while pointing new proposals to /propose, which creates the store. Nothing in the skill asks Dana to supply material. The optional database-API and Obsidian-open paths are explicitly conditional on her already having them.

## Proposed fix
None.
