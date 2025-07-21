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
    let html = `<div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <div class="flex justify-between items-center mb-2">
        <div class="text-2xl font-bold">${utils.escapeHTML(poem.title)}</div>
        <div class="text-xs text-gray-400">${utils.formatDate(poem.created_at)}</div>
      </div>
      <div class="mb-2 text-gray-600">Views: ${poem.views_count + 1}</div>
      <div class="mb-4 whitespace-pre-wrap">${utils.escapeHTML(poem.content)}</div>
      <div class="mb-4 text-sm text-gray-500">${utils.tagsToString(poem.tags)}</div>
      <div class="flex gap-2 mb-4">
        <button id="like-btn" class="rounded-lg px-4 py-2 font-semibold ${userLiked ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-800'}">❤️ Like (${likeCount})</button>
        <button id="share-btn" class="rounded-lg px-4 py-2 font-semibold bg-blue-200 text-blue-800">🔗 Share</button>
        ${(currentUser && currentUser.id === poem.user_id) ? `
          <button id="edit-btn" class="rounded-lg px-4 py-2 font-semibold bg-yellow-200 text-yellow-800">Edit</button>
          <button id="delete-btn" class="rounded-lg px-4 py-2 font-semibold bg-red-200 text-red-800">Delete</button>
        ` : ''}
      </div>
      <div class="mb-4">
        <div class="font-bold mb-2">Comments (${comments.length})</div>
        <ul class="divide-y mb-2">
          ${comments.map(c => `<li class="py-2"><span class="font-semibold">${c.user_id.slice(0, 8)}</span>: ${utils.escapeHTML(c.comment_text)} <span class="text-xs text-gray-400">${utils.formatDate(c.created_at)}</span></li>`).join('')}
        </ul>
        ${currentUser ? `
          <form id="comment-form" class="flex gap-2 mt-2">
            <input id="comment-input" class="flex-1 rounded-lg border px-3 py-2" placeholder="Add a comment..." required />
            <button type="submit" class="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold">Post</button>
          </form>
        ` : '<div class="text-gray-500">Login to comment.</div>'}
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
    // Comment form
    if (currentUser) {
      const commentForm = document.getElementById('comment-form');
      if (commentForm) {
        commentForm.onsubmit = async (e) => {
          e.preventDefault();
          const text = document.getElementById('comment-input').value.trim();
          if (!text) return;
          try {
            await addComment({ poem_id: poemId, user_id: currentUser.id, comment_text: text });
            renderViewPoem(dom, poemId); // Refresh
          } catch (err) {
            utils.showModal(dom, 'Failed to add comment: ' + (err.message || err));
          }
        };
      }
    }
  } catch (err) {
    dom.app.innerHTML = `<div class="text-center text-red-600">Failed to load poem: ${err.message || err}</div>`;
  } finally {
    utils.showLoading(dom, false);
  }
} 