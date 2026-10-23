# Branch + PR Template

Use these commands to split commits cleanly and keep upstream attribution intact.

## Branching and commit flow

1) Sync your fork's default branch with upstream

```
git checkout main
git fetch upstream
git merge --ff-only upstream/main
```

2) Create a branch per atomic work product

```
git checkout -b feat/<short-description>
```

3) Stage only the files for that work product

```
git add path/to/first/file \
  path/to/second/file
```

4) Commit with a precise subject

```
git commit -m "feat: <short imperative description>"
```

5) Repeat for the next work product

```
git checkout main
git checkout -b fix/<short-description>
git add path/to/other/file
git commit -m "fix: <short imperative description>"
```

## PR description (lean, respectful)

Title: [same as commit subject]

Body:
- What: [1 sentence describing the change]
- Why: [1 sentence about the problem it solves or the value it adds]
- Credit: Original project by its maintainers; this change is a small, focused extension/fix.

## Guardrails

- Do not modify LICENSE or NOTICE.
- Keep each PR cherry-pickable and reversible.
- Keep PRs small and focused.
