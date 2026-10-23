# Alignment Harness for Claude Code

Created by **Jonathan Haber** · Published by **Next AI Labs, Inc.** · Open source (MIT)

Jonathan Haber has run Claude Code inside this harness in daily production work since March 2026: hooks, skills and a written operating protocol that act at each point in a session where an agent tends to drift away from what the person meant. That is the use it has had so far, all in the author's own work; the numbers in [Status](#status) show its scale. This repository is where the harness is being pulled out of his personal setup and documented so other people can install it. That extraction is in early testing; the harness itself is not.

In one sentence, what it does is:

**Make Claude more operationally efficient and aligned with human intent.**

## Who it is for

This is explicitly for research purposes, for any party working towards greater alignment in AI.

## What it is trying to accomplish

The aim is to let a person hand an agent real work and get back what they actually meant, without supervising every step and without having to re-teach the agent the same lesson every hour.

The harness does this by acting at many points across a session, not through one clever trick. It runs at every known fulcrum, from the start of a session to its end, so that agent misalignment gets caught before it cascades and compounds into misaligned work.

## The thesis: misalignment compounds

When an agent misreads what a person meant, it rarely fails at that moment. It fails later, and bigger. A misread message becomes a wrong plan, and the plan becomes code and tests written to the same wrong target. The tests pass, so the agent reports success. The report goes into a commit and a session summary, and the next session reads that summary as fact and builds on it. Each step inherits the error and adds its own.

This drift gets in at specific, recurring moments. This project calls them **fulcrums**, because a small shift at one of them moves everything after it. One check at the end can't undo what compounded on the way, and one check at the start can't foresee what drifts later. So the harness puts an intervention at each fulcrum, and tries to catch the drift while fixing it still takes one sentence rather than a day.

In daily production use, the harness has made building with Claude Code dramatically more efficient — by the author's own estimate from that use (an estimate, not a measurement), on the order of 5 to 10 times, and by the same estimate a session run without it gets roughly a fifth as much done before it goes off the rails, because it has to assume too much about what's wanted. The gain isn't the agent doing more; it's the absence of the losses that hallucination, miscalibration and compounding misalignment otherwise create at each point where a session can drift from what was meant.

## The fulcrums, in brief

The full map is in [docs/FULCRUMS.md](docs/FULCRUMS.md). For each fulcrum it covers what goes wrong as the person experiences it, how the error compounds, what the harness does at that moment, and which pieces act there. In session order:

1. **Before the harness knows the person.** A new user has no record of their intent yet, so every check that relies on memory starts empty. The first sessions build that record: the harness offers, once, to read the person's recent Claude Code sessions with a low-cost model and make a map of how they work and what they want. That ships as the calibration offer, the `alignment-harness calibration` command and the `calibrate-understanding` skill (see [docs/calibration.md](docs/calibration.md)).
2. **When a session opens.** The agent starts as a capable stranger. The operating protocol and three standing trigger rules load first.
3. **The moment a message arrives.** The person's literal words go first in the agent's context, relevant past context is pulled in, and the turn is scored for how much rigor it needs.
4. **Between understanding and the first action.** The agent prints a coherence check: its reading of the person's intent, with a certainty percentage. Editing tools stay blocked until it has done so; after a few blocks the block becomes a reminder, so a stuck agent can never lock you out. Its capitalised headings (`COHERENCE_CHECK`, `ANY_NEW_SCOPE_INDICATED`, `PENDING_SCOPE`) are the agent's own check-in notes. They're how it keeps hold of what you meant, so a misread is caught before it builds on it, and the harness reads them back later to learn what you confirmed or corrected. Skim them; if a line is wrong, correct it in one sentence.
5. **Before the agent rebuilds what is already known.** Past sessions, decisions and notes are searchable, so the agent doesn't have to guess the "why" behind code.
6. **Turning intent into scope and tasks.** Scope is written as testable statements of what the person will experience, and tasks keep the person's words.
7. **Deciding how much care the work deserves.** A step called the governer scores each task for how much a mistake would cost, and routes it to the matching depth of checks.
8. **When the agent is about to stop and ask.** It predicts the answer first, decides for itself if the stakes are low, and otherwise asks with the context and its prediction attached.
9. **While it works.** Rituals for stepping outside a frame that has stopped working, loops that run until the work is proven done, breadcrumbs that show when scope shifts, and guards that stop parallel agents from colliding.
10. **Handing work to a subagent.** The target experience travels with the task, and proof comes back instead of a self-graded report.
11. **When the conversation is compacted.** The person's exact words and the session's record are saved before Claude Code summarises the conversation, and put back afterwards.
12. **When the person corrects the agent.** The source of the error gets fixed, not just this instance, and the correction is kept for next time.
13. **Calling it finished.** A stop gate blocks "it works" when there is no verification output in the transcript.
14. **Reporting back.** Reports are short, in plain language, and show the result where the person can see it.
15. **Committing.** A ledger note records why the work was worth doing, not only what changed.
16. **When the session ends.** Unfinished asks, corrections, and the checks the person confirmed are captured before the transcript is forgotten.
17. **The next session.** It can reach what was already settled, and treats earlier agents' notes as steering, not truth.
18. **When the harness itself changes or silently stops working.** Sessions are stamped with the setup that ran them, and diagnostics show which hooks actually fired.

