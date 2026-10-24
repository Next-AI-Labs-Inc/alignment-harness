# agent_find — search the project's institutional memory

## What it's for
Before guessing what you mean, the agent can look up what already exists: your repository's docs and commit messages, your past Claude Code sessions for this project, the harness's own local records, and the harness's skills. It ships inside the plugin as its own MCP server (tool name `agent_find`), with no dependencies and no service to run. Many harness skills and the coherence check ("if unsure, search memory first") lean on it.

## Is it set up?
It starts with the plugin. By default it searches the folder Claude Code was started in. `/mcp` in Claude Code lists `agent-find` as connected.

## How to set it up
Optional: list your repositories in `agent-find.json` in the plugin's data folder (`alignment-harness paths`), e.g. `{"repos": ["/path/to/app", "/path/to/api"]}`. Optional semantic search and other details: `mcp/agent-find/README.md` in the plugin folder.

## Is it working?
From your project folder: `node <plugin folder>/mcp/agent-find/cli.js "something you wrote about before"`. Good output lists ranked results with where each came from. With almost nothing to search it says so plainly ("No institutional memory yet — searched N sessions, M docs") rather than pretending.

## Opening what it found
Every result carries a reference, printed as `ref:` beside it, for example `ref:record:compactions/session-….json`. The agent opens the whole thing with the `agent_read` tool, passing that reference (`agent_read({ ref: "record:compactions/session-….json" })`). From a terminal it is `node <plugin folder>/mcp/agent-find/read-cli.js "record:compactions/session-….json"`. Long things come back a page of lines at a time, with the line to continue from. A reference only ever opens the person's own material: the harness's records, the configured repos' markdown docs and commits, this project's past sessions, and the plugin's skills.

## Where the records come from
When a session ends, the harness writes a record of it into the data folder (`records/compactions/session-<id>.json`) from the person's own messages, the files edited and the governer score, marked as automatic. When the agent writes its own record of the session with /compact-agentic-session (`alignment-harness compaction put`), that one is kept and the automatic one never overwrites it. Proposals, intents and the other records the skills keep sit in the same folder. All of them are searchable with agent_find and openable with agent_read, by the MCP tool and by the terminal fallback alike.

