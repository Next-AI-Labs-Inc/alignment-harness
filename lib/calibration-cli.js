'use strict';
// `alignment-harness calibration ...` — the first-session calibration offer.
// See docs/calibration.md. Every subcommand fails soft: it prints what went
// wrong in one plain sentence and exits non-zero, and never touches anything
// outside the harness's own data folder.

const cal = require('./calibration');

const out = (s) => process.stdout.write(`${s}\n`);
const str = (v) => (v && v !== true ? String(v) : undefined);

function common(args) {
  return {
    sessions: Number(str(args.sessions)) || 200,
    about: str(args.about),
    concurrency: Math.min(6, Math.max(1, Number(str(args.concurrency)) || 3)),
    maxUsd: Number(str(args['max-usd'])) || 5,
    model: str(args.model) || 'haiku',
    redo: !!args.redo,
    dryRun: !!args['dry-run'],
  };
}

// One cost sentence for a run: the split only when both parts are at least a cent.
function costLine(x) {
  const notes = (x.costUsd || 0) - (x.mapCostUsd || 0);
  if (x.mapCostUsd && notes >= 0.005 && x.mapCostUsd >= 0.005) return `Cost ${cal.money(x.costUsd)} (${cal.money(notes)} for the session notes, ${cal.money(x.mapCostUsd)} for the map).`;
  return x.costUsd ? `Cost ${cal.money(x.costUsd)} in total.` : 'Cost nothing.';
}

function describePick(p, i) {
  return `  ${String(i + 1).padStart(3)}. ${p.sessionId.slice(0, 8)}  ${new Date(p.mtime).toISOString().slice(0, 10)}  ${p.project.slice(0, 40).padEnd(40)}  ${(p.reasons || []).join(', ')}`;
}

function showSelection(sel, est, o) {
  out(`Sessions on this machine: ${sel.available}. Looked at the newest ${sel.considered}; ${sel.eligible} had at least two messages from you${o.about ? ` and were about "${o.about}"` : ''}.`);
  out(`Would read ${sel.picked.length} session${sel.picked.length === 1 ? '' : 's'}${o.about ? ` about "${o.about}"` : ''}, most useful first:`);
  sel.picked.slice(0, 15).forEach((p, i) => out(describePick(p, i)));
  if (sel.picked.length > 15) out(`  … and ${sel.picked.length - 15} more`);
  out(`Estimated cost: ${est.text} at Haiku's API prices (on a Claude subscription it counts toward plan usage instead). About ${est.minutes} minute${est.minutes === 1 ? '' : 's'}.`);
}

