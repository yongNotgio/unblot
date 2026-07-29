// Server-rendered archive at /poems — the crawl hub.
// Every poem on the site is reachable from here in a few hops, which gives
// crawlers a link path to content the SPA otherwise only renders via JavaScript.

import { SITE_NAME, absoluteUrl, escapeAttr, poemPath } from '../shared/site.js';
import { countPoems, listPoems } from './_lib/db.js';
import {
  breadcrumbSchema,
  buildHead,
  graph,
  organizationSchema,
  websiteSchema,
} from './_lib/head.js';
import { breadcrumbNav, pagination, poemList, siteLinks } from './_lib/markup.js';
import { renderShell, sendHtml } from './_lib/shell.js';

const PER_PAGE = 50;

export default async function handler(req, res) {
  const requested = Number.parseInt(req.query?.page, 10);
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1;

  let poems = [];
  let total = 0;
  try {
    [poems, total] = await Promise.all([
      listPoems({ limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
      countPoems(),
    ]);
  } catch (err) {
    console.error('[api/poems] listing failed', err);
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const path = page === 1 ? '/poems' : `/poems?page=${page}`;

  const title =
    page === 1
      ? `All poems — every poem published on ${SITE_NAME}`
      : `All poems — page ${page} of ${totalPages} — ${SITE_NAME}`;

  const description =
    page === 1
      ? `Browse all ${total || ''} anonymous poems published on ${SITE_NAME}, newest first. Free to read, no account needed.`.replace(
          '  ',
          ' '
        )
      : `Page ${page} of the complete ${SITE_NAME} poetry archive, sorted newest first.`;

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Poems', path: '/poems' },
  ];

  const relLinks = [
    page > 1
      ? `  <link rel="prev" href="${escapeAttr(
          absoluteUrl(page === 2 ? '/poems' : `/poems?page=${page - 1}`)
        )}">`
      : '',
    page < totalPages
      ? `  <link rel="next" href="${escapeAttr(absoluteUrl(`/poems?page=${page + 1}`))}">`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const collectionSchema = {
    '@type': 'CollectionPage',
    '@id': `${absoluteUrl(path)}#collection`,
    name: title,
    description,
    url: absoluteUrl(path),
    isPartOf: { '@id': `${absoluteUrl('/')}#website` },
    inLanguage: 'en',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: poems.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: poems.map((poem, i) => ({
        '@type': 'ListItem',
        position: (page - 1) * PER_PAGE + i + 1,
        url: absoluteUrl(poemPath(poem)),
        name: poem.title || 'Untitled',
      })),
    },
  };

  const head = buildHead({
    title,
    description,
    path,
    extra: relLinks,
    schema: [graph([organizationSchema(), websiteSchema(), collectionSchema, breadcrumbSchema(trail)])],
  });

  const body = `<section class="seo-doc">
  ${breadcrumbNav(trail)}
  <h1>All poems on ${SITE_NAME}</h1>
  <p class="seo-doc-lede">
    ${total ? `${total} anonymous poems` : 'Anonymous poems'}, newest first. Every poem is free to read and
    published without a byline.
  </p>
  ${poemList(poems)}
  ${pagination({ page, totalPages, basePath: '/poems' })}
  ${siteLinks()}
</section>`;

  sendHtml(res, renderShell({ head, body }));
}
