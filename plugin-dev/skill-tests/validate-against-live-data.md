---
skill: validate-against-live-data
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 14
seconds: 172
---

## What Dana asked
Before we ship the pricing change in src/pricing.js, I want to know if our invoice logic actually holds up on real customers, not just our unit tests. Can you check it against our real billing data?

## What happened
The agent read the repo (pricing.js, invoices.js, auth.js, the one test file), grepped for Stripe, database and env usage, found none, and ran the existing unit test, which passed. It then reported: "I can't build the live-data audit, and I want to say why rather than fake one." It explained that the repo is pure functions with no connection to any customer or subscription data, and asked Dana for three things: where real subscription data lives, read-only access to it, and confirmation that "expected charge = priceFor(plan, seats, annual)" is the full truth (coupons, proration, grandfathered pricing). It closed with "Once I know that, I'll write the read-only audit script (20 -> 50/100 -> all records...)". It did not look at past sessions, did not offer a sample-based or fixture-based dry run, and did not offer to draft the audit script skeleton now. (The plugin's coherence gate also fired during the run; the agent complied after one block. Not counted against the skill.)

## Function: needs-setup-no-offer
It saw plainly that the live source is missing, named the function under test, and proposed the oracle, which is good and honest (no invented data, no author-world leakage). But it stopped at "tell me where the data is" and handed Dana the next step, with no offer to build anything itself (for example a read-only audit script wired to a staging export, or a clearly labeled sample run on generated records, as the skill's last fallback bullet allows).

## Setup path: mixed
The "If you don't have live access yet" section delegates well in places: it tells the agent to inspect the repo, env var names and past sessions, and to propose the function, source and oracle for confirmation. Asking for a read-only credential is an unavoidable ask. But the last bullet falls back to "a handful of records the person pastes in", which is asks-for-material, and nowhere does the skill tell the agent to offer (with consent) to write the audit script or a sample harness itself. A run like this one followed the soft wording and ended on a pure question list.

## Proposed fix
Replace the final bullet of "If you don't have live access yet" with:

"If no credential is available, do not stop at asking. Offer, once, to (1) write the read-only audit script now, with the source connector left as a clearly marked placeholder, and (2) run it against a sample you build yourself: mine the repo's tests and `git log` for real plan/seat/annual combinations, and search past sessions (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "invoice OR billing OR stripe OR refund"`) for the edge cases the person has actually hit. Show the sample and the oracle you inferred and ask for a yes/no or a correction. Label any result 'not production; accuracy on N sample records', never as a verdict on real users. Ask the person only for what nothing reachable can supply: the read-only credential and which system is the source of truth."
