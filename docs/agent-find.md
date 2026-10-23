# agent_find — search the project's institutional memory

## What it's for
Before guessing what you mean, the agent can look up what already exists: your repository's docs and commit messages, your past Claude Code sessions for this project, the harness's own local records, and the harness's skills. It ships inside the plugin as its own MCP server (tool name `agent_find`), with no dependencies and no service to run. Many harness skills and the coherence check ("if unsure, search memory first") lean on it.

## Is it set up?
It starts with the plugin. By default it searches the folder Claude Code was started in. `/mcp` in Claude Code lists `agent-find` as connected.

## How to set it up
Optional: list your repositories in `agent-find.json` in the plugin's data folder (`alignment-harness paths`), e.g. `{"repos": ["/path/to/app", "/path/to/api"]}`. Optional semantic search and other details: `mcp/agent-find/README.md` in the plugin folder.

## Is it working?
From your project folder: `node <plugin folder>/mcp/agent-find/cli.js "something you wrote about before"`. Good output lists ranked results with where each came from. With almost nothing to search it says so plainly ("No institutional memory yet — searched N sessions, M docs") rather than pretending.
