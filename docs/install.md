# Install and uninstall

## What it's for
Getting the whole harness on with one command, and off again without a trace. It never edits your own settings, hooks, CLAUDE.md or skills without your yes: Claude Code runs the plugin's hooks alongside yours, and the plugin's skills are namespaced (`/alignment-harness:<name>`) so they can't collide with skills you already have.

## How to set it up
One command (from a shell):

```bash
claude plugin marketplace add <this repository or folder> && claude plugin install alignment-harness@alignment-harness
```

Inside Claude Code you can instead run `/plugin marketplace add <source>` then `/plugin install alignment-harness@alignment-harness`. Start a new session afterwards.

Needs: Node.js 18 or newer (`node --version`). Without Node the plugin stays inactive and says so at session start, and Claude offers to run `bash <plugin folder>/scripts/setup-node.sh`, which puts the harness's own fingerprint-checked copy of Node in `~/.alignment-harness/node` (no admin password). The harness uses it from the next session. On Windows, also install Git for Windows: Claude Code starts the harness's checks through its bash.

Everything is on by default. Optional setup that makes it sharper: `/alignment-harness:harness-setup`.

Cost: the skill list adds about 17,000 tokens to every session (`claude plugin details alignment-harness` shows the breakdown), and each message you send adds roughly 3,000 more for the coherence check and alignment questions (`coherenceGate.injectFullRitualText: false` trims it). The author pays this deliberately for the alignment it buys.

## Is it set up?
- `claude plugin list` shows `alignment-harness@alignment-harness` as enabled.
- At the start of a session the agent receives a short `<alignment-harness>` note (you'll see the agent mention the harness when relevant).
- `alignment-harness doctor` — if the command isn't on your PATH, run `node <plugin folder>/bin/alignment-harness doctor`.

## Is it working?
`alignment-harness doctor` lists each piece as `[ok]`, `[off]`, `[setup]` (works, but optional setup would add something) or `[!!]` (a problem, with the fix). "hooks running" turns `[ok]` after your first session with the plugin enabled.

## Turn it off or remove it
- Pause everything: `claude plugin disable alignment-harness` (turn back on with `enable`).
- Turn down one piece: edit your switches file (see [switches.md](switches.md)).
- Remove: `claude plugin uninstall alignment-harness`. Claude Code deletes the plugin and its data folder. Add `--keep-data` to keep your switches, risk table and saved messages for a later reinstall. Remove the marketplace entry too with `claude plugin marketplace remove alignment-harness`.
