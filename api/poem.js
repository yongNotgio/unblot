// Server-rendered poem page for /poem/<slug>-<uuid>.
// Emits the poem text, metadata and schema.org/Poem markup in the initial HTML
// so search crawlers and answer engines that do not execute JavaScript can read it.

import {
  DEFAULT_IMAGE,
  SITE_NAME,
  absoluteUrl,
  escapeAttr,
  escapeHtml,
  extractPoemId,
  normalizeTags,
  poemPath,
  poemUrl,
  toDescription,
} from '../shared/site.js';
import { getEngagement, getPoem, listRelatedPoems } from './_lib/db.js';
import {
  ORGANIZATION_ID,
  breadcrumbSchema,
  buildHead,
  graph,
  organizationSchema,
  websiteSchema,
} from './_lib/head.js';
import {
  breadcrumbNav,
  formatDate,
  isoDate,
  poemBody,
  poemList,
  siteLinks,
} from './_lib/markup.js';
import { renderShell, sendHtml } from './_lib/shell.js';

function counter(type, count) {
  return {
    '@type': 'InteractionCounter',
    interactionType: `https://schema.org/${type}`,
    userInteractionCount: Math.max(0, Number(count) || 0),
  };
}

function renderNotFound(res) {
  const head = buildHead({
    title: `Poem not found — ${SITE_NAME}`,
    description: 'This poem is no longer available. Browse the rest of the collection on Unblot.',
    path: '/poems',
    noindex: true,
  });
  const body = `<section class="seo-doc">
  <h1>This poem is no longer available</h1>
  <p>It may have been deleted by its author, or the link may be incorrect.</p>
  ${siteLinks()}
</section>`;
  sendHtml(res, renderShell({ head, body }), { status: 404 });
}

export default async function handler(req, res) {
  const slug = Array.isArray(req.query?.slug) ? req.query.slug[0] : req.query?.slug;
  const id = extractPoemId(slug);

  if (!id) return renderNotFound(res);

  let poem;
  try {
    poem = await getPoem(id);
  } catch (err) {
    console.error('[api/poem] lookup failed', err);
    // Fall through to the unmodified shell so the SPA can still render the poem.
    const head = buildHead({
      title: `${SITE_NAME} — anonymous poetry`,
      description: 'Read anonymous poetry on Unblot.',
      path: `/poem/${slug || ''}`,
      noindex: true,
    });
    return sendHtml(res, renderShell({ head, body: '' }), { status: 503 });
  }

  if (!poem) return renderNotFound(res);

  const canonicalPath = poemPath(poem);
  const url = poemUrl(poem);
  const tags = normalizeTags(poem.tags);
  const title = poem.title || 'Untitled';
  const description =
    toDescription(poem.content, 155) || `Read "${title}", an anonymous poem published on ${SITE_NAME}.`;

  const [{ likes, comments }, related] = await Promise.all([
    getEngagement(poem.id).catch(() => ({ likes: 0, comments: 0 })),
    listRelatedPoems(poem.id, 6).catch(() => []),
  ]);

  const published = isoDate(poem.created_at);
  const modified = isoDate(poem.updated_at) || published;

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Poems', path: '/poems' },
    { name: title, path: canonicalPath },
  ];

  const poemSchema = {
    '@type': 'Poem',
    '@id': `${url}#poem`,
    name: title,
    headline: title,
    text: String(poem.content || ''),
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: published,
    dateModified: modified,
    inLanguage: 'en',
    isAccessibleForFree: true,
    genre: 'Poetry',
    // Every poem on Unblot is published without a byline, by design.
    author: { '@type': 'Person', name: 'Anonymous' },
    publisher: { '@id': ORGANIZATION_ID },
    ...(tags.length ? { keywords: tags.join(', ') } : {}),
    ...(poem.image ? { image: absoluteUrl(poem.image) } : {}),
    interactionStatistic: [
      counter('LikeAction', likes),
      counter('CommentAction', comments),
      counter('ViewAction', poem.views_count),
    ],
  };

  const head = buildHead({
    title: `${title} — a poem on ${SITE_NAME}`,
    description,
    path: canonicalPath,
    type: 'article',
    image: poem.image ? absoluteUrl(poem.image) : DEFAULT_IMAGE,
    extra: [
      published ? `  <meta property="article:published_time" content="${escapeAttr(published)}">` : '',
      modified ? `  <meta property="article:modified_time" content="${escapeAttr(modified)}">` : '',
      ...tags.map((t) => `  <meta property="article:tag" content="${escapeAttr(t)}">`),
    ]
      .filter(Boolean)
      .join('\n'),
    schema: [
      graph([
        organizationSchema(),
        websiteSchema(),
        poemSchema,
        breadcrumbSchema(trail),
      ]),
    ],
  });

  const body = `<section class="seo-doc" data-ssr-poem="${escapeAttr(poem.id)}">
  ${breadcrumbNav(trail)}
  <article>
    <h1>${escapeHtml(title)}</h1>
    <p class="seo-doc-meta">
      By <span>Anonymous</span> ·
      <time datetime="${escapeAttr(published)}">${escapeHtml(formatDate(poem.created_at))}</time> ·
      ${escapeHtml(String(poem.views_count || 0))} views ·
      ${escapeHtml(String(likes))} likes ·
      ${escapeHtml(String(comments))} comments
    </p>
    ${
      poem.image
        ? `<img class="seo-doc-image" src="${escapeAttr(poem.image)}" alt="Artwork accompanying the poem ${escapeAttr(title)}" loading="lazy">`
        : ''
    }
    <div class="seo-doc-poem">${poemBody(poem.content)}</div>
    ${
      tags.length
        ? `<p class="seo-doc-tags">Tags: ${tags
            .map(
              (t) =>
                `<a href="/discover?q=${encodeURIComponent(t)}">${escapeHtml(t)}</a>`
            )
            .join(', ')}</p>`
        : ''
    }
    ${
      poem.prompt_title
        ? `<p class="seo-doc-prompt">Written for the writing prompt “${escapeHtml(poem.prompt_title)}”.</p>`
        : ''
    }
  </article>
  ${
    related.length
      ? `<section class="seo-related"><h2>More anonymous poetry</h2>${poemList(related)}</section>`
      : ''
  }
  ${siteLinks()}
</section>`;

  sendHtml(res, renderShell({ head, body }));
}
