// Server-rendered markup partials shared by the crawler-facing pages.
// Styling hooks live in the `.seo-doc` block inside index.html.

import {
  escapeAttr,
  escapeHtml,
  normalizeTags,
  poemPath,
  toDescription,
} from '../../shared/site.js';

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function isoDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

export function breadcrumbNav(trail) {
  const items = trail
    .map((item, i) =>
      i === trail.length - 1
        ? `<span aria-current="page">${escapeHtml(item.name)}</span>`
        : `<a href="${escapeAttr(item.path)}">${escapeHtml(item.name)}</a>`
    )
    .join('<span aria-hidden="true"> / </span>');
  return `<nav class="seo-breadcrumb" aria-label="Breadcrumb">${items}</nav>`;
}

/** One entry in a poem listing: a real anchor plus enough text to be worth indexing. */
export function poemListItem(poem) {
  const href = poemPath(poem);
  const tags = normalizeTags(poem.tags);
  return `<li class="seo-item">
  <article>
    <h3 class="seo-item-title"><a href="${escapeAttr(href)}">${escapeHtml(poem.title || 'Untitled')}</a></h3>
    <p class="seo-item-excerpt">${escapeHtml(toDescription(poem.content, 180))}</p>
    <p class="seo-item-meta">
      <time datetime="${escapeAttr(isoDate(poem.created_at))}">${escapeHtml(formatDate(poem.created_at))}</time>
      ${tags.length ? `<span class="seo-item-tags">${tags.map((t) => escapeHtml(t)).join(', ')}</span>` : ''}
    </p>
  </article>
</li>`;
}

export function poemList(poems) {
  if (!poems.length) return '<p class="seo-empty">No poems have been published yet.</p>';
  return `<ul class="seo-list">${poems.map(poemListItem).join('\n')}</ul>`;
}

/** Navigation block appended to every rendered page so no page is a crawl dead end. */
export function siteLinks() {
  return `<nav class="seo-sitelinks" aria-label="Browse Unblot">
  <a href="/">Latest poems</a>
  <a href="/poems">All poems</a>
  <a href="/trending">Trending</a>
  <a href="/discover">Search poetry</a>
  <a href="/collections">Collections</a>
  <a href="/about">About Unblot</a>
</nav>`;
}

export function pagination({ page, totalPages, basePath }) {
  if (totalPages <= 1) return '';
  const link = (n, label, rel) =>
    `<a class="seo-page-link" href="${escapeAttr(n === 1 ? basePath : `${basePath}?page=${n}`)}"${
      rel ? ` rel="${rel}"` : ''
    }>${escapeHtml(label)}</a>`;

  const parts = [];
  if (page > 1) parts.push(link(page - 1, '← Previous', 'prev'));
  parts.push(`<span class="seo-page-status">Page ${page} of ${totalPages}</span>`);
  if (page < totalPages) parts.push(link(page + 1, 'Next →', 'next'));
  return `<nav class="seo-pagination" aria-label="Pagination">${parts.join('')}</nav>`;
}

/** Preserve a poem's line and stanza breaks as real markup, not just whitespace. */
export function poemBody(content) {
  const text = String(content || '').replace(/\r\n/g, '\n');
  const stanzas = text.split(/\n{2,}/).filter((s) => s.trim());
  if (!stanzas.length) return '';
  return stanzas
    .map(
      (stanza) =>
        `<p>${stanza
          .split('\n')
          .map((line) => escapeHtml(line))
          .join('<br>')}</p>`
    )
    .join('\n');
}
