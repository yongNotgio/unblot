// Regression check for the server-rendered SEO endpoints.
// Run from the repo root:  node scripts/check-seo.mjs
// Reads Supabase credentials from the environment, falling back to the generated
// env.loader.js so it works locally without exporting anything.
import { readFileSync } from 'node:fs';

// Fall back to the generated env.loader.js so this runs locally with no setup.
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  const loader = readFileSync('env.loader.js', 'utf8');
  process.env.SUPABASE_URL = loader.match(/window\.SUPABASE_URL = "([^"]+)"/)[1];
  process.env.SUPABASE_ANON_KEY = loader.match(/window\.SUPABASE_ANON_KEY = "([^"]+)"/)[1];
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    end(payload) {
      this.body = payload || '';
    },
  };
  return res;
}

const results = [];
function check(label, condition, detail = '') {
  results.push({ label, ok: Boolean(condition), detail });
}

async function run(name, modulePath, query) {
  const mod = await import(modulePath);
  const res = mockRes();
  await mod.default({ query }, res);
  console.log(`\n--- ${name} --- status=${res.statusCode} bytes=${res.body.length} type=${res.headers['content-type']}`);
  return res;
}

// Pick a real poem to render.
const listRes = await fetch(
  `${process.env.SUPABASE_URL}/rest/v1/poems?select=id,title&order=created_at.desc&limit=1`,
  { headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` } }
);
const [sample] = await listRes.json();
const { slugify } = await import('../shared/site.js');
const slug = `${slugify(sample.title)}-${sample.id}`;
console.log('sample poem:', sample.title, '->', `/poem/${slug}`);

// 1. Poem page
const poem = await run('GET /poem/<slug>', '../api/poem.js', { slug });
check('poem: 200', poem.statusCode === 200);
check('poem: full document', poem.body.startsWith('<!DOCTYPE html>'));
check('poem: single <title>', (poem.body.match(/<title>/g) || []).length === 1);
check('poem: title contains poem name', poem.body.includes(`<title>${sample.title} — a poem on Unblot</title>`));
check('poem: canonical', poem.body.includes(`<link rel="canonical" href="https://www.unblot.app/poem/${slug}">`));
check('poem: indexable robots', /<meta name="robots" content="index, follow/.test(poem.body));
check('poem: og:type article', poem.body.includes('content="article"'));
check('poem: schema Poem', poem.body.includes('"@type":"Poem"'));
check('poem: InteractionCounter', poem.body.includes('InteractionCounter'));
check('poem: BreadcrumbList', poem.body.includes('BreadcrumbList'));
check('poem: poem text rendered in body', /class="seo-doc-poem"/.test(poem.body));
check('poem: SSR marker for hydration', /data-ssr-poem="[0-9a-f-]{36}"/.test(poem.body));
check('poem: app scripts still present', poem.body.includes('src="/main.js"'));
check('poem: internal links present', /href="\/poem\//.test(poem.body));
check('poem: no leftover placeholder', !poem.body.includes('<!--SSR_CONTENT-->\n      <section class="seo-doc">\n        <h1>Unblot'));

// 2. Missing poem -> real 404
const missing = await run('GET /poem/<bogus>', '../api/poem.js', { slug: 'nope-not-a-uuid' });
check('404: status 404', missing.statusCode === 404);
check('404: noindex', missing.body.includes('content="noindex, nofollow"'));

// 3. Archive
const archive = await run('GET /poems', '../api/poems.js', {});
check('poems: 200', archive.statusCode === 200);
check('poems: has poem links', (archive.body.match(/href="\/poem\//g) || []).length > 5);
check('poems: CollectionPage schema', archive.body.includes('"@type":"CollectionPage"'));
check('poems: ItemList', archive.body.includes('"@type":"ItemList"'));
check('poems: canonical /poems', archive.body.includes('href="https://www.unblot.app/poems"'));

const archiveP2 = await run('GET /poems?page=2', '../api/poems.js', { page: '2' });
check('poems p2: canonical includes page', archiveP2.body.includes('https://www.unblot.app/poems?page=2'));
check('poems p2: rel prev', archiveP2.body.includes('rel="prev"'));

// 4. About
const about = await run('GET /about', '../api/about.js', {});
check('about: 200', about.statusCode === 200);
check('about: FAQPage schema', about.body.includes('"@type":"FAQPage"'));
check('about: AboutPage schema', about.body.includes('"@type":"AboutPage"'));
check('about: questions rendered visibly', about.body.includes('What is Unblot?'));
check('about: canonical', about.body.includes('href="https://www.unblot.app/about"'));

// 5. Sitemap
const sitemap = await run('GET /sitemap.xml', '../api/sitemap.js', {});
check('sitemap: xml content type', String(sitemap.headers['content-type']).includes('application/xml'));
check('sitemap: declares urlset', sitemap.body.includes('<urlset'));
const urlCount = (sitemap.body.match(/<loc>/g) || []).length;
check('sitemap: includes all poems + static routes', urlCount >= 58, `${urlCount} urls`);
check('sitemap: uses canonical poem paths', sitemap.body.includes(`https://www.unblot.app/poem/${slug}`));
check('sitemap: has lastmod', sitemap.body.includes('<lastmod>'));
check('sitemap: no private routes', !/<loc>[^<]*\/(admin|my-poems|login)/.test(sitemap.body));

// Report
console.log('\n================ RESULTS ================');
let failed = 0;
for (const r of results) {
  if (!r.ok) failed += 1;
  console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.label}${r.detail ? ` (${r.detail})` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
