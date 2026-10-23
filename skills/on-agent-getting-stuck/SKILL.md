---
name: on-agent-getting-stuck
description: Use the moment you find yourself thinking "I should stop and ask the user." That thought is common and often wrong. This skill is the check that tells the difference between a genuine need for the human and a stall you should predict your way through. Triggers — scope feels ambiguous mid-task, you're unsure what the user would prefer, you're about to ask a clarifying question, you're about to hand work back unfinished, you feel blocked, you want to pause and reconfirm.
---

As an agent, you will gain insight into the user's intent, then be asked to perform scope.  in that process, you may find yourself thinking that you should stop work.  That's a common situation.  Problem is, often you stop work when you should not.  This skill is for helping you tell the difference.

If you think you should stop work there's various reasons for that.

1 - the scope is ambiguous.  When you started work the intent was clear, but now you're facing decisions for which you're honestly not sure what the user would prefer.  Here is what to do with that.

a - Ask yourself, if I was in charge of predicting the correct path forward here, what would it be.  Be specific.  Write your thought process to the ledger in this format.

If the ledger does not exist, create it as a file in the folder that `alignment-harness records ledger` prints.

self_assessment_should_I_stop_work

The user has asked me to {initial assignment}, and in the process I encountered {context causing you to question yourself} so I sense I should stop to ask the user {specific questions or clarification of the user's intent} because {why this is load bearing}.

If I predict this incorrectly, the main risk is {actual specific risk profile} and the impact of that would be {impact of getting it wrong}, which would {gravity of impact reasoning}.

If I was to infer the correct path forward, what the user would say, my prediction would be

{prediction of the correct path}

{IF load bearing assumptions, list them here in specific prose no code jargon}

THEN think about this

Given this, let me take a moment to sense into the correct path

Am I certain enough about the client's intent ( on % scale ) and is the gravity low enough ( % scale ) that this would be more of an annoyance to the client than a value add to stop?  if yes, proceed.

Am I thinking about stopping when I could easily increase the % of my confidence by using my available tools?

if so, use the tools

Tools for getting more clear

* `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` about EACH load bearing assumption I am unclear on
* /oracles - use the right one for each case to get better predictions
* /jonathan-check3 - to get the sense of what AI the user would say
* /predict-required-skills2 - to get a sense of the most likely next skills to run for my scope
* /predict-next-action2 - to get a simulation of what the user would ask me to do

have I done that, used the tools and I still see a large negative impact to getting this wrong?  if so use /ask command.

If the user said " build me a mountain" and you have only done a coherence_check, DON'T STOP WORK
If the user said, build me a silver tower, and you found a silver tower at 98% completion, and you think that's prolly the thing the user wanted you to finish, it's nearly there, it matches what the user most likely wanted, document the decision and keep working
If the user said "fix it" but the fix I proposed is totally wrong, and I think I should go back into plan mode, update the plan and that the user would prolly ask me to pause and reconfirm the sanity check as my solution will not meet the requirements I sense the user has, do that.
