#!/usr/bin/env node
/**
 * Company Intent DB CLI — local-file store, no database or server required.
 *
 * Query and manage the Company Intent DB for strategic decisions,
 * company vision, mission, values, and organizational alignment.
 * Every intent is one JSON file in the folder `alignment-harness records company-intent`
 * prints (inside the person's own harness data folder), so agent_find searches it and
 * agent_read opens it. The same store backs the company_intent_* MCP tools.
 *
 * Usage:
 *   node company-intent.js find <query> [--tags a,b] [--category c] [--limit n]
 *                                             - Search company intents (canonical first)
 *   node company-intent.js get <slug|IX-###|slug1,slug2>
 *                                             - Get full intent details (one or several)
 *   node company-intent.js children <slug>    - List children of an intent
 *   node company-intent.js tree [slug]        - Get intent tree (full or from root)
 *   node company-intent.js related <slug>     - Parent, children, siblings, linked UX intents
 *   node company-intent.js promises <slug>    - Strategic promises of an intent
 *   node company-intent.js recent [n]         - Get n most recent intents (default: 5)
 *   node company-intent.js canonical          - List all canonical intents
 *   node company-intent.js category <cat>     - List intents by category
 *   node company-intent.js list [--category c] [--status s] - Every intent, any status
 *   node company-intent.js pending            - Proposals waiting for approval
 *   node company-intent.js help-needed        - Intents someone asked for help on
 *   node company-intent.js touch <slug[,slug]> - Refresh timestamp (boost in search)
 *   node company-intent.js brief <slug>       - Get compact brief for sub-agents
 *   node company-intent.js create '<json>'    - Create new intent (proposed status)
 *   node company-intent.js propose '<json>'   - Propose intent with certainty scoring
 *   node company-intent.js validate '<json>'  - Validate proposal without saving
 *   node company-intent.js update <slug> '<json>' - Change fields of an intent
 *   node company-intent.js approve <slug>     - Approve a proposed intent
 *   node company-intent.js delete <slug>      - Remove an intent
 *   node company-intent.js principle '<json>' - Log a principle {title, description, tags?}
 *   node company-intent.js request-help <slug> [note] - Flag an intent as needing help
 *   node company-intent.js file-meta <path>   - Get file metadata for evidence
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ci = require('../../lib/company-intents');

const CATEGORY_EMOJI = {
  mission: '🎯', vision: '🔭', values: '💎', strategy: '♟️',
  product: '📦', pricing: '💰', growth: '📈', culture: '🤝',
  market: '🏪', operations: '⚙️', other: '📋',
};

const [, , cmd, ...rest] = process.argv;

function flags(list) {
  const out = { _: [] };
  for (let i = 0; i < list.length; i++) {
    if (list[i].startsWith('--') && list[i + 1] !== undefined) { out[list[i].slice(2)] = list[i + 1]; i++; } else out._.push(list[i]);
  }
  return out;
}

function parseJson(text) {
  try { return JSON.parse(text); } catch (e) { console.log('❌ Invalid JSON:', e.message); process.exit(1); return null; }
}

function line(i) {
  const star = (i.tags || []).includes('canonical') ? ' ⭐' : '';
  return `${CATEGORY_EMOJI[i.category] || '📋'} ${i.title}${star}\n   Slug: ${i.slug} | Category: ${i.category || 'other'} | Status: ${i.status || 'proposed'}`;
}

function printFull(i) {
  console.log(`\n${CATEGORY_EMOJI[i.category] || '📋'} ${i.title}\n`);
  console.log(`Slug: ${i.slug}`);
  console.log(`Category: ${i.category || 'other'}`);
  console.log(`Status: ${i.status || 'proposed'}`);
  console.log(`Tags: ${(i.tags || []).join(', ') || 'none'}`);
  if (i.parentSlug) console.log(`Parent: ${i.parentSlug}`);
  console.log(`\nPrimary Intent:\n  ${i.primaryIntent}\n`);
  (i.stack || []).forEach((s, n) => console.log(`${n ? '' : 'Stack:\n'}  • ${s}`));
  (i.items || []).forEach((it, n) => {
    console.log(`${n ? '' : '\nItems:'}\n  [${n + 1}] ${it.statement}`);
    (it.therefore || []).forEach((t) => console.log(`      → ${t}`));
    (it.why || []).forEach((w) => console.log(`      why: ${w}`));
  });
  (i.strategicPromises || []).forEach((p, n) => console.log(`${n ? '' : '\nStrategic Promises:'}\n  WHEN: ${p.when}\n  THEN: ${p.then}`));
  (i.contracts || []).forEach((c, n) => console.log(`${n ? '' : '\nContracts:'}\n  ${c.name}: ${c.commitment || c.description || ''}${c.measuredBy ? ` (measured by ${c.measuredBy})` : ''}`));
  (i.linkedUxIntents || []).forEach((l, n) => console.log(`${n ? '' : '\nLinked UX intents:'}\n  ${l.relationship || 'relates'}: ${l.slug}${l.note ? ` — ${l.note}` : ''}`));
  if (typeof i.certaintyScore === 'number') console.log(`\nCertainty: ${i.certaintyScore}/100`);
  console.log(`\nUpdated: ${i.updatedAt || 'unknown'}`);
  console.log(`File: ${ci.fileFor(i.slug)}`);
}

function printTree(nodes) {
  if (!nodes.length) { console.log('  Nothing approved yet.'); return; }
  const walk = (n) => { console.log(`${'  '.repeat(n.depth + 1)}${CATEGORY_EMOJI[n.category] || '📋'} ${n.title} (${n.slug})`); n.children.forEach(walk); };
  nodes.forEach(walk);
}

function fileMeta(filePath) {
  try {
    const stats = fs.statSync(filePath);
    let gitHistory = [];
    try {
      const out = execFileSync('git', ['log', '--format=%H|%ai|%s', '--follow', '-5', '--', path.basename(filePath)], { encoding: 'utf8', cwd: path.dirname(path.resolve(filePath)), stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (out) gitHistory = out.split('\n').map((l) => { const [hash, date, ...m] = l.split('|'); return { hash: (hash || '').slice(0, 8), date, message: m.join('|') }; });
    } catch (_) { /* not in a git repo */ }
    const days = Math.floor((Date.now() - stats.mtime.getTime()) / 86400000);
    return { filePath, created: stats.birthtime.toISOString(), modified: stats.mtime.toISOString(), daysSinceModified: days, isRecent: days < 30, isStale: days > 180, gitHistory };
  } catch (e) { return { error: e.message, filePath }; }
}

