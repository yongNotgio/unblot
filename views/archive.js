// Client-side /poems — the full archive, mirroring the server-rendered version
// in api/poems.js. Real anchors throughout, so the rendered DOM is as crawlable
// as the server response.

import { fetchPoemsPaginated } from '../poems.js';
import { setRouteSeo } from '../seo.js';
import { utils } from '../utils.js';
import { escapeHtml, normalizeTags, poemPath, toDescription } from '../shared/site.js';

const PER_PAGE = 50;

function poemItem(poem) {
  const tags = normalizeTags(poem.tags);
  return `<li class="seo-item">
    <article>
      <h3 class="seo-item-title"><a href="${poemPath(poem)}">${escapeHtml(poem.title || 'Untitled')}</a></h3>
      <p class="seo-item-excerpt">${escapeHtml(toDescription(poem.content, 180))}</p>
      <p class="seo-item-meta">
        <time datetime="${escapeHtml(poem.created_at || '')}">${escapeHtml(utils.formatDate(poem.created_at))}</time>
        ${tags.length ? `<span class="seo-item-tags">${tags.map((t) => escapeHtml(t)).join(', ')}</span>` : ''}
      </p>
    </article>
  </li>`;
}

function pagination(page, totalPages) {
  if (totalPages <= 1) return '';
  const link = (n, label) =>
    `<a class="seo-page-link" href="${n === 1 ? '/poems' : `/poems?page=${n}`}">${label}</a>`;
  return `<nav class="seo-pagination" aria-label="Pagination">
    ${page > 1 ? link(page - 1, '&larr; Previous') : ''}
    <span class="seo-page-status">Page ${page} of ${totalPages}</span>
    ${page < totalPages ? link(page + 1, 'Next &rarr;') : ''}
  </nav>`;
}

export async function renderArchive(dom, page = 1) {
  const current = Number.isFinite(page) && page > 0 ? page : 1;
  setRouteSeo('/poems', current > 1 ? { path: `/poems?page=${current}` } : {});

  dom.app.innerHTML = '<section class="seo-doc"><p>Loading poems&hellip;</p></section>';
  utils.showLoading(dom, true);

  try {
    const result = await fetchPoemsPaginated({ page: current, limit: PER_PAGE });
    const poems = result.data;

    dom.app.innerHTML = `<section class="seo-doc">
      <nav class="seo-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a><span aria-hidden="true"> / </span><span aria-current="page">Poems</span>
      </nav>
      <h1>All poems on Unblot</h1>
      <p class="seo-doc-lede">
        ${result.total ? `${result.total} anonymous poems` : 'Anonymous poems'}, newest first.
        Every poem is free to read and published without a byline.
      </p>
      ${
        poems.length
          ? `<ul class="seo-list">${poems.map(poemItem).join('')}</ul>`
          : '<p class="seo-empty">No poems have been published yet.</p>'
      }
      ${pagination(current, result.totalPages || 1)}
      <nav class="seo-sitelinks" aria-label="Browse Unblot">
        <a href="/">Latest poems</a>
        <a href="/trending">Trending</a>
        <a href="/discover">Search poetry</a>
        <a href="/collections">Collections</a>
        <a href="/about">About Unblot</a>
      </nav>
    </section>`;
  } catch (err) {
    console.error('[archive] failed to load poems', err);
    dom.app.innerHTML = `<section class="seo-doc">
      <h1>All poems on Unblot</h1>
      <p>Could not load the archive right now. <a href="/poems">Try again</a>.</p>
    </section>`;
  } finally {
    utils.showLoading(dom, false);
  }
}