## The core loops

The fulcrums are moments. These are the cycles that run through them again and again.

- **Every turn: understand before acting, prove before calling it done.** The person can see every turn whether the agent understood them, and a misreading costs one sentence to fix.
- **Every task: intent, scope, rigor, work, proof, record.** What gets checked at the end is what the person meant at the start, and the depth of checking matches what a mistake would cost.
- **Every delegation: the why travels with the work, and proof comes back.** Splitting work across agents doesn't multiply misreadings.
- **Every session: open informed, survive compaction, close without losing anything.** The session that ends knows more than the one that started, and the next one can reach that.
- **Every correction: fix the source, not just the instance.** The person teaches something once, not every week.
- **Across sessions: the learning flywheel.** The checks the person confirms or corrects are captured word for word and turned into instincts, principles and notebooks that later sessions read, so alignment improves with use. Parts of this loop run today and parts are still being built.
- **Continuously: the harness checks itself.** A change that makes agents worse, or a piece that has quietly stopped firing, can be noticed.

## What it is made of

The harness has four kinds of parts:

- **Hooks.** Scripts Claude Code runs automatically at set moments: when a session starts, when a message arrives, before a tool runs, when the agent tries to stop, and when the session ends. 39 are registered in daily use as of September 2026, in the author's own setup.
- **Skills.** Instruction files an agent loads by name, such as `/align`, `/governer` and `/ask`. 441 exist in the author's own setup as of September 2026, and each is being reviewed in turn to decide which belong in the public harness; the ones that have been reviewed ship in this repository's installable plugin, and [docs/skills.md](docs/skills.md) lists them with the current count.
- **An operating protocol.** A `CLAUDE.md` file that Claude Code reads at the start of each session. It says how to communicate, when to check against reality, and what never to do.
- **Memory the agent can reach.** A search across past sessions and decisions, and optional **oracles**. An oracle is a Google NotebookLM notebook loaded with a person's own history, which the agent consults the way it would ask a colleague who remembers. Oracles send that history to Google, and only run if the person chooses it.

The design principle behind what ships: default to giving a new person the full experience, with a switch or a dial wherever something could be too much, rather than removing or dumbing a piece down by default.

**Why some skills carry the author's name.** Skills such as `jonathan-check`, `how-to-talk-like-the-founder` and `update-the-founder` keep the names they have in the author's daily setup on purpose. Other skills, hooks and docs call them by those names, so renaming them risks breaking a harness that works. Inside, each one is written for whoever installed it: "the founder" means you, the person the agent works for. Each looks for your own material first (your writing samples, your session history, your benchmarks) and offers to build it with you when it isn't there yet. Where the author's own material appears, it is labelled as an example to replace with yours.

## Status

**In daily use in the author's own work since March 2026; the extraction into an installable, public form is what's new, and that extraction is in early testing.** The harness itself has been running in production work since March 2026 (its hooks have been under version control since March 9). Older logs are pruned, so the records still on disk start later: as of 2026-09-28, its telemetry log alone holds 274,743 recorded events going back to June 10, and 1,872 Claude Code session transcripts have run under it since July 16.

What this repository already has:

- [docs/FULCRUMS.md](docs/FULCRUMS.md): the fulcrum map and core loops.
- A first-run calibration that builds a map of a new person's intent from their own past sessions: the offer, the `alignment-harness calibration` command and the `calibrate-understanding` skill. Many pieces lean on a record of what the person wants; the author has that from months of use, and a new person gets a starting version of it this way.
- This repository itself, `alignment-harness`: the installable plugin — hooks, skills, the CLI, and per-piece docs under [docs/](docs/README.md).

