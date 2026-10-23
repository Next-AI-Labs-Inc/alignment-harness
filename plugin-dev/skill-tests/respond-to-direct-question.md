---
skill: respond-to-direct-question
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 8
seconds: 36
---

## What Dana asked
Does our invoice code round tax per line item or on the invoice total? I'm trying to understand why finance sees one-cent differences.

## What happened
The agent first tried a grep of the repo. A plugin pre-tool hook stopped it and asked for a memory search first, so it ran agent_find, found nothing useful, and said "No prior institutional memory on invoice tax rounding — nothing to reuse, so I'll go read the code directly." It then listed the source files and read only src/invoices.js and src/pricing.js. It created no files, edited no code and started no tasks. Its answer was "There's no tax logic in this codebase at all", because neither file computes or rounds tax. It said the one-cent differences must come from somewhere outside this repo, such as a separate tax service, and asked Dana to point it at that code if it exists elsewhere.

## Function: works
This is a direct question about her repo. The agent researched the code read-only, answered the question, and treated the missing tax logic as an observation rather than starting work. That matches rules 1-4 of the SKILL.md. The one oddity was that the agent_find search surfaced the skill's own text from an earlier session as its top hit. That comes from the harness memory index, not from the skill, and it did no harm.

## Setup path: no-setup-path
The SKILL.md only tells the agent how to answer. It has no dependency on notebooks, records, servers or configuration that could be missing, so there is no setup or fallback path to audit. It carries no author-specific references.

## Proposed fix
None.
