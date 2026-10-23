---
skill: intent-map-domain-synthesis
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 22
seconds: 157
---

## What Dana asked
I want to organize the docs for the pricing side of acme-billing into a proper domain map that other engineers and agents can navigate. Can you compose a domain index for pricing, covering how src/pricing.js and src/invoices.js fit together?

## What happened
The agent first passed the plugin's coherence and governer gates (scored the task 13/100, docs-only). It checked the repo for an existing intent-map folder, found none, and said: "There's no existing `docs/` or `docs/intent-map/` convention in this repo — it's a 3-file service with just a README. I'm using the skill's default (`docs/intent-map/`)". It read pricing.js, invoices.js, auth.js and the test file, then wrote four files: a root `docs/intent-map/INDEX.md`, `pricing/INDEX.md` (intent, subsystems, connections, "for agents"), and one artifact doc each for the pricing engine and invoice builder, all with the required frontmatter. It organized by system, not by status, and kept to two subsystems rather than inventing empty folders. It ran the existing test, which passed, and summarized: invoices.js has no pricing logic of its own and only calls `priceFor()`; it also flagged that `buildInvoice()` has no test coverage. It ran one agent_find search, which returned only plugin skill text and the current session; it did not say it was skipping the optional oracle or intent-db steps.

## Function: works
It produced the domain INDEX plus subsystem docs in the skill's prescribed structure, grounded in Dana's actual code, and did not reach into any outside data. Account-skill noise: none. Minor gap: it did not state which optional research steps (oracle, intent database) were skipped, as the skill asks.

## Setup path: delegates
The missing-folder path says to tell the person plainly and "offer to build the first INDEX.md from the docs, folders and code that already exist". The missing memory-search tool falls back to grepping the repo, past sessions and git log, and says so. The missing intent-db and oracle steps are skipped with a statement. The only ask is "Ask, or check, where their project's intent/knowledge docs already live", which has a default when nothing is found. No path asks Dana to write or paste material.

## Proposed fix
None.
