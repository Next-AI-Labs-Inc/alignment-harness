---
name: harness
description: "The alignment harness's front door. /harness setup (guided, optional setup), /harness status (every piece: on, off, set up, working, waiting on setup), /harness settings (a page on this machine that turns every piece on and off and shows what each does for you), /harness on|off|remind <piece> (turn one piece up, down, on or off), /harness conflicts (your own hooks or skills that already do a harness job, so nothing fires twice), /harness uninstall (how to remove it, and what lives outside the plugin). Use when the person types /harness, asks what the harness is doing, asks about a setting, or wants to turn something up, down, on or off."
---

# /harness — one command for the whole harness

A small program does the checking; you do the talking. Run the command, then tell the person what it means in plain sentences. Never paste raw output without saying what it means for them. If `alignment-harness` is not on the PATH, use the full `node …/bin/alignment-harness` path from the session-start note.

## /harness status (also the default with no word after it)

Run `alignment-harness doctor` and `alignment-harness conflicts`. Tell the person, one line per piece, whether it is on, set up and working, using the evidence the doctor shows (for example "the coherence check armed 12 times and was completed 11 times"). Say what each piece still waiting on setup would add, and the one command that sets it up. If `conflicts` found hooks or skills of theirs that do the same job, say which, and ask which they want to keep (see "conflicts" below).

## /harness setup

Invoke /alignment-harness:harness-setup. It walks the checkpoints, says before each what it will read and write, and asks.

## /harness settings: the page

Point the person to the page when they want to look around, see everything at once, or change several things. Point them to it, too, when they ask what something does and a picture would help more than a sentence.

1. Start it in the background, because it keeps running until it's closed: `alignment-harness settings` (with your Bash tool's run-in-background option). It prints an address on 127.0.0.1 with a one-time key and opens it in their browser. If it can't open the browser, give them the address.
2. Tell them in one sentence what they'll see: every piece in the order it shows up in a session, each row expandable to what it does for them, what they'd notice if they turned it off, its dials and whether it's working. Changes apply from their next message.
3. If they asked about one piece, name the row to open (for example "open Evidence gate, under 'When the agent says it's done'").

The page closes itself after 30 idle minutes. It writes only through the same writer as `alignment-harness switch`, so your changes and theirs never disagree.

## /harness on <piece> · /harness off <piece> · /harness remind <piece> · questions about a setting

Don't work from memory of which settings exist; read the list. Then follow this order:

1. **Find it.** Run `alignment-harness settings list --json`. Each entry in `settings` has `name`, `label` (its plain name), `value`, `default`, `allowed` (on/off, a list of words, or a number range), `forYou` (what the piece does for the person), `whatItDoes` (what this one setting does), `note`, `doc` (its documentation page) and `howToChange`. `sections` groups them into pieces; a piece's `primary` names its main control (for example `coherenceGate.strength`). Match what the person said to a piece by its `name` and `what`, not by guessing a key. `notSwitchableHere` lists pieces that have no switch here, each with the real way to turn it off.
2. **Explain before changing.** Tell the person in a sentence or two what the piece does for them (`forYou`) and what they'd notice with it off (the piece's `ifOff`). If they only asked a question, stop there.
3. **Offer the gentler dial.** When something is only getting in the way, suggest `remind` before `off` (for the hand-back, `block-once` is its only "on"). That keeps the benefit and removes the friction. If they still want it off, turn it off.
4. **Change it.** `alignment-harness switch <name> <value>`, for example `alignment-harness switch coherenceGate.strength remind`. Values: `on`/`off` for on-off settings, one of the `allowed.values` words, or a whole number in range. It edits their switches file in place and keeps every comment. Anything not in the list, or a value it doesn't accept, is refused and nothing changes. Claude Code may ask the person to approve the command. That's on purpose: setting changes aren't pre-approved by the harness, so the agent can't turn its own checks down unseen. Tell them that's what the prompt is. If they'd rather not be asked for this, docs/settings.md shows the allow rule they can add to their own settings; never add it for them.
5. **Confirm.** Run `alignment-harness settings get <name>` and tell them the new value and that it applies from their next message. For a gate (coherence check, governer, evidence gate), also show its `alignment-harness doctor` line.

`claude plugin disable alignment-harness` turns every hook off at once and keeps their settings.

**Never change the check's headings or wording from here.** COHERENCE_CHECK, ANY_NEW_SCOPE_INDICATED and PENDING_SCOPE are a fixed shape the harness reads back, so they aren't settings. If the person wants different wording, explain the copy-and-edit path (copy a file from the plugin's `prompts/` folder into `<data folder>/prompts/` and edit their copy; `alignment-harness paths` shows the folders). That's their decision and their edit, not yours.

Two settings are commands that run on their machine (`understanding.memorySearchCommand`, `governer.predictRequiredSkills.oracleCommand`). The page won't set them. Set them only through /alignment-harness:harness-setup, or with the person's explicit go for the exact command.

## When a newcomer meets the headings, or asks "what's this COHERENCE_CHECK thing?"

Use this during setup, the first time the person sees a reply that starts with the headings, or whenever they ask what they are. Say it in your own words, briefly: the capitalised headings at the top of your replies (COHERENCE_CHECK, then your reading of what they meant, ANY_NEW_SCOPE_INDICATED and PENDING_SCOPE) are your own check-in notes. You write them so you keep hold of what they meant, and so a misread gets caught in one sentence, before you build on it. They have a fixed shape because the harness reads them back later to learn what they confirmed or corrected. They can skim them, and correct any line in one sentence. If they want to see more, the Coherence check entry on the settings page explains each heading. Never rename, drop or reword the headings themselves.

## /harness conflicts

Run `alignment-harness conflicts`. For each duplicate, explain that both theirs and the harness's will run, and what that feels like (two checks asking the same thing). Then ask which to keep. If they keep theirs, run the switch command it prints. Never edit or remove their own hooks, settings or skills; the harness only changes its own switches.

## /harness uninstall

Tell them: `claude plugin uninstall alignment-harness` removes the plugin and its data folder (add `--keep-data` to keep their switches, risk table, records and saved messages), and `claude plugin marketplace remove alignment-harness` removes the source. Then list anything setup created OUTSIDE the data folder. Check `alignment-harness setup status` for the oracles checkpoint (notebooks in their own NotebookLM account) and, if they keep a notes vault, any notes skills filed there. Offer to help remove each one, with their confirmation for every one.
