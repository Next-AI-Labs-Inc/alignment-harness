# Private-data scanner

## What it's for
The harness was extracted from one person's working setup. Before anything ships, a scan must prove that nothing private came along. `scripts/scan-private.js` fails the build (exit 1) if it finds, anywhere in the plugin: an API key, token or private key; the author's home folder or any real-looking `/Users/<name>/` path; the author's private API server address or its endpoints; a UUID-shaped id (notebook ids, keys) that isn't an obvious placeholder; an email address other than example.com/org; or any file it can't read as text; and it refuses files that must never ship (raw author writing samples, `VERBATIM.md`, backup files, `.env` files). It never prints a matched secret — only the rule, file, line and a masked excerpt. Two things are deliberately let through: the published contact address in `README.md` only (the same address anywhere else still fails), and `.DS_Store` folder metadata, which is ignored. Test fixtures should use ids with one repeated character per group (`aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`), which the scanner treats as obvious placeholders. It also warns (without failing) about mentions of the author's private product and tools, so what still reads as someone else's setup is visible.

## What the scanner cannot see
The scanner matches patterns. It cannot tell that a story, quote, incident or example came from a real person or a real product once its names have been changed. That is how real material reached shipped skills before: the importer (`scripts/import-skills.js`) only scrubs paths, ids, keys and emails, and anything reworded by hand slipped past both.

So the importer now has a guard, and a human step the scanner cannot replace:
- It never overwrites a skill that is already in the plugin. If the incoming text differs, it prints a diff, writes nothing, and exits with code 2. To accept the change, read the diff and re-run with `--overwrite`.
- A skill marked `reviewed` is skipped unless `--force` is given. `--force` only brings it into consideration; the diff and `--overwrite` rules above still apply. A skill that gets overwritten drops back to `mechanical` in `skills-manifest.json`, since nobody has read the new text.
- Every run ends with a reminder: before anything imported ships, a person or a model must read every worked example, anecdote and "from a real project" passage and confirm it is invented or neutral. Do not label an example "invented" unless it is.

## Skills must not contain `$1`-style positional arguments
This is a second check, `scripts/check-skill-arguments.js`, run by `scripts/verify-build.sh` as step 3b. It fails the build if any `skills/*/SKILL.md` contains `$1` to `$9` or `${1}`-style references.

Why: when a skill runs as a slash command, Claude Code replaces `$1`, `$2`, `$3`… in the skill's text with words from the person's request. It does that everywhere in the file, so a shell helper such as `local title="$2"` arrives with the person's word in place of `$2`, an awk program loses its field numbers, and even a dollar amount written `$1` in plain prose changes. The helper stops doing its job and nothing says so.

There are no exemptions: the replacement is textual, so a token inside a code fence, a comment or a regex is replaced just the same. The failure message says what to do instead: pass values through environment variables, or use `"$*"` for all of the arguments; avoid awk-style `$2` field references (use `cut`, `sort -k` or `jq`); write a dollar amount in words. `node scripts/check-skill-arguments.js --self-test` checks the checker on made-up skills (a shell helper, a braced `${1:-x}`, an awk field and a prose dollar amount must fail; `"$*"`, `$ARGUMENTS`, `$NF` and `$HOME` must not).

The first run on plugin master flagged five skills: `compact-agentic-session`, `declare-scope`, `extract-wip-from-past-sessions`, `pipeline-scope-guardian` and `skill-extractor` (19 occurrences). Those are fixed on lane B's branch, so step 3b fails on master until that branch merges.

## Is it set up?
It ships with the plugin; it needs only Node.

## How to use it
```bash
node scripts/scan-private.js            # scan the whole plugin
node scripts/scan-private.js skills/x   # scan one folder
node scripts/scan-private.js --json     # machine-readable
```
`scripts/verify-build.sh` runs it together with `claude plugin validate` and the other build checks.

## Is it working?
The last line says `SCAN PASSED` or `SCAN FAILED: N private-data findings`. To see that it really catches things, point it at a scratch folder containing a file with a made-up API key header (the header name followed by twenty letters and digits) — it must fail.
