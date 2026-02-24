// views/home.js
// Home view matching the Unblot UI design — hero, featured poem, sidebar, tabs, enhanced cards
import { fetchPoemsPaginated } from '../poems.js';
import { utils } from '../utils.js';
import { navigate } from '../router.js';

// Color palette for avatars
const AVATAR_COLORS = ['#8b5cf6','#ec4899','#f59e0b','#22c55e','#3b82f6','#ef4444','#14b8a6','#f97316'];
function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Daily prompts with descriptions
const DAILY_PROMPTS = [
  { title: "Silence in Chaos", desc: "Write a creative about finding peace in a busy city" },
  { title: "Letters Never Sent", desc: "Compose words you always wanted to say but never did" },
  { title: "The Color of Longing", desc: "Describe a feeling using colors as your only metaphor" },
  { title: "Echoes of Tomorrow", desc: "Write about a future you can only imagine" },
  { title: "Between the Lines", desc: "A poem about what's left unsaid in conversation" },
  { title: "Whispers at Dawn", desc: "Capture the quiet moments before the world wakes" },
  { title: "Unspoken Truths", desc: "Express what hides behind everyday pleasantries" },
  { title: "When Stars Collide", desc: "Write about two worlds meeting for the first time" },
  { title: "The Weight of Words", desc: "Explore how language can heal or hurt" },
  { title: "Dancing with Shadows", desc: "A poem about confronting your inner darkness" }
];

function getDailyPrompt() {
  const day = Math.floor(Date.now() / 86400000);
  return DAILY_PROMPTS[day % DAILY_PROMPTS.length];
}

