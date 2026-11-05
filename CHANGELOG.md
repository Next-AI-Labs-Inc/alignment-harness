# Changelog

## 0.2.1 (2026-11-04)

Two more ways around the person's permission prompt are closed. Both were found in a review run on a Windows PC during the first live demo, and both were reproduced against 0.2.0 before fixing.

- **Mac and Linux: a command after the record text's first `EOF` line.** Bash ends the text the harness records at the first line that reads `EOF`, so anything written after that line runs as a command. The harness read the text as running to the last `EOF`, so it approved the whole thing without asking. Now, if the end marker appears early, the person is asked as usual.
- **Windows: a second command hidden behind `\"`.** PowerShell has no backslash escape, so `\"` ends a string there. The harness read it the bash way and missed a second command after it. Now a PowerShell command containing `\"` or curly quotes is never treated as "only a harness command" or "only reads", and it gets the person's normal rules.

Four tests keep these closed. The 0.2.0 code fails two of them, and the third is a guard for curly quotes, which 0.2.0 already handled.

## 0.2.0 (2026-11-04)

- **Security: no more silent approval of a command chained in front of the harness's own.** The harness lets its own `record` command run without a permission prompt. It used to recognize that command by "any path ending in alignment-harness", so `node x.js; rm -rf ~/Documents; alignment-harness record foo <<'EOF'` was approved as a whole. Now only the harness's own installed program, with nothing in front of it, skips the prompt. Affects Mac and Linux, where Claude's command tool is Bash. Reported from a review on 4 November 2026.
- **Windows: the checks run in the main conversation.** A Windows session path uses `\`, which made every main conversation look like a helper agent, so the understanding check never fired. Claude's `PowerShell` command tool is now understood the same way as `Bash`. A command that hides another inside `( )`, `{ }` or `@( )` is never treated as read-only.
- **No Node? One step to turn the harness on.** At session start the harness tells you it's off, and Claude offers `scripts/setup-node.sh`. It installs a fingerprint-checked Node.js 24 from nodejs.org into `~/.alignment-harness/node` with no admin password, and the harness uses it from the next session.
- README and install doc say what the harness needs on Mac, Linux and Windows.

## 0.1.0 (2026-10-17)

The first public release of the Alignment Harness for Claude Code, under the MIT license.

### What it is for

An agent working for you should stay tied to what you actually meant, say what it understood before it acts, take more care where more is at stake, and show proof before it calls something done. The harness puts a check at each point in a session where an agent tends to drift from that: when you send a message, before it changes something, when it hands work to a subagent, and when it says it is finished. Every piece has an on/off switch, and where a piece could fire too often it has a dial (`block`, `remind` or `off`). Nothing traps you: a gate that blocks steps back to a reminder after a few blocks, and an error inside the harness lets your work through.

### What is in it

- **Hooks** for session start, each message, each tool call, subagent start and stop, finishing, and session end (`hooks/`).
- **193 skills**, used as `/alignment-harness:<name>`, listed in `docs/skills.md`. A few adapt other people's work and are credited in `THIRD_PARTY_NOTICES.md`. Several keep the name they have in the author's own setup, because other skills and hooks call them by it; the README explains.
- **A local risk scorer** that rates each task and sets how much care the gates apply.
- **A local memory-search server** (`mcp/agent-find`) over your own repos, notes and past Claude Code sessions.
- **A command-line tool** (`bin/alignment-harness`) to check status, change a switch, and see whether each piece is set up and working.
- **Docs** for each piece in `docs/`: what it does for a person, how to set it up, how to tell it is working.

### How it was checked

As of 2026-10-16, `bash scripts/verify-build.sh` passes every step on the maintainer's machine: scripts parse, the coherence text matches between the skill and the hook, the private-data scan finds nothing, `claude plugin validate` passes, 80 hook smoke checks pass, and the plugin installs, lists and uninstalls cleanly in a throwaway HOME. Those checks cover install, removal and the core gates. They are not a test of the full first-run experience on a fresh machine, which is still being done.

On 2026-09-30 a model agent ran each of the 193 skills once in a sealed sandbox as a brand-new user and wrote up what happened (`plugin-dev/skill-tests/`). None has been confirmed by a person yet. That is one run per skill, not a measure of how often a skill works.

### Known limits

- The evidence gate counts only proof shown in the current turn. If the tests ran earlier and the agent says they pass after your next message, it is sent back to run them again. See `hooks/WIP-stop-evidence-across-turns.md`.
- The risk hint a subagent starts with comes from the session's score, not a fresh judgment of the subagent's task.
- Pieces built around NotebookLM notebooks, or around a record of your intent, need setup steps before they do anything.
- The first-run setup flow that builds a first map of a new person's intent is planned, not built.

### Security and housekeeping

- The memory-search server hands search words to `git` as arguments with no shell in between, so a query containing `;`, `$(` or backticks is only text.
- The skill importer shows a diff and refuses to overwrite an imported skill unless told to, and reminds the person that worked examples need a human or model read, because the scanner cannot see a reworded real story.
- The private-data scan runs as part of the build and covers keys, personal paths, ids and email addresses; the one published contact address is allowed in the README only.
- Reports of vulnerabilities go through GitHub's private vulnerability reporting (`SECURITY.md`).
