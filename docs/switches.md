# Switches and dials

## What it's for
One file controls every piece: an on/off switch for each, plus dials where something could fire too often ("block", "remind" or "off", and how many blocks before a gate steps back to a reminder). Every setting has a comment saying what it does. The defaults give you the full experience.

## Is it set up?
It sets itself up. On your first session the plugin copies the commented default into its data folder. `alignment-harness config path` prints where. Settings you leave out fall back to the defaults, so new settings added in later versions just work.

## How to set it up
The easiest way: `alignment-harness settings` opens a page that lists every setting with what it does for you and switches each one (see [settings.md](settings.md)). From the terminal: `alignment-harness switch <name> <value>`, for example `alignment-harness switch coherenceGate.strength remind`. Both change only that one value and keep every comment in your file. `alignment-harness settings list` shows every setting and the values each accepts.

Or open the file from `alignment-harness config path` in any editor and change values. Changes apply from the next message — no restart needed. To see the effective settings (your file merged over the defaults): `alignment-harness config show`.

The main dials:
- `coherenceGate.strength` — `block` / `remind` / `off`; `maxBlocksPerMessage` (default 3); `blockRoundMs` (2000: blocks arriving together count as one); `requirePrintedCheck` (true: an attestation needs a check the person was shown); `variant` — `control`, `per-item-96-escalation`, or `ab-test` (picks one at random per session and records which).
- `governer.gateStrength` — `block` / `remind` / `off`; `maxBlocksPerSession` (3); `criticalMassFloor` (80).
- `evidenceGate.strength` — `block` / `remind` / `off`; `editsNeedProofAtScore` (20); `contractsAtScore` (60); `maxBlocksPerSession` (6); `claimSensitivity` (`strict` / `normal`).
- `understanding.*` — what is added to each of your messages (see [understanding-loop.md](understanding-loop.md)), and the optional `memorySearchCommand`.

Wording can be tuned too: copy any file from the plugin's `prompts/` folder into `<data folder>/prompts/` and edit it there; your copy wins. In `per-message.txt`, a line wrapped in `{{#if <setting>}}…{{/if}}` is left out when that setting is off. That's how `understanding.injectAlignmentQuestions` and `understanding.injectTaskTracking` control their lines, so keep those markers if you edit a copy.

## Is it working?
If the file has a mistake (for example a missing comma), the harness keeps running on the defaults and says so: at session start the agent is told "Harness config problem …", and `alignment-harness doctor` shows `[!!] switches file` with the reason.

If the plugin's own default switches file (`config/switches.default.jsonc`) is missing or damaged, the harness does not stop working and does not show blanks: it uses the same defaults built into its code, `alignment-harness doctor` says so in plain words ("its own default switches file is missing, so it is using its built-in defaults: coherence check on, blocking; …"), and your own switches file still wins over them. Reinstalling or updating the plugin puts the file back. The built-in copy lives in `lib/core.js` (`BUILT_IN_SWITCHES`); a smoke test fails if it ever differs from the file, so change both together.
