// views/viewPoem.js
// Single poem view
import { fetchPoemById, deletePoem, incrementPoemViews, recordPoemView } from '../poems.js';
import { fetchComments, addComment } from '../comments.js';
import { fetchLikeCount, hasUserLiked, likePoem, unlikePoem } from '../likes.js';
import { currentUser } from '../auth.js';
import { utils } from '../utils.js';
import { navigate } from '../router.js';

export async function renderViewPoem(dom, poemId) {
  dom.app.innerHTML = `<div class="text-center text-lg">Loading poem...</div>`;
  utils.showLoading(dom, true);
  try {
    // Fetch poem, increment views, likes, comments
    const poem = await fetchPoemById(poemId);
    if (!poem) throw new Error('Poem not found');
    await incrementPoemViews(poemId);
    // Record view for history tracking (fire and forget)
    if (currentUser) recordPoemView(poemId, currentUser.id).catch(() => {});
    const [likeCount, comments] = await Promise.all([
      fetchLikeCount(poemId),
      fetchComments(poemId)
    ]);
    let userLiked = false;
    if (currentUser) userLiked = await hasUserLiked(poemId, currentUser.id);
    // Render poem
    let html = `<article class="poem-card max-w-2xl mx-auto animate-fade-in" data-poem-id="${poemId}">
      <header class="flex justify-between items-start mb-4">
        <h1 class="poem-title-link text-2xl md:text-3xl" style="font-weight: 700; max-width: 80%;">${utils.escapeHTML(poem.title)}</h1>
        <span class="date-text">${utils.formatDate(poem.created_at)}</span>
      </header>
      
      <div class="flex items-center gap-4 mb-6">
        <div class="author-badge">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Anonymous
        </div>
        <div class="flex items-center gap-1" style="font-size: 0.75rem; color: var(--text-muted);">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          ${poem.views_count + 1} views
        </div>
      </div>
      
      <div class="poem-content mb-6" id="poem-content-${poemId}" style="font-size: 1.15rem; line-height: 1.9;">
        <span style="white-space: pre-line;">
          ${utils.escapeHTML(poem.content).length > 500
            ? utils.escapeHTML(poem.content).slice(0, 500) + `... <button class='see-more-btn' data-id='${poemId}' style='color: var(--primary); font-weight: 600; border: none; background: none; padding: 0; cursor: pointer; font-size: 0.875rem;'>see more</button>`
            : utils.escapeHTML(poem.content)
          }
        </span>
      </div>

      ${poem.image ? `<div class="card-poem-image" style="margin-bottom: 1.5rem; aspect-ratio: ${poem.aspect_ratio ? poem.aspect_ratio.replace(':', '/') : '4/3'};"><img src="${poem.image}" alt="Poem image" /></div>` : ''}
      
      ${poem.prompt_date ? `<div style="margin-bottom: 0.75rem;">${utils.promptDayTag(poem.prompt_date, poem.prompt_title)}</div>` : ''}
      <div class="flex flex-wrap gap-2 mb-6">
        ${utils.tagsToString(poem.tags).split(', ').filter(t => t && t !== 'None').map(tag => `<span class="tag-pill">${tag}</span>`).join('')}
      </div>
      
      <footer class="flex items-center gap-2 pt-6 mb-6" style="border-top: 1px solid var(--border);">
        <button id="like-btn" class="action-btn-minimal ${userLiked ? 'liked' : ''}" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.75rem; background: none; border: none; color: ${userLiked ? '#ef4444' : 'var(--text-muted)'}; cursor: pointer; border-radius: 20px; transition: all 0.2s;">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <span style="font-size: 0.875rem;">${likeCount}</span>
        </button>
        <button id="toggle-comments-btn" class="action-btn-minimal" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.75rem; background: none; border: none; color: var(--text-muted); cursor: pointer; border-radius: 20px; transition: all 0.2s;">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          <span style="font-size: 0.875rem;">${comments.length}</span>
        </button>
        <button id="share-btn" class="action-btn-minimal" title="Share" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.75rem; background: none; border: none; color: var(--text-muted); cursor: pointer; border-radius: 20px; transition: all 0.2s;">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>
        <button id="save-poem-btn" class="action-btn-minimal save-btn" title="Save to collection" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.75rem; background: none; border: none; color: var(--text-muted); cursor: pointer; border-radius: 20px; transition: all 0.2s;">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
        ${(currentUser && currentUser.id === poem.user_id) ? `
          <button id="edit-btn" class="action-btn-minimal" title="Edit" style="display: inline-flex; align-items: center; padding: 0.5rem 0.75rem; background: none; border: none; color: var(--text-muted); cursor: pointer; border-radius: 20px; transition: all 0.2s;">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button id="delete-btn" class="action-btn-minimal" title="Delete" style="display: inline-flex; align-items: center; padding: 0.5rem 0.75rem; background: none; border: none; color: var(--text-muted); cursor: pointer; border-radius: 20px; transition: all 0.2s;">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        ` : ''}
      </footer>
      
      <div id="comments-section" class="comments-section hidden" style="margin-top: 1rem;">
        <ul class="comments-list" id="comments-list-${poemId}" style="margin-bottom: 1rem;">
            ${comments.map(c => `
              <li class="flex flex-col gap-1 py-3" style="border-bottom: 1px solid var(--border);">
                <div class="flex items-center gap-2">
                  <span class="date-text">${utils.formatDate(c.created_at)}</span>
                </div>
                <div style="color: var(--text-primary); font-size: 0.9rem; line-height: 1.5; margin-top: 0.5rem;">${utils.escapeHTML(c.comment_text)}</div>
                ${(currentUser && currentUser.id === c.user_id) ? `
                  <div class="flex gap-2 mt-2">
                    <button class="edit-comment-btn" data-cid="${c.id}" data-pid="${poemId}" style="font-size: 0.75rem; color: var(--primary); font-weight: 600; background: none; border: none; cursor: pointer;">Edit</button>
                    <button class="delete-comment-btn" data-cid="${c.id}" data-pid="${poemId}" style="font-size: 0.75rem; color: #ef4444; font-weight: 600; background: none; border: none; cursor: pointer;">Delete</button>
                  </div>
                ` : ''}
              </li>
            `).join('')}
          </ul>
          <form id="comment-form" class="flex gap-2 mt-4">
            <input id="comment-input" class="comment-input modern-input flex-1" placeholder="Share your thoughts..." required style="padding: 0.625rem 1rem; font-size: 0.875rem;" ${!currentUser ? 'disabled' : ''} />
            <button type="submit" id="comment-post-btn" class="action-btn action-btn-primary" ${!currentUser ? 'disabled' : ''}>Post</button>
          </form>
          ${!currentUser ? '<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.75rem; text-align: center;">Login to comment.</p>' : ''}
        </div>
    </article>`;
    dom.app.innerHTML = html;

    // Prompt day tag click handler
    const promptTag = dom.app.querySelector('.prompt-day-tag');
    if (promptTag) {
      promptTag.addEventListener('click', (e) => {
        e.stopPropagation();
        utils.showPromptDetails(dom, promptTag.dataset.promptDate);
      });
    }

    // Image lightbox click handler
    const poemImageEl = dom.app.querySelector('.card-poem-image');
    if (poemImageEl) {
      poemImageEl.addEventListener('click', () => {
        const img = poemImageEl.querySelector('img');
        if (img && img.src) utils.openImageLightbox(img.src);
      });
    }
    
    // See more functionality
    const seeMoreBtn = dom.app.querySelector('.see-more-btn');
    if (seeMoreBtn) {
      seeMoreBtn.addEventListener('click', function(e) {
        const id = seeMoreBtn.getAttribute('data-id');
        const contentDiv = dom.app.querySelector(`#poem-content-${id} span`);
        if (contentDiv) {
          contentDiv.innerHTML = utils.escapeHTML(poem.content);
          contentDiv.style.whiteSpace = 'pre-line';
        }
      });
    }
    
    // Like button
    document.getElementById('like-btn').onclick = async () => {
      if (!currentUser) return utils.showModal(dom, 'Login to like poems!');
      try {
        if (userLiked) {
          await unlikePoem(poemId, currentUser.id);
        } else {
          await likePoem(poemId, currentUser.id);
        }
        renderViewPoem(dom, poemId); // Refresh
      } catch (err) {
        utils.showModal(dom, 'Failed to update like: ' + (err.message || err));
      }
    };
    // Share button
    let exportPoemAsImage;
    import('../utils/imageExport.js').then(mod => { exportPoemAsImage = mod.exportPoemAsImage; });
    document.getElementById('share-btn').onclick = () => {
      const url = window.location.origin + '/#view-poem/' + poemId;
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
          onClick: () => {
            if (exportPoemAsImage) {
              exportPoemAsImage(poem);
              utils.hideModal(dom);
            }
          }
        }
      ]);
    };
    // Save/bookmark button
    const savePoemBtn = document.getElementById('save-poem-btn');
    if (savePoemBtn && currentUser) {
      import('../poems.js').then(({ hasUserSaved, savePoem: savePoemFn, unsavePoem: unsavePoemFn, fetchCollections, createCollection }) => {
        (async () => {
          const saved = await hasUserSaved(poemId, currentUser.id);
          if (saved) savePoemBtn.classList.add('save-active');
          savePoemBtn.onclick = async () => {
            const isSaved = await hasUserSaved(poemId, currentUser.id);
            if (isSaved) {
              await unsavePoemFn(poemId, currentUser.id);
              savePoemBtn.classList.remove('save-active');
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
                  await savePoemFn(poemId, currentUser.id, null);
                  savePoemBtn.classList.add('save-active');
                  utils.showToast(dom, 'Saved to Unsorted');
                });
                document.getElementById('confirm-create-collection')?.addEventListener('click', async () => {
                  const name = document.getElementById('new-collection-name')?.value.trim();
                  if (!name) return;
                  const desc = document.getElementById('new-collection-desc')?.value.trim() || '';
                  try {
                    const newCol = await createCollection(currentUser.id, name, desc);
                    await savePoemFn(poemId, currentUser.id, newCol.id);
                    savePoemBtn.classList.add('save-active');
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
                    await savePoemFn(poemId, currentUser.id, selectedId);
                    savePoemBtn.classList.add('save-active');
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
    } else if (savePoemBtn) {
      savePoemBtn.onclick = () => utils.showModal(dom, 'Login to save poems!');
    }
    // Edit/Delete buttons
    if (currentUser && currentUser.id === poem.user_id) {
      document.getElementById('edit-btn').onclick = () => navigate(`/edit-poem/${poemId}`);
      document.getElementById('delete-btn').onclick = () => {
        utils.showModal(dom, 'Are you sure you want to delete this poem?', [
          { label: 'Cancel', className: 'action-btn action-btn-secondary' },
          { label: 'Delete', className: 'action-btn' + ' bg-red-600 text-white', onClick: async () => {
            try {
              await deletePoem(poemId);
              utils.showToast(dom, 'Poem deleted!');
              setTimeout(() => navigate('/my-poems'), 1000);
            } catch (err) {
              utils.showModal(dom, 'Failed to delete poem: ' + (err.message || err));
            }
          }}
        ]);
      };
    }
    // Toggle comments logic: prevent expanding for logged out users
    const commentsSection = document.getElementById('comments-section');
    const toggleCommentsBtn = document.getElementById('toggle-comments-btn');
    if (toggleCommentsBtn) {
      toggleCommentsBtn.onclick = () => {
        if (!currentUser) {
          utils.showModal(dom, 'Login to comment on poems!');
          return;
        }
        commentsSection.classList.toggle('hidden');
      };
    }
    // Always start collapsed when rendering
    commentsSection.classList.add('hidden');
    // Comment form and edit/delete logic
    const commentsList = document.getElementById(`comments-list-${poemId}`);
    const commentForm = document.getElementById('comment-form');
    const commentInput = document.getElementById('comment-input');
    const commentPostBtn = document.getElementById('comment-post-btn');
    if (commentInput) {
      commentInput.addEventListener('focus', function(e) {
        if (!currentUser) {
          e.preventDefault();
          commentInput.blur();
          utils.showModal(dom, 'Login to comment on poems!');
        }
      });
    }
    if (commentForm) {
      commentForm.onsubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
          utils.showModal(dom, 'Login to comment on poems!');
          return;
        }
        const text = commentInput.value.trim();
        if (!text) return;
        try {
          await addComment({ poem_id: poemId, user_id: currentUser.id, comment_text: text });
          renderViewPoem(dom, poemId); // Refresh
        } catch (err) {
          utils.showModal(dom, 'Failed to add comment: ' + (err.message || err));
        }
      };
    }
    // Edit/Delete comment logic
    if (commentsList) {
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
              // You need to import updateComment from comments.js if not already
              const { updateComment } = await import('../comments.js');
              await updateComment(cid, newText);
              renderViewPoem(dom, poemId); // Refresh
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
          // You need to import deleteComment from comments.js if not already
          const { deleteComment } = await import('../comments.js');
          await deleteComment(cid);
          renderViewPoem(dom, poemId); // Refresh
        };
      });
    }
  } catch (err) {
    dom.app.innerHTML = `<div class="text-center text-red-600">Failed to load poem: ${err.message || err}</div>`;
  } finally {
    utils.showLoading(dom, false);
  }
}