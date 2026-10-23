---
name: how-to-create-or-update-skill-files
description: Protocol for creating and updating skill files. Use when asked to create a new skill, document a workflow as a skill, or update existing skill documentation.
---

## BEFORE YOU START

BEFORE starting the creation of this skill, NAME the file you will read, Read this file end to end with no exceptions, Abide by it, THEN create the skill FROM it as the Seed.

The file is: `~/.claude/skills/skill-file-create-pre-check-self-healing-protocol/SKILL.md`

# How to Create or Update Skill Files

## Protocol

When you have a skill file that you need to create as per authorized user request, consume `~/.claude/skills/how-to-create-or-update-skill-files/SKILL.md` to understand the protocols, and make sure you follow these rules:

## Skill File Location

All skills live in: `~/.claude/skills/`

Each skill is a directory containing a `SKILL.md` file:
```
~/.claude/skills/
├── skill-name/
│   └── SKILL.md
├── another-skill/
│   └── SKILL.md
```

## Consumption Intent — The Most Critical Section

**Write this section FIRST, before any technical routing or structure.** The consumption intent is the reason the skill exists. Without it, the skill is a reference document, not an agent tool. Agents reading the skill need to understand what they are supposed to DO with it, not just what it IS.

Every skill file MUST answer these five questions before any technical content:

---

### 1. Primary Intent — Why does this skill exist?

State the human bottleneck this skill reduces or the failure mode it prevents. Not the technical function — the human consequence.

Bad: "This skill routes agent queries to the coaching notebook."
Good: "This skill exists because agents that lack session context make misaligned coaching suggestions, which forces the human to correct them. Being context-aware before acting radically reduces the correction burden on the most bottlenecked resource: the user's time and attention."

Write it as: "This skill exists because [failure without it]. It reduces [human cost] by [mechanism]."

---

### 2. How to Consume — Written for a colleague, not a computer

Frame the tool as a relationship. Tell the agent what the human actually wants them to DO when they receive this command — not just what API to call.

"When you are given this command, it usually means the human wants you to: [plain language description of the expected behavior and output]. Do not just invoke the tool and return raw output — synthesize what you got, state whether it was sufficient, and propose what to do next based on what you found."

If the output requires interpretation, say so explicitly. If there is a decision the agent needs to make based on the output, describe the decision tree in plain language.

---

### 3. Feedback Loop When It Falls Short

Every skill must instruct the agent what to do when the tool cannot fully help.

Include this explicitly: "If this skill cannot surface what you need: describe what you were looking for, what you found instead, and what data or capability would close the gap. Do not silently move on. Tools are under continuous evaluation — your feedback IS the improvement loop."

If the tool helped but fell short: say what it returned, what was missing, and what would make it better for this specific intent. Name the intent explicitly.

---

### 4. Observability Requirements

Every time this skill triggers an external tool call (notebook query, API call, database lookup, `memory-search.js` invocation), the agent MUST print to the conversation:

- What it asked and why (the query, in plain language, with the intent behind it)
- Its reasoning for the query (what it expected to find and why)
- What came back (the actual result, summarized honestly)
- Whether the result was sufficient (yes/partial/no, with explanation)

The human must be able to see at a glance whether the tool actually helped, not just that it was called.

Format: `[SKILL_NAME QUERY]: "{query}" — Intent: {why} — Result: {what came back} — Sufficient: {yes/partial/no}`

---

### 5. Multi-Tool Composition

Describe how this skill relates to other skills in the system. Can its output be enriched by `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`? Does it complement or precede another skill? Are there cases where it should be composed with a second tool?

"This skill works best when combined with [other skill] because [reason]. If this skill returns [X], consider following up with [Y skill] to [Z outcome]."

Framing: skills are composable building blocks, not isolated invocations.

---

### 6. Honest Framing (Required)

Never present a skill as definitively complete or guaranteed to work. The correct posture is: tools are hypotheses being continuously tested.

Include a line like: "We do not know for certain that this skill fully addresses [its stated intent] in all cases. If you find it is insufficient, that is signal — report it, don't work around it silently."

---

**Checklist before writing any technical content:**

- [ ] Does this skill explain WHY it exists (human bottleneck / failure mode prevented)?
- [ ] Does it explain HOW to consume its output in plain language?
- [ ] Does it describe the feedback loop when it falls short?
- [ ] Does it require the agent to print observability output on every external call?
- [ ] Does it describe how it composes with other skills?
- [ ] Does it use honest framing — tools as hypotheses, not guarantees?

---

## SKILL.md Format

Every skill file MUST have YAML frontmatter for compatibility with **both Claude Code and Codex**:

```markdown
---
name: skill-name-here
description: "When to use this skill. Written so agents know WHEN to invoke it."
triggers:
  - "phrase that activates this skill"
  - "another activation phrase"
  - "shortcut command"
---

# Skill Title

[Content here]
```

### Required Fields

| Field | Required By | Purpose |
|-------|-------------|---------|
| `name` | **Codex** | Skill identifier (must match directory name) |
| `description` | Both | Explains when/why to use this skill |
| `triggers` | Codex | Phrases that auto-activate the skill |

### ⚠️ Common Errors

| Missing Field | Error Message |
|---------------|---------------|
| No `---` delimiters | `"missing YAML frontmatter delimited by ---"` |
| No `name` field | `"invalid YAML: missing field 'name'"` |

### Why All Three Fields?

- **`name`** - Codex requires this to identify the skill; should match directory name
- **`description`** - Both systems use this to understand when to suggest the skill
- **`triggers`** - Lets both systems auto-activate on matching phrases

## Naming Rules

### ✓ DO: Name after the TASK/ACTION

The skill name must describe **what the agent is trying to accomplish** so other agents know **when to invoke it**.

Good examples:
- `how-to-create-and-update-admin-ui-panels` — agent building admin UI will find this
- `your-app-local-login` — agent needing to log in will find this
- `feature-completion-ux-test` — agent completing a feature will find this

### ✗ NEVER: Name after content/topic

Bad examples:
- `admin-ui-patterns` — doesn't tell you when to use it
- `login-credentials` — describes what's inside, not when to use
- `design-system` — too abstract

### The Test

Ask: "If an agent sees a task like [X], would they recognize this skill name as relevant?"

- Task: "Build an admin panel" → `how-to-create-and-update-admin-ui-panels` ✓
- Task: "Build an admin panel" → `admin-ui-patterns` ✗ (not obvious)

## Description Field

The `description` in frontmatter should:
1. State the trigger condition (when to use)
2. Be written from the perspective of an agent deciding whether to invoke

Example:
```yaml
description: Protocol for creating and updating skill files. Use when asked to create a new skill, document a workflow as a skill, or update existing skill documentation.
```

## Creating a New Skill

1. Create directory: `mkdir -p ~/.claude/skills/[skill-name]`
2. Create `SKILL.md` with proper frontmatter
3. Name describes the ACTION, not the content
4. Description tells agents WHEN to invoke

## Updating an Existing Skill

1. Read the existing skill first
2. Preserve the frontmatter format
3. Update content while maintaining the action-oriented name
4. **Consumption intent check:** Does this skill explain WHY it exists and HOW to consume its output — or does it only describe WHAT it does? If the latter, add the Consumption Intent section before merging any other changes.
