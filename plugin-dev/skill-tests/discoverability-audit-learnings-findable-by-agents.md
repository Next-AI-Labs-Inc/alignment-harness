---
skill: discoverability-audit-learnings-findable-by-agents
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 6
seconds: 237
---

## What Dana asked
I just wrote a new skill for our acme-billing repo that explains how src/pricing.js calculates proration. Can you run a discoverability audit on it and tell me if other agents on my team will actually find it?

## What happened
The agent ran its coherence check, then searched the repo's `.claude/skills`, Dana's `~/.claude/skills`, the repo tree, git log and git status for the new skill file. It found nothing: no SKILL.md in the repo, no personal skill mentioning pricing or proration, a clean tree with one commit, and `src/pricing.js` has no proration logic at all. It stopped and said: "I can't find the skill you're describing, and I want to flag that before going further rather than auditing something that isn't there." It listed what it checked, offered three likely explanations, and asked: "Can you tell me where you saved the skill file (exact path), or paste its frontmatter?" It added that it did not want to "fabricate an audit result for something I can't locate" and had changed nothing. It did not invoke the Skill tool, and it did not reach for any account-skill or author-world material. The skill file it had to audit did not exist in the sandbox, so the discovery-surface steps were not exercised.

## Function: works
Given a premise that did not match the sandbox, the agent did the correct first part of the job: it located the artifact, found none, reported exactly what it searched, and declined to invent a passing audit. That matches the skill's own rule to never "invent a pass". It asked Dana only for a path, which is a minimal and fair ask. This run is a weak test of the later steps (triggers check, registry-skipped reporting, cross-referencing).

## Setup path: delegates
Surfaces 1 and 2 need nothing. Surface 3 (memory search) points to `/alignment-harness:harness-setup`, and Step 5 falls back to searching the repo docs, notes and `git log` while saying semantic search was not available. Surface 4 (registry) and Steps 3-4 say to skip when there is no registry and report it as "not checked", with a no-registry fix path that writes a skill file with `triggers:`. Nothing asks Dana to write or paste raw material, and nothing quietly works without saying so. The only ask is the artifact's location, which the skill leaves to the agent to find first.

## Proposed fix
None.
