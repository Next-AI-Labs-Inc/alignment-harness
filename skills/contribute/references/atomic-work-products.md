# Atomic Work Products

Use this file to group changes by intent so each group can stand alone as a commit/PR.

## Work Product Template

For each independent change, fill in a block like this before you start editing:

### <Letter>) <Short name of the change>

Purpose: <one sentence — what this change does and why it's worth sending upstream>

Files:
- path/to/first/file
- path/to/second/file

Eligibility: <bug fix (upstream PR-eligible) | feature (check the target repo's policy — often fork-only)>

Commit name (example): <type>: <short imperative description>

## Worked example (illustrative only — replace with your own)

### A) Fix off-by-one in the CLI's pagination helper

Purpose: The `--page` flag skips the last row of every page; this fixes the boundary check.

Files:
- src/cli/pagination.rs

Eligibility: bug fix (upstream PR-eligible)

Commit name (example): fix: correct off-by-one in pagination boundary check

## Grouping rules

- Group by single intent only.
- Avoid mixing unrelated concerns (e.g. UI strings and core logic) in the same commit.
- Keep each group small enough to revert without collateral changes.
