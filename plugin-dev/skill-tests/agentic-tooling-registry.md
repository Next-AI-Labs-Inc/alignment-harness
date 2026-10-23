---
skill: agentic-tooling-registry
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 15
seconds: 116
---

## What Dana asked
I need to add a helper that formats a dollar amount with currency for our invoices in acme-billing. Before I write a new one, can you check whether we already have something like that, and keep track of what you find so my team does not rebuild it later?

## What happened
The agent asked the harness for the registry path, then searched the repo and past-session memory for a currency formatter. It found none. It read src/invoices.js and src/pricing.js and saw that priceFor returns a raw number. The registry path turned out to be an empty directory, not a file, so the agent noticed both registry directories were empty: "Both directories are empty — nothing's ever been registered. I'll seed the registry with what actually exists and create the file." It wrote a registry.json holding two entries (priceFor and buildInvoice) as proposed/50. It reported: "No existing dollar-formatting helper." It said it had seeded two entries and offered: "Once you write the formatter, want me to register it too". A stop hook asked for a TaskCreate, which was not available; the agent explained that and finished. Its answer used only Dana's repo, with no author-world leakage and no account-skill noise.

## Function: works
It did the skill's core job (search before you build, say plainly the registry was empty, seed from the person's own code, offer to register the new helper). It wrote the two-entry seed before asking for confirmation. The skill says to confirm before a "large batch", so this is a small deviation, and it disclosed what it wrote.

## Setup path: delegates
The skill's empty-registry path tells the agent to say so plainly and offer to scan package.json scripts, skills, OpenAPI files and route files itself, then let the person confirm before a large batch. That is the delegating pattern. The optional admin-backend section is explicitly not required. One real defect: `alignment-harness records tool-registry` prints a directory, but the skill calls it "a JSON file at the path printed", and the agent had to improvise a filename.

## Proposed fix
In "Default: local, file-backed registry", replace "The registry is a JSON file at the path printed by:" with: "The registry lives in the directory printed by the command below. Keep all entries in one file named `registry.json` inside it (a JSON array); create the file on first write, and treat an empty directory as an empty registry."
