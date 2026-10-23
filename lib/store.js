'use strict';
// The harness's local record store — the stand-in for the author's private API
// (session compactions, intents and seeds, correction patterns, proposals,
// ledger notes, voice samples…). One JSON file per record under
//   <data folder>/records/<kind>/<id>.json
// so skills, people and the agent_find search can all read them directly.
// Nothing leaves the machine; uninstalling the plugin removes it.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const core = require('./core');

function kindDir(kind) {
  const k = String(kind || '').replace(/[^A-Za-z0-9_-]/g, '');
  if (!k) throw new Error('say which kind of record (for example: compactions, proposals, intents)');
  const d = path.join(core.P.data, 'records', k);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function newId(kind) {
  const t = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  return `${String(kind).slice(0, 12)}-${t}-${crypto.randomBytes(3).toString('hex')}`;
}

function add(kind, data, meta) {
  const d = kindDir(kind);
  const id = (data && typeof data.id === 'string' && /^[A-Za-z0-9_.-]{1,80}$/.test(data.id)) ? data.id : newId(kind);
  const rec = { ...data, id, kind: String(kind), createdAt: core.nowIso(), updatedAt: core.nowIso(), ...(meta || {}) };
  core.writeJsonAtomic(path.join(d, `${id}.json`), rec);
  return { id, file: path.join(d, `${id}.json`), record: rec };
}

function get(kind, id) {
  return core.readJson(path.join(kindDir(kind), `${String(id).replace(/[^A-Za-z0-9_.-]/g, '')}.json`), null);
}

function update(kind, id, patch) {
  const cur = get(kind, id);
  if (!cur) throw new Error(`no ${kind} record ${id}`);
  const next = core.deepMerge(cur, patch || {});
  next.updatedAt = core.nowIso();
  core.writeJsonAtomic(path.join(kindDir(kind), `${cur.id}.json`), next);
  return next;
}

function list(kind, opts) {
  const d = kindDir(kind);
  let recs = fs.readdirSync(d).filter((f) => f.endsWith('.json'))
    .map((f) => core.readJson(path.join(d, f), null)).filter(Boolean);
  if (opts && opts.where) {
    for (const [k, v] of Object.entries(opts.where)) recs = recs.filter((r) => String(r[k]) === String(v));
  }
  recs.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  return recs.slice(0, (opts && opts.limit) || 50);
}

module.exports = { add, get, update, list, kindDir };
