---
skill: principle-alignment-scanner-workflow
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 22
seconds: 148
---

## What Dana asked
Can you audit acme-billing against the coding rules in our CLAUDE.md and tell me which ones we are actually violating in src/pricing.js, src/invoices.js and src/auth.js? If there is no scanner set up for that yet, I am fine with you building a small one.

## What happened
The agent never loaded the skill by name; it worked from the request alone (the skill text was not consulted). It checked the repo for a CLAUDE.md and an existing scanner, found neither, and read the three source files, the README, the test and the git log. It found that the only rules in play were Dana's four global ones, and that they are process rules (small PRs, run tests, conventional commits, ask before changing pricing) rather than code antipatterns. It then built a small script, scripts/check-claude-rules.js, checking commit message format, pricing-file changes and diff size, ran it, fixed a stderr leak, and re-ran the tests. Its report said: "No violations in `src/pricing.js`, `src/invoices.js`, or `src/auth.js` themselves", explaining that none of the CLAUDE.md rules describe source-code antipatterns, and that it would not invent fake regex rules for them. The scanner did flag the one-line commit message as not conventional. The build was covered by Dana's own "I am fine with you building a small one", so no separate consent was needed. Account-skill noise: none reached for. The plugin's coding gate blocked the first Write until the agent ran the governer skill; that cost a few turns but it recovered.

## Function: works
For Dana's request the agent did the right first part of the job: it mapped the actual rules to what can be checked, built a minimal scanner only after confirming none existed, and gave an honest answer instead of inventing violations. Caveat: this ran without the skill text being invoked, so it shows the intent is reachable, not that the SKILL.md steps were followed.

## Setup path: mixed
The Prerequisites section handles a missing scanner by saying "Phase 2 needs you to build a minimal scanner first", which is the agent doing the work, but it never says to offer it and get consent once, nor to show the scanner before saving it. Phase 1 assumes a root CLAUDE.md "Coding Antipatterns" section and has no path for when that section or the file is missing, or when the rules are process rules (what happened here), so it is a dead end there. Phase 6b and 6c point to an "intent DB" and `/get-error-logs` / `/fix-error-logs`, which do not exist for a new user, and say nothing about skipping them. The fix-safety skill it references does ship in the plugin, and the known-fixed-errors registry is correctly marked optional.

## Proposed fix
1. In Prerequisites, replace the sentence starting "If your project doesn't have one yet" with:
"If the project has no scanner (no `.agent-warnings-config.json` and no script like `scripts/agent-code-warnings.js`), tell the person in one line that you can build a minimal one from their own coding rules, and ask once for a yes. On yes, build it (a Node script that reads a JSON rule list, regexes source files, prints violations with file:line), run it, and show the rules and first results before leaving it in the repo. Skip the ask if the request already says to build one."
2. At the top of Phase 1, add:
"Find the rules by mining, in order: the repo's CLAUDE.md (any 'antipatterns', 'never', 'rules' section), `~/.claude/CLAUDE.md`, README/contributing docs, and the person's own `~/.claude/skills/`. If none of these contain rules that describe source code, say so plainly, list which rules are process rules (commits, PR size, testing) and which are checkable in code, and offer to check the process rules against git history instead of inventing code rules. Never ask the person to type their rules out."
3. At the top of Phase 6b and 6c, add: "Skip this step if the project has no intent database or error-log tool; say it was skipped."
