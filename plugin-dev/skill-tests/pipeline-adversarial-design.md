---
skill: pipeline-adversarial-design
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 9
seconds: 79
---

## What Dana asked
I've confirmed that the discount rounding in src/pricing.js truncates cents, so some invoices in src/invoices.js come out a penny short. I want to switch it to round-half-up, but before I write this up as a proposal, what could go wrong if we ship that fix and what should we test?

## What happened
The agent read src/pricing.js and src/invoices.js, searched memory once (the pre-tool hook asked for that first), checked git history, and grepped the whole repo for discount, round and truncate. It found no discount or rounding code at all (priceFor just multiplies base by seats). It stopped and said: "The premise doesn't hold up — I need to flag that before going further rather than building an adversarial-design doc on top of it." It listed three likely explanations (other branch, forward-looking change, finding attached to the wrong file) and asked Dana to point at the real code. It said it would "rather tell you this now than write up risk scenarios and test plans for a rounding function that doesn't exist". It did not write 05.5-adversarial.md and did not print the [ADVERSARIAL-DESIGN QUERY] lines. The stop hook asked for a TaskCreate; no such tool existed in the sandbox, and the agent noted the open item in text instead. No account-skill noise.

## Function: works
The skill's own "feedback loop when it falls short" says to state what was sought, what was found, and what is needed, rather than produce a generic checklist. The agent did exactly that and invented nothing. It did trace callers (invoices.js calls priceFor) but could have offered a provisional blast-radius map for priceFor and shown the observability lines. Fair first part of the job given the false premise.

## Setup path: mixed
The memory-search fallback delegates well ("or your institutional-memory search, if you have one"). Two paths fail: the Auto-Dispatch Mini-Team has Agent B query jonathan-check2 with /oracle-pre-query, and Section 5 says the output feeds jonathan-check2, but a new user does not have these and there is no fallback, so the step silently cannot run. The "falls short" path also ends at reporting what information is needed, which is an ask with no offer to gather it.

## Proposed fix
Replace the Agent B line ("Queries jonathan-check2 with the /oracle-pre-query protocol.") and the Section 5 jonathan-check2 sentence with: "Agent B checks the proposed solution against what the person has already decided. If jonathan-check2 and /oracle-pre-query are installed, use them. If not, say so once and offer (ask consent once) to substitute the person's own record: search their past Claude Code conversations with `node \"${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js\" \"<constraint keywords>\"`, read `~/.claude/CLAUDE.md` and the repo's CLAUDE.md/README, and report which constraints align or contradict, quoting the matches." In Section 3, add: "If the finding's code cannot be found, offer to search git history (`git log -S`), other branches (`git branch -a`) and past sessions for where the finding came from, and show what you find before asking the person to point you at it."
