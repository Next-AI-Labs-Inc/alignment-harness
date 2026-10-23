---
title: Feature Completion UX Test Skill Guide
---

# Feature Completion UX Test Skill Guide

## Why this exists
The SKILL.md file is parsed with strict YAML front matter. Unquoted colons or special characters in `description` can break parsing.

## Do this when editing SKILL.md
1) Keep the front matter as valid YAML.
2) Quote `description` if it contains colons, dollar signs, or long sentences.
3) Avoid tabs; use spaces only.
4) Use plain ASCII unless the file already uses Unicode.
5) If you add a new key, keep it on one line unless you also quote it.

## Example (safe)
```yaml
---
name: feature-completion-ux-test
description: "End-to-end workflow: define intended UX, set conditions, execute, verify logs."
---
```

## Quick check
If you see `invalid YAML` errors, start by quoting `description`.
