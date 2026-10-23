'use strict';
// SessionStart and UserPromptSubmit (its own hook, next to session-start.js and
// user-prompt.js) — the first-session calibration offer and the questions after
// it, one open question per reply, and, once a person has said yes, the
// understanding it built.
//   • No decision yet, first session (or the next one if the offer went
//     unanswered): hands the agent the offer text to show the person, word for
//     word, and what to run for each answer. Never offered more than twice.
//   • An understanding map exists: hands the agent the top of it, as leans to
//     weigh. Turn off with `alignment-harness calibration prime off`.
// Fail-open like every hook: any error here and the session simply starts.

const h = require('./common');

h.run('calibration-offer', (input) => {
  if (process.env.ALIGNMENT_HARNESS_NESTED) return; // the calibration's own model calls
  if (h.isSubagent(input)) return;
  const cal = require('../lib/calibration');
  const ctx = { source: input.source || 'startup', sessionId: h.sessionIdOf(input), prompt: typeof input.prompt === 'string' ? input.prompt : '', transcriptPath: input.transcript_path || '' };
  const text = input.hook_event_name === 'UserPromptSubmit' || process.argv[2] === 'prompt'
    ? cal.promptContext(ctx)
    : cal.sessionStartContext(ctx);
  if (text) h.contextOut(`${text}\n`, 'calibration');
});
