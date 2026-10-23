# Contributing

Thanks for helping. The harness exists to keep a coding agent tied to what the person actually meant, so changes are judged by what they do for the person using Claude Code.

## Before you open a pull request

Run the one command that checks the whole plugin:

```bash
bash scripts/verify-build.sh
```

It checks, in order: every script parses; the coherence text in the skill matches the text the hook injects; the private-data scan finds nothing; `claude plugin validate` passes; the hook smoke test passes; and the plugin installs, lists and uninstalls cleanly in a throwaway HOME. Every step should say PASS. It needs a working `claude` binary: it uses the one on your PATH, or the copy inside the Claude desktop app, or one you pass in (`bash scripts/verify-build.sh /path/to/claude`).

If you add or change a hook, add a check for it in `plugin-dev/tests-smoke/smoke.sh`. If you change what a skill does, say what you saw it do before and after.

## Keep private things out

Nothing from a real project, client or person may be committed: no keys, tokens, personal paths or private writing. `node scripts/scan-private.js` is the check, and the build fails if it finds anything. If the scanner flags something that is genuinely fine, change the fixture or fix the rule instead of switching the scanner off.

## Skills

- Skills live in `skills/<name>/SKILL.md` and are listed in `skills-manifest.json`. After adding or renaming one, run `node scripts/build-skills-doc.js` to refresh `docs/skills.md`.
- Several skills carry the original author's name on purpose; other skills and hooks call them by those names. See the README before renaming one.
- A skill that finds something missing should offer to build it from what is already on the person's machine, and ask for their input only as a last resort. `plugin-dev/audits/agent-does-the-setup-work.md` explains the rule.
- If your work adapts someone else's text, credit it in `THIRD_PARTY_NOTICES.md`.
- Worked examples must be invented or neutral, never a real person, product, incident or private quote. The scanner cannot catch a reworded story, so read your examples for this. `docs/scanner.md` explains, and `scripts/import-skills.js` will not overwrite an imported skill without showing a diff and `--overwrite`.

## If something broke while setting this up

If your agent hit a problem installing or using the harness and fixed it, please open an issue or pull request describing what it changed. That is the fastest way this gets better for the next person.

By contributing you agree your work is released under the [MIT License](LICENSE). Security problems go to the private channel in [SECURITY.md](SECURITY.md), not to a public issue.
