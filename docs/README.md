# Alignment harness — documentation

Each page answers the same four questions about one piece: **what it's for**, **is it set up**, **how to set it up**, **is it working**. Start with the piece you're curious about; nothing here needs to be read in order.

The fastest check for everything at once: `alignment-harness doctor`.

## The pieces

| Piece | What it does for you | Page |
|---|---|---|
| /harness | One command: status, setup, the settings page, turn pieces on/off, find duplicates of your own hooks | [harness-command.md](harness-command.md) |
| Install / uninstall | One command in, one command out, nothing left behind | [install.md](install.md) |
| Switches and dials | One commented file that turns each piece on or off and sets how hard it pushes | [switches.md](switches.md) |
| Settings page | A page on your machine (and `settings list --json` for agents) that turns every piece on and off and shows what each does for you | [settings.md](settings.md) |
| Coherence check | After you speak, the agent says what it understood before it changes anything | [coherence-gate.md](coherence-gate.md) |
| Understanding loop | What the harness adds to each of your messages, and how your words survive compaction | [understanding-loop.md](understanding-loop.md) |
| Governer | A 0–100 risk score per task that every other gate reads | [governer.md](governer.md) |
| Evidence gate | The agent can't say "done, it works" without having run something that shows it | [evidence-gate.md](evidence-gate.md) |
| End of turn | The one-time hand-back, standing corrections, unrecorded requirements | [turn-end.md](turn-end.md) |
| Subagents, memory-first search, session end | Subagents start aligned; search memory before code; nothing lost at session end | [subagents-and-session-end.md](subagents-and-session-end.md) |
| First-session calibration | Offers once to learn how you work from your past sessions (and to index your plans), so the agent isn't starting from nothing | [calibration.md](calibration.md) |
| Setup | Optional guided setup: your risk table, your voice, memory search, oracles, dials | [harness-setup.md](harness-setup.md) |
| agent_find | Built-in MCP search over your docs, commits, past sessions and records | [agent-find.md](agent-find.md) |
| Memory search | Adds a few snippets from your past sessions and notes to each message (optional) | [memory-search.md](memory-search.md) |
| Local record store | Where compactions, proposals, intents and other records live on your machine | [local-store.md](local-store.md) |
| Skills | The approved skills that ship, and how they were made safe to share | [skills.md](skills.md) |
| Private-data scanner | The build check that fails if anything private would ship | [scanner.md](scanner.md) |

## Where things live

- The plugin's code: wherever Claude Code installed it (`alignment-harness paths` prints it).
- Everything the harness writes: the plugin's data folder, `~/.claude/plugins/data/<alignment-harness id>/` — your switches file, risk table, per-session scores, a local log, and your saved messages. It stays on your machine and is removed when you uninstall.
