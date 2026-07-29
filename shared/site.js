// Shared site constants + URL/SEO helpers.
// Imported by BOTH the browser bundle (views/, seo.js) and the Node
// serverless renderers under api/. Keep it dependency-free and isomorphic.

export const SITE_URL = 'https://www.unblot.app';
export const SITE_NAME = 'Unblot';
export const SITE_TAGLINE = 'Anonymous poetry, published in the open';
export const SITE_LOCALE = 'en_US';

export const SITE_DESCRIPTION =
  'Unblot is a free anonymous poetry platform where anyone can publish a poem without a byline, ' +
  'read new work from writers worldwide, and respond with likes and comments. No pen name, no profile, just the poem.';

export const DEFAULT_IMAGE = `${SITE_URL}/assets/unblot_logo.png`;

const UUID_SOURCE = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const UUID_RE = new RegExp(UUID_SOURCE, 'i');
const UUID_RE_GLOBAL = new RegExp(UUID_SOURCE, 'gi');

/** Turn a poem title into a URL-safe, keyword-bearing slug. */
export function slugify(input) {
  const base = String(input || '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '') // drop combining accents left behind by NFKD
    .replace(/[\u2018\u2019']/g, '') // keep "don't" as "dont", not "don-t"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '');
  return base || 'poem';
}

/**
 * Canonical path for a poem: /poem/<slug>-<uuid>.
 * The UUID always terminates the segment so it can be parsed back out exactly.
 */
export function poemPath(poem) {
  if (!poem) return '/poems';
  const id = typeof poem === 'string' ? poem : poem.id;
  if (!id) return '/poems';
  const title = typeof poem === 'string' ? '' : poem.title;
  const slug = title ? slugify(title) : '';
  return slug && slug !== 'poem' ? `/poem/${slug}-${id}` : `/poem/${id}`;
}

export function poemUrl(poem) {
  return SITE_URL + poemPath(poem);
}

/** Pull the poem UUID back out of a `<slug>-<uuid>` (or bare `<uuid>`) segment. */
export function extractPoemId(segment) {
  if (!segment) return null;
  const matches = String(segment).match(UUID_RE_GLOBAL);
  return matches ? matches[matches.length - 1].toLowerCase() : null;
}

export function isUuid(value) {
  return UUID_RE.test(String(value || ''));
}

export function absoluteUrl(path) {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return SITE_URL + (path.startsWith('/') ? path : `/${path}`);
}

/** Normalise the `tags` column, which is sometimes an array and sometimes a string. */
export function normalizeTags(tags) {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : String(tags).split(',');
  return list
    .map((t) => String(t).trim())
    .filter((t) => t && t.toLowerCase() !== 'none');
}

/** Collapse poem text into a single-line meta description of at most `max` chars. */
export function toDescription(text, max = 155) {
  const flat = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!flat) return '';
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.replace(/[\s,;:.—-]+$/, '')}…`;
}

export function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape for use inside a double-quoted HTML attribute. */
export function escapeAttr(value) {
  return escapeHtml(value).replace(/\s+/g, ' ').trim();
}

/**
 * Serialise a value into a <script type="application/ld+json"> block.
 * Angle brackets and ampersands are escaped so the payload can never break
 * out of the script element (the block is parsed as JSON, not as JS, so
 * nothing else needs escaping).
 */
export function jsonLdScript(data) {
  const json = JSON.stringify(data).replace(/[<>&]/g, (c) => {
    return '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0');
  });
  return `<script type="application/ld+json">${json}</script>`;
}

/** Routes that must never be indexed (private, auth, or duplicate-content surfaces). */
export const NOINDEX_ROUTES = [
  '/login',
  '/register',
  '/reset',
  '/admin',
  '/my-poems',
  '/add-poem',
  '/edit-poem',
  '/liked',
  '/history',
  '/notifications',
];

export function isNoindexPath(pathname) {
  const path = String(pathname || '/').split('?')[0];
  return NOINDEX_ROUTES.some((r) => path === r || path.startsWith(`${r}/`));
}
