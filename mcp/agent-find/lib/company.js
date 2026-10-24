'use strict';
// The company_intent_* tools: the Company Intent DB on the person's own data
// (lib/company-intents.js, <data folder>/records/company-intent/). Same store as the
// company-intent-db skill's command and `alignment-harness store … company-intent`.
// Every tool answers in plain text and fails open: a problem becomes a sentence.

function store() { return require('../../../lib/company-intents'); }

const short = (i) => `- ${i.title} (${i.slug}) [${i.category || 'other'}, ${i.status || 'proposed'}]${(i.tags || []).includes('canonical') ? ' ⭐' : ''}\n  ${String(i.primaryIntent || '').slice(0, 200)}\n  ref:record:company-intent/${i.slug}.json`;

const TOOLS = [
  {
    name: 'company_intent_search',
    description: 'Search company intents (mission, strategy, pricing philosophy…) by query, tags, or category. Approved intents only, canonical first.',
    inputSchema: { type: 'object', properties: {
      query: { type: 'string' }, tags: { type: 'string', description: 'Comma-separated; every tag must match.' },
      category: { type: 'string' }, limit: { type: 'number' } } },
  },
  {
    name: 'company_intent_get',
    description: 'Get full details for a specific company intent by slug (or IX-### id; comma-separate several).',
    inputSchema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] },
  },
  {
    name: 'company_intent_list',
    description: 'List company intents with optional category/status filters (any status).',
    inputSchema: { type: 'object', properties: { category: { type: 'string' }, status: { type: 'string' } } },
  },
  {
    name: 'company_intent_propose',
    description: 'Propose a new company intent. Needs slug, title, primaryIntent, tags; an agent\'s certaintyScore is capped at 50 and the intent waits as proposed until the person approves it.',
    inputSchema: { type: 'object', properties: {
      slug: { type: 'string' }, title: { type: 'string' }, primaryIntent: { type: 'string' },
      category: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } },
      certaintyScore: { type: 'number' }, parentSlug: { type: 'string' }, proposedBy: { type: 'string' },
      items: { type: 'array' }, strategicPromises: { type: 'array' }, linkedUxIntents: { type: 'array' },
      certaintyBreakdown: { type: 'object' }, sourceReferences: { type: 'array' } },
      required: ['slug', 'title', 'primaryIntent', 'tags'] },
  },
  {
    name: 'company_intent_tree',
    description: 'Get the hierarchical tree of company intents, from an optional root slug.',
    inputSchema: { type: 'object', properties: { slug: { type: 'string' } } },
  },
];

const NAMES = new Set(TOOLS.map((t) => t.name));

function run(name, args = {}) {
  const ci = store();
  if (name === 'company_intent_search') {
    const hits = ci.find(args.query, { tags: args.tags, category: args.category, limit: args.limit });
    return hits.length ? `Company intents for "${args.query || ''}" (${hits.length}):\n${hits.map(short).join('\n')}`
      : `No approved company intent matches "${args.query || ''}" yet. Proceed on your own best judgment, and say so; propose one with company_intent_propose if it should exist.`;
  }
  if (name === 'company_intent_get') {
    const found = ci.get(args.slug);
    if (!found || (Array.isArray(found) && !found.length)) return `No company intent "${args.slug}".`;
    return [].concat(found).map((i) => JSON.stringify(i, null, 2)).join('\n\n');
  }
  if (name === 'company_intent_list') {
    const all = ci.list({ category: args.category, status: args.status });
    return all.length ? `Company intents (${all.length}):\n${all.map(short).join('\n')}` : 'No company intents yet.';
  }
  if (name === 'company_intent_propose') {
    const r = ci.propose(args);
    if (!r.ok) return `Not saved. Fix and try again:\n${r.validation.errors.map((e) => `- ${e}`).join('\n')}`;
    return [`Proposed ${r.intent.slug} (status: ${r.intent.status}${typeof r.intent.certaintyScore === 'number' ? `, certainty ${r.intent.certaintyScore}/100` : ''}).`,
      r.capped ? `certaintyScore was capped at ${ci.MAX_AGENT_CERTAINTY}, the most an agent may give.` : '',
      ...r.validation.warnings.map((w) => `Warning: ${w}`),
      `It waits for the person's approval. File: ${ci.fileFor(r.intent.slug)}`].filter(Boolean).join('\n');
  }
  if (name === 'company_intent_tree') {
    const roots = ci.tree(args.slug);
    if (!roots.length) return args.slug ? `No approved company intent "${args.slug}".` : 'No approved company intents yet.';
    const out = [];
    const walk = (n) => { out.push(`${'  '.repeat(n.depth)}- ${n.title} (${n.slug}) [${n.category}]`); n.children.forEach(walk); };
    roots.forEach(walk);
    return out.join('\n');
  }
  return `Unknown tool: ${name}`;
}

module.exports = { TOOLS, NAMES, run };
