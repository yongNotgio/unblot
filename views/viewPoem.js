// views/viewPoem.js
// Single poem view
import { fetchPoemById, deletePoem, incrementPoemViews } from '../poems.js';
import { fetchComments, addComment } from '../comments.js';
import { fetchLikeCount, hasUserLiked, likePoem, unlikePoem } from '../likes.js';
import { currentUser } from '../auth.js';
import { utils } from '../utils.js';

export async function renderViewPoem(dom, poemId) {
  dom.app.innerHTML = `<div class="text-center text-lg">Loading poem...</div>`;
  utils.showLoading(dom, true);
  try {
    // Fetch poem, increment views, likes, comments
    const poem = await fetchPoemById(poemId);
    if (!poem) throw new Error('Poem not found');
    await incrementPoemViews(poemId);
    const [likeCount, comments] = await Promise.all([
      fetchLikeCount(poemId),
      fetchComments(poemId)
    ]);
    let userLiked = false;
    if (currentUser) userLiked = await hasUserLiked(poemId, currentUser.id);
    // Render poem
    let html = `<div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow" data-poem-id="${poemId}">
      <div class="flex justify-between items-center mb-2">
        <div class="text-2xl font-bold poem-title-link" style="font-family: 'Quicksand', sans-serif;">${utils.escapeHTML(poem.title)}</div>
        <div class="text-xs text-gray-400">${utils.formatDate(poem.created_at)}</div>
      </div>
      <div class="mb-2 text-gray-600">Views: ${poem.views_count + 1}</div>
      <div class="mb-4 whitespace-pre-wrap poem-content" id="poem-content-${poemId}" style="font-family: 'Quicksand', sans-serif; font-size: 1.15rem; line-height: 1.7;">
        <span style="white-space: pre-line;">
          ${utils.escapeHTML(poem.content).length > 500
            ? utils.escapeHTML(poem.content).slice(0, 500) + '... <button class=\'see-more-btn text-blue-600 ml-0\' data-id=\'' + poemId + '\' style=\'font-family: Quicksand, sans-serif; font-size: 1.15rem; line-height: 1.7; border:none;background:none;padding:0;\'>see more</button>'
            : utils.escapeHTML(poem.content)
          }
        </span>
      </div>
      <div class="mb-4 text-sm text-gray-500">Tags: ${utils.tagsToString(poem.tags)}</div>
      <div class="flex gap-2 mb-4">
        <button id="like-btn" class="rounded-lg px-4 py-2 font-semibold ${userLiked ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-800'}">❤️ Like (${likeCount})</button>
        <button id="share-btn" class="rounded-lg px-4 py-2 font-semibold bg-blue-200 text-blue-800">🔗 Share</button>
        ${(currentUser && currentUser.id === poem.user_id) ? `
          <button id="edit-btn" class="rounded-lg px-4 py-2 font-semibold bg-yellow-200 text-yellow-800">Edit</button>
          <button id="delete-btn" class="rounded-lg px-4 py-2 font-semibold bg-red-200 text-red-800">Delete</button>
        ` : ''}
      </div>
      <div class="mb-4">
        <button id="toggle-comments-btn" class="nav-btn mb-2">💬 Comments (${comments.length})</button>
        <div id="comments-section" class="hidden">
          <ul class="comments-list text-sm mb-2" id="comments-list-${poemId}">
            ${comments.map(c => `
              <li class="flex flex-col gap-1 py-2">
                <div class="text-xs text-gray-400">${utils.formatDate(c.created_at)}</div>
                <div class="flex items-start gap-2">
                  <span class="font-semibold">${c.user_id.slice(0, 8)}</span>:
                  <span class="flex-1">${utils.escapeHTML(c.comment_text)}</span>
                </div>
                ${(currentUser && currentUser.id === c.user_id) ? `
                  <div class="flex gap-2 pl-20">
                    <button class="edit-comment-btn text-xs text-blue-800" data-cid="${c.id}" data-pid="${poemId}">Edit</button>
                    <button class="delete-comment-btn text-xs text-red-800" data-cid="${c.id}" data-pid="${poemId}">Delete</button>
                  </div>
                ` : ''}
              </li>
            `).join('')}
          </ul>
          <form id="comment-form" class="flex gap-2 mt-2">
            <input id="comment-input" class="comment-input flex-1 rounded border px-2 py-1 text-sm" placeholder="Add a comment..." required ${!currentUser ? 'disabled' : ''} />
            <button type="submit" id="comment-post-btn" class="nav-btn px-2 py-1 text-xs" ${!currentUser ? 'disabled' : ''}>Post</button>
          </form>
          ${!currentUser ? '<div class="text-gray-500">Login to comment.</div>' : ''}
        </div>
      </div>
    </div>`;
    dom.app.innerHTML = html;
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
          onClick: async () => {
            utils.hideModal(dom);
            setTimeout(async () => {
              if (exportPoemAsImage) await exportPoemAsImage(poemId);
            }, 300);
          }
        }
      ]);
    };
    // Edit/Delete buttons
    if (currentUser && currentUser.id === poem.user_id) {
      document.getElementById('edit-btn').onclick = () => window.location.hash = `#edit-poem/${poemId}`;
      document.getElementById('delete-btn').onclick = () => {
        utils.showModal(dom, 'Are you sure you want to delete this poem?', [
          { label: 'Cancel', className: 'bg-gray-300 text-gray-800' },
          { label: 'Delete', className: 'bg-red-600 text-white', onClick: async () => {
            try {
              await deletePoem(poemId);
              utils.showToast(dom, 'Poem deleted!');
              setTimeout(() => window.location.hash = '#my-poems', 1000);
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