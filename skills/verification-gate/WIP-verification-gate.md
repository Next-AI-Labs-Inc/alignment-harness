# Not yet built: catching an invented citation without anyone having to remember to ask

## The target

When an agent finishes a piece of research or analysis that cites specific files and line numbers, and hands that answer to a person to read and act on, those citations should already have been checked against the real files before the person ever sees them — automatically, every time, without the agent (or the person) having to remember to run a separate check.

## What happens today instead

The check that would catch an invented citation exists, but nothing brings it into a conversation on its own. It only runs if someone explicitly asks for it by name. Left on its own, an agent's confident-sounding but wrong citation — a file, or a line number, that doesn't actually exist — can reach the person unchecked, and be trusted as if it had been verified, when it never was.

An earlier version of this same idea, built for one person's own machine, tried to bring the check in automatically whenever a helper agent was handed a big enough piece of work. Looking at months of real usage, that automatic hand-off had never actually completed even once — the piece meant to trigger it and the piece that would do the checking were never actually connecting, so in practice a person relying on it had exactly the same unprotected gap as if the automatic version had never been built at all.

## What would close the gap

Attach the check to a moment that already reliably happens at the end of every turn, rather than trying to rebuild a hand-off that has a history of silently not firing. Have that moment scan the agent's own final answer for anything that looks like a specific file-and-line claim, and only then run the existence and content check — automatically, with nothing for the person or the agent to remember to invoke, and no dependence on a separate hand-off step that has to fire correctly first.

## How it's checked

`plugin/hooks/hooks.json` registers no `SubagentStart` hook at all, so nothing in the current plugin attempts the kind of automatic hand-off the original design relied on; `plugin/skills/verification-gate/SKILL.md` still only runs when a person or agent explicitly invokes it by name.
