---
skill: smc-evaluator
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 8
seconds: 165
---

## What Dana asked
"I had an agent refactor the discount logic in src/pricing.js in ~/work/acme-billing earlier, and it told me it all went great. Can you give me an independent score on how well it followed my CLAUDE.md rules, not the agent grading its own work?"

## What happened
The agent went to the repo first to get real evidence instead of trusting the claim. It read src/pricing.js and the tests, then checked git history, branches, reflog, stashes and a full-history search for "discount". It printed the coherence check its hook required, then got past a memory-search hook. It then used the skill's Option A: it wrote Dana's CLAUDE.md rules and the repo facts into a prompt for a fresh subagent that had not seen any earlier agent's reasoning. The judge returned a score and the agent reported "Independent score: 8/100 (uncalibrated)." It added that "there's no refactor to grade": one commit by Dana, no discount code anywhere, so the "it all went great" claim was unverified. It did not say aloud that no evaluator notebook was configured. It did mention that the judge was a fresh subagent.

## Function: works
It did the skill's job for her request: an independent, rulebook-based score from a judge that never saw the working agent's reasoning, with each CLAUDE.md rule checked against evidence. It stayed in Dana's repo and used her rules, with no leakage of anyone else's data. The score was 8/100, which is harsh given the premise may simply be wrong, but the agent flagged the missing work clearly rather than inventing a critique. The skill's line "say so plainly (no evaluator notebook configured...)" was not followed verbatim; this is minor.

## Setup path: mixed
Option A works with no setup and is the default, which is good. The missing-notebook path is a plain-statement fallback to Option A, so it is not a dead end. But Option B's "upload your rulebook ... once" and the "Building your rulebook" section are written as things the person does ("mine your own past sessions", "show yourself the extracted patterns"). They never tell the agent to offer to do the mining itself, ask consent once, and show the result before saving. The "correction patterns" part of the rulebook is described as "ideally" present, but no path builds it for the person.

## Proposed fix
Replace the "Building your rulebook if you don't have one yet" section with:

"If the person has no correction patterns yet, offer to build them: 'I can read your past Claude Code sessions (`~/.claude/projects/*/*.jsonl`, your own messages only, using `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js"`) and pull out moments where you corrected an agent. OK?' On a yes, extract them, show the 5-10 clearest as drafts, and ask the person to confirm or reject each one before saving them next to their CLAUDE.md as the rulebook. If they decline, score against CLAUDE.md alone and say so."

And in Option B, change "upload your rulebook" to: "offer to assemble the rulebook file (CLAUDE.md plus the confirmed correction patterns) for the person to upload, and say plainly when it is not configured."
