---
name: workload-status-check
description: Post-implementation status check that validates UX gap, confirmations, and file audit.
triggers:
  - "status check"
  - "workload status"
  - "-checkin"
  - "check your work"
---

# Workload Status Check

Run this after every completed workload to provide a structured handoff to the human.

## Format

### 1. UX Gap: Target vs Reality

State the UX gap conversationally in the context of the user journey:
- **Target**: What the user should experience
- **Reality (before fix)**: What was actually happening
- **What was done**: Summary of changes
- **Where we are**: Current state
- **What's next**: Outstanding items

### 2. Confirmations Checklist

Each item on its own line with emoji status. Do NOT combine distinct concerns on one line.

```
- [status] Problem isolation
- [status] Intent of client confirmed (UX version)
- [status] Consent attained on solution planned
- [status] Solution implemented
- [status] TDD implemented
  - List each new isolated functionality
  - Check off any WITHOUT TDD coverage
  - If skipped, explain in UX terms
- [status] TDD assumptions confirmed
- [status] Assumptions made during dev confirmed
- [status] Intent of existing functionality impacted confirmed
- [status] All mocks used follow new code strategy
- [status] No unauthorized functionality added, scope added, features added, or functionality removed
```

### 3. Files Changed

Sort by state with FULL paths and REPO name:

```
Unstaged:
- repoName : path/to/file.js

Staged:
- repoName : path/to/file.js

Committed (hash on branch):
- repoName : path/to/file.js
```

### 4. What's Next (for authorization)

List items that require human authorization to proceed.

## Rules

- If ANY confirmation is skipped, explain the failure in UX terms (how it affects what a user sees)
- Never place distinct concerns on the same line
- Always include the repo name after each file
- Always include commit hash and branch for committed files
