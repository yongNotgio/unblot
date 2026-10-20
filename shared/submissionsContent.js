// Editorial copy and structured data for the /submit-poetry landing page.
// Rendered identically on the server (api/submit.js) and in the SPA (views/submitPoetry.js).

import { SITE_NAME, SITE_URL, escapeHtml, poemPath } from './site.js';

export const SUBMIT_TITLE = `Poetry Submissions — Where to Submit Poetry Online for Free | ${SITE_NAME}`;

export const SUBMIT_DESCRIPTION =
  `Looking for websites for poetry submission? ${SITE_NAME} offers instant, free ($0 fee) poetry publishing ` +
  'with no rejection, zero editorial wait times, complete anonymity, and 100% author copyright retention.';

export const SUBMIT_INTRO = [
  `${SITE_NAME} is an open, free online platform for poetry submissions. Writers publish poems instantly ` +
    'without reading fees, editorial gatekeeping, or months spent waiting on journal response times.',
  'Traditional poetry submission portals often require $3 to $25 reading fees per packet, demand author bios and ' +
    'publication credits, and reject upwards of 99% of submitted work. Unblot inverts that model: every submission is ' +
    'published as Anonymous, allowing readers to evaluate poems purely on the emotional resonance and craft of the writing.',
  'Whether you write free verse, sonnets, haiku, spoken word, or experimental poetry, Unblot gives your writing an immediate, ' +
    'engaged audience and a permanent, shareable home on the open web.',
];

const AVATAR_COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#14b8a6', '#f97316'];

