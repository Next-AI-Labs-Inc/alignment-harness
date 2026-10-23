---
name: contribute
description: Professional contribution workflow for upstream repos with a minimal token budget. Use when you need to split changes into atomic commits/PRs, preserve respectful credit to original authors, and delegate monotone edits to low-cost agents via short, precise briefs.
---

# Contribute

## Overview

Produce clean, respectful, atomic contributions with lean context by grouping work products, delegating monotone edits to micro-agents, and writing small, cherry-pickable PRs.

## Scope (MANDATORY)

This skill is ONLY for contributing to OpenAI’s Codex repository (the fork in `codex-main` that tracks `openai/codex` at `origin`). Do not use this skill for internal repos like `agent-swarm-mcp` or other ix repos.

When invoked, you MUST:
- Locate and follow the Codex repo’s `CONTRIBUTING.md` (repo-level path inside `codex-main`).
- Decide if the change is a bug fix (eligible for OpenAI contribution) or a feature (not eligible).
- If eligible: prepare the contribution per that `CONTRIBUTING.md`.
- If not eligible: follow the same professional atomic commit/branch flow, but commit/push ONLY to our fork so OpenAI can cherry-pick if desired (no PR to OpenAI).

## Workflow

### 1) Define atomic work products

- List the exact files changed and group them by intent.
- Keep each group independently reviewable and reversible.
- Use `references/atomic-work-products.md` for grouping patterns and current examples.

### 2) Decide if micro-agents are needed

- Use micro-agents only for monotone, low-judgment edits.
- Create a separate prompt per agent; never append to a shared directions file.
- Use `references/micro-agent-briefs.md` to generate a strict, minimal brief.

### 3) Execute the edits

- Restrict file access to the scoped list.
- Use `apply_patch` for single-file edits.
- Stop after the edit and report only the result.

### 4) Split commits and branches

- One branch per atomic work product.
- One commit per atomic work product.
- Use `references/branch-and-pr-template.md` for exact commands and PR text format.

### 5) Document respect and ownership

- Keep OpenAI attribution intact.
- Phrase changes as extensions, not replacements.
- Include a short credit line in PR descriptions.

## Lean context rules

- Open only the files needed for the current atomic change.
- Avoid repo-wide scans unless the task requires them.
- Keep instructions under 10 lines per micro-agent.
- Do not modify core prompts unless explicitly asked.

## References

- `references/atomic-work-products.md`
- `references/micro-agent-briefs.md`
- `references/branch-and-pr-template.md`
