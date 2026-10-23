---
skill: intent-map-docs-add
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 27
seconds: 159
---

## What Dana asked
I want to start an intent map for acme-billing so new engineers can find their way around. Can you add documentation for how pricing and invoicing work (src/pricing.js and src/invoices.js) and where they fit?

## What happened
The agent passed the harness coherence and governer gates (score 10, docs-only), then listed the repo and saw there was no docs folder. It read pricing.js, invoices.js, auth.js, the README and the test, then created `docs/intent/Intent-Map/` from scratch: a root INDEX, TEMPLATE, domain-taxonomy and how-agents-use-this, a `billing/` domain, and `pricing/` and `invoicing/` subsystem folders each with an INDEX and one artifact doc. It said "Now writing the Intent Map — scaffold first, then the billing domain with pricing and invoicing subsystems." It ran the existing pricing test to confirm nothing broke, noted `auth.js` as a third system not yet written up, and flagged that the file's top comment implies email sending that the repo doesn't contain. Everything came from Dana's repo files; no author-world data appeared. The agent did not ask before creating the folder, but the request was an explicit ask to start one.

## Function: works
It did the right job for a repo with no map: it built the skeleton and the first domain by system (not by lifecycle status), used the required frontmatter, and grounded the content in the real source it had just read.

## Setup path: mixed
The skill has no explicit path for the common new-user case where `Intent-Map/` does not exist. Step 1 says "Read `Intent-Map/INDEX.md`", the body template refers to "the TEMPLATE.md structure from the Intent-Map root", and "check `Intent-Map/domain-taxonomy.md`" points at files a new repo lacks, and none of this says to create them. The agent improvised correctly, but the skill relies on that rather than stating it. `linked-intents: ["{PROJECT}-#### — ..."]` also names an ID scheme with no fallback when the project has none. The skill never asks Dana for material, so nothing fails on asks-for-material.

## Proposed fix
Add this short section after "Where It Lives":

"If `<project>/docs/intent/Intent-Map/` does not exist yet, create it yourself; do not ask the person to. Tell them in one line where you will put it (default `docs/intent/Intent-Map/`, or `docs/` subfolder conventions you see in the repo) and proceed. Create INDEX.md, TEMPLATE.md (copy the frontmatter schema above), domain-taxonomy.md and how-agents-use-this.md. Derive the first domains by reading the repo's README, top-level folders under `src/`, and the files the person named. Leave `linked-intents` as `[]` unless the repo's commits or docs show an issue-ID scheme (check `git log --format=%s` for patterns like ABC-123)."