Which pieces go in was decided by reading each one against a written statement of what the harness is for; that review stays in the private workspace this repository is published from.

What's still being built, specifically because it is being pulled out of one person's machine to run on anyone's:

- **Portable versions of the remaining pieces.** The risk scorer and the memory search now run locally inside the plugin. Pieces that rely on NotebookLM notebooks, or on a record of the person's intent, still need setup steps.
- **Testing on fresh machines.** Automated tests cover install, removal and the core checks; testing the full first-install experience on fresh machines is under way.

## Install

This is an early release. As of 2026-10-16 the plugin installs and uninstalls cleanly in a throwaway setup, and its automated checks (a private-data scan, Claude Code's own plugin validation and the hook smoke tests) pass from a fresh clone. Sessions with a real model have also been run, inside sealed test rooms (a firewalled container with a made-up user and repository, started from a fresh install): three sessions of ordinary requests that checked the gates fire, and several runs of the first-session calibration, from 2026-10-16. They are the authors' own tests, not a wide trial, and they turned up problems, several of which have since been fixed. Expect rough edges in the packaging, and please tell us about them.

Inside Claude Code:

```
/plugin marketplace add Next-AI-Labs-Inc/alignment-harness
/plugin install alignment-harness@alignment-harness
```

Then start a new session and run `/alignment-harness:harness` to see what is on, what needs setup, and how to switch any piece off.

To update: `claude plugin marketplace update alignment-harness`, then `claude plugin update alignment-harness@alignment-harness`, then restart Claude Code. The [changelog](CHANGELOG.md) says what changed in each version.

To remove it: `/plugin uninstall alignment-harness@alignment-harness`. It leaves your own settings, hooks and skills as they were.

**If something breaks during setup and your agent fixes it**, please open an issue or a pull request with what it changed. That is the fastest way this gets better for the next person.

## It won't break your setup

- It never edits your settings, hooks, CLAUDE.md or skills without your yes. Its hooks run alongside yours; its skills are namespaced (`/alignment-harness:<name>`).
- Every piece has a switch and, where it could over-fire, a dial (`block` / `remind` / `off`) in one commented file: `alignment-harness config path`.
- `alignment-harness settings` opens a page on your machine that turns every piece on and off and shows what each does for you ([docs/settings.md](docs/settings.md)).
- Nothing traps you: every blocking gate steps back to a reminder after a few blocks, and any error inside the harness lets your work through.
- Everything it writes stays on your machine in the plugin's data folder.
- `claude plugin uninstall alignment-harness` removes it and its data.

## Is it working?

```bash
alignment-harness doctor
```

(or `node <plugin folder>/bin/alignment-harness doctor`). Each piece shows as on, off, set up, or needing setup, with evidence from a local log. Per-piece pages: [docs/](docs/README.md).

## For builders of this plugin

`bash scripts/verify-build.sh` runs every build check: scripts parse, the coherence text is in sync, the private-data scan passes, `claude plugin validate` passes, the hook smoke test passes, and install/uninstall works in a throwaway HOME.

Contributor tooling — smoke tests, a sandboxed try-it-out environment, and a quick local trial — lives in [plugin-dev/](plugin-dev/).

### The trade-off

The harness spends more tokens so that you spend less of your own attention. Every check it adds is text the model reads and writes, so a session costs noticeably more than plain Claude Code, and how much more depends on the work. What it buys back is the time you would otherwise spend noticing and correcting an agent that has drifted from what you meant. It is built for people who would rather pay for more tokens than manage the agent closely, and it pays off most on long, multi-step work. If you are working to a tight token budget, or your tasks are short and clearly specified, turn the checks down to reminders or off ([see the switches](docs/switches.md)); you keep much of the guidance at a fraction of the cost. The trade-off has not yet been measured on long sessions under controlled conditions.

## Working with the author

Jonathan Haber installs and configures the harness for teams running coding agents at scale. Reach him at founder@ixcoach.com or through [Next AI Labs](https://github.com/Next-AI-Labs-Inc). Vulnerability reports go through GitHub's private vulnerability reporting instead; see [SECURITY.md](SECURITY.md).

## Where to go next

[docs/README.md](docs/README.md) lists the per-piece pages: one for each skill or hook, what it does for a person, how to set it up, and how to tell whether it's working.

## License

Built by Jonathan Haber and Next AI Labs, Inc. Released under the [MIT License](LICENSE). Two skills adapt work from other projects under their own licenses; their notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
