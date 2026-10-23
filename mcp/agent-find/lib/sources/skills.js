'use strict';
// The plugin's own skills — plugin/skills/*/SKILL.md — as a searchable "what do I
// already know how to do" registry. A skill's frontmatter `description` is written
// to state WHEN to use it, in plain language, which makes it unusually good search
// text (ported idea from the private engine's searchSkills()).

const fs = require('fs');
const path = require('path');

let cache = null;

function loadIndex(pluginRoot) {
  if (cache) return cache;
  const skillsDir = path.join(pluginRoot, 'skills');
  const entries = [];
  let names = [];
  try { names = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch (_) { cache = []; return cache; }

  for (const name of names) {
    try {
      const file = path.join(skillsDir, name, 'SKILL.md');
      const content = fs.readFileSync(file, 'utf8');
      const descMatch = content.match(/^description:\s*(.+)$/m);
      const description = descMatch ? descMatch[1].trim().replace(/^["']|["']$/g, '') : '';
      const stat = fs.statSync(file);
      entries.push({
        source: 'skill',
        title: `/${name}`,
        body: description || null,
        timestamp: stat.mtime,
        searchText: `${name.replace(/-/g, ' ')} ${description}`.toLowerCase(),
        meta: { more: `/${name}`, skillName: name },
      });
    } catch (_) { /* no SKILL.md — skip */ }
  }
  cache = entries;
  return entries;
}

async function searchSkills(query, pluginRoot) {
  return loadIndex(pluginRoot);
}

function resetCache() { cache = null; }

module.exports = { searchSkills, resetCache };
