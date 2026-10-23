'use strict';
// SubagentStart — give a subagent the same alignment footing as the main agent.
//
// Claude Code's SubagentStart event says which kind of subagent started but not
// what it was asked to do. The pre-tool hook stashes the real task text from
// the Agent tool call; this hook picks it up, derives a provisional risk hint
// from THAT text (never a constant), shows the session's own governer score if
// there is one, and asks the subagent to state the exact result a person will
// experience before it builds.

const fs = require('fs');
const path = require('path');
const core = require('../lib/core');
const governer = require('../lib/governer');
const h = require('./common');

function takePending(sid, agentType) {
  const file = path.join(core.P.data, 'state', 'subagents', `${core.safeId(sid)}.pending.jsonl`);
  let rows = [];
  try { rows = fs.readFileSync(file, 'utf8').trim().split('\n').map((l) => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean); } catch (_) { return null; }
  const fresh = rows.filter((r) => Date.now() - r.at < 5 * 60 * 1000);
  let idx = -1;
  for (let i = fresh.length - 1; i >= 0; i--) {
    if (!agentType || !fresh[i].subagentType || fresh[i].subagentType === agentType) { idx = i; break; }
  }
  if (idx < 0) return null;
  const [picked] = fresh.splice(idx, 1);
  try { fs.writeFileSync(file, fresh.map((r) => JSON.stringify(r)).join('\n') + (fresh.length ? '\n' : '')); } catch (_) { /* ignore */ }
  return picked;
}

h.run('subagent-start', (input) => {
  const { switches } = core.loadSwitches();
  if ((switches.subagents || {}).injectAlignmentAtStart === false) return;
  const sid = h.sessionIdOf(input);
  const task = takePending(sid, input.agent_type);
  const text = task ? `${task.description}\n${task.prompt}` : '';
  // WIP: the hint is provisional and the score is the session's, not a fresh
  // judgment of this subagent's task. See hooks/WIP-subagent-start.md.
  const hint = text ? governer.baselineFor(text) : { score: null, why: 'the task text was not available' };
  const cs = core.currentScore(sid);

  try {
    fs.appendFileSync(path.join(core.P.data, 'state', 'subagents', `${core.safeId(sid)}.jsonl`), `${JSON.stringify({
      at: core.nowIso(), agentId: input.agent_id || null, agentType: input.agent_type || null,
      description: task ? task.description : null, taskTextFound: !!task, hint: hint.score, sessionScore: cs.scored ? cs.score : null,
    })}\n`);
  } catch (_) { /* ignore */ }
  core.log('SubagentStart', { sessionId: sid, taskTextFound: !!task, hint: hint.score, sessionScore: cs.scored ? cs.score : null });

  const scoreLine = cs.scored
    ? `The session's governer score is ${cs.score}/100 (${governer.describeScore(cs.score)}).`
    : 'The session has no governer score yet.';
  const hintLine = hint.score !== null
    ? `Your task text ${hint.why}, which suggests roughly ${hint.score}/100 (a keyword hint, not a score).`
    : `Your task text has no obvious risk keywords (${hint.why}).`;
  const context = `<subagent-alignment>
${scoreLine} ${hintLine}
If your task is riskier than the session score, or there is none and you will edit files, run /alignment-harness:governer on YOUR task first — its score applies to the session from then on.

Before you build anything:
1. State the exact result a person will experience — "When [who] does [what], they see [exact elements] and can [interact how]." If you can't describe it that precisely, read and research until you can.
2. State which conventions of this codebase apply (read an existing example of the same kind of thing first) and that you will follow them.
3. Write down every assumption your work depends on, how you will check each against reality, and then check it. Zero assumptions means you are not looking hard enough.

Search what is already known before you search code (the agent_find tool). If your answer will be read by a person, write it as plain prose (/speak-human). End with one line naming anything you could not verify.
</subagent-alignment>`;
  h.out(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: context } }));
});
