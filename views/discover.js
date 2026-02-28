// views/discover.js
// Discover view with smart sorting and enhanced cards
import { fetchPoemsWithSmartSortPaginated } from '../poems.js';
import { utils } from '../utils.js';
import { navigate } from '../router.js';

const AVATAR_COLORS = ['#8b5cf6','#ec4899','#f59e0b','#22c55e','#3b82f6','#ef4444','#14b8a6','#f97316'];
function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export async function renderDiscover(dom, searchParam = '', page = 1) {
  let search = searchParam || '';
  if (!search) {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    search = urlParams.get('q') || '';
  }
  
  dom.app.innerHTML = `<div class="text-center text-lg" style="padding: 3rem 0;">Loading poems...</div>`;
  utils.showLoading(dom, true);
  
  try {
    const result = await fetchPoemsWithSmartSortPaginated({ search, page, limit: 50 });
    const { data: poems, ...paginationData } = result;

    // Get saved view mode or default to grid
    const savedView = localStorage.getItem('discoverViewMode') || 'grid';

    // View toggle HTML
    const viewToggleHtml = `
    <div class="view-toggle" id="discover-view-toggle">
      <button class="view-toggle-btn ${savedView === 'grid' ? 'active' : ''}" data-view="grid" title="Grid view">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      </button>
      <button class="view-toggle-btn ${savedView === 'list' ? 'active' : ''}" data-view="list" title="List view">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      </button>
    </div>`;

    // Build poem cards based on view mode
    function buildPoemCard(poem, index, viewMode) {
      const content = utils.escapeHTML(poem.content);
      const preview = content.length > (viewMode === 'grid' ? 150 : 200) ? content.slice(0, viewMode === 'grid' ? 150 : 200) + '...' : content;
      const tags = utils.tagsToString(poem.tags).split(', ').filter(t => t && t !== 'None');
      const timeAgo = utils.formatDate(poem.created_at);
      const avatarColor = getAvatarColor(poem.user_id);
      const poetNumber = poem.user_id ? poem.user_id.substring(poem.user_id.length - 4).toUpperCase() : '0000';

      if (viewMode === 'grid') {
        // Grid view - compact cards
        return `
        <article class="poem-card-grid animate-fade-in" data-poem-id="${poem.id}">
          <div class="poem-card-header" style="display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.75rem;">
            <div class="card-avatar" style="background: ${avatarColor}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <svg width="16" height="16" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div style="flex: 1; overflow: hidden;">
              <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Anonymous Poet #${poetNumber}</div>
              <div style="font-size: 0.65rem; color: var(--text-muted);">${timeAgo}</div>
            </div>
          </div>
          ${poem.prompt_date ? `<div style="margin-bottom: 0.5rem;">${utils.promptDayTag(poem.prompt_date, poem.prompt_title)}</div>` : ''}
          <div class="card-poem-title" data-poem-id="${poem.id}">${utils.escapeHTML(poem.title)}</div>
          <div class="card-poem-preview">${preview.replace(/\n/g, ' ')}</div>
          ${poem.image ? `<div class="card-poem-image" style="aspect-ratio: ${poem.aspect_ratio ? poem.aspect_ratio.replace(':', '/') : '4/3'};"><img src="${poem.image}" alt="Poem image" loading="lazy" /></div>` : ''}
          <div class="card-actions-compact">
            <button class="card-action-btn-compact like-btn" data-id="${poem.id}">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span class="like-count" id="like-count-${poem.id}">0</span>
            </button>
            <button class="card-action-btn-compact toggle-comments-btn" data-id="${poem.id}">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <span class="comments-count" id="comments-count-${poem.id}">0</span>
            </button>
            <a class="card-action-btn-compact card-read-more" data-poem-id="${poem.id}" style="cursor: pointer;">Read More</a>
          </div>
          <div class="comments-section hidden" id="comments-section-${poem.id}">
            <div style="font-weight: 600; font-size: 0.875rem; color: var(--primary); margin-bottom: 0.75rem;">Comments</div>
            <ul class="comments-list" id="comments-list-${poem.id}" style="margin-bottom: 1rem; list-style: none; padding: 0;"></ul>
            <form class="comment-form flex gap-2" data-id="${poem.id}">
              <input type="text" class="comment-input modern-input flex-1" placeholder="Add a comment..." required style="padding: 0.5rem 1rem; font-size: 0.875rem;" />
              <button type="submit" class="action-btn action-btn-primary">Post</button>
            </form>
          </div>
        </article>`;
      } else {
        // List view - full enhanced cards
        return `
        <article class="poem-card-enhanced animate-fade-in stagger-${(index % 4) + 1}" data-poem-id="${poem.id}">
          <div class="poem-card-header">
            <div class="card-avatar" style="background: ${avatarColor};">
              <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div class="card-author-info">
              <div class="card-author-name">Anonymous Poet #${poetNumber}</div>
              <div class="card-author-date">Posted ${timeAgo}</div>
            </div>
          ${poem.prompt_date ? `<div style="margin-left: auto;">${utils.promptDayTag(poem.prompt_date, poem.prompt_title)}</div>` : ''}
          </div>
          <div class="card-poem-title" data-poem-id="${poem.id}">${utils.escapeHTML(poem.title)}</div>
          <div class="card-poem-preview">${preview.replace(/\n/g, '<br>')}</div>
          ${poem.image ? `<div class="card-poem-image" style="aspect-ratio: ${poem.aspect_ratio ? poem.aspect_ratio.replace(':', '/') : '4/3'};"><img src="${poem.image}" alt="Poem image" loading="lazy" /></div>` : ''}
          ${tags.length > 0 ? `<div class="card-tags">${tags.map(tag => `<span class="tag-pill">${tag}</span>`).join('')}</div>` : ''}
          <div class="card-actions">
            <button class="card-action-btn like-btn" data-id="${poem.id}">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span class="like-count" id="like-count-${poem.id}">0</span>
            </button>
            <button class="card-action-btn toggle-comments-btn" data-id="${poem.id}">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <span class="comments-count" id="comments-count-${poem.id}">0</span>
            </button>
            <button class="card-action-btn share-btn" data-id="${poem.id}">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
            <a class="card-action-btn card-read-more" data-poem-id="${poem.id}">Read More</a>
          </div>
          <div class="comments-section hidden" id="comments-section-${poem.id}">
            <div style="font-weight: 600; font-size: 0.875rem; color: var(--primary); margin-bottom: 0.75rem;">Comments</div>
            <ul class="comments-list" id="comments-list-${poem.id}" style="margin-bottom: 1rem; list-style: none; padding: 0;"></ul>
            <form class="comment-form flex gap-2" data-id="${poem.id}">
              <input type="text" class="comment-input modern-input flex-1" placeholder="Add a comment..." required style="padding: 0.5rem 1rem; font-size: 0.875rem;" />
              <button type="submit" class="action-btn action-btn-primary">Post</button>
            </form>
          </div>
        </article>`;
      }
    }

    const poemCardsHtml = poems.map((p, i) => buildPoemCard(p, i, savedView)).join('');

    let html = `<div class="w-full" style="max-width: ${savedView === 'grid' ? '1000px' : '800px'}; margin: 0 auto; padding: 0 1rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <span style="font-size: 1.5rem; font-weight: 600;">Discover</span>
        ${viewToggleHtml}
      </div>
      <div id="poems-feed" class="${savedView === 'grid' ? 'poems-grid-view' : 'poems-feed'}">
        ${poems.length === 0 ? `
          <div class="text-center py-12" style="color: var(--text-secondary);">
            <p style="font-size: 1.25rem;">No poems found yet.</p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">Be the first to share your words!</p>
          </div>` : poemCardsHtml}
      </div>`;
    
    const baseRoute = search ? `#discover?q=${encodeURIComponent(search)}` : '#discover';
    html += utils.createPaginationControls(paginationData, (newPage) => {
      renderDiscover(dom, search, newPage);
    }, baseRoute);
    html += `</div>`;
    dom.app.innerHTML = html;
    
    utils.attachPaginationHandlers((newPage) => {
      renderDiscover(dom, search, newPage);
    });

    setTimeout(() => {
      // View toggle functionality
      const viewToggleBtns = dom.app.querySelectorAll('.view-toggle-btn');
      const poemsFeed = dom.app.querySelector('#poems-feed');
      const containerEl = dom.app.querySelector('.w-full');
      
      viewToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const view = btn.dataset.view;
          localStorage.setItem('discoverViewMode', view);
          
          // Update active state
          viewToggleBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Update feed class, container width, and rebuild cards
          poemsFeed.className = view === 'grid' ? 'poems-grid-view' : 'poems-feed';
          containerEl.style.maxWidth = view === 'grid' ? '1000px' : '800px';
          poemsFeed.innerHTML = poems.map((p, i) => buildPoemCard(p, i, view)).join('');
          
          // Re-attach all handlers after rebuild
          attachAllHandlers();
        });
      });

      function attachAllHandlers() {
        // Poem title click handlers
        dom.app.querySelectorAll('.card-poem-title').forEach(title => {
          title.addEventListener('click', () => {
            navigate('/view-poem/' + title.dataset.poemId);
          });
        });

        // Prompt day tag click handlers
        dom.app.querySelectorAll('.prompt-day-tag').forEach(tag => {
          tag.addEventListener('click', (e) => {
            e.stopPropagation();
            utils.showPromptDetails(dom, tag.dataset.promptDate);
          });
        });

        // Image lightbox click handlers
        dom.app.querySelectorAll('.card-poem-image').forEach(el => {
          el.addEventListener('click', () => {
            const img = el.querySelector('img');
            if (img && img.src) utils.openImageLightbox(img.src);
          });
        });

        // Read More link handlers
        dom.app.querySelectorAll('.card-read-more').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            navigate('/view-poem/' + link.dataset.poemId);
          });
        });

        // Load counts and attach interaction handlers
        loadPoemInteractions();
      }

      attachAllHandlers();
    }, 0);

    function loadPoemInteractions() {
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

      // Like,comment, share, and export logic
      let exportPoemAsImage;
      import('../utils/imageExport.js').then(mod => { exportPoemAsImage = mod.exportPoemAsImage; });
      import('../auth.js').then(({ currentUser }) => {
        import('../comments.js').then(({ fetchComments, addComment, deleteComment, updateComment }) => {
          poems.forEach(poem => {
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
                      if (exportPoemAsImage) await exportPoemAsImage(poem.id);
                    }
                  }
                ]);
              };
            }

            // Comments logic (only for list view)
            const commentsList = dom.app.querySelector(`#comments-list-${poem.id}`);
            const commentsSection = dom.app.querySelector(`#comments-section-${poem.id}`);
            const toggleCommentsBtn = dom.app.querySelector(`.toggle-comments-btn[data-id='${poem.id}']`);
            
            if (!commentsList || !commentsSection || !toggleCommentsBtn) return;

            let commentsVisible = false;
            let comments = [];

            async function renderComments() {
              comments = await fetchComments(poem.id);
              commentsList.innerHTML = comments.map(c => `
                <li style="display: flex; flex-direction: column; gap: 0.25rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border-subtle);">
                  <div style="font-size: 0.7rem; color: var(--text-muted);">${utils.formatDate(c.created_at)}</div>
                  <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
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
            
            toggleCommentsBtn.onclick = async () => {
              commentsVisible = !commentsVisible;
              commentsSection.classList.toggle('hidden', !commentsVisible);
              if (commentsVisible) await renderComments();
            };
            
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
    }
  } catch (err) {
    dom.app.innerHTML = `<div class="text-center text-red-600" style="padding: 3rem 0;">Failed to load poems: ${err.message || err}</div>`;
  } finally {
    utils.showLoading(dom, false);
  }
}
