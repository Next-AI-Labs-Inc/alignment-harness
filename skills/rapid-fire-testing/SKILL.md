---
name: rapid-fire-testing
description: Invoked directly via /rapid-fire-testing when the user names an idea and wants the agent to race by the most direct path possible to one piece of tangible evidence proving whether the idea can actually produce the desirable outcome. Open-source-first, no stopping for permission, no perfecting prompts, no human-in-the-loop until first real artifact lands.
---

# /rapid-fire-testing

## ⛔ THE ONE NON-NEGOTIABLE RULE (read this first, every time)

**Once this skill is invoked, you DO NOT STOP until the artifact(s) exist. Not once. Not for anything.**

- You do NOT pause to ask permission.
- You do NOT stop to reflect scope back and wait for "y/n".
- You do NOT require the user to engage, confirm, choose, or greenlight mid-flight.
- You do NOT ask which approach to take — you pick one and produce.
- If you are uncertain about a detail (a brand, a model, an exact price), you make your **best honest call, state your confidence, and KEEP GOING.** The user will modify any finished artifact if it's wrong. Producing a wrong-but-editable listing is correct. Stopping to ask is a failure.
- The ONLY legitimate breaks are the two named in "When To Break Posture" below: a hard external dependency you physically cannot satisfy (a credential/account only the user has), or a write into a real shared production system. Uncertainty is NEVER a legitimate break.

If the user hands you N items, you produce N artifacts in one continuous run. You report when they ALL exist — not before, and not in between with a question.

The user's exact words that made this rule: *"you would not ever stop work ever under any circumstances when invoking the skill and that needs to be crystal clear until the listings are [done]."*

Per-message coherence/scope-gate hooks are satisfied ONCE at the start and never used as a reason to stop the run.

## Trigger

