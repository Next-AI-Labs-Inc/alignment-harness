---
name: harness-setup
description: "Guided, optional first-run setup for the alignment harness. Walks the person through each checkpoint — their own risk table, their writing voice, a memory search over their past work, optional oracles, and the dials — says what each step will do before doing it, and never changes anything without their yes. Use when the person runs /harness-setup, asks how to set the harness up, or a harness message says setup is unfinished."
---

# Harness setup — make the harness yours

The harness already works the moment it is installed: the coherence check, the governer score, and the evidence gate all run with general defaults. Setup makes it sharper by giving it the things only this person has. Every checkpoint is optional, and each one is explained before anything is done.

**How to run this:** go checkpoint by checkpoint. For each: say in one or two plain sentences what it is for and exactly what you will do (what you will read, what you will write, where), ask "shall I?", and only then do it. If they say skip or later, record that and move on. Never read their files or history before they say yes.

Record progress as you go: `alignment-harness setup mark <checkpoint> <done|skipped|later>` (see where things stand with `alignment-harness setup status`). If the `alignment-harness` command is not found, use the full path the session-start message gave you.

## Before the checkpoints — calibration

If the person has not answered the first-session calibration offer yet (`alignment-harness calibration status` says "not asked yet", or no decision), make it now: /alignment-harness:calibrate-understanding has the exact text and what to do for each answer. It is the one step that gives the harness some understanding of them from day one. If they already answered, don't ask again.

## Checkpoint 1 — check: is the harness running?

Run `alignment-harness doctor` and show the person the result in plain words: what is on, what is set up, what is working. If Node.js is missing or a hook error is listed, help them fix that first. Mark `check`.

## Checkpoint 2 — risk-table: which parts of your product are risky?

Tell them: "Before each task I rate how much could go wrong for your users, and use that to decide how carefully to work. To rate it well I need to know which parts of your product are risky — things like payments, sign-in, messages to users, or your core feature. Until you confirm, my scores are marked uncalibrated."

With their yes:
1. Read their repository for payment, auth, messaging and core-feature code (search for billing, stripe, checkout, auth, login, session, email, notification, and the main routes/screens). List what you found, with paths.
2. Offer — separately, as its own yes — to look through their past Claude Code sessions for this project (`~/.claude/projects/<this project>/*.jsonl`) for the areas they most often corrected agents on. First tell them how many session files there are and the date range (list the folder, don't read contents), then ask.
3. Propose a table: the general rows (see `alignment-harness risk-table show`) plus their core features, each with a one-line meaning in their words. Ask them to confirm or change each row, one at a time.
4. Write the confirmed table to the path printed by `alignment-harness risk-table path`, in the same shape as the default, with `"confirmed": true` and their features in `"coreFeatures"`. Show them the file.

From then on, scores say "calibrated". Mark `risk-table`.

## Checkpoint 3 — voice: how do you want to be talked to?

Tell them: "Everything I write to you follows a set of communication rules. They work best when they're grounded in how YOU write and what YOU find clear. A few paragraphs of your own writing — messages, notes, anything — lets me calibrate."

Options:
- **Their own samples (best):** ask them to paste a few paragraphs, or point to files. Save them to `samples.md` in the folder printed by `alignment-harness records voice`.
- **Sample voice for a first taste:** /how-to-talk-like-the-founder ships an opt-in example voice. Say plainly that it is someone else's voice, and they can replace it any time.
- **Skip:** the rules still apply in their general form.

Mark `voice`.

## Checkpoint 4 — memory-search: let the agent look things up before guessing

Tell them: "When I'm unsure what you mean, I can search your past conversations with me on this project and the notes in this repo before guessing. It runs on your machine, reads only text, stops after 3 seconds, and sends nothing anywhere. It is off until you turn it on."

With their yes, set in the switches file (path: `alignment-harness config path`):

```jsonc
"understanding": { "memorySearchCommand": "node \"<plugin folder>/scripts/memory-search.js\"" }
```

(`alignment-harness paths` prints the plugin folder.) If they already have their own memory or search tool, use its command instead — it must take the query as its last argument and print results. Test it once with a real query and show the output. Mark `memory-search`.

## Checkpoint 5 — oracles: optional deeper tools (NotebookLM notebooks)

Tell them what this adds: some harness skills (/insight, /oracles, /predict-required-skills, /jonathan-check2) can ask "oracles" — notebooks built from the person's own history, writing and decisions — questions like "which steps does this kind of task usually need?" or "how would I react to this?". Without them, those skills fall back to reasoning from local history and say so.

**Stop first: NotebookLM is a separate trust surface.** Before connecting it or uploading anything to it, say to the person, in plain words: "NotebookLM is Google's. Connecting it means trusting Google with the history that goes into the notebook. Do you want to connect it, or keep going with the memory search that ships with the harness, which keeps everything on your machine (or another system you already trust)? Nothing here needs NotebookLM." Wait for an explicit yes in that moment, for that notebook. Silence, or a general "set it all up", is not a yes. If they don't say yes, skip it and carry on. Once they have said yes, everything below works as written.

If they want it:
1. They need a NotebookLM account and a way for the agent to query it (a NotebookLM MCP server or command-line tool they trust). Help them install and sign in to it themselves — never handle their password.
2. Offer to extract material for each notebook from their own history (session transcripts, their writing, their decisions), showing what will be uploaded before anything leaves the machine, and asking for a yes per notebook.
3. Record the query command in the switches file, for example `"governer": { "predictRequiredSkills": { "oracleCommand": "<command that answers a question>" } }`.

If not, mark `oracles` as skipped — everything else keeps working.

## Checkpoint 6 — dials: how hard should each piece push?

Open the switches file with them (`alignment-harness config path`). Walk through the three gates in plain words:
- **Coherence check** — before changing anything after you speak, the agent writes what it understood. `block` / `remind` / `off`; steps back to a reminder after 3 blocks on one message.
- **Governer gate** — edits wait until the task has a risk score. `block` / `remind` / `off`; steps back after 3 blocks in a session.
- **Evidence gate** — the agent can't say "done, it works" without having run something that shows it. `block` / `remind` / `off`.

Recommend keeping everything on (that's the full experience) and turning a dial down only if something gets in their way. Mark `dials`.

## Finish

Run `alignment-harness doctor` again and show the difference. Then `alignment-harness setup mark complete done`. Tell them how to check any piece later: `alignment-harness doctor`, and each piece's page in the plugin's `docs/` folder.

## Undo

Everything setup writes lives in the plugin's data folder (`alignment-harness paths`). Uninstalling the plugin removes it. To undo one step, delete or edit the file it wrote.
