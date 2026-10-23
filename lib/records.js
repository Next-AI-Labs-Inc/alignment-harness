'use strict';
// Typed records on top of the local store (lib/store.js). This is the tier-1
// stand-in for the author's private API: session compactions (with the scope
// declaration), intents/seeds, proposals and correction patterns. Each kind
// validates what the hooks and skills actually read, and refuses with a
// readable reason instead of silently dropping fields.

const store = require('./store');
const core = require('./core');

const ITEM_STATUSES = ['open', 'approved', 'in-progress', 'done', 'dropped'];

const KINDS = {
  compactions: {
    what: 'one per session: what it was for, the scope declaration, and what is left',
    required: ['title'],
    anyOf: [['intent', 'compactedSession', 'scopeDeclaration']],
    normalize(r) {
      if (r.incompleteItems !== undefined) {
        if (!Array.isArray(r.incompleteItems)) throw new Error('incompleteItems must be a list');
        r.incompleteItems = r.incompleteItems.map((it, i) => {
          const o = typeof it === 'string' ? { text: it } : it;
          if (!o || !o.text) throw new Error(`incompleteItems[${i}] needs a "text"`);
          if (o.status && !ITEM_STATUSES.includes(o.status)) throw new Error(`incompleteItems[${i}].status must be one of ${ITEM_STATUSES.join(', ')}`);
          return { status: 'open', ...o };
        });
      }
      if (r.scopeDeclaration) {
        const s = r.scopeDeclaration;
        if (!s.intent) throw new Error('scopeDeclaration needs an "intent" (one sentence, in experience terms)');
        const c = Number(s.certainty);
        if (!Number.isFinite(c) || c < 0 || c > 100) throw new Error('scopeDeclaration.certainty must be 0-100 (how sure you are you understand what the person wants)');
        s.certainty = c;
        if (s.decomposed && !Array.isArray(s.decomposed)) throw new Error('scopeDeclaration.decomposed must be a list of "When …, then …" statements');
      }
      r.auto = !!r.auto;
      return r;
    },
  },
  intents: {
    what: 'confirmed statements of what the person wants: "When …, then …"',
    required: ['statement'],
    normalize(r) {
      if (!/^\s*when\b/i.test(r.statement)) throw new Error('an intent statement starts with "When …" and says what a person experiences');
      r.status = r.status || 'proposed';
      if (!['proposed', 'confirmed', 'retired'].includes(r.status)) throw new Error('status must be proposed, confirmed or retired');
      return r;
    },
  },
  seeds: {
    what: 'the seed document of an initiative: its intent, in the person\'s words, that later work is checked against',
    required: ['title', 'intent'],
    normalize(r) { r.status = r.status || 'draft'; return r; },
  },
  proposals: {
    what: 'a found problem and a proposed fix, waiting for the person\'s decision',
    required: ['title', 'problem', 'proposedFix'],
    normalize(r) {
      r.status = r.status || 'needs-review';
      const ok = ['needs-review', 'approved', 'in-progress', 'implemented', 'rejected'];
      if (!ok.includes(r.status)) throw new Error(`status must be one of ${ok.join(', ')}`);
      return r;
    },
  },
  'correction-patterns': {
    what: 'a correction the person has made more than once, turned into a standing directive',
    required: ['label', 'triggerPhrases', 'correctionDirective'],
    normalize(r) {
      if (typeof r.triggerPhrases === 'string') r.triggerPhrases = [r.triggerPhrases];
      if (!Array.isArray(r.triggerPhrases) || !r.triggerPhrases.length || r.triggerPhrases.some((p) => !String(p).trim())) {
        throw new Error('triggerPhrases must be a non-empty list of phrases that signal this situation');
      }
      r.evidenceCount = Number(r.evidenceCount || 1);
      r.leverageScore = Number(r.leverageScore || 50);
      r.status = r.status || 'candidate';
      if (!['candidate', 'active', 'retired'].includes(r.status)) throw new Error('status must be candidate, active or retired');
      return r;
    },
  },
};

