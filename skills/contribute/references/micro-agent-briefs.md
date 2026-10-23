# Micro-Agent Briefs

Use these templates to delegate monotone edits with minimal context. Create one brief per agent. Do not append to a shared directions file.

## Template: Edit-Only Agent

Purpose:
- Make a single, scoped edit with zero extra exploration.

Brief:
"""
Task: [one sentence]
Files: [exact file paths]
Allowed tools: Grep (single file only), Read (single file only), Edit
Rules:
- Do not read or modify any other files.
- Do not run tests or build.
- Do not change formatting outside the specified edit.
- Stop after the edit and report file path + 1-sentence summary.
"""

## Template: String Update Agent

Purpose:
- Replace a visible string in one file.

Brief:
"""
Task: Update string in [file] from "OLD" to "NEW".
Files: [file]
Allowed tools: Read, Edit
Rules:
- Do not alter other content.
- Keep line wrapping unchanged where possible.
- Stop after the edit and report the exact line changed.
"""

## Template: Prompt Insert Agent

Purpose:
- Insert a short block near the top of a prompt file.

Brief:
"""
Task: Insert the provided block after the first paragraph in [file].
Files: [file]
Block:
[exact block]
Allowed tools: Read, Edit
Rules:
- Do not change any other sections.
- Keep ASCII only.
- Stop after the edit and report file path + confirmation.
"""
