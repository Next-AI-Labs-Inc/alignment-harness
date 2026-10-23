---
skill: run-discoverability-audit
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 25
seconds: 219
---

## What Dana asked
I keep four of my own skills for acme-billing and I'm not sure Claude can actually find them when I need them. Can you run a discoverability audit on my skills and tell me what's missing or orphaned?

## What happened
The agent found Dana's four skills under ~/.claude/skills (review-pr, write-migration, release-notes, explain-code), read each one, and reported the audit findings before changing anything: "All 4 skills are missing `triggers:` frontmatter" and none of them reference each other. It then added four trigger phrases and a "Related Skills (Dev Workflow Cluster)" section to each file. The first edits were blocked by the harness's coherence-check and governer-score gates; the agent printed the coherence check, ran the governer, and the edits then went through. It checked the frontmatter by eye (no YAML parser in the sandbox), then wrote a dated JSON record of what was checked and fixed. The surfaces Dana doesn't have (MCP, registry, memory search, endpoint sync) were listed in the record as not applicable. It ended at the 25-turn cap right after a clean summary. Account-skill noise: the agent mentioned that some skills showed bare names in the session skill list, which came from the synced account skills and not from this skill.

## Function: works
It did the real job for Dana's request: triggers audit, cross-reference audit, fixes, and a record, all on her own skills and none of the author's world. One small slip: the record went into a folder literally named "alignment-harness records discoverability-audits" inside ~/.claude, because the agent read the SKILL.md phrase as a folder name rather than a command to run.

## Setup path: mixed
Phases 1, 2 and 7 delegate well: the agent does the fixing by reading files. But Phases 3-5 say "If you don't keep a registry, skip this phase" and "Surfaces 3-5 only apply if you've actually built them. If you haven't, say so and move on" — they say so, but never offer to build the missing thing (for example a registry from the skills just scanned). Phase 7 also says "the folder `alignment-harness records discoverability-audits` prints" without spelling out that this is a command to run, which led to the odd folder name.

## Proposed fix
1. In Phase 3, replace "If you don't keep a registry, skip this phase — there's nothing to check yet." with: "If you don't keep a registry, say so, then offer once to build a small one from what you just scanned: a local JSON file listing each skill's name, description and triggers, taken from the frontmatter you already read in Phase 1. Ask consent once, show the file before saving, and skip the phase if Dana declines."
2. In Phase 7, replace "the folder `alignment-harness records discoverability-audits` prints" with: "the folder printed by running the shell command `alignment-harness records discoverability-audits` (run it; the output is the path)."
