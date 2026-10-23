'use strict';
// CLI commands for the typed local records (compactions, intents, seeds,
// proposals, correction patterns). Called from bin/alignment-harness.

const fs = require('fs');
const records = require('./records');
const store = require('./store');
const core = require('./core');

const list = (v) => (v && v !== true ? String(v).split('|').map((s) => s.trim()).filter(Boolean) : undefined);
const str = (v) => (v && v !== true ? String(v) : undefined);
const out = (s) => process.stdout.write(`${s}\n`);

function readData(args) {
  if (args.file && args.file !== true) return JSON.parse(fs.readFileSync(String(args.file), 'utf8'));
  if (args.json && args.json !== true) return JSON.parse(String(args.json));
  return null;
}

function show(r) { out(JSON.stringify(r, null, 2)); }

function compaction(args, sessionId) {
  const sub = args._[1];
  if (sub === 'scope') {
    const scope = {
      intent: str(args.intent), certainty: args.certainty !== undefined ? Number(args.certainty) : undefined,
      decomposed: list(args.decomposed), boundary: str(args.boundary), verification: str(args.verification), assumptions: list(args.assumptions),
    };
    Object.keys(scope).forEach((k) => scope[k] === undefined && delete scope[k]);
    const cur = records.getCompaction(sessionId);
    const r = records.putCompaction(sessionId, { title: (cur && cur.title) || `Session ${sessionId.slice(0, 8)}: ${scope.intent || ''}`.slice(0, 120), scopeDeclaration: scope });
    out(`scope saved for this session (certainty ${r.record.scopeDeclaration.certainty}%) — it is shown back to you on every message.`);
    if (r.record.scopeDeclaration.certainty < 90) out('Certainty is under 90%: run /reflect, predict the most likely intent, state it to the person as a proposal, and proceed.');
    return;
  }
  if (sub === 'put') {
    const data = readData(args);
    if (!data) throw new Error('give the compaction as --json \'{...}\' or --file <path>');
    const r = records.putCompaction(sessionId, data);
    out(r.skipped ? 'kept the existing agent-written record (an automatic backup never overwrites it)' : `saved compaction ${r.record.id}`);
    show(r.record);
    return;
  }
  if (sub === 'get') { const r = records.getCompaction(sessionId); out(r ? JSON.stringify(r, null, 2) : 'no compaction for this session yet — write one with /compact-agentic-session'); return; }
  if (sub === 'open-items') {
    const recs = store.list('compactions', { limit: 1000 });
    let n = 0;
    for (const r of recs) {
      for (const [i, it] of (r.incompleteItems || []).entries()) {
        if (!['open', 'approved', 'in-progress'].includes(it.status)) continue;
        if (args.status && args.status !== true && it.status !== args.status) continue;
        n++; out(`${r.id}#${i} [${it.status}${it.priority ? ` p${it.priority}` : ''}] ${it.text}`);
      }
    }
    if (!n) out('no open items in any compaction');
    return;
  }
  if (sub === 'item') {
    const [id, idx] = String(args._[2] || '').split('#');
    const status = str(args.status);
    const r = store.get('compactions', id);
    if (!r || !r.incompleteItems || !r.incompleteItems[Number(idx)]) throw new Error('usage: compaction item <compaction-id>#<n> --status open|approved|in-progress|done|dropped');
    r.incompleteItems[Number(idx)].status = status;
    records.update('compactions', id, { incompleteItems: r.incompleteItems });
    out(`item ${id}#${idx} → ${status}`);
    return;
  }
  const recs = store.list('compactions', { limit: Number(args.limit) || 20 });
  if (!recs.length) out('no compactions yet');
  for (const r of recs) out(`${r.id}  ${String(r.updatedAt).slice(0, 16)}  ${r.auto ? '(auto) ' : ''}${r.title}`);
}

function simpleKind(kind, args, sessionId, fields) {
  const sub = args._[1];
  if (sub === 'add') {
    const data = readData(args) || fields(args);
    const r = records.add(kind, data, { sessionId });
    out(`saved ${kind} ${r.id}\n  ${r.file}`);
    return;
  }
  if (sub === 'update') {
    const id = args._[2];
    const patch = readData(args) || {};
    if (args.status && args.status !== true) patch.status = String(args.status);
    records.update(kind, id, patch);
    out(`updated ${kind} ${id}`);
    return;
  }
  if (sub === 'get') { const r = store.get(kind, args._[2]); out(r ? JSON.stringify(r, null, 2) : `no ${kind} record ${args._[2]}`); return; }
  if (sub === 'search') {
    const rs = records.search(kind, args._.slice(2).join(' '), Number(args.limit) || 10);
    if (!rs.length) out(`no ${kind} match — ${store.list(kind, { limit: 100000 }).length} on file`);
    for (const r of rs) out(`${r.id}  [${r.status || ''}]  ${r.title || r.statement || r.label || ''}`);
    return;
  }
  const where = {};
  if (args.status && args.status !== true) where.status = String(args.status);
  const rs = store.list(kind, { where, limit: Number(args.limit) || 50 });
  if (!rs.length) out(`no ${kind} yet`);
  for (const r of rs) out(`${r.id}  [${r.status || ''}]  ${String(r.updatedAt).slice(0, 10)}  ${r.title || r.statement || r.label || ''}`);
}

function correction(args, sessionId) {
  const sub = args._[1];
  const { switches } = core.loadSwitches();
  const activateAt = Number((switches.correctionPatterns && switches.correctionPatterns.activateAtEvidence) || 3);
  if (sub === 'add') {
    const data = readData(args) || {
      label: str(args.label), triggerPhrases: list(args.trigger), correctionDirective: str(args.directive),
      leverageScore: args.leverage !== undefined ? Number(args.leverage) : undefined,
    };
    const r = records.addCorrection(data, activateAt);
    out(`${r.grew ? 'added evidence to' : 'saved'} correction pattern ${r.record.id} — evidence ${r.record.evidenceCount}, status ${r.record.status}${r.record.status === 'candidate' ? ` (becomes active at ${activateAt}, or run: correction activate ${r.record.id})` : ''}`);
    return;
  }
  if (sub === 'activate' || sub === 'retire') {
    records.update('correction-patterns', args._[2], { status: sub === 'activate' ? 'active' : 'retired' });
    out(`${args._[2]} → ${sub === 'activate' ? 'active' : 'retired'}`);
    return;
  }
  const rs = store.list('correction-patterns', { limit: 200 });
  if (!rs.length) out('no correction patterns yet');
  for (const r of rs) out(`${r.id}  [${r.status}, evidence ${r.evidenceCount}]  ${r.label} — when: ${(r.triggerPhrases || []).join(' | ')}`);
  void sessionId;
}

function run(cmd, args, sessionId) {
  switch (cmd) {
    case 'compaction': return compaction(args, sessionId);
    case 'intent': return simpleKind('intents', args, sessionId, (a) => ({ statement: str(a.statement), therefore: str(a.therefore), why: str(a.why), status: str(a.status), domain: str(a.domain) }));
    case 'seed': return simpleKind('seeds', args, sessionId, (a) => ({ title: str(a.title), intent: str(a.intent), children: list(a.children) }));
    case 'proposal': return simpleKind('proposals', args, sessionId, (a) => ({ title: str(a.title), problem: str(a.problem), proposedFix: str(a.fix), priority: a.priority !== undefined ? Number(a.priority) : undefined, evidence: str(a.evidence) }));
    case 'correction': return correction(args, sessionId);
    default: return false;
  }
}

module.exports = { run };
