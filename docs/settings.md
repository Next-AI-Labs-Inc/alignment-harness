# Settings page

## What it's for
One place to see every piece of the harness, what each one does for you, and to turn each one up, down, on or off, without opening a file. Every piece can be expanded to show what it does for you, what you'd notice if you turned it off, its dials, whether it's working, and the same change as a terminal command.

It's built for two readers at once:
- **You:** `alignment-harness settings` opens a page in your browser. Pieces are laid out in the order they show up in a session, with plain names and the purpose before the control.
- **The agent:** `alignment-harness settings list --json` prints the same list as data. For each setting it gives the name, current value, default, allowed values, what it does for you, its doc page and the command that changes it. The page is drawn from that same list, so the two can't disagree.

There is one source of truth: your switches file (`alignment-harness config path`). The page, `alignment-harness switch` and the agent all write it through the same writer. If you flip something on the page, the agent sees it. If the agent flips something, you see it on the page after a refresh. Changes apply from your next message.

## Is it set up?
Nothing to set up. It ships with the plugin and needs no extra packages.

## How to use it
- Open the page: `alignment-harness settings` (or ask the agent, or type `/alignment-harness:harness settings`). It prints an address like `http://127.0.0.1:<port>/?key=<one-time key>` and opens it in your browser. Add `--no-open` to only print it.
- List everything: `alignment-harness settings list` (readable) or `alignment-harness settings list --json` (for agents; add `--health` to include each piece's "is it working?" line).
- One setting: `alignment-harness settings get coherenceGate.strength`.
- Change one: `alignment-harness switch coherenceGate.strength remind` (the same as `alignment-harness settings set …`).

Prefer "remind" to "off" when a piece is only getting in the way: you keep the benefit and lose the friction.

### What the page will and won't do
- It changes only settings that already exist, and only to values each one accepts. Anything else is refused and your file is left alone.
- It edits your file in place. Only the characters of the one value change, so every comment stays. If you change something and then change it back, the file is byte-for-byte what it was.
- Writes are atomic, so a hook never reads half a file. If a change doesn't read back as intended, the previous text is put back.
- If your switches file has a mistake in it, the page shows it ("running on defaults until this is fixed") and won't write over the file. The hooks keep running on the defaults.
- Two settings are commands that run on your machine: `understanding.memorySearchCommand` and `governer.predictRequiredSkills.oracleCommand`. The page shows them but doesn't set them. Use `/alignment-harness:harness-setup` or the terminal.
- It never touches the headings the agent prints (COHERENCE_CHECK, ANY_NEW_SCOPE_INDICATED, PENDING_SCOPE) or the wording of the check. Those are a fixed shape the harness reads back, so they aren't settings.
- Turning any piece off lets work through. Nothing here can trap you.

### The capitalised headings in the agent's replies
When the coherence check is on, the agent's replies start with a few capitalised headings: `COHERENCE_CHECK`, then its reading of what you meant, ending with `ANY_NEW_SCOPE_INDICATED = TRUE` or `FALSE` and a `PENDING_SCOPE` list. These are the agent's own check-in notes. It writes them so it keeps hold of what you meant, and so a misread is caught in one sentence, before it builds on it.
- `COHERENCE_CHECK` marks the start of the check. The gate looks for it, and the learning loop collects it together with your reply.
- `ANY_NEW_SCOPE_INDICATED = TRUE / FALSE` says whether your message added work.
- `PENDING_SCOPE` lists every open thread, one line each, so nothing you asked for goes missing between turns.

They come in a fixed shape because the harness reads them back, so they are not settings and this page never changes them. Skim them; if a line is wrong, correct it in one sentence. The page explains them again inside the Coherence check entry.

### Not switchable here yet
These are shown on the page, each with the real way to turn it off:
- The "harness is on" note at session start: every other piece relies on it. It goes away with `claude plugin disable alignment-harness`.
- Remembering a subagent's task text: it only feeds subagent alignment, so turning that off is enough.
- The `agent_find` search server: Claude Code manages it (`/mcp`).
- Skills: view only for now. There isn't a supported way yet to switch off a single plugin skill.
- Everything at once: `claude plugin disable alignment-harness` keeps your settings.

### Scope read-back
`scope.showOnEveryMessage` shows the session's written scope (`alignment-harness compaction scope …`) back to the agent on every message, so the work keeps checking itself against what was agreed. `scope.certaintyGate` (default 90): below this certainty, the agent is told to reflect, state its best reading to you as a proposal, and carry on rather than stall.

### Local log
`telemetry.enabled` writes one line per check decision to `telemetry.jsonl` in the data folder. It stays on your machine. It's what lets `alignment-harness doctor` and the page's "Is it working?" lines answer with numbers.

### No prompts for harness bookkeeping
`permissions.allowHarnessCommands` lets the harness's own bookkeeping commands run without a permission prompt: `attest`, `score`, `status`, `doctor`, `contract add`, `contract list`, `contract replace` (fixing a broken check), `settings list` and `settings get`. They only read, or write inside the harness's data folder.

These still follow your normal Claude Code permission rules, on purpose, so you may be asked to approve them:
- `alignment-harness switch …` and `settings set …`: they can turn the agent's own checks down, so you see it happen.
- `contract remove`: it drops a check the agent promised.
- `contract verify`: it runs the check's command, which is your code.
- `alignment-harness settings` (opening this page): it starts a small local server and opens your browser.

The prompt comes from Claude Code, triggered because these aren't on the harness's pre-approved list (`hooks/pre-tool.js`). If you'd rather not be asked when you've just told the agent to change a setting, add an allow rule for it to the `allow` list in your own Claude Code settings file (`~/.claude/settings.json`), for example `"Bash(alignment-harness switch:*)"` (if the agent runs the command by its full `node …/bin/alignment-harness` path instead, the rule needs that form). That's your choice; the harness never adds rules to your settings.

## Is it working?
- `alignment-harness settings list --json | head` prints the list. If your file has a mistake, its `problems` field says so.
- On the page, each piece's "Is it working?" line comes from `alignment-harness doctor` and the local log.
- Safety: the page listens only on 127.0.0.1 and refuses requests without its one-time key or naming another host. It closes after 30 idle minutes, or on Ctrl-C.