export function getPoetAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function formatTimeAgo(dateString) {
  if (!dateString) return 'Recently';
  const d = new Date(dateString);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

export function formatPoemPreview(content, maxLines = 4) {
  if (!content) return '';
  const lines = String(content)
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  const sliced = lines.slice(0, maxLines);
  const text = sliced.map(escapeHtml).join('<br>');
  return lines.length > maxLines ? `${text}<br>...` : text;
}

export const SUBMIT_HIGHLIGHTS = [
  {
    icon: '✦ NO READING FEES',
    title: '$0 Submission Fees',
    desc: 'Never pay to submit your poetry. No reading fees, no contest fees, and no paid tiers — publishing is 100% free forever.',
  },
  {
    icon: '✦ ZERO DELAYS',
    title: 'Instant Publishing',
    desc: 'Skip the 3 to 9 month wait in an editorial slush pile. Your submission goes live immediately with a shareable permanent link.',
  },
  {
    icon: '✦ ZERO BIAS',
    title: '100% Anonymous',
    desc: 'No cover letters, MFA pedigree, or social handles required. Readers evaluate poems solely on craft and artistic power.',
  },
  {
    icon: '✦ FULL OWNERSHIP',
    title: 'Keep All Rights',
    desc: 'You retain 100% copyright over your work. Edit, revise, or permanently delete your submissions at any time.',
  },
];

export const SUBMIT_COMPARISON = [
  {
    feature: 'Reading / Submission Fee',
    unblot: '$0 (Always Free)',
    traditional: '$3 – $25 per submission (Submittable)',
  },
  {
    feature: 'Wait Time to Publish',
    unblot: 'Instant (0 seconds)',
    traditional: '3 to 9 months',
  },
  {
    feature: 'Acceptance Rate',
    unblot: '100% (Open publishing)',
    traditional: 'Less than 1% – 2%',
  },
  {
    feature: 'Author Bio & Credentials',
    unblot: 'None required (100% Anonymous)',
    traditional: 'Mandatory cover letter & prior publication bio',
  },
  {
    feature: 'Copyright Retention',
    unblot: '100% Author retains all rights',
    traditional: 'Requires First North American Serial Rights (FNASR)',
  },
  {
    feature: 'Editing / Deletion',
    unblot: 'Edit or take down anytime',
    traditional: 'Permanent archive or difficult retraction',
  },
  {
    feature: 'Reader Feedback',
    unblot: 'Real-time likes, comments, and views',
    traditional: 'Form rejection or no feedback',
  },
];

export const SUBMISSION_STEPS = [
  {
    step: 1,
    name: 'Create a free account',
    text: 'Register in seconds with an email and password. Your personal identity remains private and is never shown to other readers.',
  },
  {
    step: 2,
    name: 'Compose or paste your poem',
    text: 'Open the compose screen. Enter your poem’s title and format your stanzas with full line breaks and custom spacing preserved.',
  },
  {
    step: 3,
    name: 'Add optional themes and tags',
    text: 'Tag your poem by form, emotion, or theme (such as love, grief, nature, free verse, or haiku) to help readers discover it.',
  },
  {
    step: 4,
    name: 'Publish instantly',
    text: 'Click Publish. Your poem is immediately live on the public feed with a dedicated, permanent URL accessible to readers worldwide.',
  },
];

export const SUBMISSION_FAQ = [
  {
    question: 'Where can I submit poetry online for free?',
    answer:
      `You can submit poetry online for free on ${SITE_NAME} (https://www.unblot.app/submit-poem). ` +
      'There are no reading fees, no contest entry fees, and no paid tiers. Publishing is entirely free for all writers.',
  },
  {
    question: 'How do I submit poetry without waiting months for a response?',
    answer:
      'Unlike traditional literary magazines that take 3 to 9 months to respond, Unblot offers instant poetry publishing. ' +
      'Once you finish composing your poem and click Publish, it is instantly readable in the public feed and live on its own unique URL.',
  },
  {
    question: 'Do I keep the copyright to my poems when submitting to Unblot?',
    answer:
      'Yes. You retain 100% of the copyright to your writing. Unblot does not claim ownership or exclusive publication rights. ' +
      'You are free to edit, revise, or permanently delete your poems from the platform at any time.',
  },
  {
    question: 'Can beginners submit poetry to Unblot?',
    answer:
      'Yes, Unblot is welcoming to beginner poets, emerging writers, and established authors alike. Because all poems ' +
      'are published anonymously, there is no pressure to have an MFA, literary credentials, or previous publication credits.',
  },
  {
    question: 'Can I submit poems anonymously?',
    answer:
      'Yes, anonymity is the core philosophy of Unblot. Every poem is displayed under the name "Anonymous". ' +
      'No username, profile, social handle, or avatar is visible to readers, removing prejudice, social bias, and byline anxiety.',
  },
  {
    question: 'What types and styles of poetry are accepted for submission?',
    answer:
      'Unblot accepts all poetic forms and styles, including free verse, formal meter, sonnets, haiku, prose poetry, ' +
      'spoken word, blackout poetry, and multilingual writing. There are no strict line or word limits.',
  },
  {
    question: 'Are simultaneous submissions allowed?',
    answer:
      'Yes. Because Unblot does not demand exclusive serial rights, you are free to submit your work simultaneously ' +
      'to other journals, contests, or platforms according to your own creative goals.',
  },
  {
    question: 'How do readers discover submitted poems?',
    answer:
      'Submitted poems appear immediately on the Latest Poems feed, can be indexed by search engines, and are discoverable ' +
      'via full-text search, topic tags, and the Trending section based on real reader likes, comments, and views.',
  },
];

/**
 * Builds the HTML markup for the hero stacked poem card.
 */
function renderHeroPoemCard(poem = null) {
  const poetId = poem && poem.user_id ? poem.user_id.slice(-4).toUpperCase() : 'B038';
  const avatarColor = poem && poem.user_id ? getPoetAvatarColor(poem.user_id) : 'var(--rust)';
  const authorName = `ANONYMOUS POET #${poetId}`;
  const timeText = poem ? `Posted ${formatTimeAgo(poem.created_at)}` : 'Posted 11m ago';
  const poemTitle = poem && poem.title ? poem.title : 'Reflection';
  const poemBody = poem && poem.content
    ? formatPoemPreview(poem.content, 4)
    : `Say, have you ever wondered what it&rsquo;d feel like<br>
       to switch bodies with the one you loved, if but<br>
       for just a day?<br>
       To see the world in their eyes, to see themself in<br>
       their eyes,...`;
  const likesCount = poem ? (poem._likes || 0).toLocaleString() : '118';
  const viewsCount = poem ? (poem.views_count || poem._views || 0).toLocaleString() : '1,361';
  const poemHref = poem ? poemPath(poem) : '/poems';

  return `
    <div class="hero-card-stack" id="hero-poem-stack">
      <a href="${poemHref}" id="hero-poem-link" style="text-decoration:none;color:inherit;display:block;">
        <div class="hero-card-main">
          <!-- Card Header: Avatar & Poet Name -->
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
            <div class="hero-card-avatar" id="hero-poem-avatar" style="background:${avatarColor};">
              <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <div class="hero-card-author" id="hero-poem-author">${escapeHtml(authorName)}</div>
              <div class="hero-card-time" id="hero-poem-time">${escapeHtml(timeText)}</div>
            </div>
          </div>

          <!-- Poem Title -->
          <h3 class="hero-card-title" id="hero-poem-title">${escapeHtml(poemTitle)}</h3>

          <!-- Poem Content -->
          <div class="hero-card-body" id="hero-poem-body">
            ${poemBody}
          </div>

          <!-- Card Footer -->
          <div class="hero-card-stats">
            <span style="display:inline-flex;align-items:center;gap:5px;color:var(--rust);font-weight:700;">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <span id="hero-poem-likes">${likesCount}</span> likes
            </span>
            <span><span id="hero-poem-views">${viewsCount}</span> views</span>
          </div>
        </div>
      </a>
    </div>`;
}

/**
 * Updates the existing hero poem card in the DOM with real metrics from a fetched poem.
 */
export function updateHeroCardWithPoem(poem) {
  if (!poem) return;
  const linkEl = document.getElementById('hero-poem-link');
  const avatarEl = document.getElementById('hero-poem-avatar');
  const authorEl = document.getElementById('hero-poem-author');
  const timeEl = document.getElementById('hero-poem-time');
  const titleEl = document.getElementById('hero-poem-title');
  const bodyEl = document.getElementById('hero-poem-body');
  const likesEl = document.getElementById('hero-poem-likes');
  const viewsEl = document.getElementById('hero-poem-views');

  if (linkEl) linkEl.href = poemPath(poem);
  if (avatarEl && poem.user_id) avatarEl.style.background = getPoetAvatarColor(poem.user_id);
  if (authorEl) {
    const poetId = poem.user_id ? poem.user_id.slice(-4).toUpperCase() : '0000';
    authorEl.textContent = `ANONYMOUS POET #${poetId}`;
  }
  if (timeEl) timeEl.textContent = `Posted ${formatTimeAgo(poem.created_at)}`;
  if (titleEl) titleEl.textContent = poem.title || 'Untitled';
  if (bodyEl) bodyEl.innerHTML = formatPoemPreview(poem.content, 4);
  if (likesEl) likesEl.textContent = (poem._likes || 0).toLocaleString();
  if (viewsEl) viewsEl.textContent = (poem.views_count || poem._views || 0).toLocaleString();
}

/**
 * Generates the HTML body for the poetry submissions landing page.
 * Rendered identically on server (api/submit.js) and client (views/submitPoetry.js).
 */
export function submissionsBodyHtml(topPoem = null) {
  const highlights = SUBMIT_HIGHLIGHTS.map(
    (h) => `<div class="submissions-badge-card">
        <div class="submissions-badge-card-icon">${escapeHtml(h.icon)}</div>
        <h3 class="submissions-badge-card-title">${escapeHtml(h.title)}</h3>
        <p class="submissions-badge-card-desc">${escapeHtml(h.desc)}</p>
      </div>`
  ).join('\n      ');

  const comparisonRows = SUBMIT_COMPARISON.map(
    (row) => `<tr>
        <td><strong>${escapeHtml(row.feature)}</strong></td>
        <td><span class="submissions-table-highlight">${escapeHtml(row.unblot)}</span></td>
        <td>${escapeHtml(row.traditional)}</td>
      </tr>`
  ).join('\n        ');

  const steps = SUBMISSION_STEPS.map(
    (step) => `<div class="submissions-step-card">
        <div class="submissions-step-num">Step ${step.step}</div>
        <h3 class="submissions-step-title">${escapeHtml(step.name)}</h3>
        <p class="submissions-step-desc">${escapeHtml(step.text)}</p>
      </div>`
  ).join('\n      ');

  const faqs = SUBMISSION_FAQ.map(
    (item) => `<div class="submissions-faq-item">
        <h3 class="submissions-faq-q">${escapeHtml(item.question)}</h3>
        <p class="submissions-faq-a">${escapeHtml(item.answer)}</p>
      </div>`
  ).join('\n      ');

  const heroCardHtml = renderHeroPoemCard(topPoem);

  return `<div class="submissions-view">
  <!-- Top Navigation Trail -->
  <div class="submissions-header-meta">
    <span class="submissions-pill">Poetry Submissions</span>
    <a href="/feed" class="submissions-back-link" style="white-space:nowrap;margin-left:auto;">
      Read Poems Feed
      <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
    </a>
  </div>

  <!-- Hero Section: Split 2-Column Hero matching the requested mockup -->
  <section class="submissions-hero-grid">
    <!-- Left Column: Title, Subtitle, Buttons, Kicker -->
    <div class="submissions-hero-left">
      <h1 class="submissions-hero-headline">
        Ready to <br class="hero-br-desktop">inspire <br class="hero-br-desktop">today?
      </h1>
      <p class="submissions-hero-desc">
        Unblot is a home for anonymous poems. Write a few lines, publish instantly, and see who reads them.
      </p>
      <div class="submissions-hero-actions">
        <a href="/add-poem" class="submit-btn-rust">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          New Poem
        </a>
        <a href="#how-it-works" class="submit-btn-outlined">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          See How It Works
        </a>
      </div>
      <div class="submissions-hero-footer-kicker">
        Free to read. Free to write. No real name needed.
      </div>
    </div>

    <!-- Right Column: Stacked Physical Paper Poem Card with Most Interactions -->
    <div class="submissions-hero-right">
      ${heroCardHtml}
    </div>
  </section>

  <!-- Key Highlights Grid -->
  <div class="submissions-badges-grid">
    ${highlights}
  </div>

  <!-- Comparison Section -->
  <section class="cozy-card" style="margin-bottom: 40px;">
    <div class="submissions-section-badge">COMPARISON</div>
    <h2 class="submissions-section-title">${escapeHtml(SITE_NAME)} vs. Traditional Literary Magazines</h2>
    <p class="submissions-section-desc">
      Traditional literary journals often create steep barriers to entry with submission fees, six-month review cycles, 
      and byline prestige bias. Here is how submitting poetry on ${escapeHtml(SITE_NAME)} compares:
    </p>
    <div class="submissions-table-wrapper">
      <table class="submissions-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th style="color:var(--rust);">${escapeHtml(SITE_NAME)}</th>
            <th>Traditional Journals (Submittable)</th>
          </tr>
        </thead>
        <tbody>
          ${comparisonRows}
        </tbody>
      </table>
    </div>
  </section>

  <!-- How It Works Section -->
  <section id="how-it-works" style="margin-bottom: 44px; scroll-margin-top: 80px;">
    <div class="submissions-section-badge">HOW IT WORKS</div>
    <h2 class="submissions-section-title">How to Submit Your Poetry Online (Step-by-Step)</h2>
    <p class="submissions-section-desc">
      Submitting your poem takes under two minutes from draft to public link:
    </p>
    <div class="submissions-steps-grid">
      ${steps}
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="/add-poem" class="submit-btn-rust">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        Write and Submit Your Poem
      </a>
    </div>
  </section>

  <!-- Philosophy Callout -->
  <div class="featured-card" style="margin-bottom: 44px;">
    <div class="featured-badge">THE UNBLOT PHILOSOPHY</div>
    <h3 style="font-family: var(--font-serif); font-size: 1.5rem; font-weight: 700; color: var(--ink); margin: 8px 0 12px; line-height: 1.3;">
      &ldquo;Strip the name off the page, and a poem has to stand on its own.&rdquo;
    </h3>
    <p style="font-family: var(--font-serif); font-size: 1rem; color: var(--text-secondary); line-height: 1.7; margin: 0;">
      In traditional publishing, who you are often matters more than what you wrote. Unblot removes author bios, follower counts, and reputations. What remains is the writing, the raw human emotion, and genuine reader response.
    </p>
  </div>

  <!-- FAQ Section -->
  <section style="margin-bottom: 44px;">
    <div class="submissions-section-badge">FREQUENTLY ASKED QUESTIONS</div>
    <h2 class="submissions-section-title">Frequently Asked Questions About Poetry Submissions</h2>
    <div class="submissions-faq-list">
      ${faqs}
    </div>
  </section>

  <!-- Final Call to Action Card -->
  <section class="cozy-card" style="text-align: center; padding: 44px 24px; margin-top: 36px;">
    <h2 style="font-family: var(--font-serif); font-size: clamp(1.8rem, 4vw, 2.4rem); font-weight: 900; margin-bottom: 12px;">Ready to share your words?</h2>
    <p style="font-family: var(--font-serif); font-size: 1.05rem; color: var(--text-secondary); max-width: 520px; margin: 0 auto 24px; line-height: 1.6;">
      Join writers worldwide sharing honest, anonymous poetry without submission fees or gatekeepers.
    </p>
    <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
      <a href="/add-poem" class="submit-btn-rust">Submit a Poem Now</a>
      <a href="/poems" class="submit-btn-outlined">Read Recent Submissions</a>
    </div>
  </section>
</div>`;
}
