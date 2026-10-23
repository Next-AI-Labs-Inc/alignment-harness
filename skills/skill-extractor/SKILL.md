---
name: skill-extractor
description: Scans markdown files across the codebase and converts documentation into searchable agent skills.
triggers:
  - "extract skill"
  - "skill from conversation"
  - "mine skill"
---

## BEFORE YOU START

BEFORE starting the creation of this skill, NAME the file you will read, Read this file end to end with no exceptions, Abide by it, THEN create the skill FROM it as the Seed.

The file is: `${CLAUDE_PLUGIN_ROOT}/skills/skill-file-create-pre-check-self-healing-protocol/SKILL.md`

# Skill Extractor - Mine Skills from Markdown Files

<command-name>extract-skills</command-name>

Automatically discover and extract skills from new or updated .md files across the codebase. Converts documentation into searchable, actionable agent knowledge.

## When to Use

- After adding new documentation files
- During periodic knowledge base refresh
- When onboarding a new repo or system
- When asked "what new skills exist?"

---

## Quick Start

```bash
# Find new .md files (last 7 days)
/skill-extractor --since 7d

# Extract from specific directory
/skill-extractor --path <frontend-repo>/docs

# Full scan (all .md files)
/skill-extractor --full
```

---

## What It Extracts

For each .md file, the extractor looks for:

| Pattern | Becomes | Example |
|---------|---------|---------|
| `# How to X` | Skill: "how-to-x" | "How to Deploy to Vercel" |
| `## When to Use` | Trigger patterns | "Use when deploying..." |
| Code blocks with commands | Executable steps | `npm run deploy` |
| `## Examples` | Usage examples | Real-world patterns |
| YAML frontmatter | Metadata | name, description, triggers |

---

## Extraction Algorithm

```bash
#!/bin/bash
# skill-extractor.sh

SINCE="${@:1:1}"; SINCE="${SINCE:-7d}"
SKILL_DIR="$HOME/.claude/skills"

echo "🔍 Scanning for new .md files (since $SINCE)..."

# Find recent .md files
git log --since="$SINCE" --name-only --pretty=format: -- "*.md" | \
  sort -u | grep -v '^$' | while read file; do

  if [ -f "$file" ]; then
    echo ""
    echo "📄 Analyzing: $file"

    # Extract title
    TITLE=$(head -20 "$file" | grep -m1 "^# " | sed 's/^# //')

    # Check for skill indicators
    HAS_HOWTO=$(grep -c "^## How to\|^# How to" "$file" 2>/dev/null || echo 0)
    HAS_WHEN=$(grep -c "^## When to Use" "$file" 2>/dev/null || echo 0)
    HAS_COMMANDS=$(grep -c '```bash\|```shell' "$file" 2>/dev/null || echo 0)

    # Score skill potential
    SCORE=$((HAS_HOWTO * 3 + HAS_WHEN * 2 + HAS_COMMANDS))

    if [ "$SCORE" -gt 3 ]; then
      echo "   ✅ High skill potential (score: $SCORE)"
      echo "   Title: $TITLE"
      echo "   Has 'When to Use': $([ $HAS_WHEN -gt 0 ] && echo 'Yes' || echo 'No')"
      echo "   Command blocks: $HAS_COMMANDS"
    else
      echo "   ⚪ Low skill potential (score: $SCORE)"
    fi
  fi
done
```

---

## Output Format

### Proposed Skills Report

```
🔍 Skill Extraction Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 <frontend-repo>/docs/DEPLOYMENT.md
   ✅ High skill potential (score: 8)

   Proposed Skill:
   - Name: deployment-guide
   - Triggers: "deploy", "vercel", "production"
   - Key Commands:
     - `vercel --prod`
     - `npm run build`
   - When to Use: "When deploying to production..."

   Action: Create skill file? [Y/n]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 <api-repo>/docs/WEBHOOKS.md
   ✅ High skill potential (score: 6)

   Proposed Skill:
   - Name: webhook-handling
   - Triggers: "webhook", "stripe event", "callback"
   ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary: 3 potential skills found, 12 files scanned
```

---

## Skill Template Generation

When a skill is confirmed, generate:

```markdown
---
name: {extracted-name}
description: Scans markdown files across the codebase and converts documentation into searchable agent skills.
---

# {Title from H1}

{Content extracted from source}

## When to Use

{Extracted from "When to Use" section or inferred from context}

## Quick Start

{Extracted code blocks}

## Source

Originally extracted from: {source_file_path}
Extraction date: {date}
```

---

## Integration with agent-find

Extracted skills automatically become searchable via `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`:

1. Skill file created in `~/.claude/skills/{name}/SKILL.md`
2. Next `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` query includes it in "📄 Markdown Docs" source
3. If registered to Agent Tooling Registry, appears in "🔧 Agent Tools"

---

## Directories to Scan

Priority order for extraction:

```
1. ~/.claude/skills/**/*.md         # Existing skills (check for updates)
2. */docs/**/*.md                   # Documentation folders
3. **/README.md                     # Project readmes
4. **/CONTRIBUTING.md               # Contribution guides
5. **/ARCHITECTURE.md               # System architecture
6. agent-swarm-mcp/**/*.md          # Swarm documentation
7. **/*.md (remaining)              # Everything else
```

---

## CLI Commands

```bash
# Recent files only
git log --since="7 days ago" --name-only --pretty=format: -- "*.md" | sort -u | grep -v '^$'

# Count skill indicators in a file
grep -c "^## When to Use\|^## How to\|^## Quick Start" path/to/file.md

# Extract frontmatter
head -20 path/to/file.md | sed -n '/^---$/,/^---$/p'

# Find files with high skill potential
find . -name "*.md" -exec grep -l "## When to Use" {} \;
```

---

## Automation

### Scheduled Extraction (Weekly)

If `~/.claude/skills/skill-extractor/extract.sh` does not exist, create it from the Extraction Algorithm above and make it executable (`chmod +x`).

```bash
# Add to crontab or launchd
0 9 * * 1 ~/.claude/skills/skill-extractor/extract.sh --since 7d >> /tmp/skill-extraction.log
```

### Git Hook (On Commit)

```bash
# .git/hooks/post-commit
#!/bin/bash
CHANGED_MD=$(git diff --name-only HEAD~1 -- "*.md")
if [ -n "$CHANGED_MD" ]; then
  echo "New/updated .md files detected. Run /skill-extractor to check for new skills."
fi
```

---

## Best Practices

1. **Don't over-extract** - Not every .md file is a skill
2. **Merge related docs** - Combine small related files into one skill
3. **Preserve source** - Always link back to original documentation
4. **Human review** - Confirm before creating skill files
5. **Dedupe first** - Check if skill already exists in `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`
