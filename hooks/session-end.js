'use strict';
// SessionEnd — last-chance persistence. Can't block anything; never does.
//   1. If the agent never wrote a record of this session, write an automatic
//      one (marked auto) from THIS session: the person's own messages, the
//      governer score and task, the files edited, the verification contract.
//      It never overwrites a record the agent wrote.
//   2. Note likely corrections in the person's messages as candidates to
//      review (alignment-harness store list correction-candidates) — they only
//      become standing directives when promoted with `correction add`.
//   3. Remove this session's temporary gate files.

const fs = require('fs');
const path = require('path');
const core = require('../lib/core');
const records = require('../lib/records');
const store = require('../lib/store');
const transcript = require('../lib/transcript');
const h = require('./common');

const CORRECTION = /^(no\b[,.! ]|nope\b|that'?s (not|wrong)|not what i (asked|said|meant)|i (said|told you|asked)\b|don'?t\b|stop\b|why did you|you (keep|didn'?t|forgot|missed|ignored))/i;

h.run('session-end', (input) => {
  const { switches } = core.loadSwitches();
  const se = switches.sessionEnd || {};
  const sid = h.sessionIdOf(input);
  const msgs = (() => {
    try {
      return fs.readFileSync(path.join(core.P.verbatim, `${core.safeId(sid)}.jsonl`), 'utf8').trim().split('\n')
        .map((l) => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
    } catch (_) { return []; }
  })();

  if (se.autoCompaction !== false && msgs.length) {
    try {
      const existing = records.getCompaction(sid);
      if (!existing) {
        const cs = core.currentScore(sid);
        const st = cs.state || {};
        const edited = [...new Set(transcript.allToolUses(input.transcript_path)
          .filter((u) => ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(u.name))
          .map((u) => String(u.input.file_path || u.input.notebook_path || '')).filter(Boolean))];
        const cwd = input.cwd || '';
        const rel = (f) => (cwd && f.startsWith(cwd) ? path.relative(cwd, f) : f);
        const vc = (st.verificationContract && st.verificationContract.items) || [];
        const quote = (m) => `- ${String(m.content).replace(/\s+/g, ' ').slice(0, 400)}`;
        const shown = msgs.length <= 8 ? msgs : [...msgs.slice(0, 3), { content: `… ${msgs.length - 6} more messages …` }, ...msgs.slice(-3)];
        records.putCompaction(sid, {
          auto: true,
          title: `(automatic) ${String(msgs[0].content).replace(/\s+/g, ' ').slice(0, 90)}`,
          intent: 'Not declared by the agent — this is an automatic record built from the session itself.',
          compactedSession: [
            `The person's messages (${msgs.length}):`, ...shown.map(quote), '',
            cs.scored ? `Governer: ${cs.score}/100 for "${st.governer.task}"${cs.calibrated ? '' : ' (uncalibrated)'}.` : 'Governer: never scored.',
            edited.length ? `Files edited (${edited.length}): ${edited.slice(0, 30).map(rel).join(', ')}` : 'No files edited.',
            vc.length ? `Verification contract: ${vc.filter((i) => i.verified).length}/${vc.length} checked.` : '',
          ].filter(Boolean).join('\n'),
          incompleteItems: vc.filter((i) => !i.verified).map((i) => ({ text: `Unchecked: ${i.intentStatement}`, status: 'open' })),
        });
        core.log('SessionEndAutoCompaction', { sessionId: sid, messages: msgs.length, edited: edited.length });
      }
    } catch (e) { core.log('HookError', { hook: 'session-end', error: e.message }); }
  }

  if (se.collectCorrectionCandidates !== false) {
    for (const m of msgs) {
      const text = String(m.content || '').trim();
      if (!CORRECTION.test(text)) continue;
      try {
        store.add('correction-candidates', { quote: text.slice(0, 600), at: m.timestamp, sessionId: sid, status: 'to-review' });
      } catch (_) { /* ignore */ }
    }
  }

  if (se.cleanUp !== false) {
    const id = core.safeId(sid);
    for (const f of [
      path.join(core.P.coherence, `required-${id}`), path.join(core.P.coherence, `done-${id}`), path.join(core.P.coherence, `variant-${id}`),
      path.join(core.P.data, 'state', 'subagents', `${id}.pending.jsonl`), path.join(core.P.data, 'state', 'intent-search', `${id}.resolved`),
      path.join(core.P.blocks, `${id}.json`),
    ]) { try { fs.unlinkSync(f); } catch (_) { /* not there */ } }
  }
  core.log('SessionEnd', { sessionId: sid, reason: input.reason || null });
});
