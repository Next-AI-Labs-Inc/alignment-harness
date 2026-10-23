#!/usr/bin/env node
/**
 * Intent DB CLI — local-file store, no database or server required.
 *
 * Query and manage a record of confirmed UX decisions: what should happen
 * for a user under which conditions, and why. Every entry lives as its own
 * JSON file, so it's readable, greppable, and diffable without this script.
 *
 * Usage:
 *   node intent.js find <query>       - Search intents (canonical first, then recent)
 *   node intent.js get <slug>         - Get full intent details
 *   node intent.js children <slug>    - List children of an intent
 *   node intent.js tree <slug>        - Get intent with children
 *   node intent.js recent [n]         - Get n most recent APPROVED intents (default: 5)
 *   node intent.js canonical          - List all canonical (prioritized) intents
 *   node intent.js touch <slug>       - Refresh timestamp (boost in search)
 *   node intent.js create '<json>'    - Create new intent (status: proposed, awaiting approval)
 *   node intent.js approve <slug>     - Mark a proposed intent approved (only approved entries
 *                                       are returned by find/recent/canonical/tree/children)
 *   node intent.js brief <slug>       - Get compact brief for sub-agents (~500 tokens)
 *
 * Where entries live: this script asks `alignment-harness records intents` for a folder
 * (if that CLI is on PATH); otherwise it falls back to ./.alignment-harness/intent-db
 * relative to the current project. Either way it's just a directory of <slug>.json files —
 * nothing here requires MongoDB, a running API server, or admin auth.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function resolveStoreDir() {
  try {
    const out = execFileSync('alignment-harness', ['records', 'intents'], { encoding: 'utf8' }).trim();
    if (out) return out;
  } catch (_) { /* CLI not on PATH or not installed — fall through to local default */ }
  const dir = path.join(process.cwd(), '.alignment-harness', 'intent-db');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const STORE_DIR = resolveStoreDir();

function slugFile(slug) {
  return path.join(STORE_DIR, `${slug.replace(/[^A-Za-z0-9._-]/g, '_')}.json`);
}

function loadAll() {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  return fs.readdirSync(STORE_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try { return JSON.parse(fs.readFileSync(path.join(STORE_DIR, f), 'utf8')); }
      catch (_) { return null; }
    })
    .filter(Boolean);
}

function save(intent) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(slugFile(intent.slug), JSON.stringify(intent, null, 2));
}

function findOne(slug) {
  return loadAll().find((i) => i.slug === slug) || null;
}

const [, , cmd, ...args] = process.argv;

