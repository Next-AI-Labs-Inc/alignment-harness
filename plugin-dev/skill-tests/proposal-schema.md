---
skill: proposal-schema
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 8
seconds: 109
---

## What Dana asked
I think prorated invoices in src/invoices.js are rounding cents the wrong way when pricing.js hands them a fractional amount. Can you write this up as a proposal my team lead can review and approve before I touch anything?

## What happened
The agent was stopped once by the harness's coherence-check hook, printed its understanding (92% certain, "a written proposal describing the problem — not a code fix"), recorded it, and went on. It read src/invoices.js and src/pricing.js, found no proration or rounding logic anywhere (prices are whole-number plan price times seats), and searched past-session memory, which had nothing on this issue. It then stopped before filing and said: "I searched the actual code before writing anything, and the premise doesn't hold up — I want to flag this rather than write a proposal for a bug that isn't there." It gave three possible explanations (wrong repo or branch, a proration feature request, or an upstream service) and asked which one applied. It did not write a proposal file. It also did not print the skill's "Proposal_Schema" banner line.

## Function: works
The skill's validation checklist requires an Evidence Chain item with a verifiable source, and the agent declined to invent one for a bug the code does not contain. That is the right first part of the job: no made-up evidence, no author-world data, and a plain question back to Dana. The only miss is the unprinted banner, which is cosmetic. Note that this request's premise was false for the sandbox repo, so the test did not exercise the actual file-writing path.

## Setup path: no-setup-path
Everything the skill needs is either built in or has a default that works with nothing set up: proposals go in the plain folder printed by `alignment-harness records proposals`, and the Obsidian vault or other store is explicitly optional ("Default (works with nothing set up)"). The grounding section says to write it yourself if /proposal-ground is not available, and it allows a first proposal to file without the optional fields. No path asks Dana to produce material or dead-ends.

## Proposed fix
None.
