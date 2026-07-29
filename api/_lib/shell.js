// Loads index.html once per warm lambda and stamps server-rendered content into it.
//
// Crawlers (and any client with JS disabled) get the real content in the initial
// HTML response. When the SPA boots it renders the same route over the top, so
// what a crawler sees and what a user sees stay identical — no cloaking.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEFAULT_IMAGE, SITE_NAME, SITE_URL, escapeHtml } from '../../shared/site.js';

const HEAD_OPEN = '<!--SEO_HEAD-->';
const HEAD_CLOSE = '<!--/SEO_HEAD-->';
const APP_OPEN = '<!--SSR_CONTENT-->';
const APP_CLOSE = '<!--/SSR_CONTENT-->';

let cachedShell;

function readShell() {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(process.cwd(), 'index.html'),
    join(here, '..', '..', 'index.html'),
    join(here, '..', '..', '..', 'index.html'),
  ];
  for (const candidate of candidates) {
    try {
      // index.html is saved with a UTF-8 BOM; strip it so the rendered response
      // starts cleanly at <!DOCTYPE html>.
      const html = readFileSync(candidate, 'utf8');
      return html.charCodeAt(0) === 0xfeff ? html.slice(1) : html;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

function loadShell() {
  if (cachedShell === undefined) cachedShell = readShell();
  return cachedShell;
}

function replaceBetween(html, open, close, replacement) {
  const start = html.indexOf(open);
  const end = html.indexOf(close);
  if (start === -1 || end === -1 || end < start) return null;
  return html.slice(0, start + open.length) + replacement + html.slice(end);
}

/**
 * Minimal standalone document, used only if index.html cannot be read.
 * It still carries correct metadata and content so a crawl is never wasted.
 */
function fallbackDocument(headHtml, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" href="/assets/unblot_logo.png">
${headHtml}
</head>
<body>
  <a href="/" rel="home"><strong>${escapeHtml(SITE_NAME)}</strong></a>
  <main>${bodyHtml}</main>
</body>
</html>`;
}

/**
 * @param {object} opts
 * @param {string} opts.head Rendered <head> block (see buildHead).
 * @param {string} opts.body Rendered markup to place inside #app.
 * @returns {string} Complete HTML document.
 */
export function renderShell({ head, body }) {
  const shell = loadShell();
  if (!shell) return fallbackDocument(head, body);

  const withHead =
    replaceBetween(shell, HEAD_OPEN, HEAD_CLOSE, `\n${head}\n  `) ||
    shell.replace('</head>', `${head}\n</head>`);

  const withBody =
    replaceBetween(withHead, APP_OPEN, APP_CLOSE, `\n${body}\n    `) ||
    withHead.replace(/(<div id="app"[^>]*>)[\s\S]*?(<\/div>)/, `$1\n${body}\n$2`);

  return withBody;
}

const CACHE_OK = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';
const CACHE_MISS = 'public, max-age=0, s-maxage=60, stale-while-revalidate=600';

export function sendHtml(res, html, { status = 200 } = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', status === 200 ? CACHE_OK : CACHE_MISS);
  res.end(html);
}

/** Absolute URL of the request, used for canonical tags on paginated pages. */
export function canonicalFor(path) {
  return SITE_URL + path;
}

export { DEFAULT_IMAGE };
