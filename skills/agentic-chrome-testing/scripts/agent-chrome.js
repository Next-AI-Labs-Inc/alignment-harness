#!/usr/bin/env node

/**
 * agent-chrome.js — Control YOUR running Chrome. No restart. No debug port. No Puppeteer.
 *
 * Uses AppleScript to talk to Chrome + screencapture for screenshots. This is macOS-only
 * (AppleScript has no equivalent on Linux/Windows — on those platforms use the
 * chrome-devtools MCP path described in /alignment-harness:devtools-site-testing instead).
 *
 * One-time setup: Chrome → View → Developer → "Allow JavaScript from Apple Events"
 *
 * Usage: node agent-chrome.js <command> [args...]
 */

const { execSync } = require('child_process');

// ---------------------------------------------------------------------------
// AppleScript helpers
// ---------------------------------------------------------------------------

function osa(script) {
  return execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
    encoding: 'utf8',
    timeout: 30000,
  }).trim();
}

function chromeJS(js) {
  // Escape for AppleScript string embedding
  const escaped = js.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return osa(
    `tell application "Google Chrome" to execute front window's active tab javascript "${escaped}"`
  );
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const commands = {
  navigate(args) {
    const url = args[0];
    if (!url) { console.error('Usage: navigate <url>'); process.exit(1); }
    osa(`tell application "Google Chrome"
      if (count of windows) = 0 then make new window
      set URL of active tab of front window to "${url.replace(/"/g, '\\"')}"
    end tell`);
    // Wait for page to load
    let ready = false;
    for (let i = 0; i < 20; i++) {
      try {
        const state = osa('tell application "Google Chrome" to return loading of active tab of front window');
        if (state === 'false') { ready = true; break; }
      } catch { /* still loading */ }
      execSync('sleep 0.5');
    }
    const title = osa('tell application "Google Chrome" to return title of active tab of front window');
    console.log(`Navigated: ${title}`);
  },

  screenshot(args) {
    const filePath = args[0] || '/tmp/agent-screenshot.png';
    // Bring Chrome to front
    osa('tell application "Google Chrome" to activate');
    execSync('sleep 0.3');
    // Capture the frontmost window (no window ID needed)
    execSync(`screencapture -o -w "${filePath}"`);
    console.log(`Screenshot saved: ${filePath}`);
  },

  click(args) {
    const selector = args[0];
    if (!selector) { console.error('Usage: click <selector>'); process.exit(1); }
    let js;
    if (selector.startsWith('text=')) {
      const text = selector.slice(5).replace(/"/g, '\\"');
      js = `(function(){
        const els = [...document.querySelectorAll('*')].filter(e => e.textContent.trim() === '${text}' && e.children.length === 0);
        if(els[0]){els[0].click(); return 'clicked'}
        const partial = [...document.querySelectorAll('*')].filter(e => e.textContent.includes('${text}') && e.children.length === 0);
        if(partial[0]){partial[0].click(); return 'clicked (partial match)'}
        return 'not found'
      })()`;
    } else {
      js = `(function(){const e=document.querySelector('${selector.replace(/'/g, "\\'")}'); if(e){e.click();return 'clicked'} return 'not found'})()`;
    }
    const result = chromeJS(js);
    if (result.includes('not found')) {
      console.error(`Element not found: ${selector}`);
      process.exit(1);
    }
    console.log(`Clicked: ${selector}`);
  },

  type(args) {
    const selector = args[0];
    const text = args.slice(1).join(' ');
    if (!selector || !text) { console.error('Usage: type <selector> <text>'); process.exit(1); }
    const js = `(function(){
      const el = document.querySelector('${selector.replace(/'/g, "\\'")}');
      if(!el) return 'not found';
      el.focus(); el.value = '${text.replace(/'/g, "\\'")}';
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
      return 'typed';
    })()`;
    const result = chromeJS(js);
    if (result.includes('not found')) {
      console.error(`Element not found: ${selector}`);
      process.exit(1);
    }
    console.log(`Typed into ${selector}: "${text}"`);
  },

  eval(args) {
    const expression = args.join(' ');
    if (!expression) { console.error('Usage: eval <js-expression>'); process.exit(1); }
    const result = chromeJS(expression);
    console.log(result);
  },

  wait(args) {
    const selector = args[0];
    const timeoutMs = Number(args[1]) || 5000;
    if (!selector) { console.error('Usage: wait <selector> [timeoutMs]'); process.exit(1); }
    const started = Date.now();
    const js = `(function(){return document.querySelector('${selector.replace(/'/g, "\\'")}') ? 'found' : 'missing'})()`;
    while (Date.now() - started < timeoutMs) {
      if (chromeJS(js) === 'found') { console.log(`Found: ${selector}`); return; }
      execSync('sleep 0.3');
    }
    console.error(`Timed out waiting for: ${selector}`);
    process.exit(1);
  },

  url() {
    const url = osa('tell application "Google Chrome" to return URL of active tab of front window');
    console.log(url);
  },

  title() {
    const title = osa('tell application "Google Chrome" to return title of active tab of front window');
    console.log(title);
  },

  tabs() {
    const script = `tell application "Google Chrome"
      set output to ""
      repeat with w from 1 to (count of windows)
        repeat with t from 1 to (count of tabs of window w)
          set output to output & "[" & w & ":" & t & "] " & title of tab t of window w & " — " & URL of tab t of window w & "\\n"
        end repeat
      end repeat
      return output
    end tell`;
    console.log(osa(script));
  },

  'console-errors'(args) {
    const listenMs = Number(args[0]) || 3000;
    const js = `(function(){
      window.__agentConsoleErrors = [];
      const orig = console.error;
      console.error = function(...a){ window.__agentConsoleErrors.push(a.join(' ')); orig.apply(console, a); };
      return 'listening';
    })()`;
    chromeJS(js);
    execSync(`sleep ${listenMs / 1000}`);
    console.log(chromeJS('JSON.stringify(window.__agentConsoleErrors || [])'));
  },

  help() {
    console.log(`agent-chrome — control YOUR Chrome via AppleScript + screencapture

Setup: Chrome → View → Developer → "Allow JavaScript from Apple Events"
macOS only.

Commands:
  navigate <url>              Go to URL in active tab
  screenshot [path]           Capture Chrome window (default /tmp/agent-screenshot.png)
  click <selector>            Click element (CSS or "text=...")
  type <selector> <text>      Type into input (sets value + fires events)
  eval <js-expression>        Run JS in active tab, print result
  wait <selector> [timeoutMs] Poll until selector appears (default 5000ms)
  console-errors [ms]         Listen for console.error calls for N ms, print them
  url                         Print current URL
  title                       Print current page title
  tabs                        List all tabs across all windows
  help                        Show this help

No debug port needed. No restart. Uses your running Chrome.`);
  },
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const [command, ...args] = process.argv.slice(2);

if (!command || command === 'help') {
  commands.help();
  process.exit(0);
}

if (!commands[command]) {
  console.error(`Unknown command: ${command}\nRun with "help" for usage.`);
  process.exit(1);
}

try {
  commands[command](args);
} catch (err) {
  if (err.message && err.message.includes('not allowed')) {
    console.error('Chrome blocked JavaScript from AppleScript.');
    console.error('Fix: Chrome → View → Developer → "Allow JavaScript from Apple Events"');
  } else {
    console.error(err.message || err);
  }
  process.exit(1);
}
