# Security

## Reporting a vulnerability

Please report it privately through GitHub's private vulnerability reporting: open this repository's **Security** tab and choose **Report a vulnerability**. Please don't open a public issue or pull request for a vulnerability, since that shows it to everyone before there is a fix.

Include what you saw, the steps to reproduce it, and which version or commit you ran. This is a small project, so replies are best effort; we will acknowledge a report as soon as we can and tell you what we plan to do about it.

## What this plugin does on your machine

The harness runs on your own machine, inside Claude Code, with your permissions. So what matters most for security is what it can read, run and send:

- **Hooks** run as local Node scripts on Claude Code events. They read the event Claude Code gives them and write to the plugin's own data folder.
- **The search server** (`mcp/agent-find`) is a local process that reads your repos, your Claude Code session transcripts and the plugin's records. It starts `git` with an argument list and no shell, so a search query is only ever text.
- **Network:** as of 2026-10-16 none of the plugin's own scripts, hooks or server make network requests. The one optional piece that can reach the internet is the meaning-based search add-on (`@xenova/transformers`), which you install yourself and which is not part of this repository; it may download its model on first use.
- **Local record of activity:** the plugin keeps a local log of its own events in its data folder. Nothing is sent anywhere.

Some skills tell the agent to run commands (tests, git, a browser). Those are the agent's actions under your Claude Code permissions, the same as anything else you ask it to do.

## Supported versions

The latest release on the default branch. This is version 0.1.0, an early release.
