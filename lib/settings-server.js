'use strict';
// The settings page's small web server: `alignment-harness settings` starts it.
//
// It runs on this machine only and adds no packages:
//   - it listens on 127.0.0.1 (never a network address), on a random free port by default;
//   - every request needs the one-time key printed in the address, so another web page open in
//     your browser can't read or flip your switches (changes also need the key in a request
//     header and a JSON body, which a page on another site can't send here);
//   - requests naming any other host are refused, so a look-alike address can't reach it;
//   - it closes itself after 30 idle minutes, or on Ctrl-C.
// Every change goes through lib/settings.js, the same writer `alignment-harness switch` uses.
// Nothing here is read by the hooks; if this server breaks, the harness keeps working.

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const core = require('./core');
const settings = require('./settings');

const PAGE = path.join(__dirname, 'settings-page.html');
const DOCS = path.join(core.PLUGIN_ROOT, 'docs');

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function slug(s) { return String(s).toLowerCase().replace(/[`*_]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

// Just enough Markdown for the plugin's own docs pages: headings (with anchors), lists, code,
// bold and links. Links to other docs pages stay on this page's server; nothing loads from
// anywhere else.
function renderMarkdown(md, key) {
  const inline = (t) => esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
      const doc = href.match(/^(?:\.\/)?([a-z0-9-]+\.md)(#[a-z0-9-]+)?$/i);
      return doc ? `<a href="/docs/${doc[1]}?key=${key}${doc[2] || ''}">${label}</a>` : `${label} <span class="ghost">(${href})</span>`;
    });
  const out = []; let list = null; let para = []; let code = null;
  const flush = () => {
    if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; }
    if (list) { out.push(`</${list}>`); list = null; }
  };
  for (const line of String(md).split('\n')) {
    if (code !== null) {
      if (/^```/.test(line)) { out.push(`<pre>${esc(code.join('\n'))}</pre>`); code = null; } else code.push(line);
      continue;
    }
    if (/^```/.test(line)) { flush(); code = []; continue; }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flush(); out.push(`<h${h[1].length} id="${slug(h[2])}">${inline(h[2])}</h${h[1].length}>`); continue; }
    const li = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
    if (li) {
      if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; }
      const kind = /^\s*\d+\./.test(line) ? 'ol' : 'ul';
      if (list !== kind) { if (list) out.push(`</${list}>`); out.push(`<${kind}>`); list = kind; }
      out.push(`<li>${inline(li[1])}</li>`);
      continue;
    }
    if (/^\s*\|/.test(line)) { flush(); out.push(`<pre class="table">${esc(line)}</pre>`); continue; }
    if (!line.trim()) { flush(); continue; }
    if (list && /^\s{2,}/.test(line)) { out[out.length - 1] = out[out.length - 1].replace(/<\/li>$/, ` ${inline(line.trim())}</li>`); continue; }
    if (list) { out.push(`</${list}>`); list = null; }
    para.push(line.trim());
  }
  if (code !== null) out.push(`<pre>${esc(code.join('\n'))}</pre>`);
  flush();
  return out.join('\n');
}

function docPage(name, key) {
  const file = path.join(DOCS, name);
  const md = fs.readFileSync(file, 'utf8');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)} · harness docs</title><style>
body{margin:0;background:#f6f5f1;color:#1d1f22;font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif}
.wrap{max-width:780px;margin:0 auto;padding:28px 16px 60px} a{color:#2f5d50} h1{font-size:24px} h2{font-size:18px;margin-top:28px}
code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px} code{background:#ece9e1;padding:1px 5px;border-radius:4px}
pre{background:#fff;border:1px solid #e3e1da;border-radius:8px;padding:10px 12px;overflow-x:auto;white-space:pre-wrap} pre.table{margin:0;border-radius:0;border-top:0;padding:4px 12px}
.ghost{color:#8b9097;font-size:12px}.back{display:inline-block;margin-bottom:16px}
@media (prefers-color-scheme: dark){body{background:#17191b;color:#e7e4dc}pre{background:#202326;border-color:#33373b}code{background:#2a2d31}a{color:#8fc7b0}}
</style></head><body><div class="wrap"><a class="back" href="/?key=${key}">← Back to settings</a>
${renderMarkdown(md, key)}</div></body></html>`;
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const parts = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('request too large')); req.destroy(); } else parts.push(c); });
    req.on('end', () => resolve(Buffer.concat(parts).toString('utf8')));
    req.on('error', reject);
  });
}