function run() {
  const a = flags(rest);
  switch (cmd) {
    case 'find': {
      const q = a._.join(' ');
      const hits = ci.find(q, { tags: a.tags, category: a.category, limit: a.limit });
      console.log(`\n🏢 Company Intent Search: "${q}" (${hits.length} results)\n`);
      if (!hits.length) console.log('  Nothing approved on this yet. Proceed on your own best judgment, and say so.\n');
      hits.forEach((i, n) => console.log(`${n + 1}. ${line(i)}\n   ${String(i.primaryIntent || '').slice(0, 80)}...\n`));
      break;
    }
    case 'get': {
      const found = ci.get(a._[0]);
      if (!found || (Array.isArray(found) && !found.length)) { console.log('Not found:', a._[0]); process.exitCode = 1; break; }
      [].concat(found).forEach(printFull);
      break;
    }
    case 'children': {
      const kids = ci.children(a._[0]);
      console.log(`\n📂 Children of ${a._[0]} (${kids.length})\n`);
      kids.forEach((c) => console.log(`${c.order ?? '-'}. ${c.slug}\n   ${c.title}`));
      break;
    }
    case 'tree': {
      console.log(a._[0] ? `\n🌳 Tree from ${a._[0]}\n` : '\n🌳 Company Intent Tree\n');
      printTree(ci.tree(a._[0]));
      break;
    }
    case 'related': {
      const r = ci.related(a._[0]);
      if (!r) { console.log('Not found:', a._[0]); process.exitCode = 1; break; }
      console.log(`\n🔗 Related to ${r.intent.title}\n`);
      console.log(`Parent: ${r.parent ? `${r.parent.title} (${r.parent.slug})` : 'none (a root)'}`);
      console.log(`Children: ${r.children.map((c) => c.slug).join(', ') || 'none'}`);
      console.log(`Siblings: ${r.siblings.map((c) => c.slug).join(', ') || 'none'}`);
      console.log(`Linked UX intents: ${r.linkedUxIntents.map((l) => `${l.relationship || 'relates'}: ${l.slug}`).join(', ') || 'none'}`);
      break;
    }
    case 'promises': {
      const i = ci.get(a._[0]);
      if (!i || Array.isArray(i)) { console.log('Not found:', a._[0]); process.exitCode = 1; break; }
      console.log(`\n🤝 Strategic promises of ${i.title} (${(i.strategicPromises || []).length})\n`);
      (i.strategicPromises || []).forEach((p) => console.log(`  WHEN: ${p.when}\n  THEN: ${p.then}\n`));
      break;
    }
    case 'recent': {
      const n = parseInt(a._[0], 10) || 5;
      const list = ci.recent(n);
      console.log(`\n🕐 Most Recent Company Intents (${n})\n`);
      if (!list.length) console.log('  Nothing approved yet.\n');
      list.forEach((i, k) => console.log(`${k + 1}. ${line(i)} (${String(i.updatedAt || '').slice(0, 10)})`));
      break;
    }
    case 'canonical': {
      const list = ci.canonical();
      console.log(`\n⭐ Canonical Company Intents (${list.length})\n`);
      console.log('These are the SOURCE OF TRUTH. Check these first.\n');
      if (!list.length) console.log('  None marked canonical yet.\n');
      list.forEach((i, k) => console.log(`${k + 1}. ${line(i)}\n   ${String(i.primaryIntent || '').slice(0, 100)}...\n`));
      break;
    }
    case 'category': {
      const cat = a._[0];
      if (!ci.CATEGORIES.includes(cat)) { console.log(`Category must be one of: ${ci.CATEGORIES.join(', ')}`); process.exitCode = 1; break; }
      const list = ci.byCategory(cat);
      console.log(`\n${CATEGORY_EMOJI[cat]} ${cat} (${list.length})\n`);
      list.forEach((i, k) => console.log(`${k + 1}. ${line(i)}`));
      break;
    }
    case 'list': {
      const list = ci.list({ category: a.category, status: a.status });
      console.log(`\n📋 Company Intents (${list.length})\n`);
      list.forEach((i, k) => console.log(`${k + 1}. ${line(i)}`));
      break;
    }
    case 'pending': {
      const list = ci.pending();
      console.log(`\n⏳ Pending proposals (${list.length})\n`);
      list.forEach((i, k) => console.log(`${k + 1}. ${line(i)}${typeof i.certaintyScore === 'number' ? ` | certainty ${i.certaintyScore}` : ''}`));
      break;
    }
    case 'help-needed': {
      const list = ci.helpNeeded();
      console.log(`\n🙋 Where help is needed (${list.length})\n`);
      list.forEach((i, k) => console.log(`${k + 1}. ${line(i)}\n   ${(i.helpRequested && i.helpRequested.note) || ''}`));
      break;
    }
    case 'touch': {
      const done = ci.touch(a._[0]);
      if (!done.length) { console.log('Not found:', a._[0]); process.exitCode = 1; break; }
      done.forEach((i) => console.log(`✅ Touched: ${i.title}\n   New timestamp: ${i.updatedAt}`));
      console.log('   This will now appear first in searches.');
      break;
    }
    case 'brief': {
      const b = ci.brief(a._[0]);
      if (!b) { console.log('Not found:', a._[0]); process.exitCode = 1; break; }
      console.log('\n📄 Compact Brief (for sub-agents)\n');
      console.log(JSON.stringify(b, null, 2));
      console.log(`\nEstimated tokens: ~${Math.ceil(JSON.stringify(b).length / 4)}`);
      break;
    }
    case 'create': {
      try {
        const i = ci.create(parseJson(a._.join(' ')));
        console.log('✅ Created:', i.slug);
        console.log(`   Status: ${i.status} (awaiting approval — run: node company-intent.js approve ${i.slug})`);
        console.log(`   File: ${ci.fileFor(i.slug)}`);
      } catch (e) { console.log(`❌ ${e.message}`); process.exitCode = 1; }
      break;
    }
    case 'validate': {
      const v = ci.validate(parseJson(a._.join(' ')));
      console.log(`\n🔍 Validation Result: ${v.valid ? '✅ VALID' : '❌ INVALID'}\n`);
      v.errors.forEach((e) => console.log(`  ❌ ${e}`));
      v.warnings.forEach((w) => console.log(`  ⚠️  ${w}`));
      if (v.valid && !v.warnings.length) console.log('  All checks passed!');
      break;
    }
    case 'propose': {
      const r = ci.propose(parseJson(a._.join(' ')));
      if (!r.ok) { console.log('❌ Validation failed:\n'); r.validation.errors.forEach((e) => console.log(`  * ${e}`)); console.log('\nFix errors and try again.'); process.exitCode = 1; break; }
      const i = r.intent;
      if (r.capped) console.log(`⚠️  Capped certaintyScore to ${ci.MAX_AGENT_CERTAINTY} (agent max)`);
      console.log(`\n✅ Company Intent Proposed: ${i.slug}\n`);
      console.log(`   Title: ${i.title}`);
      console.log(`   Category: ${CATEGORY_EMOJI[i.category] || '📋'} ${i.category || 'other'}`);
      if (typeof i.certaintyScore === 'number') console.log(`   Certainty: ${i.certaintyScore}/100 (agent max: ${ci.MAX_AGENT_CERTAINTY})`);
      console.log(`   Status: ${i.status}`);
      console.log(`   Proposed by: ${i.proposedBy}`);
      r.validation.warnings.forEach((w) => console.log(`     ⚠️  ${w}`));
      console.log(`\n   📋 Review it: node company-intent.js get ${i.slug} (file: ${ci.fileFor(i.slug)})`);
      console.log('   Human approval required to raise certainty above 50.');
      break;
    }
    case 'update': {
      try { const i = ci.update(a._[0], parseJson(a._.slice(1).join(' '))); console.log(`✅ Updated: ${i.slug}`); } catch (e) { console.log(`❌ ${e.message}`); process.exitCode = 1; }
      break;
    }
    case 'approve': {
      try { const i = ci.approve(a._[0], a.by); console.log(`✅ Approved: ${i.slug} — it will now appear in searches.`); } catch (e) { console.log(`❌ ${e.message}`); process.exitCode = 1; }
      break;
    }
    case 'delete': {
      try { const i = ci.remove(a._[0]); console.log(`🗑️  Deleted: ${i.slug}`); } catch (e) { console.log(`❌ ${e.message}`); process.exitCode = 1; }
      break;
    }
    case 'principle': {
      try { const i = ci.principle(parseJson(a._.join(' '))); console.log(`✅ Principle logged: ${i.slug}`); } catch (e) { console.log(`❌ ${e.message}`); process.exitCode = 1; }
      break;
    }
    case 'request-help': {
      try { const i = ci.requestHelp(a._[0], a._.slice(1).join(' ')); console.log(`🙋 Help requested on: ${i.slug}`); } catch (e) { console.log(`❌ ${e.message}`); process.exitCode = 1; }
      break;
    }
    case 'file-meta': {
      if (!a._[0]) { console.log('Usage: node company-intent.js file-meta <file-path>'); break; }
      const m = fileMeta(a._[0]);
      if (m.error) { console.log(`❌ Error: ${m.error}`); process.exitCode = 1; break; }
      console.log(JSON.stringify(m, null, 2));
      break;
    }
    default:
      console.log(`
Company Intent DB CLI (local file store — no database or server needed)

Commands: find, get, children, tree, related, promises, recent, canonical, category, list,
pending, help-needed, touch, brief, create, propose, validate, update, approve, delete,
principle, request-help, file-meta (see the top of this file for each one's arguments).

Store location: ${ci.dir()}

Example:
  node company-intent.js propose '{"slug":"mission","title":"Why we exist","primaryIntent":"We exist to help small teams ship work they are proud of.","category":"mission","tags":["canonical"],"certaintyScore":40,"proposedBy":"claude-agent"}'
`);
  }
}

run();
