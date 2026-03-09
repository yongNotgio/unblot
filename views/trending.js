// Trending view — poems ranked by engagement score
import { fetchTrendingPoems } from '../poems.js';
import { utils } from '../utils.js';
import { navigate } from '../router.js';

const AVATAR_COLORS = ['#8b5cf6','#ec4899','#f59e0b','#22c55e','#3b82f6','#ef4444','#14b8a6','#f97316'];
function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export async function renderTrending(dom) {
  dom.app.innerHTML = `<div class="text-center text-lg" style="padding: 3rem 0;">Loading trending poems...</div>`;
  utils.showLoading(dom, true);

  try {
    const poems = await fetchTrendingPoems(50);

    function buildCard(poem, index) {
      const content = utils.escapeHTML(poem.content);
      const preview = content.length > 150 ? content.slice(0, 150) + '...' : content;
      const timeAgo = utils.formatDate(poem.created_at);
      const avatarColor = getAvatarColor(poem.user_id);
      const poetNumber = poem.user_id ? poem.user_id.substring(poem.user_id.length - 4).toUpperCase() : '0000';

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
          <div style="margin-left:auto; display:flex; align-items:center; gap:0.75rem; font-size:0.75rem; color:var(--text-muted);">
            <span title="Likes" style="display:flex;align-items:center;gap:0.2rem;">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              ${poem._likes}
            </span>
            <span title="Comments" style="display:flex;align-items:center;gap:0.2rem;">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              ${poem._comments}
            </span>
            <span title="Views" style="display:flex;align-items:center;gap:0.2rem;">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              ${poem._views || 0}
            </span>
          </div>
        </div>
        ${poem.prompt_date ? `<div style="margin-bottom: 0.5rem;">${utils.promptDayTag(poem.prompt_date, poem.prompt_title)}</div>` : ''}
        <div class="card-poem-title" data-poem-id="${poem.id}">${utils.escapeHTML(poem.title)}</div>
        <div class="card-poem-preview">${preview.replace(/\n/g, '<br>')}</div>
        ${poem.image ? `<div class="card-poem-image" style="aspect-ratio: ${poem.aspect_ratio ? poem.aspect_ratio.replace(':', '/') : '4/3'};"><img src="${poem.image}" alt="Poem image" loading="lazy" /></div>` : ''}
        <div class="card-actions">
          <button class="card-action-btn like-btn" data-id="${poem.id}">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span class="like-count" id="like-count-${poem.id}">${poem._likes}</span>
          </button>
          <button class="card-action-btn toggle-comments-btn" data-id="${poem.id}">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <span class="comments-count" id="comments-count-${poem.id}">${poem._comments}</span>
          </button>
          <button class="card-action-btn share-btn" data-id="${poem.id}">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
          <button class="card-action-btn save-btn" data-id="${poem.id}" title="Save to collection">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <a class="card-action-btn card-read-more" data-poem-id="${poem.id}" style="cursor:pointer;">Read More</a>
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

    const cardsHtml = poems.map((p, i) => buildCard(p, i)).join('');

    dom.app.innerHTML = `
    <div class="w-full" style="max-width: 800px; margin: 0 auto; padding: 0 1rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <span style="font-size: 1.5rem; font-weight: 600;">Trending</span>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Ranked by engagement</span>
      </div>
      <div id="poems-feed" class="poems-feed">
        ${poems.length === 0 ? `
          <div class="text-center py-12" style="color: var(--text-secondary);">
            <p style="font-size: 1.25rem;">No trending poems yet.</p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">Start writing and engaging!</p>
          </div>` : cardsHtml}
      </div>
    </div>`;

    setTimeout(() => {
      // Title clicks
      dom.app.querySelectorAll('.card-poem-title').forEach(el => {
        el.addEventListener('click', () => navigate('/view-poem/' + el.dataset.poemId));
      });
      // Read more
      dom.app.querySelectorAll('.card-read-more').forEach(el => {
        el.addEventListener('click', (e) => { e.preventDefault(); navigate('/view-poem/' + el.dataset.poemId); });
      });
      // Image lightbox
      dom.app.querySelectorAll('.card-poem-image').forEach(el => {
        el.addEventListener('click', () => { const img = el.querySelector('img'); if (img && img.src) utils.openImageLightbox(img.src); });
      });
      // Prompt tag clicks
      dom.app.querySelectorAll('.prompt-day-tag').forEach(tag => {
        tag.addEventListener('click', (e) => { e.stopPropagation(); utils.showPromptDetails(dom, tag.dataset.promptDate); });
      });
      attachInteractions(poems, dom);
    }, 0);

  } catch (err) {
    dom.app.innerHTML = `<div class="text-center text-red-600" style="padding: 3rem 0;">Failed to load trending poems: ${err.message || err}</div>`;
  } finally {
    utils.showLoading(dom, false);
  }
}

function attachInteractions(poems, dom) {
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
              { label: 'Copy Link', class: 'nav-btn px-2 py-1 text-xs', onClick: () => { navigator.clipboard.writeText(url); utils.showToast(dom, 'Link copied!'); utils.hideModal(dom); } },
              { label: 'Download as Image', class: 'nav-btn px-2 py-1 text-xs', onClick: async () => { utils.hideModal(dom); if (exportPoemAsImage) await exportPoemAsImage(poem.id); } }
            ]);
          };
        }

        const saveBtn = dom.app.querySelector(`.save-btn[data-id='${poem.id}']`);
        if (saveBtn && currentUser) {
          import('../poems.js').then(({ hasUserSaved, savePoem, unsavePoem, fetchCollections, createCollection }) => {
            (async () => {
              const saved = await hasUserSaved(poem.id, currentUser.id);
              if (saved) saveBtn.classList.add('save-active');
              saveBtn.onclick = async () => {
                const isSaved = await hasUserSaved(poem.id, currentUser.id);
                if (isSaved) {
                  await unsavePoem(poem.id, currentUser.id);
                  saveBtn.classList.remove('save-active');
                  utils.showToast(dom, 'Removed from saved');
                } else {
                  // Fetch collections to prompt user where to save
                  const collections = await fetchCollections(currentUser.id);
                  if (collections.length === 0) {
                    // No collections - prompt to create one
                    dom.modalMessage.innerHTML = `
                      <h3 style="margin-bottom:1rem;font-size:1.1rem;color:var(--text-primary);">Create your first collection</h3>
                      <p style="margin-bottom:1rem;color:var(--text-secondary);font-size:0.9rem;">Collections help organize your saved poems.</p>
                      <input id="new-collection-name" class="modern-input" type="text" placeholder="Collection name" style="width:100%;margin-bottom:0.75rem;padding:0.5rem 1rem;font-size:0.9rem;" />
                      <input id="new-collection-desc" class="modern-input" type="text" placeholder="Description (optional)" style="width:100%;margin-bottom:1rem;padding:0.5rem 1rem;font-size:0.9rem;" />`;
                    dom.modalActions.innerHTML = `
                      <button id="cancel-create-collection" class="action-btn action-btn-secondary" style="padding:0.4rem 1rem;font-size:0.85rem;">Save Unsorted</button>
                      <button id="confirm-create-collection" class="action-btn action-btn-primary" style="padding:0.4rem 1rem;font-size:0.85rem;">Create & Save</button>`;
                    dom.modalBg.classList.remove('hidden');
                    document.getElementById('new-collection-name')?.focus();
                    document.getElementById('cancel-create-collection')?.addEventListener('click', async () => {
                      utils.hideModal(dom);
                      await savePoem(poem.id, currentUser.id, null);
                      saveBtn.classList.add('save-active');
                      utils.showToast(dom, 'Saved to Unsorted');
                    });
                    document.getElementById('confirm-create-collection')?.addEventListener('click', async () => {
                      const name = document.getElementById('new-collection-name')?.value.trim();
                      if (!name) return;
                      const desc = document.getElementById('new-collection-desc')?.value.trim() || '';
                      try {
                        const newCol = await createCollection(currentUser.id, name, desc);
                        await savePoem(poem.id, currentUser.id, newCol.id);
                        saveBtn.classList.add('save-active');
                        utils.hideModal(dom);
                        utils.showToast(dom, `Saved to "${name}"`);
                      } catch (err) {
                        utils.showToast(dom, 'Failed to create collection: ' + (err.message || err), 3000, 'error');
                      }
                    });
                  } else {
                    // Collections exist - show selection
                    dom.modalMessage.innerHTML = `
                      <h3 style="margin-bottom:1rem;font-size:1.1rem;color:var(--text-primary);">Save to collection</h3>
                      <select id="collection-select" class="modern-input" style="width:100%;padding:0.5rem 1rem;font-size:0.9rem;margin-bottom:1rem;">
                        <option value="">Unsorted</option>
                        ${collections.map(c => `<option value="${c.id}">${utils.escapeHTML(c.name)}</option>`).join('')}
                      </select>`;
                    dom.modalActions.innerHTML = `
                      <button id="cancel-save" class="action-btn action-btn-secondary" style="padding:0.4rem 1rem;font-size:0.85rem;">Cancel</button>
                      <button id="confirm-save" class="action-btn action-btn-primary" style="padding:0.4rem 1rem;font-size:0.85rem;">Save</button>`;
                    dom.modalBg.classList.remove('hidden');
                    document.getElementById('collection-select')?.focus();
                    document.getElementById('cancel-save')?.addEventListener('click', () => utils.hideModal(dom));
                    document.getElementById('confirm-save')?.addEventListener('click', async () => {
                      const selectedId = document.getElementById('collection-select')?.value || null;
                      try {
                        await savePoem(poem.id, currentUser.id, selectedId);
                        saveBtn.classList.add('save-active');
                        utils.hideModal(dom);
                        const collectionName = selectedId ? collections.find(c => c.id === selectedId)?.name : 'Unsorted';
                        utils.showToast(dom, `Saved to ${collectionName}`);
                      } catch (err) {
                        utils.showToast(dom, 'Failed to save: ' + (err.message || err), 3000, 'error');
                      }
                    });
                  }
                }
              };
            })();
          });
        } else if (saveBtn) {
          saveBtn.onclick = () => utils.showModal(dom, 'Login to save poems!');
        }

        // Comments
        const commentsList = dom.app.querySelector(`#comments-list-${poem.id}`);
        const commentsSection = dom.app.querySelector(`#comments-section-${poem.id}`);
        const toggleCommentsBtn = dom.app.querySelector(`.toggle-comments-btn[data-id='${poem.id}']`);
        if (!commentsList || !commentsSection || !toggleCommentsBtn) return;

        let commentsVisible = false;
        async function renderComments() {
          const comments = await fetchComments(poem.id);
          commentsList.innerHTML = comments.map(c => `
            <li style="display:flex;flex-direction:column;gap:0.25rem;padding:0.5rem 0;border-bottom:1px solid var(--border-subtle);">
              <div style="font-size:0.7rem;color:var(--text-muted);">${utils.formatDate(c.created_at)}</div>
              <div style="display:flex;align-items:flex-start;gap:0.5rem;">
                <span style="flex:1;font-size:0.85rem;color:var(--text-secondary);">${utils.escapeHTML(c.comment_text)}</span>
              </div>
              ${currentUser && currentUser.id === c.user_id ? `
                <div style="display:flex;gap:0.5rem;margin-left:3rem;">
                  <button class="edit-comment-btn" style="font-size:0.7rem;color:var(--primary);background:none;border:none;cursor:pointer;" data-cid="${c.id}" data-pid="${poem.id}">Edit</button>
                  <button class="delete-comment-btn" style="font-size:0.7rem;color:var(--error);background:none;border:none;cursor:pointer;" data-cid="${c.id}" data-pid="${poem.id}">Delete</button>
                </div>` : ''}
            </li>`).join('');
          commentsList.querySelectorAll('.edit-comment-btn').forEach(btn => {
            btn.onclick = () => {
              const cid = btn.getAttribute('data-cid');
              const orig = comments.find(c => c.id === cid);
              if (!orig) return;
              const editDiv = document.createElement('div');
              editDiv.innerHTML = `<input class="edit-comment-input modern-input" value="${utils.escapeHTML(orig.comment_text)}" style="font-size:0.85rem;padding:0.4rem 0.75rem;margin:0.25rem 0;"/><div style="display:flex;gap:0.5rem;margin-top:0.25rem;"><button class="save-edit-btn action-btn action-btn-primary" style="padding:0.25rem 0.75rem;font-size:0.75rem;">Save</button><button class="cancel-edit-btn action-btn action-btn-secondary" style="padding:0.25rem 0.75rem;font-size:0.75rem;">Cancel</button></div>`;
              btn.parentElement.appendChild(editDiv);
              editDiv.querySelector('.save-edit-btn').onclick = async () => { const t = editDiv.querySelector('.edit-comment-input').value.trim(); if (t && t !== orig.comment_text) { await updateComment(cid, t); await renderComments(); } };
              editDiv.querySelector('.cancel-edit-btn').onclick = () => editDiv.remove();
            };
          });
          commentsList.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.onclick = async () => { await deleteComment(btn.getAttribute('data-cid')); await renderComments(); };
          });
          const countSpan = dom.app.querySelector(`#comments-count-${poem.id}`);
          if (countSpan) countSpan.textContent = comments.length;
        }
        toggleCommentsBtn.onclick = async () => { commentsVisible = !commentsVisible; commentsSection.classList.toggle('hidden', !commentsVisible); if (commentsVisible) await renderComments(); };
        const commentForm = dom.app.querySelector(`.comment-form[data-id='${poem.id}']`);
        if (commentForm) {
          commentForm.onsubmit = async (e) => {
            e.preventDefault();
            const input = commentForm.querySelector('.comment-input');
            const text = input.value.trim();
            if (!text) return;
            if (!currentUser || !currentUser.id) { utils.showModal(dom, 'Login to comment on poems!'); return; }
            await addComment({ poem_id: poem.id, user_id: currentUser.id, comment_text: text });
            input.value = '';
            await renderComments();
          };
        }
      });
    });
  });
}