function sameKey(a, b) {
  const x = Buffer.from(String(a || '')); const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Starts the server. Resolves with { url, port, key, server, close }.
function start(opts) {
  const o = opts || {};
  const key = crypto.randomBytes(18).toString('hex');
  const idleMs = Math.max(1, Number(o.idleMinutes) || 30) * 60 * 1000;
  let idleTimer = null;
  let server = null;
  const close = () => { try { clearTimeout(idleTimer); server.close(); } catch (_) { /* already closed */ } if (o.onClose) o.onClose(); };
  const touch = () => { clearTimeout(idleTimer); idleTimer = setTimeout(close, idleMs); if (idleTimer.unref && o.unrefTimer) idleTimer.unref(); };

  const headers = (type) => ({
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  });
  const send = (res, code, type, body) => { res.writeHead(code, headers(type)); res.end(body); };
  const json = (res, code, obj) => send(res, code, 'application/json; charset=utf-8', JSON.stringify(obj));
  const list = () => settings.listSettings({ withHealth: true, withSkills: true });

  server = http.createServer(async (req, res) => {
    touch();
    try {
      const port = server.address().port;
      const host = String(req.headers.host || '');
      if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return send(res, 421, 'text/plain; charset=utf-8', 'This settings page only answers on 127.0.0.1.\n');
      const u = new URL(req.url, `http://${host}`);
      const given = req.headers['x-harness-key'] || u.searchParams.get('key');
      if (!sameKey(given, key)) return send(res, 403, 'text/plain; charset=utf-8', 'Open the address that `alignment-harness settings` printed; it carries a one-time key.\n');

      if (req.method === 'GET' && u.pathname === '/') {
        return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(PAGE, 'utf8').split('__HARNESS_KEY__').join(key));
      }
      if (req.method === 'GET' && u.pathname === '/api/settings') return json(res, 200, list());
      if (req.method === 'POST' && u.pathname === '/api/set') {
        if (!req.headers['x-harness-key']) return json(res, 403, { ok: false, error: 'changes need the key in the X-Harness-Key header' });
        if (!/^application\/json\b/.test(String(req.headers['content-type'] || ''))) return json(res, 415, { ok: false, error: 'send changes as JSON' });
        let body;
        try { body = JSON.parse(await readBody(req, 64 * 1024)); } catch (e) { return json(res, 400, { ok: false, error: `could not read the change: ${e.message}` }); }
        const changes = Array.isArray(body.changes) ? body.changes : [{ name: body.name, value: body.value }];
        const current = list();
        for (const ch of changes) {
          const s = current.settings.find((x) => x.name === (ch && ch.name));
          if (s && !s.switchableOnPage) return json(res, 400, { ok: false, error: `${s.name} is a command that runs on your machine, so this page doesn't change it. Use: ${s.howToChange}`, list: current });
        }
        try {
          const done = settings.setMany(changes);
          return json(res, 200, { ok: true, done, list: list() });
        } catch (e) {
          return json(res, 400, { ok: false, error: e.message, list: list() });
        }
      }
      const doc = u.pathname.match(/^\/docs\/([a-z0-9-]+\.md)$/i);
      if (req.method === 'GET' && doc && fs.existsSync(path.join(DOCS, doc[1]))) return send(res, 200, 'text/html; charset=utf-8', docPage(doc[1], key));
      return send(res, 404, 'text/plain; charset=utf-8', 'Not found.\n');
    } catch (e) {
      return json(res, 500, { ok: false, error: `the settings page hit a problem (${e.message}); your switches file was not changed by it, and the harness keeps running` });
    }
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(Number(o.port) || 0, '127.0.0.1', () => {
      touch();
      const { port } = server.address();
      resolve({ url: `http://127.0.0.1:${port}/?key=${key}`, port, key, server, close });
    });
  });
}

// Open the address in the person's browser. Best effort: if it can't, the address is printed.
function openBrowser(url) {
  const { spawn } = require('child_process');
  const cmd = process.platform === 'darwin' ? ['open', [url]]
    : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
      : ['xdg-open', [url]];
  try {
    const p = spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true });
    p.on('error', () => { /* printed address is the fallback */ });
    p.unref();
    return true;
  } catch (_) { return false; }
}

module.exports = { start, openBrowser, renderMarkdown };
