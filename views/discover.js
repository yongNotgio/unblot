// views/discover.js
// Discover view with smart sorting: recent poems first, then randomized
import { fetchPoemsWithSmartSortPaginated } from '../poems.js';
import { utils } from '../utils.js';
import { navigate } from '../router.js';

export async function renderDiscover(dom, searchParam = '', page = 1) {
  // Search can be passed as param or from URL
  let search = searchParam || '';
  if (!search) {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    search = urlParams.get('q') || '';
  }
  
  dom.app.innerHTML = `<div class="text-center text-lg">Loading poems...</div>`;
  utils.showLoading(dom, true);
  
  try {
    const result = await fetchPoemsWithSmartSortPaginated({ 
      search, 
      page, 
      limit: 50 
    }); // Use paginated smart sorting for discover
    const { data: poems, ...paginationData } = result;
    
    // Get saved view preference (default to grid)
    const savedView = localStorage.getItem('poemViewMode') || 'grid';
    
    // Helper to get container class based on view
    const getContainerClass = (view) => {
      if (view === 'list') return 'grid gap-6';
      if (view === 'grid-sm') return 'poems-grid-sm';
      if (view === 'grid-lg') return 'poems-grid-lg';
      return 'poems-grid';
    };
    
    let html = `<div class="w-full">
      <div id="poems-container" class="${getContainerClass(savedView)}" style="max-width: ${savedView === 'list' ? '720px' : '100%'}; margin: 0 auto;">`;
      
    if (poems.length === 0) {
      html += `<div class="text-center py-12" style="color: var(--text-secondary);">

        <p style="font-family: 'EB Garamond', serif; font-size: 1.25rem;">No poems found yet.</p>
        <p style="font-size: 0.875rem; margin-top: 0.5rem;">Be the first to share your words!</p>
      </div>`;
    } else {
      // Generate both grid and list HTML
      const gridHtml = poems.map((poem, index) => {
        const content = utils.escapeHTML(poem.content);
        const previewContent = content.length > 150 ? content.slice(0, 150) + '...' : content;
        return `
        <div class="poem-grid-tile animate-fade-in stagger-${(index % 4) + 1}" data-poem-id="${poem.id}">
          <div class="tile-title">${utils.escapeHTML(poem.title)}</div>
          <div class="tile-preview">${previewContent.replace(/\n/g, ' ')}</div>
          <div class="tile-meta">
            <span>${utils.formatDate(poem.created_at)}</span>
            <div class="tile-stats">
              <span class="tile-stat">
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <span class="grid-like-count" data-id="${poem.id}">0</span>
              </span>
              <span class="tile-stat">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                <span class="grid-comments-count" data-id="${poem.id}">0</span>
              </span>
            </div>
          </div>
        </div>`;
      }).join('');

      const listHtml = poems.map((poem, index) => {
        const content = utils.escapeHTML(poem.content);
        return `
        <article class="poem-card animate-fade-in stagger-${(index % 4) + 1}" data-poem-id="${poem.id}">
          <header class="flex justify-between items-start mb-3">
            <a href="#view-poem/${poem.id}" class="poem-title-link text-xl" style="font-weight: 600;" data-poem-id="${poem.id}">${utils.escapeHTML(poem.title)}</a>
            <span class="date-text">${utils.formatDate(poem.created_at)}</span>
          </header>
          <div class="author-badge mb-4">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Anonymous
          </div>
          <div class="poem-content mb-4" data-id="${poem.id}">
            <span style="white-space: pre-line;">${content}</span>
          </div>
          <div class="flex flex-wrap gap-2 mb-4">
            ${utils.tagsToString(poem.tags).split(', ').filter(t => t && t !== 'None').map(tag => `<span class="tag-pill">${tag}</span>`).join('')}
          </div>
          <footer class="flex flex-wrap items-center gap-2 pt-4" style="border-top: 1px solid var(--border);">
            <button class="like-btn action-btn action-btn-like" data-id="${poem.id}">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              Like
            </button>
            <span class="like-count" id="like-count-${poem.id}" style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;"></span>
            <button class="toggle-comments-btn action-btn action-btn-secondary" data-id="${poem.id}">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <span class="comments-count" id="comments-count-${poem.id}">0</span>
            </button>
            <button class="share-btn action-btn action-btn-secondary" data-id="${poem.id}">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share
            </button>
          </footer>
          <div class="comments-section hidden" id="comments-section-${poem.id}">
            <div style="font-weight: 600; font-size: 0.875rem; color: var(--primary); margin-bottom: 0.75rem;">Comments</div>
            <ul class="comments-list" id="comments-list-${poem.id}" style="margin-bottom: 1rem;"></ul>
            <form class="comment-form flex gap-2" data-id="${poem.id}">
              <input type="text" class="comment-input modern-input flex-1" placeholder="Add a comment..." required style="padding: 0.5rem 1rem; font-size: 0.875rem;" />
              <button type="submit" class="action-btn action-btn-primary">Post</button>
            </form>
          </div>
        </article>
      `;
      }).join('');

      // Store both HTML versions for toggle
      window._poemViewData = { gridHtml, listHtml, poems };
      
      // Show based on saved preference
      html += savedView === 'list' ? listHtml : gridHtml;
    }
    
    html += `</div>`;
    
    // Add pagination controls
    const baseRoute = search ? `#discover?q=${encodeURIComponent(search)}` : '#discover';
    html += utils.createPaginationControls(paginationData, (newPage) => {
      renderDiscover(dom, newPage);
    }, baseRoute);
    
    html += `</div>`;
    dom.app.innerHTML = html;
    
    // Attach pagination handlers
    utils.attachPaginationHandlers((newPage) => {
      renderDiscover(dom, newPage);
    });

    // Add click handler to poem title links
    setTimeout(() => {
      // Show the header view toggle (desktop)
      const headerToggleContainer = document.getElementById('header-view-toggle-container');
      if (headerToggleContainer) {
        headerToggleContainer.classList.remove('hidden');
      }
      
      // Show the mobile header view toggle
      const mobileHeaderToggleContainer = document.getElementById('mobile-header-toggle-container');
      if (mobileHeaderToggleContainer) {
        mobileHeaderToggleContainer.classList.remove('hidden');
      }
      
      // Helper to get container class based on view
      const getContainerClass = (view) => {
        if (view === 'list') return 'grid gap-6';
        if (view === 'grid-sm') return 'poems-grid-sm';
        if (view === 'grid-lg') return 'poems-grid-lg';
        return 'poems-grid';
      };

      // Listen for view mode changes from header toggle
      const viewChangeHandler = (e) => {
        const view = e.detail.view;
        
        // Update container
        const container = dom.app.querySelector('#poems-container');
        if (container && window._poemViewData) {
          container.className = getContainerClass(view);
          container.style.maxWidth = view === 'list' ? '720px' : '100%';
          container.innerHTML = view === 'list' ? window._poemViewData.listHtml : window._poemViewData.gridHtml;
          
          // Re-attach handlers after view change
          attachGridHandlers();
          attachListHandlers();
          loadCounts();
        }
      };
      
      window.addEventListener('viewModeChanged', viewChangeHandler);
      
      // Cleanup listener when navigating away
      window._discoverViewChangeHandler = viewChangeHandler;

      // Function to attach grid tile click handlers
      function attachGridHandlers() {
        dom.app.querySelectorAll('.poem-grid-tile').forEach(tile => {
          tile.addEventListener('click', function() {
            const poemId = tile.getAttribute('data-poem-id');
            navigate('/view-poem/' + poemId);
          });
        });
      }

      // Function to attach list view handlers
      function attachListHandlers() {
        const links = dom.app.querySelectorAll('.poem-title-link');
        links.forEach(link => {
          link.addEventListener('click', function(e) {
            e.preventDefault();
            const poemId = link.getAttribute('data-poem-id');
            navigate('/view-poem/' + poemId);
          });
        });
      }

      // Function to load like/comment counts
      function loadCounts() {
        import('../likes.js').then(({ fetchLikeCount }) => {
          import('../comments.js').then(({ fetchComments }) => {
            poems.forEach(async poem => {
              // Like count for list view
              const likeCount = await fetchLikeCount(poem.id);
              const likeCountSpan = dom.app.querySelector(`#like-count-${poem.id}`);
              if (likeCountSpan) likeCountSpan.textContent = `(${likeCount})`;
              
              // Like count for grid view
              const gridLikeSpan = dom.app.querySelector(`.grid-like-count[data-id="${poem.id}"]`);
              if (gridLikeSpan) gridLikeSpan.textContent = likeCount;
              
              // Comment count for list view
              const comments = await fetchComments(poem.id);
              const commentsCountSpan = dom.app.querySelector(`#comments-count-${poem.id}`);
              if (commentsCountSpan) commentsCountSpan.textContent = comments.length;
              
              // Comment count for grid view
              const gridCommentsSpan = dom.app.querySelector(`.grid-comments-count[data-id="${poem.id}"]`);
              if (gridCommentsSpan) gridCommentsSpan.textContent = comments.length;
            });
          });
        });
      }

      // Initial attachment
      attachGridHandlers();
      attachListHandlers();
    }, 0);

    // Show like and comment counts for each poem
    import('../likes.js').then(({ fetchLikeCount }) => {
      import('../comments.js').then(({ fetchComments }) => {
        poems.forEach(async poem => {
          // Like count
          const likeCount = await fetchLikeCount(poem.id);
          const likeCountSpan = dom.app.querySelector(`#like-count-${poem.id}`);
          if (likeCountSpan) likeCountSpan.textContent = `(${likeCount})`;
          // Comment count
          const comments = await fetchComments(poem.id);
          const commentsCountSpan = dom.app.querySelector(`#comments-count-${poem.id}`);
          if (commentsCountSpan) commentsCountSpan.textContent = comments.length;
        });
      });
    });

    // Like, comment, and share logic
    let exportPoemAsImage;
    import('../utils/imageExport.js').then(mod => { exportPoemAsImage = mod.exportPoemAsImage; });
    import('../auth.js').then(({ currentUser }) => {
      import('../comments.js').then(({ fetchComments, addComment, deleteComment, updateComment }) => {
        poems.forEach(poem => {
          // Like button logic
          import('../likes.js').then(({ hasUserLiked, likePoem, unlikePoem, fetchLikeCount }) => {
            const likeBtn = dom.app.querySelector(`.like-btn[data-id='${poem.id}']`);
            const likeCountSpan = dom.app.querySelector(`#like-count-${poem.id}`);
            if (!likeBtn) return;
            (async () => {
              if (currentUser) {
                const liked = await hasUserLiked(poem.id, currentUser.id);
                if (liked) {
                  likeBtn.classList.add('active');
                } else {
                  likeBtn.classList.remove('active');
                }
                likeBtn.onclick = async () => {
                  const isLiked = await hasUserLiked(poem.id, currentUser.id);
                  if (isLiked) {
                    await unlikePoem(poem.id, currentUser.id);
                    likeBtn.classList.remove('active');
                  } else {
                    await likePoem(poem.id, currentUser.id);
                    likeBtn.classList.add('active');
                  }
                  const newCount = await fetchLikeCount(poem.id);
                  if (likeCountSpan) likeCountSpan.textContent = `(${newCount})`;
                };
              } else {
                likeBtn.onclick = () => utils.showModal(dom, 'Login to like poems!');
              }
            })();
          });

          // Share button
          const shareBtn = dom.app.querySelector(`.share-btn[data-id='${poem.id}']`);
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
                  // Wait for modal to close before capturing image to avoid overlay
                  utils.hideModal(dom);
                  setTimeout(async () => {
                    if (exportPoemAsImage) await exportPoemAsImage(poem.id);
                  }, 300);
                }
              }
            ]);
          };

          // Comments logic
          const commentsList = dom.app.querySelector(`#comments-list-${poem.id}`);
          const commentsSection = dom.app.querySelector(`#comments-section-${poem.id}`);
          const toggleCommentsBtn = dom.app.querySelector(`.toggle-comments-btn[data-id='${poem.id}']`);
          let commentsVisible = false;
          let comments = [];

          async function renderComments() {
            comments = await fetchComments(poem.id);
            commentsList.innerHTML = comments.map(c => `
              <li class="flex flex-col gap-1 py-2">
                <div class="text-xs text-gray-400">${utils.formatDate(c.created_at)}</div>
                <div class="flex items-start gap-2">
                  <span class="font-semibold">${c.user_id.slice(0, 8)}</span>:
                  <span class="flex-1">${utils.escapeHTML(c.comment_text)}</span>
                </div>
                ${currentUser && currentUser.id === c.user_id ? `
                  <div class="flex gap-2 pl-20">
                    <button class="edit-comment-btn text-xs text-blue-600" data-cid="${c.id}" data-pid="${poem.id}">Edit</button>
                    <button class="delete-comment-btn text-xs text-red-600" data-cid="${c.id}" data-pid="${poem.id}">Delete</button>
                  </div>
                ` : ''}
              </li>
            `).join('');

            // Attach edit/delete handlers
            commentsList.querySelectorAll('.edit-comment-btn').forEach(btn => {
              btn.onclick = () => {
                const cid = btn.getAttribute('data-cid');
                const orig = comments.find(c => c.id === cid);
                if (!orig) return;
                const editDiv = document.createElement('div');
                editDiv.innerHTML = `
                  <input class="edit-comment-input border rounded px-2 py-1 text-sm w-full" value="${utils.escapeHTML(orig.comment_text)}" />
                  <button class="save-edit-btn nav-btn px-2 py-1 text-xs">Save</button>
                  <button class="cancel-edit-btn nav-btn px-2 py-1 text-xs">Cancel</button>
                `;
                btn.parentElement.appendChild(editDiv);
                editDiv.querySelector('.save-edit-btn').onclick = async () => {
                  const newText = editDiv.querySelector('.edit-comment-input').value.trim();
                  if (newText && newText !== orig.comment_text) {
                    await updateComment(cid, newText);
                    await renderComments();
                  }
                };
                editDiv.querySelector('.cancel-edit-btn').onclick = () => {
                  editDiv.remove();
                };
              };
            });
            commentsList.querySelectorAll('.delete-comment-btn').forEach(btn => {
              btn.onclick = async () => {
                const cid = btn.getAttribute('data-cid');
                await deleteComment(cid);
                await renderComments();
              };
            });
            // Update comment count
            const countSpan = dom.app.querySelector(`#comments-count-${poem.id}`);
            if (countSpan) countSpan.textContent = comments.length;
          }
          
          // Toggle comments
          toggleCommentsBtn.onclick = async () => {
            commentsVisible = !commentsVisible;
            commentsSection.classList.toggle('hidden', !commentsVisible);
            if (commentsVisible) await renderComments();
          };
          
          // Comment form
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
    dom.app.innerHTML = `<div class="text-center text-red-600">Failed to load poems: ${err.message || err}</div>`;
  } finally {
    utils.showLoading(dom, false);
  }
}