export async function renderHome(dom, page = 1) {
  let search = '';
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  search = urlParams.get('q') || '';

  dom.app.innerHTML = `<div class="text-center text-lg" style="padding: 3rem 0;">Loading poems...</div>`;
  utils.showLoading(dom, true);

  try {
    const result = await fetchPoemsPaginated({ search, page, limit: 50 });
    const { data: poems, ...paginationData } = result;

    // Determine user state
    let currentUser = null;
    try {
      const authMod = await import('../auth.js');
      currentUser = authMod.currentUser;
    } catch(e) {}

    const userName = currentUser ? (currentUser.email ? currentUser.email.split('@')[0] : 'Poet') : null;
    const totalPoems = paginationData.total || poems.length;
    const totalLikes = totalPoems * 29; // Placeholder — aggregate likes

    // Featured poem
    const featuredPoem = poems.length > 0 ? poems[0] : null;
    const feedPoems = poems.length > 1 ? poems.slice(1) : [];

    // Unique tags for category tabs
    const allTags = new Set();
    poems.forEach(p => {
      const tags = utils.tagsToString(p.tags).split(', ').filter(t => t && t !== 'None');
      tags.forEach(t => allTags.add(t));
    });
    const topTags = Array.from(allTags).slice(0, 3);

    // Top poets
    const authorMap = {};
    poems.forEach(p => {
      const uid = p.user_id || 'anonymous';
      if (!authorMap[uid]) authorMap[uid] = { id: uid, count: 0 };
      authorMap[uid].count++;
    });
    const topPoets = Object.values(authorMap).sort((a, b) => b.count - a.count).slice(0, 3);

    const prompt = getDailyPrompt();

    // === BUILD HERO ===
    let heroHtml = '';
    if (!search) {
      heroHtml = `
      <section class="hero-section animate-fade-in">
        <div class="stats-line">${totalPoems} Works &bull; ${totalLikes.toLocaleString()} Likes</div>
        <h1 class="hero-title">${userName ? `Hi ${utils.escapeHTML(userName)},` : ''}<br>Ready to inspire today?</h1>
        <div class="hero-actions">
          <button class="hero-btn-primary" onclick="window.location.hash='${currentUser ? 'add-poem' : 'register'}'">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            ${currentUser ? 'New Poem' : 'New Poem'}
          </button>
          <button class="hero-btn-secondary" onclick="window.location.hash='discover'">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Collection Feed
          </button>
        </div>
      </section>`;
    }

    // === FEATURED POEM CARD ===
    let featuredHtml = '';
    if (featuredPoem && !search) {
      const fc = utils.escapeHTML(featuredPoem.content);
      const fp = fc.length > 200 ? fc.slice(0, 200) + '...' : fc;
      const authorId = featuredPoem.user_id || 'anonymous';
      const authorName = authorId.includes('@') ? authorId.split('@')[0] : authorId.slice(0, 14);
      const responsePercent = Math.min(98, 75 + Math.floor(totalPoems % 24));

      // Avatar stack (decorative)
      const stackColors = AVATAR_COLORS.slice(0, 5);
      const avatarStackHtml = stackColors.map((c, i) =>
        `<div class="avatar-thumb" style="background:${c};">${String.fromCharCode(65 + i)}</div>`
      ).join('');

      featuredHtml = `
      <div class="featured-card animate-fade-in stagger-1" data-poem-id="${featuredPoem.id}" id="featured-poem-card">
        <div class="featured-badge">
          <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Featured Poem
        </div>
        <div class="featured-title">${utils.escapeHTML(featuredPoem.title)}</div>
        <div class="featured-author-line">by ${utils.escapeHTML(authorName)}</div>
        <div class="featured-preview" style="font-style: italic;">${fp.replace(/\n/g, ' ')}</div>
        <div class="community-response">
          <span class="response-label">Community Response</span>
          <span class="response-percent">${responsePercent}%</span>
          <div class="response-bar"><div class="response-fill" style="width: ${responsePercent}%;"></div></div>
        </div>
        <div class="featured-footer">
          <div class="avatar-stack">${avatarStackHtml}</div>
          <button class="read-explore-btn" onclick="event.stopPropagation();">Read&amp;Explore</button>
        </div>
      </div>`;
    }

    // === DAILY PROMPT WIDGET ===
    const dailyPromptHtml = `
    <div class="sidebar-widget animate-fade-in stagger-2">
      <div class="widget-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" stroke-width="2"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" stroke-width="2"/></svg>
        Daily Prompt
      </div>
      <div class="prompt-visual">
        <div class="prompt-circle" style="background: linear-gradient(135deg, #f97316, #ec4899);"></div>
      </div>
      <div class="daily-prompt-text">"${prompt.title}"</div>
      <div class="prompt-description">${prompt.desc}</div>
      <button class="daily-prompt-btn" onclick="window.location.hash='add-poem'">Accept Challenge</button>
    </div>`;

    // === ACTIVITY COUNTER WIDGET ===
    const activityCounterHtml = `
    <div class="sidebar-widget animate-fade-in stagger-3" style="padding: 1rem;">
      <div class="activity-counter-row">
        <div class="activity-big-number">${totalLikes.toLocaleString()}</div>
        <div class="activity-sparkline">
          ${[20,35,25,45,30,50,40,55,45,60,50,65].map(h => `<div class="sparkline-bar" style="height:${h}%;"></div>`).join('')}
        </div>
      </div>
    </div>`;

    // === CATEGORY TABS ===
    const defaultTabs = ['Trending', 'Recent', 'Following'];
    const dynamicTabs = topTags.filter(t => !defaultTabs.map(d => d.toLowerCase()).includes(t.toLowerCase()));
    const allTabLabels = [...defaultTabs, ...dynamicTabs.slice(0, 3)];

    const tabsHtml = `
    <div class="category-tabs" id="category-tabs">
      ${allTabLabels.map((tab, i) => `<button class="category-tab${i === 0 ? ' active' : ''}" data-tag="${tab.toLowerCase()}">${tab}</button>`).join('')}
    </div>`;

    // === POEM CARDS ===
    const poemCardsHtml = (search ? poems : feedPoems).map((poem, index) => {
      const content = utils.escapeHTML(poem.content);
      const preview = content.length > 200 ? content.slice(0, 200) + '...' : content;
      const authorId = poem.user_id || 'anonymous';
      const avatarColor = getAvatarColor(authorId);
      const initial = authorId.charAt(0).toUpperCase();
      const authorName = authorId.includes('@') ? authorId.split('@')[0] : authorId.slice(0, 14);
      const tags = utils.tagsToString(poem.tags).split(', ').filter(t => t && t !== 'None');
      const isTopPick = index < 3;

      return `
      <article class="poem-card-enhanced animate-fade-in stagger-${(index % 4) + 1}" data-poem-id="${poem.id}">
        <div class="poem-card-header">
          <div class="card-avatar" style="background: ${avatarColor};">${initial}</div>
          <div class="card-author-info">
            <div class="card-author-name">${utils.escapeHTML(authorName)}</div>
          </div>
        </div>
        <div class="card-poem-title" data-poem-id="${poem.id}">${utils.escapeHTML(poem.title)}</div>
        <div class="card-poem-preview">${preview.replace(/\n/g, '<br>')}</div>
        <div class="color-bar"></div>
        ${isTopPick ? `<div style="margin-bottom: 0.75rem;"><span class="card-top-pick"><svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Top Picks</span></div>` : ''}
        ${tags.length > 0 ? `<div class="card-tags">${tags.map(tag => `<span class="tag-pill">${tag}</span>`).join('')}</div>` : ''}
        <div class="card-actions">
          <button class="card-action-btn like-btn" data-id="${poem.id}">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span class="like-count" id="like-count-${poem.id}">0</span>
          </button>
          <button class="card-action-btn toggle-comments-btn" data-id="${poem.id}">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <span class="comments-count" id="comments-count-${poem.id}">0</span>
          </button>
          <button class="card-action-btn share-btn" data-id="${poem.id}">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
          <button class="card-action-btn bookmark-btn" data-id="${poem.id}">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
        <div class="comments-section hidden" id="comments-section-${poem.id}">
          <div style="font-weight: 600; font-size: 0.875rem; color: var(--primary); margin-bottom: 0.75rem;">Comments</div>
          <ul class="comments-list" id="comments-list-${poem.id}" style="margin-bottom: 1rem; list-style: none; padding: 0;"></ul>
          <form class="comment-form flex gap-2" data-id="${poem.id}">
            <input type="text" class="comment-input modern-input flex-1" placeholder="Add a comment..." required style="padding: 0.5rem 1rem; font-size: 0.875rem;" />
            <button type="submit" class="action-btn action-btn-primary">Post</button>
          </form>
        </div>
        ${index > 0 && (index + 1) % 3 === 0 ? `
        <button class="export-image-btn export-btn" data-id="${poem.id}">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export as Image
        </button>` : ''}
      </article>`;
    }).join('');

    // === SIDEBAR: START WRITING ===
    const startWritingHtml = `
    <div class="sidebar-widget start-writing-widget animate-fade-in stagger-2">
      <div class="widget-title">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Start Writing
      </div>
      <div class="start-writing-text" style="font-style: italic; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">poem ideas &amp; prompts</div>
      <button class="hero-btn-primary" style="width: 100%; justify-content: center; padding: 0.625rem;" onclick="window.location.hash='add-poem'">
        Create New Poem
      </button>
    </div>`;

    // === SIDEBAR: TOP POETS ===
    const topPoetsHtml = `
    <div class="sidebar-widget animate-fade-in stagger-3">
      <div class="widget-title">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        Top Poets
      </div>
      <div class="top-poets-list" style="display: flex; flex-direction: column; gap: 0.625rem;">
        ${topPoets.map(poet => {
          const color = getAvatarColor(poet.id);
          const name = poet.id.includes('@') ? poet.id.split('@')[0] : poet.id.slice(0, 14);
          return `
          <div class="top-poet-item">
            <div class="poet-dot" style="background: ${color};"></div>
            <div class="poet-name">${utils.escapeHTML(name)}</div>
          </div>`;
        }).join('')}
        ${topPoets.length === 0 ? '<div style="font-size: 0.8rem; color: var(--text-muted);">No poets yet</div>' : ''}
      </div>
    </div>`;

    // === SIDEBAR: LIFETIME ACTIVITY (GREEN) ===
    const lifetimeHtml = `
    <div class="sidebar-widget lifetime-widget animate-fade-in stagger-4">
      <div class="lifetime-label">LIFETIME ACTIVITY</div>
      <div class="lifetime-number">${totalPoems}</div>
      <div class="lifetime-sublabel">Poems Written</div>
      <div class="lifetime-chart">
        ${[35,55,25,70,45,60,80,40,65,50,75,90].map(h => `<div class="lifetime-bar" style="height: ${h}%;"></div>`).join('')}
      </div>
    </div>`;

    // === ASSEMBLE FULL LAYOUT ===
    let html = `<div class="home-container">
      ${heroHtml}
      <div class="home-layout">
        <div class="home-main">
          ${featuredHtml}
          ${tabsHtml}
          <div id="poems-feed" class="poems-feed">
            ${poems.length === 0 ? `
              <div class="empty-state">
                <p class="empty-title">No poems found yet.</p>
                <p class="empty-subtitle">Be the first to share your words!</p>
              </div>` : poemCardsHtml}
          </div>
        </div>
        <aside class="home-sidebar">
          ${dailyPromptHtml}
          ${activityCounterHtml}
          ${startWritingHtml}
          ${topPoetsHtml}
          ${lifetimeHtml}
        </aside>
      </div>
    </div>`;

    // Pagination
    const baseRoute = search ? `#home?q=${encodeURIComponent(search)}` : '#home';
    html += utils.createPaginationControls(paginationData, (newPage) => {
      renderHome(dom, newPage);
    }, baseRoute);

    dom.app.innerHTML = html;

    utils.attachPaginationHandlers((newPage) => {
      renderHome(dom, newPage);
    });

    // === DOM INTERACTION SETUP ===
    setTimeout(() => {
      // Hide header view toggles
      const headerToggleContainer = document.getElementById('header-view-toggle-container');
      if (headerToggleContainer) headerToggleContainer.classList.add('hidden');
      const mobileHeaderToggleContainer = document.getElementById('mobile-header-toggle-container');
      if (mobileHeaderToggleContainer) mobileHeaderToggleContainer.classList.add('hidden');

      // Category tab filtering
      const tabBtns = dom.app.querySelectorAll('.category-tab');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          tabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const tag = btn.dataset.tag;
          const cards = dom.app.querySelectorAll('.poem-card-enhanced');
          cards.forEach(card => {
            const poemId = card.dataset.poemId;
            const poem = poems.find(p => p.id === poemId);
            if (!poem) { card.style.display = 'none'; return; }
            if (tag === 'trending' || tag === 'all') {
              card.style.display = '';
            } else if (tag === 'recent') {
              const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
              card.style.display = new Date(poem.created_at).getTime() > twoDaysAgo ? '' : 'none';
            } else if (tag === 'following') {
              card.style.display = ''; // Placeholder — show all
            } else {
              const poemTags = utils.tagsToString(poem.tags).toLowerCase();
              card.style.display = poemTags.includes(tag.toLowerCase()) ? '' : 'none';
            }
          });
        });
      });

      // Featured poem click
      const featuredCard = document.getElementById('featured-poem-card');
      if (featuredCard) {
        featuredCard.addEventListener('click', (e) => {
          if (e.target.closest('button')) return;
          navigate('/view-poem/' + featuredPoem.id);
        });
        // Read&Explore button
        const readExploreBtn = featuredCard.querySelector('.read-explore-btn');
        if (readExploreBtn) {
          readExploreBtn.addEventListener('click', () => navigate('/view-poem/' + featuredPoem.id));
        }
      }

      // Poem title click handlers
      dom.app.querySelectorAll('.card-poem-title').forEach(title => {
        title.addEventListener('click', () => navigate('/view-poem/' + title.dataset.poemId));
      });
    }, 0);

    // === LOAD LIKE & COMMENT COUNTS ===
    import('../likes.js').then(({ fetchLikeCount }) => {
      import('../comments.js').then(({ fetchComments }) => {
        poems.forEach(async poem => {
          const likeCount = await fetchLikeCount(poem.id);
          const likeCountSpan = dom.app.querySelector(`#like-count-${poem.id}`);
          if (likeCountSpan) likeCountSpan.textContent = likeCount;

          const comments = await fetchComments(poem.id);
          const commentsCountSpan = dom.app.querySelector(`#comments-count-${poem.id}`);
          if (commentsCountSpan) commentsCountSpan.textContent = comments.length;
        });
      });
    });

    // === LIKE, COMMENT, SHARE, EXPORT LOGIC ===
    let exportPoemAsImage;
    import('../utils/imageExport.js').then(mod => { exportPoemAsImage = mod.exportPoemAsImage; });
    import('../auth.js').then(({ currentUser }) => {
      import('../comments.js').then(({ fetchComments, addComment, deleteComment, updateComment }) => {
        const allPoems = search ? poems : (featuredPoem ? [featuredPoem, ...feedPoems] : feedPoems);
        allPoems.forEach(poem => {
          // Like buttons
          import('../likes.js').then(({ hasUserLiked, likePoem, unlikePoem, fetchLikeCount }) => {
            const likeBtn = dom.app.querySelector(`.like-btn[data-id='${poem.id}']`);
            const likeCountSpan = dom.app.querySelector(`#like-count-${poem.id}`);
            if (!likeBtn) return;
            (async () => {
              if (currentUser) {
                const liked = await hasUserLiked(poem.id, currentUser.id);
                if (liked) likeBtn.classList.add('like-active');
                likeBtn.onclick = async () => {
                  const isLiked = await hasUserLiked(poem.id, currentUser.id);
                  if (isLiked) {
                    await unlikePoem(poem.id, currentUser.id);
                    likeBtn.classList.remove('like-active');
                  } else {
                    await likePoem(poem.id, currentUser.id);
                    likeBtn.classList.add('like-active');
                  }
                  const newCount = await fetchLikeCount(poem.id);
                  if (likeCountSpan) likeCountSpan.textContent = newCount;
                };
              } else {
                likeBtn.onclick = () => utils.showModal(dom, 'Login to like poems!');
              }
            })();
          });

          // Share button
          const shareBtn = dom.app.querySelector(`.share-btn[data-id='${poem.id}']`);
          if (shareBtn) {
            shareBtn.onclick = () => {
              const url = window.location.origin + '/#view-poem/' + poem.id;
              utils.showModal(dom, 'Share this poem', [
                {
                  label: 'Copy Link',
                  class: 'nav-btn px-2 py-1 text-xs',
                  onClick: () => {
                    navigator.clipboard.writeText(url);
                    utils.showToast(dom, 'Link copied!');
                    utils.hideModal(dom);
                  }
                },
                {
                  label: 'Download as Image',
                  class: 'nav-btn px-2 py-1 text-xs',
                  onClick: async () => {
                    utils.hideModal(dom);
                    setTimeout(async () => {
                      if (exportPoemAsImage) await exportPoemAsImage(poem.id);
                    }, 300);
                  }
                }
              ]);
            };
          }

          // Export button
          const exportBtn = dom.app.querySelector(`.export-btn[data-id='${poem.id}']`);
          if (exportBtn) {
            exportBtn.onclick = async () => {
              if (exportPoemAsImage) await exportPoemAsImage(poem.id);
            };
          }

          // Comments logic
          const commentsList = dom.app.querySelector(`#comments-list-${poem.id}`);
          const commentsSection = dom.app.querySelector(`#comments-section-${poem.id}`);
          const toggleCommentsBtn = dom.app.querySelector(`.toggle-comments-btn[data-id='${poem.id}']`);
          let commentsVisible = false;
          let comments = [];

          async function renderComments() {
            comments = await fetchComments(poem.id);
            commentsList.innerHTML = comments.map(c => `
              <li style="display: flex; flex-direction: column; gap: 0.25rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border-subtle);">
                <div style="font-size: 0.7rem; color: var(--text-muted);">${utils.formatDate(c.created_at)}</div>
                <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                  <span style="font-weight: 600; color: var(--primary-light); font-size: 0.8rem;">${c.user_id.slice(0, 8)}</span>
                  <span style="flex: 1; font-size: 0.85rem; color: var(--text-secondary);">${utils.escapeHTML(c.comment_text)}</span>
                </div>
                ${currentUser && currentUser.id === c.user_id ? `
                  <div style="display: flex; gap: 0.5rem; margin-left: 3rem;">
                    <button class="edit-comment-btn" style="font-size: 0.7rem; color: var(--primary); background: none; border: none; cursor: pointer;" data-cid="${c.id}" data-pid="${poem.id}">Edit</button>
                    <button class="delete-comment-btn" style="font-size: 0.7rem; color: var(--error); background: none; border: none; cursor: pointer;" data-cid="${c.id}" data-pid="${poem.id}">Delete</button>
                  </div>
                ` : ''}
              </li>
            `).join('');

            commentsList.querySelectorAll('.edit-comment-btn').forEach(btn => {
              btn.onclick = () => {
                const cid = btn.getAttribute('data-cid');
                const orig = comments.find(c => c.id === cid);
                if (!orig) return;
                const editDiv = document.createElement('div');
                editDiv.innerHTML = `
                  <input class="edit-comment-input modern-input" value="${utils.escapeHTML(orig.comment_text)}" style="font-size: 0.85rem; padding: 0.4rem 0.75rem; margin: 0.25rem 0;" />
                  <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
                    <button class="save-edit-btn action-btn action-btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">Save</button>
                    <button class="cancel-edit-btn action-btn action-btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">Cancel</button>
                  </div>
                `;
                btn.parentElement.appendChild(editDiv);
                editDiv.querySelector('.save-edit-btn').onclick = async () => {
                  const newText = editDiv.querySelector('.edit-comment-input').value.trim();
                  if (newText && newText !== orig.comment_text) {
                    await updateComment(cid, newText);
                    await renderComments();
                  }
                };
                editDiv.querySelector('.cancel-edit-btn').onclick = () => editDiv.remove();
              };
            });
            commentsList.querySelectorAll('.delete-comment-btn').forEach(btn => {
              btn.onclick = async () => {
                const cid = btn.getAttribute('data-cid');
                await deleteComment(cid);
                await renderComments();
              };
            });
            const countSpan = dom.app.querySelector(`#comments-count-${poem.id}`);
            if (countSpan) countSpan.textContent = comments.length;
          }

          if (toggleCommentsBtn) {
            toggleCommentsBtn.onclick = async () => {
              commentsVisible = !commentsVisible;
              commentsSection.classList.toggle('hidden', !commentsVisible);
              if (commentsVisible) await renderComments();
            };
          }

          const commentForm = dom.app.querySelector(`.comment-form[data-id='${poem.id}']`);
          if (commentForm) {
            commentForm.onsubmit = async (e) => {
              e.preventDefault();
              const input = commentForm.querySelector('.comment-input');
              const text = input.value.trim();
              if (!text) return;
              try {
                if (!currentUser || !currentUser.id) {
                  utils.showModal(dom, 'Login to comment on poems!');
                  return;
                }
                await addComment({ poem_id: poem.id, user_id: currentUser.id, comment_text: text });
                input.value = '';
                await renderComments();
              } catch (err) {
                utils.showModal(dom, 'Login to comment on poems!');
              }
            };
          }
        });
      });
    });
  } catch (err) {
    dom.app.innerHTML = `<div class="text-center text-red-600" style="padding: 3rem 0;">Failed to load poems: ${err.message || err}</div>`;
  } finally {
    utils.showLoading(dom, false);
  }
}
