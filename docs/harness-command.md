# /harness — the front door

## What it's for
One command for everything: `/alignment-harness:harness status` (every piece — on, set up, working, what it's waiting on), `setup` (guided optional setup), `settings` (opens the [settings page](settings.md), which turns every piece on and off and shows what each does for you), `on` / `off` / `remind <piece>`, `conflicts` (your own hooks or skills that already do a harness job, so nothing fires twice), and `uninstall`.

## Is it set up?
Nothing to set up. Underneath it are commands you can run yourself: `alignment-harness settings` (the settings page), `alignment-harness settings list` (every setting, what it does for you and the values it accepts; add `--json` for agents), `alignment-harness switch <setting> <value>` (edits your switches file in place, keeping its comments) and `alignment-harness conflicts` (read-only; never edits your settings). The agent finds settings by reading `settings list --json`, not from a list of its own.

## Is it working?
`alignment-harness doctor` includes a "duplicates of your own" line; if it lists anything, both copies are running until you turn one off.