function validate(kind, rec) {
  const spec = KINDS[kind];
  if (!spec) return rec; // free-form kinds are allowed
  for (const f of spec.required || []) {
    if (rec[f] === undefined || rec[f] === null || rec[f] === '') throw new Error(`a ${kind} record needs "${f}"`);
  }
  for (const group of spec.anyOf || []) {
    if (!group.some((f) => rec[f])) throw new Error(`a ${kind} record needs at least one of: ${group.join(', ')}`);
  }
  return spec.normalize ? spec.normalize(rec) : rec;
}

function add(kind, data, meta) {
  const rec = validate(kind, { ...data });
  return store.add(kind, rec, meta);
}

function update(kind, id, patch) {
  const cur = store.get(kind, id);
  if (!cur) throw new Error(`no ${kind} record ${id}`);
  const merged = core.deepMerge(cur, patch || {});
  validate(kind, merged);
  return store.update(kind, id, merged);
}

// ── Compactions: one record per session, id = session id ────────────────────
function compactionId(sessionId) { return `session-${core.safeId(sessionId)}`; }

function getCompaction(sessionId) { return store.get('compactions', compactionId(sessionId)); }

function putCompaction(sessionId, data) {
  const id = compactionId(sessionId);
  const cur = store.get('compactions', id);
  if (cur && !cur.auto && data.auto) return { skipped: true, record: cur }; // never overwrite an agent-written record with a backup
  const next = cur ? core.deepMerge(cur, data) : { ...data };
  next.id = id;
  next.sessionId = String(sessionId);
  if (cur && !data.auto) next.auto = false;
  validate('compactions', next);
  if (cur) return { record: store.update('compactions', id, next) };
  return { record: store.add('compactions', next).record };
}

// ── Correction patterns: add evidence, activate at a threshold ─────────────
function addCorrection(data, activateAt) {
  const existing = store.list('correction-patterns', { limit: 1000 })
    .find((p) => String(p.label).toLowerCase() === String(data.label || '').toLowerCase());
  if (existing) {
    const phrases = [...new Set([...(existing.triggerPhrases || []), ...[].concat(data.triggerPhrases || [])])];
    const evidenceCount = Number(existing.evidenceCount || 1) + 1;
    const status = existing.status === 'candidate' && evidenceCount >= activateAt ? 'active' : existing.status;
    return { record: update('correction-patterns', existing.id, { triggerPhrases: phrases, evidenceCount, status, correctionDirective: data.correctionDirective || existing.correctionDirective }), grew: true };
  }
  const r = add('correction-patterns', { ...data, status: data.status || (Number(data.evidenceCount || 1) >= activateAt ? 'active' : 'candidate') });
  return { record: r.record, grew: false };
}

function matchingCorrections(text, max) {
  const low = String(text || '').toLowerCase();
  if (!low) return [];
  let pats = [];
  try { pats = store.list('correction-patterns', { limit: 1000, where: { status: 'active' } }); } catch (_) { return []; }
  return pats
    .filter((p) => Array.isArray(p.triggerPhrases) && p.triggerPhrases.some((t) => t && low.includes(String(t).toLowerCase())))
    .sort((a, b) => Number(b.leverageScore || 0) - Number(a.leverageScore || 0))
    .slice(0, max || 3);
}

function search(kind, query, limit) {
  const words = String(query || '').toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const recs = store.list(kind, { limit: 5000 });
  return recs.map((r) => {
    const t = JSON.stringify(r).toLowerCase();
    return { r, s: words.reduce((a, w) => a + (t.includes(w) ? 1 : 0), 0) };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, limit || 10).map((x) => x.r);
}

module.exports = { KINDS, validate, add, update, getCompaction, putCompaction, compactionId, addCorrection, matchingCorrections, search };
