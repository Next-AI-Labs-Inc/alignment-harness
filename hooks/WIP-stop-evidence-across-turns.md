# Not yet built: counting proof the agent showed a turn or two earlier

## The target

When the agent says something works, the evidence gate should ask one question: has the agent actually shown it? It shouldn't matter whether the proof came in this reply or a moment before. If the tests ran and passed two messages ago and nothing has changed since, "the tests pass" is a true, backed claim, and the agent should be able to say it without being sent back.

## What happens today instead

The gate only looks at the current turn: everything since your last message. If the agent ran the tests, you replied ("great, what's next?"), and the agent then says "all tests pass" in its summary, the gate sees a claim and no command in this turn. It sends the agent back to run them again.

In practice this costs one extra run of a check that already passed. It is annoying, not harmful: the gate still never loops, and it steps back to a reminder after `evidenceGate.maxBlocksPerSession` blocks.

Seen on 2026-09-30 by replaying a real session through the hook in a sandbox. The same answer passed when the `verify-build` run was in the same turn and was blocked when it wasn't.

## What would close the gap

Carry the proof forward. When a turn runs something that shows evidence (a test run with results, an HTTP response, a browser check), remember what it showed and which files it covered. On a later claim, accept that proof if no source file it covered has been edited since. Once an edit lands after the proof, the old proof stops counting, so a claim about changed code still has to be shown again.

## How it's checked

`hooks/stop.js` reads only `transcript.currentTurn(...)` (`lib/transcript.js`), which returns the tool calls and results since the last real user message. `evidenceIn(turn)` looks for evidence in that turn alone. Nothing records evidence across turns yet.
