# agent_find (bundled)

A local "institutional memory" search, bundled inside this plugin. No external
services, no database, and no `npm install` required to get keyword search working.
It ships as its own MCP server (`server.js`) plus a CLI fallback (`cli.js`) that runs
the identical search when the MCP connection is down.

## What it's for

Before redoing work or re-deriving a decision, search what already exists:

- markdown docs (`*.md`, `*.mdx`) in your configured repo(s)
- `git log` commit messages in those same repos
- your own past Claude Code sessions for this project
- this harness's local records folder (whatever it has written so far)
- this plugin's own skills (`plugin/skills/*/SKILL.md`) — "what do I already know how
  to do"

Call it with `agent_find({ query: "..." })` from any tool-calling agent, or run
`node cli.js "..."` from a shell.

Every result carries a reference (`ref:record:…`, `ref:doc:…`, `ref:session:…`,
`ref:git:…`, `ref:/skill-name`). Open the whole thing with
`agent_read({ ref: "..." })`, or `node read-cli.js "..."` from a shell. It reads only
the places agent_find searches, a page of lines at a time (`offset`, `limit`).

## Is it set up?

Run this from anywhere:

```bash
node <path-to-plugin>/mcp/agent-find/cli.js "test query"
```

- If it returns a result (or an honest "no institutional memory yet" message) in a
  couple of seconds, it's working.
- By default it searches only the current working directory as a repo, your past
  Claude Code sessions for that directory, this plugin's skills, and whatever is in
  the harness's records folder. Nothing else is required.

## How to set it up further (all optional)

### 1. Point it at more than one repo

Create `agent-find.json` inside the plugin's data folder:

```json
{ "repos": ["/abs/path/to/repo-a", "/abs/path/to/repo-b"] }
```

The data folder is wherever `CLAUDE_PLUGIN_DATA` points (set automatically when
Claude Code loads this plugin). Without that config file, it defaults to searching
just the current working directory — never a guessed sibling folder.

### 2. Turn on semantic (synonym/paraphrase) search — optional

Keyword search works with zero setup. To also catch paraphrases and synonyms
("cost model" finding "pricing philosophy"), install the optional embedding model
into the plugin's own scratch space (not the plugin's own folder — this never ships
with the plugin):

```bash
mkdir -p "$CLAUDE_PLUGIN_DATA/agent-find" && cd "$CLAUDE_PLUGIN_DATA/agent-find" && npm install @xenova/transformers
```

If that package isn't installed, `agent_find` silently runs in keyword-only mode —
you'll see `(keyword mode)` in its output header. Nothing breaks either way.

### 3. A structured database — not included

This build intentionally does not wire up any database (MongoDB or otherwise). A
stranger's schema is unknown, and the point of this bundle is to work with only what
a fresh install actually has: their own repo and their own session history. If you
later want a structured "confirmed decisions" store searched the same way, that's a
separate, deliberate integration — not something this file guesses at.

## Is it working?

```bash
node cli.js "some real question about your project" --limit 5
```

Good output looks like:

```
Found 3 results for "..." (from 12 candidates) (keyword mode):
Hits: doc(2) | commit(1)

1. 📄 <heading of a real markdown file>
   62% | 3d ago | ref:doc:your-repo/path/to/file.md
   <first paragraph or snippet>

...
```

An empty or near-empty index says so honestly instead of just "Found 0 results":

```
No institutional memory yet for "..." — searched nothing yet. This grows as you
work: past sessions, your repo's docs and commits, and skills all become
searchable automatically. Nothing is broken; there is just nothing indexed that
matches this query yet.
```

## Files

- `server.js` — the MCP stdio server (JSON-RPC 2.0, no SDK). Exposes two tools:
  `agent_find` (search) and `agent_read` (open a result in full by its ref).
- `cli.js` — the same search, run from a shell. Use this whenever the MCP transport
  is reported down ("Transport closed").
- `read-cli.js` — the same as `agent_read`, run from a shell.
- `lib/read.js` — opens a ref, only inside the places agent_find searches.
- `lib/config.js` — resolves the repo list, data folder (the same one the hooks use,
  via `lib/core.js`), records folder, and session transcript folder. The only place any of this is configured.
- `lib/ranking.js` — the zero-dependency keyword ranking (rarity-weighted term
  coverage + a title/density tiebreak + recency decay). This is the "BM25-style"
  scoring; it needs nothing installed to run.
- `lib/vector.js` — the optional semantic layer described in step 2 above. Loads
  nothing and returns `null` if the optional dependency isn't present.
- `lib/sources/*.js` — one file per source (`doc`, `commit`, `skill`, `session`,
  `record`).
- `lib/search.js` — orchestrates the sources, scores and merges results, and caps
  the whole call at a ~4 second deadline so nothing can hang.
- `lib/format.js` — renders a result as plain text, including the honest empty-state
  message.
- `MCP-ENTRY.json` — the `mcpServers` object to merge into the plugin manifest. Not
  wired up automatically by this folder — the plugin's `.claude-plugin/plugin.json`
  owner does that.

## What's keyword-only vs optional

- Keyword search over docs, commits, sessions, records, and skills: always on, zero
  setup, zero dependencies.
- Semantic (embedding-based) search: optional, off until `@xenova/transformers` is
  installed into the plugin's data folder (step 2). Falls back silently to
  keyword-only.
- A structured database (Mongo or similar): not included in this build. See "3."
  above.
