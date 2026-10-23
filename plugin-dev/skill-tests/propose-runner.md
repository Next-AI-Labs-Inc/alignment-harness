---
skill: propose-runner
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 9
seconds: 57
---

## What Dana asked
I think src/invoices.js applies the discount before tax while src/pricing.js does it after, so totals could disagree. Can you write this up as a proper proposal for my team, with how sure you are of each claim?

## What happened
The skill loaded (the session shows the propose-runner command). The agent was stopped once by the memory-search hook, ran a memory search, then read src/invoices.js, src/pricing.js and the test file, and grepped the repo for "discount" and "tax". It found no tax logic anywhere and no discount/tax ordering in either file. It said: "The premise doesn't hold up — I checked the actual code before writing anything." It gave each finding an inline certainty (98%, 95%, 99%), gave its own read of Dana's hypothesis as "(70% confidence)", and declined to write a formal proposal because there was no confirmed gap. It also noted "no triage item file was specified to attach anything to". It ended by asking whether the tax logic lives somewhere else (another service, a payment processor, unmerged code). One stray hit in the memory search was the test run's own prompt echoing back, which it ignored.

## Function: works
The skill did its core job: it grounded the claim in live code instead of the request's framing, put a certainty number on every load-bearing claim, and surfaced the one decision it needed. Not writing the proposal was the right call, because the gap Dana described does not exist in her code. Nothing came from the author's world.

## Setup path: mixed
The "no filing convention" path delegates correctly: it tells the agent to say so and use /propose's default local proposals store. But step 1 assumes a triage item file already exists ("Read the item file fully"), and the skill has no instruction for when the request arrives as plain chat with no item file. The agent had to improvise and did not offer to create the item or file the proposal anywhere. That is a quiet dead-end for a new user who has no triage folder.

## Proposed fix
Add this after the "If the triage folder..." paragraph in skills/propose-runner/SKILL.md:

"**If there is no item file** (the person described the gap in chat, or has no triage folder at all), do not stop and do not ask them to write one. Build the item yourself from what they said plus the files they named: write a short item (suspected gap, likely files, a one-line verification recipe) and show it to them. Ask once for consent to save it in the local proposals store (the default /propose uses), then continue at step 2. If step 3 shows the suspected gap isn't real, say so plainly, still offer to save the short grounded finding there, and ask only the one judgment you need (for example, 'is the logic you mean somewhere else?')."
