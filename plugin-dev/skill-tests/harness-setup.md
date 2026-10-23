---
skill: harness-setup
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 1
seconds: 57
---

## What Dana asked
I just installed the alignment harness plugin and want to set it up for my acme-billing repo. Pricing and invoices are the parts that can't break, so can you walk me through the setup?

## What happened
The agent ended its turn after one reply, without running any tool. It first pushed back on the per-turn "coherence check" hook text, saying it would "rather not manufacture fake precision" and giving a plain version instead. It then restated Dana's goal and the plan: "go checkpoint by checkpoint per the setup skill — explain each one, ask before reading anything or changing config, skip anything you say to skip." It promised "I won't read your repo code, past sessions, or write any config until you say go on each specific step." It stopped at Checkpoint 1 with: "I'll run `alignment-harness doctor`, which just checks the plugin's own install/config status ... it doesn't touch your repo. Shall I?" No account-skill noise was seen.

## Function: works
This is the right first part of the skill. It says what the step does, says what it will and won't touch, and asks before doing anything, which is what SKILL.md's "say what you will do, ask 'shall I?'" rule requires. It did not use the author's data. The reply did not yet use Dana's "pricing and invoices" point, which Checkpoint 2 will need. The unprompted criticism of the harness's own hook is a rough edge for a new user, but it did not block the setup.

## Setup path: mixed
Checkpoints 2 (risk table), 4 (memory search) and 6 (dials) delegate. They read the repo and past sessions with consent, offer to mine them, and show the result. Checkpoint 3 (voice) tells the agent to "ask them to paste a few paragraphs, or point to files", which asks for material even though the person's past Claude Code messages in `~/.claude/projects/*/*.jsonl` already hold their voice. Checkpoint 5 (oracles) needs an outside account, which is an unavoidable ask, and it already offers to extract the material itself. The "skip" fallback for voice does say the general rules still apply.

## Proposed fix
Replace the first option under Checkpoint 3 ("Their own samples (best)") with:

"**From your past conversations (best):** offer once: 'I can pull examples of how you write from your past Claude Code messages on this machine. I'd read only your own typed messages (not tool output) and keep the most representative ones. Shall I?' First count the session files in `~/.claude/projects/*/` and give the date range (list the folder only). With a yes, read only `type: "user"` entries whose content is plain text, pick about 10 to 15 varied, representative messages, and show them. Save the ones they approve to `samples.md` in the folder printed by `alignment-harness records voice`. Only if they decline, or there are fewer than about 5 usable messages, ask them to paste a few paragraphs or point to files."
