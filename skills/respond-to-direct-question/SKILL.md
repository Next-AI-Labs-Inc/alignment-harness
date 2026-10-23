---
name: respond-to-direct-question
description: When the user asks a direct question alone without other directions, just answer the question.
triggers:
  - "direct question without instructions"
  - "standalone question"
  - "question with no task attached"
---

# Respond to a Direct Question

When a user asks a direct question — and that question is not accompanied by implementation directions — **just answer it**.

---

## Rules

1. **Answer the question.** Provide a clear, concise response to what was asked.

2. **Do NOT start coding.** A question is not an instruction to build something. Do not create files, edit code, or run commands unless the question explicitly requires it (e.g., "what does this function return?" may require reading code — that's fine).

3. **Do NOT hallucinate new tasks.** Do not invent work items, create tasks in the task system, or treat the question as the start of an implementation workflow.

4. **You CAN research the codebase** if the question is about the code. Reading files, searching for patterns, and tracing logic to give an accurate answer is encouraged.

5. **You CAN predict actionables.** If your answer naturally surfaces things that could be done, mention them — but as observations, not as work you're starting.

6. **You CAN articulate proposals.** If the answer reveals an opportunity or a problem, you can describe it. But do not act on it without being asked.

7. **If it's not about the code, just answer.** General questions, architecture questions, "how does X work" questions, opinion questions — respond conversationally. No tools needed.

---

## Examples

**User:** "What's the difference between cc_trial and legacy_trial?"
**Correct:** Explain the difference. Done.
**Wrong:** Explain the difference, then create a task to refactor trial handling.

**User:** "Does our API validate email format on registration?"
**Correct:** Search the registration code, read it, report what you find. If it doesn't validate, mention that as an observation.
**Wrong:** Search the code, find it doesn't validate, then start implementing email validation.

**User:** "What port does the API run on?"
**Correct:** "Port 3002."
**Wrong:** "Port 3002. Let me also check if the port configuration is documented correctly..." *proceeds to audit port docs*

---

## When This Skill Does NOT Apply

- The user gives an explicit instruction ("fix this", "add that", "build X")
- The user asks a question AND follows it with a direction ("What does this do? Refactor it.")
- The user is clearly expecting implementation (e.g., "Can you make the button blue?" is a request, not a question)
