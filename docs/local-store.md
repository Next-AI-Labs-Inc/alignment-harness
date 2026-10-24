# Local record store

## What it's for
Many harness skills keep records: session compactions (what a session was for and what's left), intents and seeds, proposals, correction patterns, ledger notes about why work was done, voice samples. In one reference setup these went to a private server. Here they go to plain JSON files on your machine, one file per record, under the plugin's data folder — readable by you, by the skills, and by the built-in `agent_find` search.

## Is it set up?
Nothing to set up. The folder appears the first time a record is saved: `alignment-harness paths` → "records".

## How to use it
```bash
alignment-harness store add compactions --json '{"title":"...","intent":"...","incomplete":["..."]}'
alignment-harness store list compactions [--where status=open] [--limit 20] [--json]
alignment-harness store get compactions <id>
alignment-harness store update compactions <id> --json '{"status":"done"}'
```
Any word works as the kind (`proposals`, `intents`, `ledger`, `voice`, …). `--file <path>` reads the record from a file instead of `--json`.

Two kinds have their own command as well, if you want them. Your intent DB (what people should experience, "When …, then …") is `node <plugin folder>/skills/intent-db/intent.js`, kept in `records/intents/`. Your company intent DB (mission, strategy, pricing philosophy and the like) is `node <plugin folder>/skills/company-intent-db/company-intent.js`, kept in `records/company-intent/`, and the same intents are reachable from the `company_intent_search`, `company_intent_get`, `company_intent_list`, `company_intent_propose` and `company_intent_tree` tools on the bundled agent-find server. `store add company-intent` writes to the same folder (`records company-intents` is the same folder too). New intents wait as proposed until you approve them, and an agent's certainty on a proposal can't go above 50. Both are searched by `agent_find` and opened by `agent_read` like every other record.

## Is it working?
`alignment-harness store list <kind>` shows what's saved, newest first. The files themselves are in `<data folder>/records/<kind>/`. Uninstalling the plugin deletes them (use `--keep-data` to keep them).
