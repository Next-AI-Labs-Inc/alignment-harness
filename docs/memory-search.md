# Memory search

## What it's for
When the agent isn't sure what you mean, the best answer is often something you already said or decided. This lets the agent look before it guesses. The plugin ships a simple local search (`scripts/memory-search.js`): for the words in your message, it looks through your past Claude Code conversations for this project (only your words and the agent's words, never tool output) and the markdown files in your repository, and returns a few matching snippets with where they came from. It stops after about 3 seconds, writes nothing, and sends nothing anywhere.

## Is it set up?
Off by default, because it reads your past sessions. `alignment-harness doctor` → `memory search: not configured (optional)` or `configured`.

## How to set it up
Say yes at the "memory-search" checkpoint of `/alignment-harness:harness-setup`, or set it yourself in the switches file:
```jsonc
"understanding": { "memorySearchCommand": "node \"<plugin folder>/scripts/memory-search.js\"" }
```
(`alignment-harness paths` prints the plugin folder.) Any other tool works if it takes the query as its last argument and prints results.

## Is it working?
Run it by hand: `node <plugin folder>/scripts/memory-search.js "a phrase you used before"` from your project folder. You should see lines like `- past session 1a2b3c4d (user, 2026-09-01): …` or `- docs/notes.md: …`. In the agent's context the results appear in an `<institutional-context>` block; the local log records `MemorySearch` with the result length.
