// Dynamic /sitemap.xml built from live Supabase data, so poems published after
// the last deploy are still discoverable by Search Console and other crawlers.

import { SITE_URL, absoluteUrl, poemPath } from '../shared/site.js';
import { listPoemStubs } from './_lib/db.js';

// Sitemaps are capped at 50,000 URLs; leave room for the static entries.
const MAX_POEMS = 49000;

const STATIC_ROUTES = [
  { path: '/', changefreq: 'hourly', priority: '1.0' },
  { path: '/poems', changefreq: 'hourly', priority: '0.9' },
  { path: '/trending', changefreq: 'daily', priority: '0.8' },
  { path: '/discover', changefreq: 'daily', priority: '0.7' },
  { path: '/collections', changefreq: 'weekly', priority: '0.6' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
];

function escapeXml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : '',
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
    priority ? `    <priority>${priority}</priority>` : '',
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

function toLastmod(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  let poems = [];
  try {
    poems = await listPoemStubs({ limit: MAX_POEMS });
  } catch (err) {
    // Still serve the static routes rather than returning an error page,
    // which Search Console would record as a broken sitemap.
    console.error('[api/sitemap] poem listing failed', err);
  }

  const newestPoem = poems.length ? toLastmod(poems[0].updated_at || poems[0].created_at) : '';

  const entries = [
    ...STATIC_ROUTES.map((route) =>
      urlEntry({
        loc: absoluteUrl(route.path),
        lastmod: newestPoem,
        changefreq: route.changefreq,
        priority: route.priority,
      })
    ),
    ...poems.map((poem) =>
      urlEntry({
        loc: SITE_URL + poemPath(poem),
        lastmod: toLastmod(poem.updated_at || poem.created_at),
        changefreq: 'monthly',
        priority: '0.8',
      })
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.end(xml);
}
