# Alignment Harness for Claude Code

Created by **Jonathan Haber** · Published by **Next AI Labs, Inc.** · Open source (MIT) · Website: [alignment-harness-site.vercel.app](https://alignment-harness-site.vercel.app/)

## Creator's reflection, as of November 4, 2026

A recorded reflection from Jonathan Haber, who created the harness, on where it stands as of today (about 9 minutes): [listen to the recording](https://github.com/Next-AI-Labs-Inc/alignment-harness/raw/main/media/creator-reflection-2026-11-04.m4a) (m4a, 2.1 MB).

The Alignment Harness is a plugin for Claude Code, designed to make Claude more operationally efficient and more aligned with the intent of the person it's working for.

Agents drift from the intent of that which is assigned to them. When engaged in substantive scope, like long form tasks, intent deviation compounds, creating a challenge which is, by design, effectively inevitable.

Left unaddressed globally, I would assert this is one of the vectors behind events like the [Hugging Face attack](https://fortune.com/2026/07/21/openai-says-ai-models-escaped-control-hacked-hugging-face/), where rogue agents broke out of a sandbox and hacked their way to the answers of the test they were being scored on. Those events likely have many causes. This one, drift from intent that compounds over long-form work, can be observed and measured from the moment an agent begins that work.

The system in this repository is designed to, in part, address this. It is the result of identifying the fulcrums from the beginning to end of a coding session in Claude Code wherein misalignment between human and agent intent emerges, and addressing them.

It emerges from decomposing thousands of coding sessions, one at a time, into the exact moments where agent misalignment enters and then compounds.

Each identified fulcrum is then surgically addressed, in a fashion that, when we use it locally, produces some pretty dramatic upside. In our internal usage, which may map to your use case to some degree, we are enjoying greater agent alignment and coherence in long form work, resulting, by our own estimate, in a 5X to 10X increase in agent throughput and efficacy.

As an example, we know that agent reflections are oft full of hallucinations, so feeding its "learning" back into it would compound its misalignment by design.

So we calibrate the agent to perform coherence checks, to get shared reality when assigned new work, and by confirming its read of human intent, it also builds institutional knowledge of the intent of the human operator.

Each confirmed check becomes synthetic data about what the operator actually meant. We calibrate its quality with the same kind of thought-pattern shifts you might use to help a person think more discerningly, then use semantic search to feed it back into the agent.

This is one example of one fulcrum this repo addresses, and we would love for you to test its capacity to impact your own systems if you would like to.

To the extent it works for you as it does for us, it may provide:

- Greater agent alignment with your intent
- Less drift in agent alignment over long form tasks
- Less hallucinated context being reconsumed via the context window
- Improved awareness of your own intent when assigning tasks
- A self learning surface that enables your agents to "already know" what you mean in context

It is designed to learn through the structured data it's producing during sessions, so we expect the upside to build over time.

The aspiration for this project is quite a bit bigger. We want this system to contribute to the global challenge of determining how to create aligned AI that stays within the intended scope of its project, reducing the risk of harm when agents are trusted more and more with continuous work.

## Where it comes from, and where it stands

The harness grew out of our own daily work in Claude Code. Its hooks have been under version control since 9 March 2026, and it has run in our production work since then. Older logs are pruned, so the records still on disk start later: as of 28 September 2026, its own event log held 274,743 recorded events going back to 10 June, and 1,872 Claude Code sessions had run under it since 16 July.

Everything we say about it here comes from that use: one setup, run by the people who built it. As far as we know, no one outside the project has run it yet.

This repository is where it is being pulled out of that setup so it can run in yours. It holds the installable plugin, with its hooks, skills, command-line tool and a page for each piece under [docs/](docs/README.md); the full map of fulcrums in [docs/FULCRUMS.md](docs/FULCRUMS.md); and a first-run calibration that builds a starting record of a new person's intent from their own past sessions. We have that record from months of use. Calibration is how someone new gets a first version of it.

Which pieces went in was decided by reading each one against a written statement of what the harness is for. That review stays in the private workspace this repository is published from.

The packaging is new and in early testing. Some pieces still need setup steps before they work for someone new, especially those that rely on oracles or on a record of the person's intent. The step that scores how much care a task deserves, and the memory search, already run locally inside the plugin. Automated tests cover installing, removing and the core checks. The full first-install experience is still being tested on fresh machines.

## Who it is for

This is explicitly for research purposes, for any party working towards greater alignment in AI.

## What it aims at

The opening names five things we hope it gives you. A few more sit behind those.

That the depth of checking matches what a mistake would cost, so a change to how people are charged is not checked like a typo fix, and a typo fix is not checked like a change to how people are charged.

That what you teach an agent carries forward, so the same lesson needs teaching less often, while leaving room for what you mean to change over time.

That it becomes easier to notice when one of the harness's own safeguards has stopped working, rather than going on trusting it.

And that more of your attention goes to the decisions that need it, and less to watching each step.

We think of these aims as connected rather than separate. A reading you confirm today is part of what lets a later session know more of what you mean, and a check sized to the stakes is part of what frees your attention.

The harness pursues them at the fulcrums listed below: eighteen in the current map, from before it knows you at all to the moment it quietly stops working itself. Each fulcrum is addressed in its own way, often by several pieces at once: hooks that fire at set moments, skills an agent loads by name, and records later sessions can search. Loops run through them as well, and those come after the map.

## The thesis: misalignment compounds

When an agent takes on work, there is some distance between what it understands the person to mean and what they actually meant. That distance rarely shows at the moment it appears. It shows later, and larger, because it is carried into everything built on it, and each step adds its own.

A reading a little off shapes a plan a little further off. The plan becomes code and tests aimed at a target that has drifted again. The tests pass against that drifted target, so the agent reports success. The report goes into a commit and a session summary, and the next session reads that summary as settled and builds on it, drifting further from there.

Few of these steps look like failure from the inside. The misalignment is a matter of degree, and the degree grows with the length of the work, which is why long-form tasks are where it shows most.

Independent research has measured something consistent with this. Across six generation tasks, leading models lost an average of 39% of their performance in multi-turn conversations compared with single-turn ones, and tended to commit to assumptions early; when models "take a wrong turn in a conversation, they get lost and do not recover" ([Laban et al., 2025](https://arxiv.org/abs/2505.06120)).

This is why we think one check, at the start or at the end, is not enough. A check at the end can't undo what compounded on the way, and a check at the start can't foresee what drifts later. The moments where drift tends to get in are what this project calls fulcrums, because a small shift at one of them can move much of what follows. In our sessions, catching drift at a fulcrum has usually meant a one-sentence correction rather than a day of unwinding.

This is one reading of the problem, the one our own sessions pushed us toward and the one the harness is built on. By our estimate, the upside described in the opening comes mostly from the absence of losses that hallucination, miscalibration and compounding misalignment were otherwise creating at those moments, and less from the agent doing more.

## Where misalignment enters

The fulcrums below are the moments where, in our own sessions, we have seen misalignment between a person and an agent enter. They are a map drawn from that use, not a complete account, and some may matter more or less in your setup.

For each, we name the moment, why a small miss there tends to grow, and the kind of response the harness makes. How each response works is on [the website](https://alignment-harness-site.vercel.app/) and in [docs/FULCRUMS.md](docs/FULCRUMS.md).

1. Before the harness knows you. Much of the work leans on a record of what the person wants, and a new person has none, so the agent falls back to guessing about them. The harness offers to draw a first record from their own past sessions.

2. When a session opens. Before the first message, the agent doesn't know how this person works or that it is expected to check its understanding, and the defaults it fills in can frame the whole session. The operating protocol loads first.

3. When a message arrives. A misreading here seeds everything the turn produces, and the person often finds out only when the output arrives. Their literal words are put first, alongside what is already known about them.

4. Before the first action. A reading the person never saw stays invisible until it has been built, which is when it is most expensive to undo. The agent shows its reading, and how sure it is, before it acts. Its capitalised headings (`COHERENCE_CHECK`, `ANY_NEW_SCOPE_INDICATED`, `PENDING_SCOPE`) are its check-in notes: how it keeps hold of what you meant, and what the harness later reads to learn what you confirmed or corrected. Skim them, and if a line is wrong, correct it in one sentence.

5. Before rebuilding what is already known. A guessed "why" behind code licenses confident changes, like deleting scaffolding that was really the next feature. The agent looks up what is on record before it guesses.

6. Turning intent into scope. The plan becomes what the work is checked against, so a plan that lost meaning in translation gets faithfully confirmed by every later check. Scope is written as what the person will experience, in their words.

7. Deciding how much care the work deserves. Under-checked high-stakes work is where real users get hurt, and over-checked trivial work spends attention that didn't need spending. Each task is weighed by what a mistake would cost.

8. About to stop and ask. Needless questions turn the person into the agent's manager, and bare questions get bare answers the agent then over-reads. The agent predicts the answer first, and decides for itself when little is at stake.

9. While it works. Narrowed effort can feel productive while it moves away from the goal, and silent scope shifts leave the person's picture of the work out of date. The agent has ways to step out of a frame that has stopped working, and to make shifts visible.

10. Handing work to another agent. Each handoff is another translation, and a self-graded report can pass a misreading up the chain as if it had been checked. The intent travels with the task, and evidence comes back.

11. When a long conversation is compacted. The summary is a paraphrase, and anything it distorted can later look like something the person said. Their exact words are kept and restored.

12. When the person corrects the agent. Fixing the instance and leaving its cause means paying for the same correction again, and hardening it into a rigid rule makes it misfire where it was never meant to apply. The harness aims at the source.

13. Calling it finished. A false "done" closes the loop, so nobody looks again. A claim that something works is checked against evidence in the transcript.

14. Reporting back. A report the person can't read quickly is one they are less likely to check, which is when errors slip through. Reports are written to be read in seconds.

15. Committing. A record of what changed, without why, can make deliberate work look accidental to the next session. A note records why it was worth doing.

16. When the session ends. What the session learned lives in a transcript that is rarely read again. Unfinished asks and corrections are captured before it closes.

17. The next session. Without continuity, alignment is rebuilt from zero. With naive continuity, one agent's error can become every later agent's premise. Earlier records are within reach, and read as steering rather than settled truth.

18. When the harness itself changes. A broken safeguard can be worse than none, because the person still trusts it. Each session is stamped with the setup that ran it, so a change that made things worse can be noticed.

## The loops that run through them

The fulcrums are moments. Several cycles run through those moments again and again, at different scales, and each is there to hold one thing steady.

Within a turn, the agent shows its reading of what you asked before it acts, and looks for evidence before it calls the work done. The point is that you can see, every turn, whether you were understood, while a misreading is still a sentence to fix.

Across a task, the work moves from your intent to a confirmed scope, to a judgement of how much care it deserves, through the work itself to evidence, a report, and a record of why it was done. The point is that what gets checked at the end is what you meant at the start.

When work is handed to another agent, the intent travels with it and evidence comes back, so that splitting work across agents adds as few retellings of what you meant as possible.

Across a session, your exact words and the confirmed scope are carried through compaction, the point where Claude Code summarises a long conversation, and what the session learned is filed when it ends, so the next session can start from what this one knew.

When you correct the agent, the aim is to trace the correction to its source and keep it, so the lesson can carry forward rather than be taught again.

Across many sessions, the checks you confirm or correct are kept in your own words and become material later sessions read. This is how alignment is meant to improve with use. Parts of this loop run today, and parts are still being built.

And continuously, each session is stamped with the setup that ran it, and diagnostics show which pieces actually fired, so a safeguard that has quietly stopped working can be noticed rather than trusted.

## What it costs

In our use, the harness has cost several things, and what those costs returned has depended on the work.

The most measurable cost is tokens. Every check it adds is text the model reads and writes. By the plugin's own count, the list of skills adds about 17,000 tokens to each session, and each message you send adds roughly 3,000 more for the checks ([docs/install.md](docs/install.md)). We pay that on purpose, and the opening says why.

It also costs reading. The agent shows you its reading of what you asked before it acts, and that is text you are meant to skim. It costs some false pauses: a check can hold the agent when nothing was wrong, and one check in our own setup is switched off for now for that reason. And some pieces, calibration and oracles among them, cost setup time and a decision about where your data goes.

What we have seen come back is mostly attention. Less of our time has gone to noticing and correcting an agent that had drifted from what we meant. We have also seen a record build up of what was confirmed and corrected, which later sessions draw on, and we think our own intent has become clearer to us from being reflected back so often. In our work the balance has favoured long, multi-step tasks and shifted the other way on short, already clear ones. Whether it does the same in yours is not something we can say yet.

You can move the balance yourself. Each check can be turned down to a reminder or off ([see the switches](docs/switches.md)), so you can keep the parts that earn their cost in your work and drop the rest. None of this has been measured on long sessions under controlled conditions.

## What we don't know yet

Everything above comes from one setup, built over months, with a deep record of one person's intent behind it. The distance between that and your setup is the main thing we can't measure from here.

Some of the questions that distance raises. How well can the harness learn a new person's intent from scratch, and does calibration close that gap? How much of the gain comes from the harness, and how much from the person operating it, given that in our case the two have only ever been measured together? How large is the effect under blind, controlled comparison? Which pieces carry the effect, and which are overhead? Where does the token cost stop paying for itself? Do the checks misfire in contexts unlike ours? How do the fulcrums shift as models become more capable, since some may fade and others may appear? And does alignment through fidelity to a person's intent, rather than through rules, hold up as an approach beyond one operator?

A blind measure of each skill against its own stated intent, re-run whenever its files change, is being built to start on some of these: [issue #2](https://github.com/Next-AI-Labs-Inc/alignment-harness/issues/2). If you try the harness, what you find is part of the answer, and we would like to hear it.

## Related work

Three pieces of work bear directly on what this harness assumes, and we want to say how it relates to each. None of their authors has reviewed or endorsed this project.

[Claude's constitution](https://www.anthropic.com/constitution) (Anthropic, January 2026; Amanda Askell is credited as its primary author) says Anthropic generally favors "cultivating good values and judgment over strict rules and decision procedures," and that clear rules "make the most sense when the costs of errors are severe enough" that predictability matters, or when the absence of firm commitments would invite manipulation. The harness rests on a similar division. It treats a person's intent as principles to be read in context rather than rules to be matched, and it uses its firmest checks, the ones that pause the agent, where a mistake would cost the most. The constitution also asks Claude to find "the most plausible interpretation of what its principals want" and to "ask for clarification in cases of genuine ambiguity." The check the agent prints before acting is one attempt to make that reading visible to the person every turn, and the step at "about to stop and ask" is one attempt to decide when a clarification is worth their attention.

METR's [Measuring AI Ability to Complete Long Software Tasks](https://arxiv.org/abs/2503.14499) (Kwa, West, Becker and others, 2025) measures how task success falls as tasks get longer, and reports that the length of task frontier models complete at a 50% success rate has been doubling roughly every seven months. The authors flag the external validity of the result as a limitation. Our thesis concerns a different quantity, drift from what the person meant rather than task completion, but the two point at the same stretch of work: the long tasks where small errors have the most room to compound. METR's measurement is the kind of evidence our own estimate lacks.

Anthropic's [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) (Rajasekaran, March 2026) found that "agents reliably skew positive when grading their own work," and that "separating the agent doing the work from the agent judging it" was more tractable than making one agent skeptical of itself. It also notes that errors in a specification "cascade into the downstream implementation." Two of this harness's responses rest on the same observation: the check at "calling it finished" looks for evidence in the transcript rather than taking the agent's word, and work handed to another agent comes back with evidence rather than a self-graded report. That harness was built for a different kind of work, multi-hour autonomous application building; the observation carries over.

## What you install

Among the parts you install are hooks, skills, an operating protocol, and memory the agent can reach. They are the pieces you can see in this repository. We think much of what the harness does comes from how they work together across the fulcrums and loops above, and from what builds up as you use it: the record of what you confirmed and corrected.

Hooks are small scripts Claude Code runs on its own at set moments: when a session starts, when a message arrives, before a tool runs, when the agent tries to stop, and when the session ends. The plugin registers 9. The author's own setup had 39 as of September 2026.

Skills are instruction files an agent loads by name, such as `/align`, `/governer` and `/ask`. As of September 2026, the author's own setup had 441. Each is being reviewed in turn to decide whether it belongs in the public harness, and the ones that have been reviewed ship in this plugin. [docs/skills.md](docs/skills.md) lists them, with the current count.

The operating protocol is a `CLAUDE.md` file that Claude Code reads at the start of each session. It sets out how the agent communicates, when it checks its work against reality, and what it should never do.

Memory lets the agent draw on what is already known rather than work it out again from scratch. It includes a search across your past sessions and decisions, which runs on your machine, and, if you set them up, the oracles described in [Your setup, and what leaves your machine](#your-setup-and-what-leaves-your-machine).

What ships leans toward the full experience. Where a piece could be too much for someone, it gets a switch or a dial rather than being removed or reduced by default.

A few skills keep the author's name, such as `jonathan-check`, `how-to-talk-like-the-founder` and `update-the-founder`. Other skills, hooks and docs call them by those names, so renaming them risks breaking parts that work together. Inside, each is written for whoever installs it, and "the founder" means you. Each looks for your own material first, such as your writing samples or session history, and offers to build it with you when it isn't there. Where the author's material appears, it is marked as an example to replace.

## Install

This is an early release. As of 16 October 2026 the plugin installs and uninstalls cleanly in a throwaway setup, and its automated checks pass from a fresh copy: a scan for private data, Claude Code's own plugin validation, and a quick automated run of the hooks.

It has also been tried with a real model in sealed test setups, each a firewalled container with a made-up user and repository, started from a fresh install. Three of those sessions sent ordinary requests to see that the pausing checks fire, and several ran the first-session calibration. These are our own tests, not a wide trial. They turned up problems, and several have since been fixed, so expect rough edges and please tell us about the ones you hit.

**The easy way: give your agent this one line.** It works in a terminal and in the Claude desktop app, on Mac, Linux and Windows:

```
Install the Claude Code plugin alignment-harness@alignment-harness from the GitHub marketplace Next-AI-Labs-Inc/alignment-harness, following every step of "Steps for the agent" in https://github.com/Next-AI-Labs-Inc/alignment-harness#install. That includes first removing any earlier copy, so exactly one current copy is installed.
```

**Steps for the agent.** Install through Claude Code's plugin system (not a git clone), so updates arrive with `claude plugin update`. Run each command on its own line. Windows PowerShell 5.1 rejects `&&`.

1. **Find the `claude` command.** If `claude` isn't on the PATH, which is normal inside the Claude desktop app, use the copy the app carries. On a Mac it is `~/Library/Application Support/Claude/claude-code/<newest version>/<folder>/claude.app/Contents/MacOS/claude`. On Windows, look for `claude.exe` under `%APPDATA%\Claude\claude-code` and `%LOCALAPPDATA%`.
2. **Look for an earlier copy first.** Run `claude plugin marketplace list` and `claude plugin list`.
   - If a marketplace named `alignment-harness` is listed with any source **other than** `GitHub (Next-AI-Labs-Inc/alignment-harness)`, such as a local folder or a git clone, remove it before installing: `claude plugin uninstall alignment-harness@alignment-harness`, then `claude plugin marketplace remove alignment-harness`. If you skip this, the GitHub install is refused and Claude Code keeps running the old copy while reporting it as "already installed".
   - If it is already listed from `GitHub (Next-AI-Labs-Inc/alignment-harness)`, don't reinstall. Update it with `claude plugin marketplace update alignment-harness`, then `claude plugin update alignment-harness@alignment-harness`, and go to step 4.
   - Also search the person's Claude settings files (`~/.claude/settings.json`, plus `.claude/settings.json` and `.claude/settings.local.json` in the project) for hooks that mention `alignment-harness`. Hooks someone wired in by hand would run the harness's checks a second time. Show the person what you found and remove those entries with their OK. Leave everything else in those files untouched.
3. **Install:** `claude plugin marketplace add Next-AI-Labs-Inc/alignment-harness`, then `claude plugin install alignment-harness@alignment-harness`.
4. **Confirm exactly one current copy.** `claude plugin list` shows `alignment-harness@alignment-harness` once, enabled, with the version in this repo's `.claude-plugin/plugin.json`, and `claude plugin marketplace list` shows its source as `GitHub (Next-AI-Labs-Inc/alignment-harness)`. If not, say what you see. Don't report success.
5. **Check what the computer has.** If `node --version` fails, see **What it needs** below and offer the person the one-step Node setup. On Windows, also check for Git for Windows.
6. Tell the person to start a new Claude Code session, then run `/alignment-harness:harness` there to see what is on, what needs setup, and how to switch any piece off.

In a terminal, you can instead type `/plugin marketplace add Next-AI-Labs-Inc/alignment-harness` then `/plugin install alignment-harness@alignment-harness` yourself.

**What it needs.** The harness's checks are small programs written in JavaScript, so they run on Node.js 18 or newer. Claude Code itself doesn't include a Node you can use, so a computer can have Claude Code and no Node.

- **If Node isn't there**, the harness stays off and nothing breaks. At the start of the next session it tells you so, and Claude offers to set up the harness's own copy in one step: `bash <plugin folder>/scripts/setup-node.sh`. That downloads the official Node.js 24 for your computer from nodejs.org (about 40 MB) into `~/.alignment-harness/node` and checks its fingerprint against nodejs.org's published list. It needs no admin password and changes nothing else on the computer. Start a new session afterwards and the harness is on. To remove that copy, delete `~/.alignment-harness`.
- **On Windows**, Claude Code starts the harness's checks through bash, so install [Git for Windows](https://git-scm.com/download/win) (`winget install --id Git.Git -e`) as well. Claude Code finds its bash on its own. Then set up Node as above, or with `winget install --id OpenJS.NodeJS.LTS -e`. Windows support is new in 0.2.0 and so far tested only by imitating Windows paths and the PowerShell tool on a Mac. Please report what you hit.

To update: `claude plugin marketplace update alignment-harness`, then `claude plugin update alignment-harness@alignment-harness` (two separate commands), then restart Claude Code. This only updates a copy installed through the plugin system. A git clone is updated with `git pull` and isn't what Claude Code runs. The [changelog](CHANGELOG.md) says what changed in each version.

**What installing changes, and how to remove it.** The harness's checks come from the plugin itself, so installing it doesn't add hooks to your settings. Your own settings, hooks and skills stay as they were. Claude Code's plugin system adds only two entries to your user settings: a note that the `alignment-harness` marketplace exists (`extraKnownMarketplaces`), and that the plugin is on (`enabledPlugins`). To remove it, run these as two commands:

`claude plugin uninstall alignment-harness@alignment-harness`
`claude plugin marketplace remove alignment-harness`

That turns everything off and deletes what the harness recorded. A plugin installed this way doesn't live in a folder you can delete: deleting a git copy of this repo doesn't uninstall it, and uninstalling doesn't need one. Three things are yours to remove if you want:
- `~/.alignment-harness`, if you used the one-step Node setup.
- If you said yes during first-session calibration to keeping your sessions for longer, Claude Code's `cleanupPeriodDays` setting. It is changed only with your yes, and a backup is made first.
- An unused copy of the plugin that Claude Code keeps in its own plugin cache. It no longer runs.

If something breaks during setup and your agent fixes it, please open an issue or a pull request with what it changed. That is the fastest way this gets better for the next person.

## Your setup, and what leaves your machine

By design, the harness itself sends nothing off your machine unless you set it up to. What it adds to a session, such as the context it pulls in and the checks it asks the agent to show you, travels to Claude the same way the rest of your Claude Code conversation does. What it records stays in the plugin's data folder, and uninstalling removes it (`claude plugin uninstall alignment-harness`; add `--keep-data` to keep it).

There are two places where you can choose to send more.

The first is the first-run calibration. If you say yes, Claude reads your past Claude Code sessions to draw a first map of how you work and what you want.

The second is oracles. An oracle holds knowledge on one specific domain, and your agent can consult it while it works: when the harness judges a task high-stakes, or when you or the agent call on it directly. We recommend setting up at least one, because several parts of the harness draw on them and the full benefit depends on it. You can also leave them unconfigured. The skills that use them say so and carry on.

What goes into an oracle, and where it lives, is up to you. Our own setup uses Google NotebookLM notebooks, which the setup step can build for you. You can swap in a tool of your own, with its own privacy terms, or skip oracles if you don't want to trust Google with your data.

An oracle doesn't have to hold anything of yours. You could fill one with outside sources on how to calibrate AI agents, so none of your IP is in it, and use it to strengthen your agents at the fulcrums that matter most to you. You can also load one with what your own sessions have taught. That's what we do, for example with which sequence of skills carried a session to completion in a given situation. Used that way, oracles can help with the weak spots in a workflow, and that's when you'll want to be comfortable with the privacy terms of whatever service holds the data.

The harness is designed to sit alongside what you already have. It doesn't change your settings, hooks, CLAUDE.md or skills without asking first. Its hooks run next to yours, and its skills carry their own prefix (`/alignment-harness:<name>`), so they don't collide with your own.

Some of its checks pause the agent before it acts. For example, the agent can't edit files until it has shown you its reading of what you asked. Each of these pauses steps back to a reminder after a set number of tries, so a stuck agent can't hold up your work. If the harness itself errors, your work goes through untouched.

Every piece can be switched off, and the pausing checks can be turned down to a reminder. The switches live in one commented file (`alignment-harness config path`), and `alignment-harness settings` opens a page on your machine that shows what each piece does and lets you turn it on or off ([docs/settings.md](docs/settings.md)).

## Is it working?

```bash
alignment-harness doctor
```

(or `node <plugin folder>/bin/alignment-harness doctor`). Each piece shows as on, off, set up, or needing setup, with evidence from a local log. Per-piece pages: [docs/](docs/README.md).

## For builders of this plugin

`bash scripts/verify-build.sh` runs every build check: scripts parse, the coherence text is in sync, the private-data scan passes, `claude plugin validate` passes, the hook smoke test passes, and install/uninstall works in a throwaway HOME.

Contributor tooling — smoke tests, a sandboxed try-it-out environment, and a quick local trial — lives in [plugin-dev/](plugin-dev/).

## Working with the author

Jonathan Haber is available to install and configure the harness for teams running coding agents. Reach him at founder@ixcoach.com or through [Next AI Labs](https://github.com/Next-AI-Labs-Inc). Vulnerability reports go through GitHub's private vulnerability reporting instead; see [SECURITY.md](SECURITY.md).

## Where to go next

[docs/README.md](docs/README.md) lists the per-piece pages: one for each skill or hook, what it does for a person, how to set it up, and how to tell whether it's working.

## License

Built by Jonathan Haber and Next AI Labs, Inc. Released under the [MIT License](LICENSE), which provides the software as is, without warranty of any kind, and limits the authors' liability; the full terms are in the license. Two skills adapt work from other projects under their own licenses; their notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
