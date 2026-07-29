// Editorial copy that must exist identically in the server-rendered /about page
// and in the client-side SPA view, so crawlers and users see the same answer.

import { SITE_NAME, SITE_URL, escapeHtml } from './site.js';

/**
 * Question/answer pairs. These drive both the visible page and the FAQPage
 * structured data, which is what answer engines quote from.
 */
export const FAQ_ITEMS = [
  {
    question: 'What is Unblot?',
    answer:
      'Unblot is a free anonymous poetry platform. Anyone can publish a poem without attaching a name, ' +
      'read work from other writers, and respond with likes and comments. Every poem is credited only to ' +
      '"Anonymous", so readers judge the writing rather than the writer.',
  },
  {
    question: 'Is Unblot free to use?',
    answer:
      'Yes. Reading, writing, publishing, liking and commenting are all free. There is no paid tier, ' +
      'no submission fee, and no charge to keep your work on the site.',
  },
  {
    question: 'Do I need an account to read poems on Unblot?',
    answer:
      'No. Every published poem is public and readable without signing in. An account is only required to ' +
      'publish your own poems, leave comments, or like and save the work of others.',
  },
  {
    question: 'How anonymous is a poem published on Unblot?',
    answer:
      'Poems never display an author name, handle, or avatar to other readers. Your account exists so you can ' +
      'edit and manage your own work, but it is not shown alongside the poem. Anything you choose to put inside ' +
      'the poem itself is, of course, public.',
  },
  {
    question: 'Who owns the poems published on Unblot?',
    answer:
      'You do. Publishing on Unblot does not transfer copyright. You keep the rights to your poem and can edit ' +
      'or delete it at any time from your own collection.',
  },
  {
    question: 'How do I publish a poem on Unblot?',
    answer:
      'Create a free account, open the compose screen, then add a title, the body of the poem, and optional tags. ' +
      'Publishing makes the poem immediately visible on the public feed and gives it a permanent shareable link.',
  },
  {
    question: 'What kinds of poetry are on Unblot?',
    answer:
      'The collection is open-form and multilingual, spanning free verse, spoken word, short lyric poems, ' +
      'and structured forms. Daily writing prompts seed themed work, and poems are tagged so readers can browse by subject.',
  },
  {
    question: 'How does Unblot decide what is trending?',
    answer:
      'Trending ranks recently published poems by reader engagement, combining likes, comments and views over a ' +
      'recent window, so newer work can surface rather than only long-standing favourites.',
  },
];

/** Short, declarative statements of fact that answer engines can lift verbatim. */
export const KEY_FACTS = [
  [`What ${SITE_NAME} is`, 'A free, anonymous poetry publishing and reading platform on the open web.'],
  ['Who it is for', 'Poets who want readers without a byline, and readers who want new poetry without an algorithmic feed.'],
  ['Cost', 'Free. No paid tier and no submission fees.'],
  ['Account required', 'Only to publish, comment, or like. Reading is fully open.'],
  ['Attribution', 'Every poem is published as Anonymous. No author names are shown.'],
  ['Rights', 'Writers keep full copyright and can edit or delete their work at any time.'],
  ['Website', SITE_URL],
];

export const ABOUT_INTRO = [
  `${SITE_NAME} is a free, anonymous poetry platform. Writers publish poems without a byline, and readers find new ` +
    'work without a follower count deciding what is worth reading.',
  'The premise is simple: strip the name off the page and a poem has to stand on its own. There are no profiles to ' +
    'build, no handles to recognise, and no reputation carried between poems. What remains is the writing, the ' +
    'response it gets, and the small record of readers who liked it or wrote back.',
  'Everything published is public and permanently linkable, so a poem can be shared, quoted, and found by search ' +
    'engines and answer engines alike.',
];

export const ABOUT_TITLE = `About ${SITE_NAME} — the anonymous poetry platform`;

export const ABOUT_DESCRIPTION =
  `${SITE_NAME} is a free platform for publishing and reading anonymous poetry. Poems carry no byline, ` +
  'reading needs no account, and writers keep full copyright.';

/**
 * The visible /about page. Rendered byte-identically on the server (api/about.js)
 * and in the SPA (views/about.js) so crawlers and users read the same answers.
 */
export function aboutBodyHtml() {
  const intro = ABOUT_INTRO.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n    ');

  const facts = KEY_FACTS.map(
    ([term, value]) =>
      `<div class="seo-fact"><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`
  ).join('\n      ');

  const faqs = FAQ_ITEMS.map(
    (item) => `<div class="seo-faq-item">
        <h3>${escapeHtml(item.question)}</h3>
        <p>${escapeHtml(item.answer)}</p>
      </div>`
  ).join('\n      ');

  return `<section class="seo-doc">
  <article>
    <h1>${escapeHtml(ABOUT_TITLE)}</h1>
    ${intro}

    <h2>${escapeHtml(SITE_NAME)} at a glance</h2>
    <dl class="seo-facts">
      ${facts}
    </dl>

    <h2>Frequently asked questions</h2>
    <div class="seo-faq">
      ${faqs}
    </div>

    <h2>Start reading</h2>
    <p>
      Browse the <a href="/poems">complete poem archive</a>, see what is
      <a href="/trending">trending this week</a>, or
      <a href="/discover">search the collection</a> by title, line or tag.
      Ready to publish? <a href="/register">Create a free account</a> and post your first poem anonymously.
    </p>
    <p class="seo-doc-meta">${escapeHtml(SITE_NAME)} &middot; <a href="${escapeHtml(SITE_URL)}">${escapeHtml(
      SITE_URL.replace(/^https?:\/\//, '')
    )}</a></p>
  </article>
</section>`;
}
