'use strict';
// The Company Intent DB on the person's own machine: company-level strategic intent
// (mission, vision, values, strategy, pricing, growth…), one JSON file per intent in
// <data folder>/records/company-intent/<slug>.json. No database and no server.
//
// One store, three ways in, all reading the same folder:
//   - skills/company-intent-db/company-intent.js (the command the skill's tables run)
//   - the company_intent_* tools on the bundled agent-find MCP server
//   - `alignment-harness store add|list|get company-intent` (intent-lifecycle)
// agent_find searches the folder like every other record, and agent_read opens one.

const fs = require('fs');
const path = require('path');
const store = require('./store');

const KIND = 'company-intent';
const MAX_AGENT_CERTAINTY = 50;
const CATEGORIES = ['mission', 'vision', 'values', 'strategy', 'product', 'pricing', 'growth', 'culture', 'market', 'operations', 'other'];
const STATUSES = ['draft', 'proposed', 'approved', 'deprecated'];

function dir() { return store.kindDir(KIND); }
function fileFor(slug) { return path.join(dir(), `${String(slug).replace(/[^A-Za-z0-9._-]/g, '_')}.json`); }
const nowIso = () => new Date().toISOString();
const isCanonical = (i) => (i.tags || []).includes('canonical');
const byUpdated = (a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));

function loadAll() {
  const d = dir();
  return fs.readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => {
    try { return JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')); } catch (_) { return null; }
  }).filter((i) => i && i.slug);
}

