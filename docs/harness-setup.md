# Setup (/alignment-harness:harness-setup)

## What it's for
The harness works the moment it's installed. Setup gives it the things only you have, one optional checkpoint at a time, and says what each will do before doing it:
1. **check** — runs `alignment-harness doctor` and fixes anything broken.
2. **risk-table** — which parts of your product are risky, confirmed row by row (makes governer scores "calibrated").
3. **voice** — a few paragraphs of your own writing, so the agent talks to you the way you find clear (or the author's samples as an opt-in first taste).
4. **memory-search** — lets the agent search your past sessions and notes before guessing (local, read-only, off until you say yes).
5. **oracles** — optional NotebookLM notebooks built from your own history for the skills that use them; skipped cleanly if you don't want them. Oracles send your history to Google, and only run if you choose it.
6. **dials** — a walk through the switches file.

## Is it set up?
`alignment-harness setup status` lists each checkpoint as done / skipped / later / not done. `alignment-harness doctor` shows the resulting state of each piece.

## How to set it up
In Claude Code: `/alignment-harness:harness-setup`. You can stop at any checkpoint and come back later.

## Is it working?
After setup, `alignment-harness doctor` should show the risk table as confirmed, and any optional pieces you chose as `[ok]`. Everything setup writes is in the plugin's data folder; uninstalling removes it.
