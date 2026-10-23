'use strict';
// Zero-dependency, BM25-style keyword ranking. Ported and generalized from an
// earlier private search engine's document-ranking module — the scoring math itself
// was already domain-neutral (it just counts term matches and rarity over whatever
// corpus it's given), so this keeps that logic and drops everything that assumed
// a specific company's document set, vocabulary, or folder layout.
//
// Three signals combine:
//   1. keywordRelevance   — term coverage, weighted by how rare each term is across
//                           the corpus (a rare term matching is stronger evidence
//                           than a common one), tolerant of extra query words.
//   2. relevanceTiebreak  — title match + whole-word match + term density, so two
//                           documents that both "contain" the query stop tying.
//   3. recencyScore       — exponential decay so older material counts for less,
//                           unless the caller says a source is timeless (e.g. a
//                           skill file, which doesn't go stale by sitting still).

const DEFAULT_DECAY_RATE = 0.012; // today=1.0, 7d=0.85, 30d=0.6, 90d=0.35, floor 0.15
const COVERAGE_FLOOR = 0.55;

function recencyScore(dateStr, decayRate = DEFAULT_DECAY_RATE) {
  if (!dateStr) return 0.15;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return 0.15;
  const daysAgo = (Date.now() - t) / 86400000;
  if (daysAgo < 0) return 1.0;
  return Math.max(0.15, Math.exp(-decayRate * daysAgo));
}

// --- Document-frequency index, for rarity-weighted term matching. -----------------
// Built fresh per search over whatever entries were gathered for that query, so it
// never needs a rebuild step or persistence of its own — see buildIdfIndex.

function buildIdfIndex(entries) {
  const df = new Map();
  for (const e of entries) {
    const seen = new Set(String(e.searchText || '').split(/[^a-z0-9_./-]+/i).filter((t) => t.length > 2));
    for (const t of seen) df.set(t.toLowerCase(), (df.get(t.toLowerCase()) || 0) + 1);
  }
  return { df, total: entries.length || 1 };
}

function idfWeight(idfIndex, term) {
  if (!idfIndex || idfIndex.total <= 1) return 1;
  const df = idfIndex.df.get(term) || 0;
  return Math.log(idfIndex.total / (1 + df)) / Math.log(idfIndex.total);
}

function keywordRelevance(query, text, idfIndex) {
  if (!text || !query) return 0;
  const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const lowerText = text.toLowerCase();
  if (queryTerms.length === 0) return 0;

  let matchCount = 0;
  for (const term of queryTerms) if (lowerText.includes(term)) matchCount++;

  const exactPhraseBonus = lowerText.includes(query.toLowerCase()) ? 0.3 : 0;

  let idfTotal = 0;
  let idfHit = 0;
  for (const term of queryTerms) {
    const w = idfWeight(idfIndex, term);
    idfTotal += w;
    if (lowerText.includes(term)) idfHit += w;
  }
  const ratio = idfTotal > 0 ? idfHit / idfTotal : matchCount / queryTerms.length;
  const absScore = matchCount === 0 ? 0 : Math.min(1.0, 0.15 + matchCount * 0.25);
  const base = Math.max(ratio, absScore);
  const coverageFactor = COVERAGE_FLOOR + (1 - COVERAGE_FLOOR) * ratio;

  return base * coverageFactor + exactPhraseBonus;
}

function relevanceTiebreak(query, title, text) {
  if (!query || !text) return 0;
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (!terms.length) return 0;

  const lowerTitle = (title || '').toLowerCase();
  const titleWords = lowerTitle.split(/\s+/).filter(Boolean).length || 1;
  const titleHits = terms.filter((t) => lowerTitle.includes(t)).length;
  const concision = Math.min(1, 10 / titleWords);
  const titleSignal = (titleHits / terms.length) * 0.2 * concision;

  const wordBoundaryHits = terms.filter((t) => {
    const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return re.test(text);
  }).length;
  const wholeWordSignal = (wordBoundaryHits / terms.length) * 0.15;

  const lowerText = text.toLowerCase();
  let occurrences = 0;
  for (const t of terms) {
    let i = lowerText.indexOf(t);
    while (i !== -1 && occurrences < 40) { occurrences++; i = lowerText.indexOf(t, i + t.length); }
  }
  const densitySignal = Math.min(0.1, 0.1 * (1 - Math.exp(-occurrences / 12)));

  return titleSignal + densitySignal + wholeWordSignal;
}

/**
 * Score an entry end to end: keyword coverage + tiebreak, scaled by source weight
 * and recency (unless the source is marked timeless).
 */
function scoreEntry(query, entry, idfIndex, sourceWeight, opts = {}) {
  const text = entry.searchText || '';
  const title = entry.title || '';
  const relevance = keywordRelevance(query, text, idfIndex) + relevanceTiebreak(query, title, text);
  const recency = opts.timeless ? 1.0 : recencyScore(entry.timestamp, opts.decayRate);
  return relevance * sourceWeight * recency;
}

module.exports = {
  DEFAULT_DECAY_RATE,
  recencyScore,
  buildIdfIndex,
  idfWeight,
  keywordRelevance,
  relevanceTiebreak,
  scoreEntry,
};
