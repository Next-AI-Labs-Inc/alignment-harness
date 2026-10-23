---
name: review-proposal-greenlight
description: Implementation dispatch triggered by the user saying "build it" during a proposal review conversation. Creates worktree, implements, tests, opens PR. Invoked by /review-proposal — do not invoke directly unless in the context of a proposal review conversation.
triggers:
  - "build it"
  - "greenlight"
  - "build it"
  - "do it"
---

# Review Proposal — Greenlight Implementation

Triggered when the user greenlights a proposal during a `/review-proposal` conversation. This skill turns a reviewed proposal into a PR.

## Pre-flight Checks

Before writing a single line of code:

1. **Read the proposal file in full** to extract the implementation contract:
   - "What should happen instead" section = the intent
   - "Fix" or implementation section = the approach
   - "Verification" section = the completion criteria (these become the sprint contract)
   - "Dependencies" section = what else must be true

2. **Verify the affected area currently works:**
   - If coaching code: test that coaching is producing responses right now. Coaching is the conversion mechanism — fail-open always, leverage 100.
   - If payment/checkout code: verify checkout flow is not broken before touching it.
   - If auth code: verify login works before touching it.
   
   ```bash
   # Quick smoke test — adapt to the domain
   curl -s <your-api>/health | jq .
   ```

3. **Flag if current functionality could break:**
   If the fix touches a working critical path, say this before proceeding:
   > "This touches {area}. {Area} currently works. The fix could break it if {specific condition}. Proceeding with {specific safeguard I will use}."
   
   Do NOT ask permission — state what you're doing and proceed unless the user says stop.

## Sprint Contract

Before writing code, commit to this contract out loud:

- **Scope:** exactly what files will change and why
- **Verification commands:** the specific commands from the proposal's Verification section that will prove it works
- **Exit criteria:** what "done" looks like in the running product
- **What must NOT change:** any files outside the proposal's explicit scope

## Implementation

1. **Create git worktree:**
   ```bash
   git -C "$(git rev-parse --show-toplevel)" worktree add \
     "$(git rev-parse --show-toplevel)"/.claude/worktrees/{proposal-id-lowercase} \
     -b fix/{proposal-id-lowercase}
   ```
   Work exclusively in this worktree — never touch main branch files directly.

2. **Implement the fix** following the proposal's "What should happen instead" and "Fix" sections:
   - Stay within the proposal's scope. If you discover a related issue, note it, but do NOT fix it here.
   - Follow CLAUDE.md coding antipatterns — no console.log, no double-response, no missing return.
   - Use `logger.error` not `console.error`. Use structured logging throughout.

3. **Run the verification commands** from the proposal's Verification section.
   Read the output. Do not self-assess — report exactly what the commands returned.

4. **Open the PR:**
   ```bash
   gh pr create \
     --title "{proposal title from frontmatter}" \
     --body "$(cat <<'EOF'
   ## What this fixes
   
   {The "What is actually happening to real people" section from the proposal, verbatim or closely paraphrased}
   
   ## Verification
   
   {The output from running the verification commands}
   
   Resolves: {LP-XXX}
   Proposal: <api-repo>/docs/intent/1.7_proposed/{filename}
   EOF
   )"
   ```

5. **Update the proposal file frontmatter:** `status: greenlit`

6. **Report back:**
   > "PR opened: {URL}. {N} files changed. Verification: {pass/fail with the actual output you saw}. The proposal is marked greenlit."

## Safety Rails

- NEVER touch files outside the proposal's explicit scope. Scope creep invalidates the proposal as a contract.
- NEVER remove existing functionality to make a fix simpler. Per Operating Mind: "never fix errors by removing functionality" (leverage 95).
- NEVER force-push or skip tests. If tests fail, report exactly what failed — do not try to work around it.
- NEVER mark verification as "pass" without running the actual commands and reading the actual output.
- If implementation turns out to be significantly more complex than the proposal described: STOP. Report what you found to the user before continuing. The scope may need to change.
- If the worktree creation fails: check if a worktree for this proposal already exists (`git worktree list`). If it does, use it rather than creating a duplicate.

## When Implementation Uncovers a New Problem

Say exactly this structure:
> "While implementing {LP-XXX}, I found {what the new problem is, in human terms}. This is outside the proposal's scope. I'm continuing with the original fix. I'll log the new finding as a candidate for a separate proposal."

Then continue implementing the original scope. Log the new finding to `<api-repo>/docs/intent/1.7_proposed/` as a new LP if it's significant. If the `<api-repo>/docs/intent/1.7_proposed/` folder does not exist, create it.