function run() {
  switch (cmd) {
    case 'find': {
      const query = args.join(' ');
      const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchesText = (i) => [
        i.slug, i.title, i.primaryIntent, ...(i.tags || []),
        ...(i.items || []).flatMap((it) => [it.statement, ...(it.therefore || [])]),
        ...(i.uxPromises || []).flatMap((p) => [p.when, p.then]),
      ].filter(Boolean).some((s) => re.test(String(s)));

      const all = loadAll().filter((i) => i.status === 'approved' && matchesText(i));
      all.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      const canonical = all.filter((i) => (i.tags || []).includes('canonical'));
      const rest = all.filter((i) => !(i.tags || []).includes('canonical'));
      const sorted = [...canonical, ...rest].slice(0, 10);

      console.log(`\n🔍 Search: "${query}" (${sorted.length} results)\n`);
      if (!sorted.length) console.log('  Nothing confirmed on this yet. Proceed on your own best judgment, and say so.\n');
      sorted.forEach((i, idx) => {
        const isCanonical = (i.tags || []).includes('canonical') ? ' ⭐' : '';
        console.log(`${idx + 1}. ${i.title}${isCanonical}`);
        console.log(`   Slug: ${i.slug}`);
        console.log(`   ${String(i.primaryIntent || '').slice(0, 80)}...`);
        console.log('');
      });
      break;
    }

    case 'get': {
      const intent = findOne(args[0]);
      if (!intent) { console.log('Not found:', args[0]); break; }
      console.log(`\n📋 ${intent.title}\n`);
      console.log(`Slug: ${intent.slug}`);
      console.log(`Status: ${intent.status || 'proposed'}`);
      console.log(`Tags: ${(intent.tags || []).join(', ') || 'none'}`);
      console.log(`\nPrimary Intent:\n  ${intent.primaryIntent}\n`);
      if (intent.stack?.length) {
        console.log('Stack:');
        intent.stack.forEach((s) => console.log(`  • ${s}`));
        console.log('');
      }
      if (intent.items?.length) {
        console.log('Items:');
        intent.items.forEach((item, idx) => {
          console.log(`\n  [${idx + 1}] ${item.statement}`);
          (item.therefore || []).forEach((t) => console.log(`      → ${t}`));
        });
        console.log('');
      }
      if (intent.uxPromises?.length) {
        console.log('UX Promises:');
        intent.uxPromises.forEach((p) => {
          console.log(`  WHEN: ${p.when}`);
          console.log(`  THEN: ${p.then}`);
          console.log('');
        });
      }
      console.log(`Updated: ${intent.updatedAt || 'unknown'}`);
      break;
    }

    case 'children': {
      const parentSlug = args[0];
      const children = loadAll()
        .filter((i) => i.parentSlug === parentSlug && i.status === 'approved')
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      console.log(`\n📂 Children of ${parentSlug} (${children.length})\n`);
      children.forEach((c) => console.log(`${c.order ?? '-'}. ${c.slug}\n   ${c.title}`));
      break;
    }

    case 'tree': {
      const root = findOne(args[0]);
      if (!root) { console.log('Not found:', args[0]); break; }
      const children = loadAll()
        .filter((i) => i.parentSlug === args[0] && i.status === 'approved')
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      console.log(`\n🌳 ${root.title}\n`);
      console.log(`Root: ${root.slug}`);
      console.log(`  ${root.primaryIntent}\n`);
      if (children.length) {
        console.log(`Children (${children.length}):`);
        children.forEach((c, idx) => {
          console.log(`  ${idx + 1}. ${c.title}`);
          console.log(`     ${c.slug}`);
        });
      }
      break;
    }

    case 'recent': {
      const limit = parseInt(args[0], 10) || 5;
      const intents = loadAll()
        .filter((i) => i.status === 'approved')
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
        .slice(0, limit);
      console.log(`\n🕐 Most Recent Intents (${limit})\n`);
      if (!intents.length) console.log('  Nothing approved yet.\n');
      intents.forEach((i, idx) => {
        const date = (i.updatedAt || '').slice(0, 10) || 'unknown date';
        const isCanonical = (i.tags || []).includes('canonical') ? ' ⭐' : '';
        console.log(`${idx + 1}. ${i.title}${isCanonical}`);
        console.log(`   ${i.slug} (${date})`);
      });
      break;
    }

    case 'canonical': {
      const intents = loadAll()
        .filter((i) => i.status === 'approved' && (i.tags || []).includes('canonical'))
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      console.log(`\n⭐ Canonical Intents (${intents.length})\n`);
      console.log('These are the SOURCE OF TRUTH. Check these first.\n');
      if (!intents.length) console.log('  None marked canonical yet.\n');
      intents.forEach((i, idx) => {
        console.log(`${idx + 1}. ${i.title}`);
        console.log(`   Slug: ${i.slug}`);
        console.log(`   ${String(i.primaryIntent || '').slice(0, 100)}...`);
        console.log('');
      });
      break;
    }

    case 'touch': {
      const slug = args[0];
      const intent = findOne(slug);
      if (!intent) { console.log('Not found:', slug); break; }
      intent.updatedAt = new Date().toISOString();
      save(intent);
      console.log(`✅ Touched: ${intent.title}`);
      console.log(`   New timestamp: ${intent.updatedAt}`);
      console.log('   This intent will now appear first in searches.');
      break;
    }

    case 'brief': {
      const intent = findOne(args[0]);
      if (!intent) { console.log('Not found:', args[0]); break; }
      const brief = {
        slug: intent.slug,
        title: intent.title,
        primaryIntent: intent.primaryIntent,
        coreRules: (intent.items || []).slice(0, 5).map((item) => ({
          rule: item.statement,
          means: item.therefore?.[0] || null,
        })),
        neverDo: (intent.items || []).flatMap((item) => (item.therefore || []).filter((t) => t.toLowerCase().includes('never'))).slice(0, 5),
        uxContracts: (intent.uxPromises || []).slice(0, 3).map((p) => `WHEN ${p.when} THEN ${p.then}`),
        tags: intent.tags || [],
      };
      console.log('\n📄 Compact Brief (for sub-agents)\n');
      console.log(JSON.stringify(brief, null, 2));
      console.log(`\nEstimated tokens: ~${Math.ceil(JSON.stringify(brief).length / 4)}`);
      break;
    }

    case 'create': {
      const data = JSON.parse(args.join(' '));
      if (!data.slug || !data.title || !data.primaryIntent) {
        console.log('Need at least: slug, title, primaryIntent.');
        break;
      }
      if (findOne(data.slug)) { console.log('Already exists:', data.slug, '— use a different slug or edit the file directly.'); break; }
      data.status = data.status || 'proposed';
      data.tags = data.tags || [];
      data.createdAt = new Date().toISOString();
      data.updatedAt = data.createdAt;
      save(data);
      console.log('✅ Created:', data.slug);
      console.log(`   Status: ${data.status} (won't appear in searches until approved — run: node intent.js approve ${data.slug})`);
      console.log(`   File: ${slugFile(data.slug)}`);
      break;
    }

    case 'approve': {
      const intent = findOne(args[0]);
      if (!intent) { console.log('Not found:', args[0]); break; }
      intent.status = 'approved';
      intent.approvedAt = new Date().toISOString();
      save(intent);
      console.log(`✅ Approved: ${intent.slug} — it will now appear in searches.`);
      break;
    }

    default:
      console.log(`
Intent DB CLI (local file store — no database or server needed)

Usage:
  node intent.js find <query>       Search approved intents (canonical first)
  node intent.js get <slug>         Get full intent details
  node intent.js children <slug>    List children of an intent
  node intent.js tree <slug>        Get intent with children
  node intent.js recent [n]         Get n most recently updated approved intents
  node intent.js canonical          List all canonical intents ⭐
  node intent.js touch <slug>       Refresh timestamp (boost in search)
  node intent.js create '<json>'    Propose a new intent (status: proposed)
  node intent.js approve <slug>     Approve a proposed intent
  node intent.js brief <slug>       Get compact brief for sub-agents

Store location: ${STORE_DIR}

Examples:
  node intent.js find "session expiry"
  node intent.js create '{"slug":"onboarding.first-run-empty-state","title":"First-run empty state","primaryIntent":"When a brand-new user has no data yet, we aim to show them what to do next instead of a blank screen.","tags":["onboarding"]}'
  node intent.js recent 10
`);
  }
}

run();
