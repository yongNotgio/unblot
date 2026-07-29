// Client-side head management for SPA navigation.
//
// The server renderers in /api produce correct metadata for the first paint.
// Once the SPA takes over, route changes no longer reload the document, so this
// module keeps <title>, the meta description, the canonical URL, the Open Graph
// tags and the JSON-LD payload in sync with whatever the user is actually looking at.

import {
  DEFAULT_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  isNoindexPath,
  normalizeTags,
  poemPath,
  toDescription,
} from './shared/site.js';

const ROBOTS_INDEX = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const ROBOTS_NOINDEX = 'noindex, nofollow';
const MANAGED_LD_ID = 'seo-route-jsonld';

function upsertMeta(selector, attr, name, content) {
  let el = document.head.querySelector(selector);
  if (!content) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Replace the route-scoped JSON-LD block. The site-wide Organization/WebSite
 * graph in index.html is left untouched.
 */
function setJsonLd(data) {
  const existing = document.getElementById(MANAGED_LD_ID);
  if (existing) existing.remove();
  if (!data) return;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = MANAGED_LD_ID;
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

/**
 * @param {object} opts
 * @param {string} opts.title       Full <title> text.
 * @param {string} [opts.description]
 * @param {string} [opts.path]      Canonical path. Defaults to the current location.
 * @param {string} [opts.image]
 * @param {string} [opts.type]      Open Graph type.
 * @param {boolean} [opts.noindex]  Force noindex; otherwise derived from the path.
 * @param {object} [opts.jsonLd]    Route-scoped structured data.
 */
export function setSeo({
  title,
  description = SITE_DESCRIPTION,
  path,
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex,
  jsonLd = null,
} = {}) {
  const routePath = path || window.location.pathname + window.location.search;
  const canonical = absoluteUrl(routePath);
  const fullTitle = title || `${SITE_NAME} — ${SITE_DESCRIPTION.slice(0, 60)}`;
  const shouldNoindex = noindex === undefined ? isNoindexPath(routePath) : noindex;

  document.title = fullTitle;

  upsertMeta('meta[name="description"]', 'name', 'description', description);
  upsertMeta('meta[name="robots"]', 'name', 'robots', shouldNoindex ? ROBOTS_NOINDEX : ROBOTS_INDEX);
  upsertCanonical(canonical);

  upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
  upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
  upsertMeta('meta[property="og:type"]', 'property', 'og:type', type);
  upsertMeta('meta[property="og:image"]', 'property', 'og:image', absoluteUrl(image));

  upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', absoluteUrl(image));

  setJsonLd(jsonLd);
}

/** Per-route defaults for everything that is not an individual poem. */
const ROUTE_SEO = {
  '/': {
    title: `${SITE_NAME} — read and publish anonymous poetry, free`,
    description: SITE_DESCRIPTION,
  },
  '/poems': {
    title: `All poems — every poem published on ${SITE_NAME}`,
    description: `Browse every anonymous poem published on ${SITE_NAME}, newest first. Free to read, no account needed.`,
  },
  '/trending': {
    title: `Trending poetry — the most-read poems on ${SITE_NAME}`,
    description: `The anonymous poems readers are liking, discussing and sharing most on ${SITE_NAME} right now.`,
  },
  '/discover': {
    title: `Search poetry — discover anonymous poems on ${SITE_NAME}`,
    description: `Search the ${SITE_NAME} collection by title, line or tag and find anonymous poetry to read for free.`,
  },
  '/collections': {
    title: `Poetry collections — curated anonymous poems on ${SITE_NAME}`,
    description: `Curated collections of anonymous poetry on ${SITE_NAME}, grouped by theme and form.`,
  },
  '/about': {
    title: `About ${SITE_NAME} — the anonymous poetry platform`,
    description: `${SITE_NAME} is a free platform for publishing and reading anonymous poetry. Poems carry no byline, reading needs no account, and writers keep full copyright.`,
  },
  '/login': { title: `Log in — ${SITE_NAME}`, description: `Log in to your ${SITE_NAME} account.` },
  '/register': { title: `Create an account — ${SITE_NAME}`, description: `Create a free ${SITE_NAME} account to publish poetry anonymously.` },
  '/reset': { title: `Reset your password — ${SITE_NAME}`, description: `Reset the password on your ${SITE_NAME} account.` },
  '/my-poems': { title: `My poems — ${SITE_NAME}`, description: 'Poems you have published.' },
  '/add-poem': { title: `Write a poem — ${SITE_NAME}`, description: 'Publish a new poem anonymously.' },
  '/edit-poem': { title: `Edit poem — ${SITE_NAME}`, description: 'Edit a poem you published.' },
  '/liked': { title: `Liked poems — ${SITE_NAME}`, description: 'Poems you have liked.' },
  '/history': { title: `Reading history — ${SITE_NAME}`, description: 'Poems you have recently read.' },
  '/notifications': { title: `Notifications — ${SITE_NAME}`, description: 'Activity on your poems.' },
  '/admin': { title: `Admin — ${SITE_NAME}`, description: 'Moderation dashboard.' },
};

/** Apply the standard metadata for a non-poem route. */
export function setRouteSeo(route, overrides = {}) {
  const base = ROUTE_SEO[route] || ROUTE_SEO['/'];
  setSeo({ path: route, ...base, ...overrides });
}

/** Apply full poem metadata, including schema.org/Poem structured data. */
export function setPoemSeo(poem, { likes = 0, comments = 0 } = {}) {
  if (!poem) return;

  const path = poemPath(poem);
  const url = SITE_URL + path;
  const title = poem.title || 'Untitled';
  const tags = normalizeTags(poem.tags);
  const description =
    toDescription(poem.content, 155) || `Read "${title}", an anonymous poem published on ${SITE_NAME}.`;

  const counter = (interaction, count) => ({
    '@type': 'InteractionCounter',
    interactionType: `https://schema.org/${interaction}`,
    userInteractionCount: Math.max(0, Number(count) || 0),
  });

  setSeo({
    title: `${title} — a poem on ${SITE_NAME}`,
    description,
    path,
    type: 'article',
    image: poem.image || DEFAULT_IMAGE,
    noindex: false,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Poem',
      '@id': `${url}#poem`,
      name: title,
      headline: title,
      text: String(poem.content || ''),
      url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      datePublished: poem.created_at,
      dateModified: poem.updated_at || poem.created_at,
      inLanguage: 'en',
      isAccessibleForFree: true,
      genre: 'Poetry',
      author: { '@type': 'Person', name: 'Anonymous' },
      publisher: { '@id': `${SITE_URL}/#organization` },
      ...(tags.length ? { keywords: tags.join(', ') } : {}),
      ...(poem.image ? { image: absoluteUrl(poem.image) } : {}),
      interactionStatistic: [
        counter('LikeAction', likes),
        counter('CommentAction', comments),
        counter('ViewAction', poem.views_count),
      ],
    },
  });
}

/** 404s must never be indexed, and must not silently inherit the previous route's tags. */
export function setNotFoundSeo(path) {
  setSeo({
    title: `Page not found — ${SITE_NAME}`,
    description: 'This page does not exist. Browse anonymous poetry on Unblot instead.',
    path: path || window.location.pathname,
    noindex: true,
  });
}