async function run(args) {
  const sub = args._[1] || 'status';
  const o = common(args);
  try {
    switch (sub) {
      case 'status': {
        const s = cal.status();
        const st = s.state;
        out(`decision: ${st.decision || 'not asked yet'}${st.offeredIn && st.offeredIn.length ? ` (offered in ${st.offeredIn.length} session${st.offeredIn.length === 1 ? '' : 's'})` : ''}`);
        out(`session notes: ${s.notes}${st.lastRun ? ` · last run ${String(st.lastRun.finishedAt || st.lastRun.startedAt || '').slice(0, 16)}: ${st.lastRun.done || 0} noted, ${st.lastRun.empty || 0} with nothing to learn, ${st.lastRun.failed || 0} skipped, cost ${cal.money(st.lastRun.costUsd || 0)}${st.lastRun.stopped ? `, stopped early: ${st.lastRun.stopped}` : ''}` : ''}`);
        out(`understanding map: ${s.mapExists ? 'yes' : 'not yet'} · read at every session start: ${st.prime === false ? 'off' : 'on'}`);
        out(`plans and notes indexed: ${s.plansIndexed}`);
        const c = st.costs || {};
        const n = st.costCounts || {};
        out(`spent so far: ${cal.money(c.total || 0)}${c.total ? ` (session notes ${cal.money(c.sessionNotes || 0)}, ${(n.map || 0) > 1 ? `${n.map} maps` : 'map'} ${cal.money(c.map || 0)}, ${(n.sample || 0) === 1 ? 'sample' : 'samples'} ${cal.money(c.sample || 0)})` : ''}`);
        const ret = cal.retention();
        out(`Claude Code keeps sessions for: ${ret.days} days${ret.fromSettings ? ' (your settings)' : ' (its default)'}`);
        out(`folder: ${s.folder}`);
        return 0;
      }
      case 'offer-text': { out(cal.offerText().text); return 0; }
      case 'estimate': {
        const sel = cal.pickSessions(o);
        showSelection(sel, cal.estimate(sel.picked), o);
        return 0;
      }
      case 'sample': {
        // One real note from the most useful session, shown and not saved — so
        // the person sees the kind of data before saying yes to the full run.
        const sel = cal.pickSessions({ ...o, sessions: 1 });
        if (!sel.picked.length) { out(`No session${o.about ? ` about "${o.about}"` : ''} with at least two messages from you was found, so there is nothing to sample.`); return 1; }
        const pick = sel.picked[0];
        out(`Sample from session ${pick.sessionId.slice(0, 8)} (${new Date(pick.mtime).toISOString().slice(0, 10)}, ${pick.project}), picked because: ${(pick.reasons || []).join(', ')}.`);
        if (o.dryRun) {
          const sig = cal.extractSignal(pick);
          out('\nThis is exactly what would be sent to Haiku (your words verbatim, the agent shortened):\n');
          out(sig.text.length > 4000 ? `${sig.text.slice(0, 4000)}\n… [${sig.text.length - 4000} more characters]` : sig.text);
          out('\n(dry run: no model was called, nothing was saved)');
          return 0;
        }
        const r = await cal.noteForSession(pick, o);
        if (r.costUsd) cal.addCost('sample', r.costUsd);
        if (!r.ok) { out(`The sample could not be made: ${r.error}. Nothing was saved, and nothing else is affected.`); return 1; }
        const file = cal.saveSample(r.record);
        out(`\nHere is what Haiku understood about you from that one session (cost ${cal.money(r.costUsd || 0)}). Your own words are in quotes; everything else is its reading, which you can correct:\n`);
        out(cal.describeNote(r.record));
        void file; // the structured version stays on disk; the person never needs the path
        out('\nThis is only a sample: it is not part of your calibration.');
        return 0;
      }
      case 'run': {
        if (o.dryRun) {
          const r = await cal.runCalibration(o);
          showSelection(r.selection, r.estimate, o);
          out(`${r.todo.length} of these still need a note${r.run.alreadyHad ? ` (${r.run.alreadyHad} done earlier)` : ''}. Dry run: no model was called, nothing was saved.`);
          return 0;
        }
        const r = await cal.runCalibration({ ...o, log: out });
        const x = r.run;
        out(`\nDone: ${x.done} session${x.done === 1 ? '' : 's'} noted, ${x.empty} had nothing to learn, ${x.failed} skipped. ${costLine(x)}${x.stopped ? ` Stopped early: ${x.stopped}.` : ''}`);
        out(`Understanding map: ${x.map || 'not written'}${x.map && x.map.startsWith('written') ? ` → ${cal.dirs().map}` : ''}`);
        return x.done || x.empty ? 0 : 1;
      }
      case 'map': {
        const r = await cal.buildMap(o);
        out(r.ok ? `Map ${r.synthesized ? 'written' : 'written as a plain list (the summary step failed: ' + r.error + ')'}: ${r.file}\nCost ${cal.money(r.costUsd || 0)}${r.synthesized ? '' : ' (no model reply was used)'}.` : `No map: ${r.error}`);
        return r.ok ? 0 : 1;
      }
      case 'plans': {
        const r = cal.indexWrittenDown({ dryRun: o.dryRun });
        out(`Found ${r.plans} plan${r.plans === 1 ? '' : 's'} and ${r.notes} memory note${r.notes === 1 ? '' : 's'}:`);
        for (const [k, v] of Object.entries(r.folders)) out(`  ${String(v).padStart(4)}  ${k}`);
        if (r.dryRun) { out('Dry run: nothing was indexed.'); return 0; }
        out(`Indexed ${r.written} new or changed, ${r.unchanged} already current${r.skipped ? `, ${r.skipped} unreadable` : ''}. The memory search finds them now. Index folder: ${r.folder}`);
        return 0;
      }
      case 'decide': {
        let choice = String(args._[2] || '').toLowerCase();
        const ok = ['yes', 'no', 'skip', 'later', 'sample', 'about', 'keep-no'];
        if (!ok.includes(choice)) { out(`usage: calibration decide ${ok.join('|')}`); return 1; }
        if (choice === 'skip') choice = 'no'; // "no" and "skip" are the same answer
        if (choice === 'sample' || choice === 'about') { cal.writeState({ lastAnswer: choice, lastAnswerAt: new Date().toISOString() }); out(`noted (${choice}); the offer stays open until yes or no`); return 0; }
        if (choice === 'keep-no') { cal.writeState({ keepDecision: 'no', keepDecidedAt: new Date().toISOString() }); out('Noted: keep Claude Code\'s session setting as it is. Nothing was changed, and it will not be asked again.'); return 0; }
        cal.writeState({ decision: choice === 'later' ? null : choice, lastAnswer: choice, decidedAt: new Date().toISOString() });
        out(choice === 'no' ? 'Noted: no. Calibration will not be offered again; run `alignment-harness calibration run` any time if they change their mind.' : choice === 'later' ? 'Noted: later. It may be offered once more next session.' : 'Noted: yes.');
        return 0;
      }
      case 'answer': {
        // The person's answer to the one open question from the harness, and only that one.
        const r = cal.answer(String(args._[2] || ''), { days: str(args.days) });
        out(r.ok ? r.message : `Nothing was recorded: ${r.error}.`);
        return r.ok ? 0 : 1;
      }
      case 'prime': {
        const v = String(args._[2] || '').toLowerCase();
        if (v !== 'on' && v !== 'off') { out('usage: calibration prime on|off  (whether the understanding map is read at every session start)'); return 1; }
        cal.writeState({ prime: v === 'on' });
        out(`The understanding map will ${v === 'on' ? '' : 'not '}be read at session start.`);
        return 0;
      }
      case 'keep-history': {
        // Only with the switch on AND the person's explicit yes (--yes).
        if (!args.yes) { out('This changes how long Claude Code keeps your sessions (its cleanupPeriodDays setting). Run it only after the person said yes, with --yes [--days N].'); return 1; }
        // Only ever as the person's yes to the keep-sessions question they were shown: when that question
        // is open it goes through the same answer path (so it also closes the question); in every other
        // state keepHistory itself refuses, and nothing is written.
        const oqNow = cal.readState().openQuestion;
        if (oqNow && oqNow.id === 'keep') {
          const a = cal.answer('yes', { days: str(args.days) });
          out(a.ok ? a.message : `Not changed: ${a.error}.`);
          return a.ok ? 0 : 1;
        }
        const r = cal.keepHistory(str(args.days));
        if (!r.ok) { out(`Not changed: ${r.error}.`); return 1; }
        out(`Claude Code will now keep sessions for ${r.after} days (it was ${r.before === null ? 'the default, 30' : r.before}). Changed only that one setting in ${r.file}.${r.backup ? ` The previous file is saved at ${r.backup}.` : ''}`);
        return 0;
      }
      case 'context': { out(cal.primeText() || '(no understanding map yet)'); return 0; }
      case 'forget': {
        const s = cal.status();
        if (!args.yes) {
          out(`This would delete ${s.notes} session note${s.notes === 1 ? '' : 's'}, ${s.plansIndexed} plan index entr${s.plansIndexed === 1 ? 'y' : 'ies'}${s.mapExists ? ' and the understanding map' : ''} from ${s.folder}. Your own sessions, plans and notes are never touched. Run again with --yes to delete.`);
          return 0;
        }
        const removed = cal.forget();
        out(removed.length ? `Deleted:\n  ${removed.join('\n  ')}` : 'Nothing to delete.');
        return 0;
      }
      default:
        out('usage: alignment-harness calibration status | offer-text | estimate | sample [--dry-run] | run [--sessions N] [--about "x"] [--dry-run] [--redo] [--max-usd N] | map | plans [--dry-run] | answer yes|no|later [--days N] | decide yes|no|later|keep-no | prime on|off | keep-history --yes [--days N] | context | forget [--yes]');
        return 1;
    }
  } catch (e) {
    out(`calibration: ${e.message}. Nothing else was affected.`);
    return 1;
  }
}

module.exports = { run };
