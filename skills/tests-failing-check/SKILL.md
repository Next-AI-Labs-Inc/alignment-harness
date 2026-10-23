---
name: tests-failing-check
paths: "**/*.test.*,**/*.spec.*,**/tests/**,**/__tests__/**"
description: Align intent vs actuality for a single failing test. Use when a user asks whether a failing test actually proves the intended behavior, and how to change the test or code so the intent is truly verified.
---

# Intent Actuality Test Alignment

## Overview
Provide a deterministic, intent-first workflow for one failing test so the user can see whether the test proves the code’s intended UX behavior and what change makes it do so.

## Workflow (single failing test)

### 1) Figure it out
Read the code path first and infer the intent of the code based on what you see.

### 2) Compare intent to test
Check what the test is intended to do against the actual code:
- What is the intent of the code based on what you see?
- What is the intent of the test?
- Does the test reflect the current code?
- Would the test need to be changed?

### 3) State code intent (UX terms)
State the intent of the code the test is testing, in UX terms.

### 4) State test intent (within that)
State the intent of the test within the code’s UX intent.

### 5) Map intent to code
Name the exact file + function that implements the intent.

### 6) Map intent to test
List the specific assertions the test uses to prove the intent.

### 7) Confirm alignment
State whether those assertions actually prove the intent.

### 8) If misaligned, specify the test change
Propose the precise change to the test so it proves the intent.

### 9) If aligned, specify the fix path
State whether the behavior appears broken and give the direct fix path.

### 10) Verdict
Close with a single-line intent vs actuality verdict.

## Output format
- Code intent (UX terms)
- Test intent (within that)
- Code path (file + function)
- Test proof points (bulleted assertions)
- Alignment verdict (1 sentence)
- If needed: Test change (1–2 sentences) or Fix path (1–2 sentences)
- Final verdict line: “Intent vs actuality: <aligned|misaligned> because <reason>.”
