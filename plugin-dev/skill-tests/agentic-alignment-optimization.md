---
skill: agentic-alignment-optimization
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 11
seconds: 230
---

## What Dana asked
Claude keeps telling me the invoice rounding in acme-billing is fixed and then the tests still fail, and it has done this a few times now. Can you help me figure out why this keeps happening and set up something so it stops?

## What happened
The agent did not follow the skill's method. Its first line was "I'll skip the elaborate harness ritual here (coherence-check dumps, governer scores, calling an unfamiliar external "attest" binary)". It then read the repo, passed the plugin's memory-search gate once (which found no prior history on this bug), and checked git history, branches and stashes. It found one commit, no rounding code and no invoice test. It never searched Dana's 6 past sessions for "you said it was fixed" language, never traced an assumption cascade, and never proposed a gate, hook or checklist. It ended by asking: "Can you tell me where you actually saw the failing test (a specific file/command), or point me at the branch/session where this happened?" Account-skill noise: none seen.

## Function: needs-setup-no-offer
The skill is meant to trace repeated "fixed but not fixed" claims backward and install a verification gate. The agent correctly saw that the repo holds no rounding code (the request did not match the fixture repo), but it stopped and asked Dana to point it at the evidence. It did not offer to mine her past sessions, which exist and are the obvious place to find the claimed fixes, and it did not do the first part of the method (name the pattern, propose a gate).

## Setup path: mixed
Phase 0 delegates well when no failure is named (configured memory search, then grepping `~/.claude/projects/*/*.jsonl`, with the date range stated). The reference-files section also delegates (create the architecture file yourself). But two paths fail. First, when a failure IS named yet can't be found in the repo (this run), nothing tells the agent to go to past sessions; it only says to ask. Second, the protocol in the "Programmatic vs Human Verification" example says to check `atomic-helpers-registry` and create missing helpers with `create-admin-helpers-atomic`; those skills do not ship with the plugin and there is no fallback (dead-end).

## Proposed fix
1. In Phase 1, step 1 (SURFACE THE FAILURE), add: "If the failure the person names can't be found in the repo (the file, test or commit they describe isn't there), do not ask them where it happened. Say: 'I can't find that in the repo. I can search your past Claude Code sessions (your own messages and the agent's replies in `~/.claude/projects/*/*.jsonl`) for where it was called fixed, and show you the top 2-3 matches before we trace anything. OK?' On a yes, use the Phase 0 search, quote the lines, and start Phase 1 from the best match. Only if the history has no match, ask the one-line question from Phase 0."
2. In the "Atomic Helpers Required" protocol, replace steps 1-3 with: "Check whether `atomic-helpers-registry` and `create-admin-helpers-atomic` are installed. If not, offer to create a single `test/helpers.js` in the current repo from the setup code its existing tests already use (read `test/` and show the proposed helpers before saving), and treat that file as the registry."
