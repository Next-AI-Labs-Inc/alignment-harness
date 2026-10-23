---
skill: ux-assignment-reasoning-protocol
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 13
seconds: 108
---

## What Dana asked
I just changed how src/invoices.js handles a failed payment retry, and I need a UX assignment so a reviewer can check the new retry banner without reading the code. Can you write it up?

## What happened
The agent ran Gate 0 (code existence) first, as the skill requires. It listed and grepped the repo, read src/invoices.js (9 lines, no retry or banner logic), then checked the file list, git log, git status and branches. Along the way the plugin's own hooks made it search memory once, print a coherence check and record a risk score; it complied with each. It then told Dana plainly: "I can't write that assignment — the code isn't there." It listed the evidence (no match for retry or banner anywhere in src/, no UI files, one commit, clean tree) and asked her to point it at the right repo or diff. It did not invent a banner or a fake assignment.

## Function: works
This is the skill's intended gate: the code Dana described does not exist in the sandbox repo, so the protocol says stop rather than write a phantom assignment. The agent did that and asked for the real change. It reported in chat instead of writing the `blocked` JSON stub, which is a small gap but keeps the same outcome. No account-skill noise and no author-world leakage seen.

## Setup path: no-setup-path
The skill needs no pre-built data. Its optional pieces are already handled in the text. The known-broken tracker is explicitly skipped if the project has none. A missing test helper falls back to "write the manual steps ... and note the missing helper". The simulator URLs and `create-admin-helpers-atomic` are labelled as examples to replace. Nothing asks Dana to supply raw material the agent could gather.

## Proposed fix
None.
