---
name: worktree-pr-workflow
description: When an agent has completed work, isolate it in a git worktree, commit, push, and open a PR for human review.
triggers:
  - worktree
  - pull request
---

# Worktree → Branch → Commit → PR Workflow

**Purpose:** Take your completed work product, isolate it in a worktree, commit it on a clean branch, open a PR, and clean up. The human reviews the PR.

**Announce at start:** "Using worktree-pr-workflow to isolate my changes and open a PR."

## The Workflow

### Step 1: Identify Your Changes

Before anything else, capture what you changed:

```bash
# From the main checkout
cd <repo-root>
git status
git diff
git diff --staged
```

Note every modified/added/deleted file. These are your work product.

### Step 2: Create a Worktree with a New Branch

```bash
# Branch name should describe the work (kebab-case, prefixed)
# Examples: fix/login-redirect, feat/dark-toast-animation, chore/cleanup-dead-routes
git worktree add .worktrees/<branch-name> -b <branch-name>
```

**Branch naming rules:**
- `fix/` for bug fixes
- `feat/` for new features
- `chore/` for cleanup/refactoring
- Keep it short but descriptive

### Step 3: Apply Your Changes to the Worktree

Copy your changed files into the worktree. The worktree starts as a clean checkout of the base branch, so you need to bring your work over:

```bash
# For each changed file, copy it over
cp <file> .worktrees/<branch-name>/<file>

# For deleted files, remove them in the worktree
rm .worktrees/<branch-name>/<file>

# For new files, copy them over (ensure parent dirs exist)
mkdir -p .worktrees/<branch-name>/<parent-dir>
cp <new-file> .worktrees/<branch-name>/<new-file>
```

**Alternative if many files changed:** Use `git diff` to create a patch and apply it:

```bash
git diff > /tmp/agentic-work.patch
cd .worktrees/<branch-name>
git apply /tmp/agentic-work.patch
rm /tmp/agentic-work.patch
```

### Step 4: Commit in the Worktree

```bash
cd .worktrees/<branch-name>

# Stage the specific files you changed (NEVER git add -A)
git add <file1> <file2> <file3>

# Commit with a clear message
git commit -m "$(cat <<'EOF'
<type>(<scope>): <short description>

<what changed and why — 1-3 lines>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

### Step 5: Push and Create PR

```bash
# Push the branch
git push -u origin <branch-name>

# Create the PR
gh pr create --title "<short title under 70 chars>" --body "$(cat <<'EOF'
## Summary
- <what this PR does>
- <why it's needed>

## Test plan
- [ ] <how to verify this works>

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Print the PR URL** so the human can review it.

### Step 6: Restore Main Checkout and Clean Up

```bash
# Go back to main checkout
cd <repo-root>

# Discard the uncommitted changes from the main checkout
# (they're safely committed in the worktree branch now)
git checkout -- .

# Remove the worktree (the branch and PR still exist)
git worktree remove .worktrees/<branch-name>
```

### Step 7: Report

Tell the human:
```
PR ready for review: <PR-URL>
Branch: <branch-name>
Changes: <1-line summary>
Worktree cleaned up.
```

The human reviews and merges the PR. You're done.

## Safety Rules

- **NEVER force push**
- **NEVER merge the PR yourself** — the human reviews and merges
- **NEVER use `git add -A` or `git add .`** — stage specific files only
- **NEVER skip the gitignore check** — `.worktrees/` must be in `.gitignore`
- **If `gh pr create` fails** (no GitHub CLI, auth issues), push the branch and give the human the branch name so they can create the PR manually

## Quick Reference

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `git status && git diff` | Know what you changed |
| 2 | `git worktree add .worktrees/<name> -b <name>` | Isolated workspace |
| 3 | `cp` or `git apply` | Bring work into worktree |
| 4 | `git add <files> && git commit` | Commit on clean branch |
| 5 | `git push -u && gh pr create` | PR for human review |
| 6 | `git checkout -- . && git worktree remove` | Clean up |
| 7 | Print PR URL | Human takes it from here |
