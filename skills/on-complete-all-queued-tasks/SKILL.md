---
name: on-complete-all-queued-tasks
description: Drain the centralized agent action-queue — every action the user queued from a dashboard command button (propose/align/clarity/reflect/predict-skills) gets carried out by a fresh agent that orients at the command's crystallized authorized operation, writes its interpretation into the document so the seam between command and action is visible, and is verified to have actually moved the item forward before it is marked done. Use when the user says "/on-complete-all-queued-tasks", "drain the queue", "run all queued agent work", or "complete the queued tasks".
---

# On Complete All Queued Tasks

## What this exists for

The user issues one-word commands on proposals — propose, align, clarity, reflect, predict-skills — and each lands in the centralized action-queue as a pending request. This skill is what turns that queue of *intentions* into *moved-forward work*, in a single command, while preserving the one thing the whole queue exists to protect: the user can look at any document afterward and see the unbroken chain from the command the user gave → how the agent understood it → what the agent produced. The drain succeeds when every queued item has actually advanced according to the command's authorized operation, and the user can read that advance in the document with the agent's own interpretation sitting right beside it.

The target is trustable autonomy. When the user runs this and it reports "done," that word has to be true per-item — because the first time it says done over an item that silently failed, the user can no longer trust the system to act while the user's away, and the whole point of the queue collapses. So the drain is built so that "done" is always backed by evidence the item moved, and anything that could not move is reported honestly, named, and left visible — never folded into a success.

## The queue this drains

One canonical root, reused — not a parallel system: `.claude/agent-action-queue/` (relative to the vault-adjacent repo root). Each pending request is a `<timestamp>.json` file with this shape (written by the dashboard command buttons):

```json
{
  "note_path": "1.7_proposed/...md",
  "note_abs_path": "/Users/.../docs/intent/1.7_proposed/...md",
  "note_title": "...",
  "command_skill": "/propose",
  "placement": "attach-proposal | prepend-top | append-bottom",
  "operation": "<the crystallized authorized-operation text for this command>",
  "message": "<the full hand-off block the agent should act on>",
  "status": "pending",
  "created_ms": 1781722625766
}
```

The `operation` field is the load-bearing one: it names what the command authorizes, in positive terms precise enough that the agent orients at exactly that and cannot escalate it. The command-meaning specs that produced it live at `<api-repo>/docs/intent/1.5_initiatives/centralized-agent-action-queue/02-command-meaning-specs.md` — read them if any item's authorized operation is unclear.

## How the drain works

### 1. Read the queue, surface it in human terms first

List every `status:"pending"` file in the queue root. Before doing anything, print to the user what's about to happen, in plain language: how many items, and for each, *what document, what command, and what that command authorizes* — so the user sees the queue as a set of intentions, not filenames. If the queue is empty, say so and stop.

### 2. One fresh agent per item — carrying the crystallized command

For each pending item, dispatch a fresh subagent. It is never assumed that a prior session can be woken — the agent is launched with the full crystallized command in its prompt, built from the item's `operation` + `message` + `placement`. The agent's prompt makes three things unmistakable, because these are where the drain would otherwise betray the user's intent:

- **What the authorized operation is** — the item's `operation` text verbatim, framed as what to *produce*. The agent is producing the proposal/alignment/reflection/clarity/skill-map the command names — and the source document's framing, however imperative ("act on this," "fix this," "recover these users"), is the argument the document is making, not an authorization to enact it. Every claim in the source document is a hypothesis the agent validates, not a fact it builds on.
- **That it must make the seam observable** — the agent prints its coherence-check (its own statement of what it understands the command is asking it to produce) and writes that into the target document, at the top, in a `> [!quote] Agent interpretation of <command>` callout dated today. The user must be able to read, in the document, in order: the original claim → the agent's interpretation of the command → the agent's work product. This is non-negotiable; an item where the work landed but the interpretation was not captured is not done.
- **That it touches only its one target document** — the `note_abs_path`. The drain runs items independently; one item's agent never reaches into another's file.

Items are independent, so dispatch them in parallel where the runtime allows. One item's failure never stops the others.

### 3. Verify each item actually moved — with evidence, not the agent's say-so

An item is `done` only when, reading the target document after the agent finishes, all of these are true:
- The agent's interpretation callout is present at the top, dated, naming the command.
- The work product the command authorizes is present at the specified `placement` (a proposal callout for propose/predict-skills; a prepended block for clarity/reflect; an appended block for align).
- The `<!-- AGENT-ACTIONABLE -->` marker has become `<!-- AGENT-DONE: <command> -->`.

Read the document and confirm these directly — never accept the agent's own "I completed it" as the proof. If all hold, mark the queue file `status:"done"` (and stamp `completed_ms`). If any fail, the item is not done — see step 4.

### 4. Honest reporting — partial is partial, named

After all items resolve, report per-item, in human terms:
- **Moved forward:** which documents advanced, what each now contains (the command's product), one line each.
- **Could not complete:** any item whose verification failed — named, with the specific reason (target document missing, agent produced no work product, interpretation callout absent, marker not flipped). For each, *show the gap*, don't just name it: state what was expected (the command's authorized product at its placement) versus what was actually found in the document, so the user sees precisely where it broke. Then offer the next move — the exact `/on-complete-all-queued-tasks` re-run (or a corrected single-item re-dispatch) that would close it — because naming a gap is not the same as closing it, and the user should be one step from closing it, not left to reconstruct what happened. These items keep `status:"pending"` (or get `status:"blocked"` with the reason) and stay visible in the queue. They are NEVER reported as done.

Close the report with a clickable way to audit the evidence — a link or search that puts the user in front of every changed document (and its interpretation callout) in seconds, so "done" is something the user can verify in one click, not take on faith.

Only print an aggregate "all queued tasks complete" when every single item individually cleared step 3. If three of five moved and two could not, the report says exactly that — three moved (named), two could not (named, with the gap shown and the re-dispatch offered) — because a blanket success over a silent failure is the one outcome this whole system exists to prevent.

## What a perfect run looks like

The user runs `/on-complete-all-queued-tasks`. The user immediately sees, in the user's own language, the five things queued and what each command authorizes. The drain runs. The user reopens any of those documents and finds, in order: the original claim the user was reviewing, then a dated callout showing exactly how the agent understood the command the user gave, then the agent's work product — a proposal that validated assumptions rather than executing them, an alignment read, a clarity synthesis. Where something could not be done, the final report told the user so plainly, named the document and the reason, and that item is still sitting in the queue waiting. Nothing was claimed done that wasn't. The user trusts what the report said because every "done" was something the user could verify by opening the file — and the user doesn't have to, because the system already did.

## Relationship to other parts of the system

- The **dashboard command buttons** (in `5.0_Founder_Dashboards/Indexes/1 - Open Proposals.md`) write the queue items this drains, carrying the crystallized `operation`. This skill is the consumer of what they produce.
- The **command-meaning specs** (`1.5_initiatives/centralized-agent-action-queue/02-command-meaning-specs.md`) are the source of truth for what each command authorizes. If an item's `operation` text is ever missing, fall back to the spec for that command.
- The **failure inventory** (`01-failure-inventory.md`) names the failures this drain is built to make impossible (F2 interpretation-chain, F3 completion-over-silent-failure, F5 stranded items, F6 wrong operation). Re-read it if extending this skill.
- This is the **action queue** (work → agents). It is distinct from the **review queue** (finished work → the user approval, seeded at `seeds/review-queue-centralized-approval.md`). Do not conflate them.