function save(intent) {
  const tmp = `${fileFor(intent.slug)}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(intent, null, 2));
  fs.renameSync(tmp, fileFor(intent.slug));
  return intent;
}

// A slug, an IX-### style id, or several of either separated by commas.
function get(ref) {
  const all = loadAll();
  const one = (r) => all.find((i) => i.slug === r || (i.id && String(i.id) === r) || (i.intentId && String(i.intentId) === r)) || null;
  const refs = String(ref || '').split(',').map((s) => s.trim()).filter(Boolean);
  return refs.length > 1 ? refs.map(one).filter(Boolean) : one(refs[0]);
}

function textOf(i) {
  return [i.slug, i.title, i.primaryIntent, i.category, ...(i.tags || []),
    ...(i.items || []).flatMap((it) => [it.statement, ...(it.therefore || [])]),
    ...(i.strategicPromises || []).flatMap((p) => [p.when, p.then])].filter(Boolean).map(String);
}

// Approved intents only, canonical first, then most recently updated.
function find(query, opts = {}) {
  const q = String(query || '').trim();
  const re = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
  const tags = opts.tags ? String(opts.tags).split(',').map((t) => t.trim()).filter(Boolean) : [];
  let hits = loadAll().filter((i) => i.status === 'approved')
    .filter((i) => !re || textOf(i).some((s) => re.test(s)))
    .filter((i) => !opts.category || i.category === opts.category)
    .filter((i) => !tags.length || tags.every((t) => (i.tags || []).includes(t)))
    .sort(byUpdated);
  hits = [...hits.filter(isCanonical), ...hits.filter((i) => !isCanonical(i))];
  return hits.slice(0, Number(opts.limit) || 10);
}

function list(opts = {}) {
  return loadAll()
    .filter((i) => !opts.category || i.category === opts.category)
    .filter((i) => !opts.status || i.status === opts.status)
    .sort(byUpdated);
}

function children(slug) {
  return loadAll().filter((i) => i.parentSlug === slug && i.status === 'approved').sort((a, b) => (a.order || 0) - (b.order || 0));
}

// From one slug, or every root when no slug is given.
function tree(slug) {
  const all = loadAll().filter((i) => i.status === 'approved');
  const build = (node, depth) => ({ slug: node.slug, title: node.title, category: node.category || 'other', depth,
    children: all.filter((c) => c.parentSlug === node.slug).sort((a, b) => (a.order || 0) - (b.order || 0)).map((c) => build(c, depth + 1)) });
  if (slug) { const root = all.find((i) => i.slug === slug); return root ? [build(root, 0)] : []; }
  return all.filter((i) => !i.parentSlug || !all.some((p) => p.slug === i.parentSlug)).sort((a, b) => (a.order || 0) - (b.order || 0)).map((r) => build(r, 0));
}

function related(slug) {
  const all = loadAll();
  const me = all.find((i) => i.slug === slug);
  if (!me) return null;
  return {
    intent: me,
    parent: me.parentSlug ? all.find((i) => i.slug === me.parentSlug) || null : null,
    children: all.filter((i) => i.parentSlug === slug),
    siblings: me.parentSlug ? all.filter((i) => i.parentSlug === me.parentSlug && i.slug !== slug) : [],
    linkedUxIntents: me.linkedUxIntents || [],
  };
}

function recent(n) { return loadAll().filter((i) => i.status === 'approved').sort(byUpdated).slice(0, Number(n) || 5); }
function canonical() { return loadAll().filter((i) => i.status === 'approved' && isCanonical(i)).sort(byUpdated); }
function byCategory(cat) { return loadAll().filter((i) => i.status === 'approved' && (i.category || 'other') === cat).sort(byUpdated); }
function pending() { return loadAll().filter((i) => i.status === 'proposed').sort(byUpdated); }
function helpNeeded() { return loadAll().filter((i) => i.helpRequested).sort(byUpdated); }

function touch(ref) {
  const found = [].concat(get(ref) || []);
  const t = nowIso();
  return found.map((i) => save({ ...i, updatedAt: t }));
}

function brief(slug) {
  const i = get(slug);
  if (!i || Array.isArray(i)) return null;
  return {
    slug: i.slug, title: i.title, category: i.category || 'other', primaryIntent: i.primaryIntent,
    coreRules: (i.items || []).slice(0, 5).map((it) => ({ rule: it.statement, means: (it.therefore || [])[0] || null, why: (it.why || [])[0] || null })),
    strategicPromises: (i.strategicPromises || []).slice(0, 3).map((p) => `WHEN ${p.when} THEN ${p.then}`),
    linkedUxIntents: (i.linkedUxIntents || []).map((l) => `${l.relationship || 'relates'}: ${l.slug}`),
    tags: i.tags || [],
  };
}

function validate(data) {
  const errors = [];
  const warnings = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['Give the intent as a JSON object'], warnings };
  if (!data.slug) errors.push('Missing required field: slug');
  if (!data.title) errors.push('Missing required field: title');
  if (!data.primaryIntent) errors.push('Missing required field: primaryIntent');
  if (!data.tags || !Array.isArray(data.tags)) errors.push('Missing required field: tags (array)');
  if (data.category && !CATEGORIES.includes(data.category)) errors.push(`Invalid category "${data.category}". Must be one of: ${CATEGORIES.join(', ')}`);
  if (data.status && !STATUSES.includes(data.status)) errors.push(`Invalid status "${data.status}". Must be one of: ${STATUSES.join(', ')}`);
  const byAgent = /agent|claude/i.test(String(data.proposedBy || ''));
  if (byAgent) {
    if (typeof data.certaintyScore !== 'number') errors.push(`Agent proposals require certaintyScore (number 1-${MAX_AGENT_CERTAINTY})`);
    else if (data.certaintyScore > MAX_AGENT_CERTAINTY) errors.push(`Agent certaintyScore cannot exceed ${MAX_AGENT_CERTAINTY}. Got: ${data.certaintyScore}`);
    else if (data.certaintyScore < 1) errors.push('certaintyScore must be at least 1');
    if (!data.certaintyBreakdown) warnings.push('Agent proposals should include certaintyBreakdown for transparency');
    if (!data.sourceReferences || !data.sourceReferences.length) warnings.push('Agent proposals should include sourceReferences with file paths');
  }
  const used = ['function', 'component', 'query', 'api call', 'method', 'class'].filter((t) => String(data.primaryIntent || '').toLowerCase().includes(t));
  if (used.length) warnings.push(`primaryIntent uses code terminology (${used.join(', ')}). Use strategy-centric language.`);
  if (data.slug && get(data.slug)) warnings.push(`Slug "${data.slug}" already exists. Consider a different slug or update the existing intent.`);
  return { valid: errors.length === 0, errors, warnings };
}

function create(data) {
  if (!data || !data.slug || !data.title || !data.primaryIntent) throw new Error('Need at least: slug, title, primaryIntent.');
  if (get(data.slug)) throw new Error(`Slug "${data.slug}" already exists. Use a different slug, or update it.`);
  const t = nowIso();
  return save({ category: 'other', tags: [], ...data, proposedBy: data.proposedBy || 'claude-agent', status: data.status || 'proposed', createdAt: t, updatedAt: t });
}

// Propose = validate, cap an agent's certainty at 50, then save as proposed.
function propose(data) {
  const d = { ...data, proposedBy: (data && data.proposedBy) || 'claude-agent', status: (data && data.status) || 'proposed' };
  const v = validate(d);
  if (!v.valid) return { ok: false, validation: v };
  let capped = false;
  if (typeof d.certaintyScore === 'number' && d.certaintyScore > MAX_AGENT_CERTAINTY) { d.certaintyScore = MAX_AGENT_CERTAINTY; capped = true; }
  if (get(d.slug)) return { ok: false, validation: { valid: false, errors: [`Slug "${d.slug}" already exists.`], warnings: v.warnings } };
  return { ok: true, intent: create(d), capped, validation: v };
}

function update(slug, patch) {
  const cur = get(slug);
  if (!cur || Array.isArray(cur)) throw new Error(`No company intent "${slug}".`);
  const next = { ...cur, ...(patch || {}), slug: cur.slug, createdAt: cur.createdAt, updatedAt: nowIso() };
  const v = validate({ ...next, slug: undefined, tags: next.tags || [] });
  const real = v.errors.filter((e) => !/slug/.test(e));
  if (real.length) throw new Error(real.join('; '));
  return save(next);
}

function approve(slug, by) {
  return update(slug, { status: 'approved', approvedBy: by || 'the user', approvedAt: nowIso() });
}

function remove(slug) {
  const cur = get(slug);
  if (!cur || Array.isArray(cur)) throw new Error(`No company intent "${slug}".`);
  fs.unlinkSync(fileFor(cur.slug));
  return cur;
}

function requestHelp(slug, note) { return update(slug, { helpRequested: { at: nowIso(), note: note || '' } }); }

// A principle is a company intent in the values category, kept as approved.
function principle(data) {
  if (!data || !data.title || !data.description) throw new Error('A principle needs a title and a description.');
  const slug = data.slug || `principle-${String(data.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)}`;
  return create({ slug, title: data.title, primaryIntent: data.description, category: 'values', tags: ['principle', ...(data.tags || [])], status: 'approved', proposedBy: data.proposedBy || 'the user' });
}

module.exports = {
  KIND, CATEGORIES, STATUSES, MAX_AGENT_CERTAINTY, dir, fileFor,
  loadAll, get, find, list, children, tree, related, recent, canonical, byCategory, pending, helpNeeded,
  touch, brief, validate, create, propose, update, approve, remove, requestHelp, principle,
};
