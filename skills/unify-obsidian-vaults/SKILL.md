---
name: unify-obsidian-vaults
description: Unify scattered repo documentation into the one canonical Obsidian "intent" vault (<vault-repo>/docs/intent) via symlinks, with source-repo provenance rendered without editing source files. Use when repo docs are fragmented across repos and should be navigable/searchable from the single intent vault, or when an accidental second .obsidian vault config needs collapsing into the canonical one.
---

# Unify Obsidian Vaults Into The Canonical Intent Vault

## Intent (what this is for)

The user thinks in ONE Obsidian vault: `<vault-repo>/docs/intent` — the canonical
"intent" vault (~6,800 notes). Documentation that lives in other repos
(`<repo-a>/docs`, `<repo-b>/docs`, etc.) is invisible there, so institutional
knowledge is split across roots the user has to remember to open separately. That fragmentation
defeats the purpose of a single intent map.

This skill makes every repo's docs **visible and navigable inside the one canonical vault**,
each labeled with its source repo, **without copying files and without editing the source
files in their home repos**.

## The mechanism (and why each choice)

### 1. Symlink, don't copy

Obsidian follows directory symlinks. The intent vault already does this — it contains
`agent-skills -> ~/.codex/skills`. Extend that established pattern:

```bash
INTENT=<repos-root>/<vault-repo>/docs/intent
ln -s <repos-root>/<repo-a>/docs        "$INTENT/<repo-a>-docs"
ln -s <repos-root>/<repo-b>/docs  "$INTENT/<repo-b>-docs"
```

Symlinks (not copies) because copies go stale the moment the source changes; symlinks always
render current. Name the link `<repo>-docs` so the source repo is visible in every file's path.

**Before creating any symlink — verify no recursion.** If the target tree contains a copy of
the vault or a path back into `docs/intent`, Obsidian will loop. Check:

```bash
find <target>/docs -maxdepth 3 -type d \( -name intent -o -path "*<vault-repo>*" \) 2>/dev/null
```

Empty result = safe to link.

### 2. Provenance WITHOUT editing source files

The symlinked files physically live in their home repos. Writing `source_repo:` front matter
INTO them means editing thousands of files across other repos' git history and tripping their
pre-commit hooks. Don't. Instead provenance is carried two ways that touch zero source files:

- **Folder name** — `<repo-a>-docs/...` shows the source in every path (file explorer, search,
  graph, backlinks).
- **Folder note** — one `_index.md` (or a folder-note) per linked tree at the vault root
  declaring the source repo as a dataview-readable property. One authoritative provenance
  statement per source, impossible to get out of sync, survives source files changing.

Only `dataview` is enabled as a community plugin in this vault — the folder note uses dataview/
front matter the vault can already render. Do not require a new plugin.

The folder note lives in the vault (NOT in the symlinked tree — writing into the symlink writes
into the source repo). Place it adjacent:

```
docs/intent/<repo-a>-docs.md        ← folder note for the <repo-a>-docs/ symlink
docs/intent/<repo-b>-docs.md          ← folder note for the <repo-b>-docs/ symlink
```

with front matter:

```yaml
---
source_repo: <repo-a>
unified_from: <repos-root>/<repo-a>/docs
unified_via: symlink
note: "Provenance label. Files render from the source repo; not copied, not edited."
---
```

### 3. Collapse accidental fragmentation

An accidental second `.obsidian` config at a repo ROOT (e.g. `<vault-repo>/.obsidian`) means
Obsidian was once opened on the repo root instead of on `docs/intent`. That's the real
fragmentation. Remove ONLY the stray config dir, leaving the canonical `docs/intent/.obsidian`
as the single vault. Move to `.trash` rather than hard-delete for reversibility:

If the `docs/intent/.trash/` folder does not exist, create it.

```bash
mv <repos-root>/<vault-repo>/.obsidian \
   <repos-root>/<vault-repo>/docs/intent/.trash/stray-root-obsidian-$(date +%Y%m%d)
```

Never delete the root `.md` files — only the stray vault marker.

## Guardrails (the real risks)

- **Link-healing hook** (`<vault-repo>/scripts/heal-vault-links.js`) walks `docs/intent` via
  `readdirSync`. It heals `.md` cross-refs. Symlinked trees are followed by readdir; if the hook
  ever errors on a symlinked path, scope it to skip the `*-docs` symlink roots — do NOT disable it.
- **graphify** — after structural change run the code-graph rebuild noted in CLAUDE.md if the
  graph should reflect the new docs.
- **Never write into a symlinked path** thinking you're writing into the vault — you're writing
  into the source repo's git tree. Folder notes go at the vault root, beside the symlink.
- **Don't symlink `-cee` clone docs or `cypress/docs`** — those are snapshots / test fixtures,
  not thinking material. Unify curated `docs/` trees only.

## Verify

```bash
ls -la docs/intent/*-docs        # symlinks resolve, point at real dirs
# Open Obsidian on docs/intent → the <repo-a>-docs/ and <repo-b>-docs/ folders render
# Search a known <repo-a> doc title from the intent vault → it appears
```

Verification is "open the vault and see the folders render," not "the symlink command exited 0."
