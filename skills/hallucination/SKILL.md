---
name: hallucination
description: Diagnostic protocol invoked when an agent stated or acted on something false as if it were fact.
triggers:
  - "hallucination"
---
The Hallucination skill has been invoked. This means that you have developed some opinion which was false, then incorrectly violated the most fundamental intent and principle of the entire system — you have either stated it was a FACT when it was not or interpreted it as a fact when it was not.

Hallucination is the core disease that prevents you from transitioning from a team of AI agents that need constant micromanagement to a self-governing, self-healing, autonomous team which would enable the most profound breakthrough of this entire codebase.

So, perform a diagnostic. If the admin has provisioned you any hints as to what you hallucinated, pause all other initiatives and trace the causal chain between the context you consumed and the hallucination.

For example, if you saw X in console on trying to hit the API, assumed it meant it was not running — what was the exact thing that printed X to you, and why did you interpret it that way?

The point of this is not mental masturbation, it's leverage. We want you to find and repair the source of hallucination. So any "well I just thought X" is noise. Only signal. What Y would be required for Z, if Z is non-hallucination, what is Y.

Meaning, in that example: if I change that API to output a more informative message I won't hallucinate and think it's offline when it's just a, b, c, or d.

## Source Categories

Examples of where hallucination sources live:

- Comments in code at path (full path)
- False intent.db entry
- Confusing compaction history
- Code seemed to imply X
- I took my own notes and left all the nuance out and literally created a feedback loop that confused myself (CRITICAL — this happens constantly)
- An agent named a variable in a way and instead of pausing to understand it and looking it up I violated the core tenet and assumed the variable name held its semantic meaning even though that required literally hallucinating things that are not there
- A previous agent's session compaction stated X as fact when it was unverified
- A memory file or MEMORY.md entry was wrong or outdated
- I ran a command with default args instead of reading the config that tells me what args to use

## Output Format

```
Causes of hallucination:
 - [one sentence per cause, specific, with the exact context source]

Fixes of these causes:
 - [one sentence per fix, mechanical, actionable — e.g. "delete intentdb ID X which says A when B is true"]
```

## Principle

If you cannot point to the exact line, file, memory, compaction, or variable that caused the hallucination — you haven't finished the diagnostic. "I assumed" is not a cause. The thing that made you assume is the cause. Find that thing. Fix that thing.

---

## Field-Contract Hallucination (Structural Hallucination)

This is the most common hallucination that does not look like a factual error but causes more harm than factual errors in agent-consumed systems.

**What it is:** An agent writes content for a field that violates the field's defined contract — not by stating a false fact, but by misunderstanding what the field IS FOR and producing the wrong kind of content.

**Why it's hallucination:** The agent hallucinated a field contract that doesn't exist. They wrote what they thought the field should contain, instead of what the skill file says it actually contains.

**The most dangerous example — `coachingApplication` in extract-coaching-principle:**

What agents hallucinate the field means:
> "What the coach should do when this principle is relevant — specific instructions."

What the field actually is:
> "An option the coach becomes aware of. When certain conditions are present, this move tends to be available. The coach decides whether and how to use it based on what the specific person needs. Never a directive. Never a script. Never an if/then."

**How to detect you are writing a field-contract hallucination:**

If you are writing for `coachingApplication` and you produce ANY of these, stop — you have hallucinated the contract:
- A directive sentence: "Hold attention in the body." / "Redirect to somatic experience." / "Don't let the client leave the body."
- A prescribed script: `redirect: 'Where do you feel that right now?'` — any quoted phrase the coach should say
- An if/then instruction: "When the person says X, say Y" — destroys emotional intelligence, replaces it with a calculator
- An absolute: "this breaks if" / "coach must" / "always" / "never" (in the directive sense)
- An implicit override of client signals: "keep returning to somatic experience rather than resolving narrative content" — this instructs the coach to override what the client is actually signaling

**The correct test before writing any `coachingApplication` content:**
> "Does this ADD to the coach's awareness of available options? Or does it REMOVE the coach's ability to respond to the actual person in front of them?"

If it removes — do not write it.

**Root causes of this hallucination:**
- Skill file GOOD example itself contained the pattern — agents copy examples literally
- The field name "coachingApplication" sounds like "how to apply coaching" → interpreted as instructions
- GOOD examples showed `coachingApplication` with directives — agents trust examples over definitions
- Agents read the field definition but pattern-match to the example, which overrides the definition

**Fix:** Read the field definition. Then read the GOOD example. If they contradict — the definition wins. If the example contains the prohibited pattern, flag it before using it as a template.

---

## Evidence-Attribution Conflation Hallucination

**What it is:** An agent treats a citation (attribution — "this person said this") as evidence (empirical support — "a study showed this mechanism works"). The two are not the same. Conflating them produces overclaims that erode trust when checked.

**What triggers it:** The label "evidence" on a field that contains citations. Agents read the label, not the content type. "Evidence array" → they treat everything in it as proven. "Citation with contribution" → they still call it evidence because the parent field says evidence.

**Test:** For each source in any evidence/citations field, ask: "What specifically did this measure, in what population, with what controls?" If the honest answer is "it didn't measure anything — it described, attributed, or theorized," it is NOT evidence. It is attribution or lineage.

**How to detect you are writing an evidence-attribution conflation:**
- You wrote "evidence shows" followed by a practitioner report
- You wrote "neuroscience confirms" without naming the study and the specific mechanism it measured
- You put a citation for where a practice originated in the same array as RCT findings
- You mixed "Tara Brach developed this practice" (attribution) with "Holzel 2011 found structural brain changes" (empirical finding) without distinguishing them

**Correct structure:**
- Each source entry answers ONE question: "What does this source actually contribute — attribution, empirical finding, practitioner consensus, historical lineage?"
- Entries that are attribution are labeled as attribution explicitly. Not implied.
- The distinction between "attributed to" and "evidenced by" must be visible without the reader needing to evaluate the source themselves.

---

## Anti-Hallucination Protocol for Principle Extraction Agents

Before composing ANY field in a coaching principle extraction:

1. **Read the field definition in the skill file, not your memory of it.** Field contracts change. Your memory of them may be wrong or outdated.
2. **For `coachingApplication`:** Ask yourself — "Am I writing an option the coach becomes aware of, or am I directing the coach?" If directing — rewrite.
3. **For any evidence/citations field:** List each source entry separately. For each, write the honest answer to "what does this source actually prove about this specific claim?" If it doesn't prove anything — say so explicitly.
4. **For `principle`:** Read what you wrote and ask — "Could an agent reading only this paragraph apply the principle without hallucinating context?" If you find yourself relying on implications, rewrite.
5. **Check the GOOD example** against the field definition. If they contradict, the definition wins and the example should be flagged as needing correction.