Direct invocation: `/rapid-fire-testing <idea>` (or `/rapid-fire-testing` followed by an idea anywhere in the user's message).

The idea is whatever the user has named — automate X, prove Y works, see if Z is feasible. Treat that named idea as the thing to be tested and enter the protocol immediately.

## What this skill IS (and what it isn't)

**IS:** A rapid-iteration posture for racing to the first piece of tangible evidence that proves (or disproves) whether an idea can produce a desirable outcome.

**ISN'T:**
- A planning skill (do not produce plans, produce artifacts)
- A brainstorming skill (the idea is given — your job is to *test* it)
- A full-build skill (you are not shipping a feature, you are gathering evidence)
- A confirmation-loop skill (you do NOT stop for permission between steps)

The boundary against neighboring skills:
- `/brainstorming` *explores options* — this skill *resolves a single bet*.
- `/feature-completion-ux-test` *validates a finished feature* — this skill *validates an unproven idea*.
- `/governer` *gates risky work* — call it only if you genuinely need to write into shared systems, not as a stalling tactic.

## The Core Posture

The user is testing whether the idea can result in a tangible outcome that is desirable, in the most direct way possible. The user does NOT want you to:

- Custom-build from scratch when an open-source repo already exists
- Stop for permission between steps
- Spend ten hours and ten confirmations getting to a strategy that won't work
- Polish prompts, write specs, or build scaffolding before the first evidence point
- Loop a human into the work until the fundamental evidence has been gathered

The user DOES want you to:

- Identify the single piece of evidence that proves the strategy has merit
- Take the most direct path to producing that evidence
- Lean on open-source tooling that you can pull into the project root and try
- Work continuously in a loop toward the evidence, not toward a plan
- Produce an actual artifact the user can evaluate

## The Five-Minute Test

> "If there's a way for you to test your best idea on this in five minutes and determine if it's actually gonna work with actual evidence, that would be the right path forward."

Before doing anything else, ask: **what is the smallest possible artifact that, if it exists, proves this idea has merit?**

Examples:
- `T - automate facebook customer service` → the smallest proof is **one real reply sent back to one real message in Facebook Marketplace**. Not a perfect reply. Not a polished system. One message, sent.
- `T - create videos with this new Claude tool` → the smallest proof is **one actually-generated video, relevant to the user's domain, that the user can watch right now**.
- `T - automate cold outreach to family offices` → the smallest proof is **one personalized outreach message generated from a real prospect's public data**, not a sent message (that would require alignment first).

The evidence point is whatever, when seen by the user, will give them enough signal to say "keep going" or "kill it."

## Protocol — Run In Order, Don't Stop

### 1. `/reflect`

Open with `/reflect` so the work is observable. State:
- The verbatim `T -` idea
- Your interpretation of the desirable outcome
- Your deduced "first piece of tangible evidence" (the artifact that, if it lands, proves merit)
- The most direct path you can imagine to producing it
- Whether an open-source repo, MCP tool, or existing project capability likely shortcuts the path

### 2. Open-Source / Existing-Tool Scan

Before writing any custom code, check whether someone has already done most of the work:

- `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` with the idea phrased as a question — find existing project tooling, skills, or knowledge
- Search GitHub for the obvious open-source project (e.g. for `T - automate facebook customer service`, search for "facebook marketplace bot", "messenger automation", "FB chat API wrapper")
- Check if an MCP tool the user has already installed can do it (look at the connected MCP servers in your context)

Pull the most promising candidate into the project root *as a test*, not as an adoption decision. If it's a repo, clone it into a scratch dir. If it's an MCP tool, read its capabilities and pick the single most representative call.

### 3. Pick The Exemplary Test Case

For the chosen tool, ask: *what makes this tool unique, and what test case best showcases that uniqueness while also being relevant to the user's actual goal?*

This is where `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` earns its keep — pull context about what the user is actually working on so the test artifact lands in their world, not in toy-example world.

### 4. Produce The Artifact

Take the most direct path to producing the single piece of evidence. Skip:
- Robustness
- Edge cases
- Error handling beyond "don't break the user's machine"
- Prompt polish
- Configuration scaffolding

Keep:
- A real input
- A real output
- A clear path for the user to see the output

### 5. Hand The Artifact To The User

Use `/how-to-talk-like-the-founder` to write the closing message. Whatever format the artifact is in:
- **Video / image / audio** → drop directly into chat if possible; if not, save into an organized folder in the intent vault and open it for the user
- **Generated message / email / reply** → paste the full text in chat
- **Generated link / deployed page** → give the clickable URL FIRST, then one short sentence on what it shows and why
- **Code / file artifact** → give the clickable file path FIRST, then the consumption path

The closing message has three parts, in this order:
1. **The URL or artifact** (clickable, no preamble)
2. **What the user will see when they open it** (one sentence, the user's voice)
3. **Why this proves (or fails to prove) the idea has merit** (one sentence, the user's voice)

## When To Break Posture

You will stay in the loop until evidence is in hand. The ONLY legitimate breaks:

- **`/ask`** — if a genuinely external dependency blocks you (credential the user must provide, an account that doesn't exist yet, a piece of context only the user has). Use the `/ask` protocol: synthesize, predict, score, route. Don't break posture for "should I use library A or library B" — pick one and try it.
- **`/governer`** — if the most direct path would write into a shared production system (real customer DB, real email send to real users, real payment, real deploy). Score it, route it, but do NOT use governer as a stalling tactic on local exploration.
- **Tool that's actually broken** — report immediately per the "Report Tool Failures Immediately" rule. Don't silently switch strategies.

Anything else — including uncertainty, intermediate questions, "should I keep going" — is NOT a legitimate break. Keep working toward the artifact.

## Observable Evidence Trail

Throughout the loop, surface (briefly) that you are following the posture:

- Print the deduced "first evidence point" so the user can correct it if you misread the idea
- When you find an open-source candidate, name it and link it
- When you pick a test case, name what makes it exemplary for the tool
- When you produce the artifact, lead with the artifact itself, not narration about it

This is the difference between observable rapid iteration and a black-box "trust me, I'm working."

## Anti-Patterns (what triggers a /rapid-fire-testing failure)

- Producing a plan instead of an artifact
- Asking the user to choose between approaches before you've tried one
- Building scaffolding (folders, configs, abstractions) before producing evidence
- Stopping at "I researched it, here's what I found" without attempting to produce the artifact
- Polishing the artifact past "good enough to evaluate"
- Hiding the artifact at the bottom of a long status update — the artifact leads

## Example Walkthrough

**User message:** `T - automate facebook customer service`

**Agent move 1 (`/reflect`):**
> Verbatim idea: *automate facebook customer service*.
> Interpretation: the user wants to know if an agent can handle the marketing/customer-service loop on Facebook (likely Marketplace, given context) without a human in the loop for every message.
> First evidence point: **one real reply sent back to a real message in Facebook Marketplace**. If that works, the strategy has merit. If it can't be done without harming the account or breaking ToS in a way that kills the strategy, kill it now.
> Most direct path: find an existing open-source FB Messenger / Marketplace bot, see if it can read one inbound message and send one outbound reply against the user's test account.

**Agent move 2 (open-source scan):** searches GitHub for "facebook marketplace bot", finds 2-3 candidates, picks the most-starred maintained one, pulls into a scratch dir under the project root.

**Agent move 3 (test case):** pulls a real inbound message from the user's Marketplace inbox (or uses a test message the user sends to themselves from a second account). Generates a reply with Claude. Sends it.

**Agent move 4 (artifact):** the reply lands in the test conversation. Agent screenshots or links to the conversation.

**Agent move 5 (handoff in the user's voice):**
> https://facebook.com/marketplace/inbox/<thread-id>
>
> That thread shows a message I sent automatically — pulled your inbound, generated a reply, sent it back, no human touch.
>
> This proves the loop closes end-to-end. The next question is quality, not feasibility — which is the right question to be stuck on.

That's a complete `/rapid-fire-testing` cycle.

## Done Criteria

The skill exits when:
- An artifact exists that the user can evaluate in under 60 seconds of their time
- The artifact is delivered with a `/how-to-talk-like-the-founder` closing in URL-first format
- The user has enough signal to say "keep going" or "kill it"

Not before.
