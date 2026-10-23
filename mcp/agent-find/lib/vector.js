'use strict';
// Optional semantic search. Entirely best-effort: this file NEVER throws out to the
// caller, and search.js must work correctly if every function here returns null/[].
//
// Setup is out of scope for this build — a later setup step may run
// `npm install @xenova/transformers` inside <dataDir>/agent-find/, which is not on
// the plugin's own module resolution path (the plugin ships with no node_modules at
// all, per the "no shipped node_modules" requirement). If that install never
// happens, every call here fails to load the module and the caller falls back to
// keyword-only mode — search.js reports that honestly in its header.

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { createRequire } = require('module');

let pipelinePromise = null; // memoized feature-extraction pipeline, or null if unavailable
let attempted = false;

function tryLoadTransformers(dataDir) {
  const vectorHome = path.join(dataDir, 'agent-find');
  const require_ = createRequire(path.join(vectorHome, 'package.json'));
  // createRequire needs SOME file path to resolve relative to; it doesn't need that
  // file to exist, only the directory to be a plausible module resolution root.
  return require_('@xenova/transformers');
}

/**
 * Returns an embed(text) => Promise<Float32Array|null> function, or null if the
 * optional dependency isn't installed. Never throws.
 */
async function getEmbedder(dataDir) {
  if (attempted) return pipelinePromise;
  attempted = true;
  try {
    const { pipeline } = tryLoadTransformers(dataDir);
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    pipelinePromise = async (text) => {
      try {
        const out = await extractor(text, { pooling: 'mean', normalize: true });
        return out && out.data ? out.data : null;
      } catch (_) {
        return null;
      }
    };
  } catch (_) {
    pipelinePromise = null; // not installed, or failed to load — keyword mode only
  }
  return pipelinePromise;
}

function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // both vectors are already normalized, so dot product == cosine
}

function hashText(text) {
  return crypto.createHash('sha1').update(text).digest('hex');
}

function loadCache(dataDir) {
  const file = path.join(dataDir, 'agent-find', 'vector-cache.json');
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return {}; }
}

function saveCache(dataDir, cache) {
  try {
    const dir = path.join(dataDir, 'agent-find');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'vector-cache.json'), JSON.stringify(cache));
  } catch (_) { /* best effort — a failed cache write must never break search */ }
}

/**
 * Semantic pass over a small candidate set (already keyword-filtered, so this stays
 * cheap). Returns a Map from entry index -> cosine similarity with the query, using
 * a content-hash cache so repeat searches over the same corpus don't re-embed.
 */
async function semanticScores(dataDir, query, entries, deadlineAt) {
  const embed = await getEmbedder(dataDir);
  if (!embed) return null; // keyword-only mode

  const cache = loadCache(dataDir);
  let cacheDirty = false;
  const scores = new Map();

  const queryVec = await embed(query);
  if (!queryVec) return null;

  for (let i = 0; i < entries.length; i++) {
    if (deadlineAt && Date.now() > deadlineAt) break;
    const text = (entries[i].searchText || '').slice(0, 2000);
    if (!text) continue;
    const key = hashText(text);
    let vec = cache[key];
    if (!vec) {
      const computed = await embed(text);
      if (!computed) continue;
      vec = Array.from(computed);
      cache[key] = vec;
      cacheDirty = true;
    }
    scores.set(i, cosine(queryVec, vec));
  }

  if (cacheDirty) saveCache(dataDir, cache);
  return scores;
}

module.exports = { getEmbedder, semanticScores };
