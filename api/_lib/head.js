// Builds the <head> block and structured data for server-rendered pages.

import {
  DEFAULT_IMAGE,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  escapeAttr,
  escapeHtml,
  jsonLdScript,
} from '../../shared/site.js';

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: {
      '@type': 'ImageObject',
      url: DEFAULT_IMAGE,
      width: 512,
      height: 512,
    },
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@id': ORGANIZATION_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/discover?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbSchema(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Wrap a set of nodes in a single @graph document — one script tag per page. */
export function graph(nodes) {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean),
  });
}

function meta(attr, name, content) {
  if (!content) return '';
  return `  <meta ${attr}="${escapeAttr(name)}" content="${escapeAttr(content)}">`;
}

/**
 * Render the full replaceable head block.
 *
 * @param {object} opts
 * @param {string} opts.title      Full <title> text.
 * @param {string} opts.description Meta description.
 * @param {string} opts.path       Canonical path, e.g. "/poem/abc".
 * @param {string} [opts.image]    Absolute or root-relative social image.
 * @param {string} [opts.type]     Open Graph type. Defaults to "website".
 * @param {boolean} [opts.noindex] Emit robots noindex instead of the index directives.
 * @param {string[]} [opts.schema] Pre-serialised JSON-LD script tags.
 * @param {string} [opts.extra]    Any extra raw head HTML (prev/next, article meta).
 */
export function buildHead({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  schema = [],
  extra = '',
}) {
  const canonical = absoluteUrl(path);
  const robots = noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  return [
    `  <title>${escapeHtml(title)}</title>`,
    meta('name', 'description', description),
    meta('name', 'robots', robots),
    `  <link rel="canonical" href="${escapeAttr(canonical)}">`,
    meta('property', 'og:site_name', SITE_NAME),
    meta('property', 'og:type', type),
    meta('property', 'og:title', title),
    meta('property', 'og:description', description),
    meta('property', 'og:url', canonical),
    meta('property', 'og:image', absoluteUrl(image)),
    meta('property', 'og:locale', SITE_LOCALE),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', title),
    meta('name', 'twitter:description', description),
    meta('name', 'twitter:image', absoluteUrl(image)),
    extra,
    ...schema.map((s) => `  ${s}`),
  ]
    .filter(Boolean)
    .join('\n');
}
