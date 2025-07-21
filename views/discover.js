// views/discover.js
// Discover tab: shows all poems from all users, with like and comment features
import { fetchPoems } from '../poems.js';
import { fetchLikeCount, hasUserLiked, likePoem, unlikePoem } from '../likes.js';
import { fetchComments, addComment } from '../comments.js';
import { currentUser } from '../auth.js';
import { utils } from '../utils.js';

export async function renderDiscover(dom) {
  dom.app.innerHTML = `<div class="text-center text-lg">Loading poems...</div>`;
  utils.showLoading(dom, true);
  try {
    const poems = await fetchPoems(); // Fetch all poems
    let html = `<div class="w-full max-w-2xl mx-auto">
      <div class="font-bold text-2xl mb-4 text-center">Discover</div>
      <ul class="grid gap-6">`;
    if (poems.length === 0) {
      html += `<li class="text-center text-gray-500">No poems found. Be the first to share!</li>`;
    } else {
      html += poems.map(poem => `
        <li class="p-6 bg-white rounded-lg shadow flex flex-col gap-2" data-poem-id="${poem.id}">
          <div class="flex justify-between items-center mb-1">
            <div class="text-xl font-semibold text-blue-700">${utils.escapeHTML(poem.title)}</div>
            <div class="text-xs text-gray-400">${utils.formatDate(poem.created_at)}</div>
          </div>
          <div class="text-xs text-gray-400 mb-2">By: <span class="font-mono">${poem.user_id.slice(0, 8)}</span></div>
          <div class="text-gray-700 whitespace-pre-line mb-2">${utils.escapeHTML(poem.content)}</div>
          <div class="flex gap-2 mb-2">
            <button class="like-btn rounded px-2 py-1 text-sm font-semibold bg-gray-200 text-gray-800" data-id="${poem.id}">❤️ Like</button>
            <span class="like-count text-xs text-gray-600" id="like-count-${poem.id}"></span>
            <button class="toggle-comments-btn nav-btn px-2 py-1 text-xs" data-id="${poem.id}">💬 Comments <span class="comments-count" id="comments-count-${poem.id}"></span></button>
            <button class="share-btn nav-btn px-2 py-1 text-xs" data-id="${poem.id}">🔗 Share</button>
          </div>
          <div class="comments-section mt-2 hidden" id="comments-section-${poem.id}">
            <div class="font-semibold text-sm text-blue-900 mb-1">Comments</div>
            <ul class="comments-list text-sm mb-2" id="comments-list-${poem.id}"></ul>
            <form class="comment-form flex gap-2" data-id="${poem.id}">
              <input type="text" class="comment-input flex-1 rounded border px-2 py-1 text-sm" placeholder="Add a comment..." required />
              <button type="submit" class="nav-btn px-2 py-1 text-xs">Post</button>
            </form>
          </div>
        </li>
      `).join('');
    }
    html += `</ul></div>`;
    dom.app.innerHTML = html;
    // Like, comment, and share logic (mirroring home.js)
    let exportPoemAsImage;
    import('../utils/imageExport.js').then(mod => { exportPoemAsImage = mod.exportPoemAsImage; });
    import('../auth.js').then(({ currentUser }) => {
      import('../comments.js').then(({ fetchComments, addComment, deleteComment, updateComment }) => {
        poems.forEach(async poem => {
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
                  utils.hideModal(dom);
                  setTimeout(async () => {
                    if (exportPoemAsImage) await exportPoemAsImage(poem.id);
                  }, 300);
                }
              }
            ]);
          };

          // Like and comment logic
          // Like button
          const likeBtn = dom.app.querySelector(`.like-btn[data-id='${poem.id}']`);
          if (currentUser) {
            likeBtn.onclick = async () => {
              // Implement like/unlike logic as in home.js if needed
            };
          } else {
            likeBtn.onclick = () => alert('Login to like poems!');
          }

          // Fetch and render comments
          const commentsList = dom.app.querySelector(`#comments-list-${poem.id}`);
          const commentsSection = dom.app.querySelector(`#comments-section-${poem.id}`);
          const toggleCommentsBtn = dom.app.querySelector(`.toggle-comments-btn[data-id='${poem.id}']`);
          let commentsVisible = false;
          let comments = [];
          async function renderComments() {
            comments = await fetchComments(poem.id);
            commentsList.innerHTML = comments.map(c => `
              <li class="flex items-start gap-2 py-1">
                <span class="font-semibold">${c.user_id.slice(0,8)}</span>: <span class="flex-1">${utils.escapeHTML(c.comment_text)}</span>
                <span class="text-xs text-gray-400">${utils.formatDate(c.created_at)}</span>
                ${currentUser && currentUser.id === c.user_id ? `
                  <button class="edit-comment-btn text-xs text-blue-600 underline" data-cid="${c.id}" data-pid="${poem.id}">Edit</button>
                  <button class="delete-comment-btn text-xs text-red-600 underline" data-cid="${c.id}" data-pid="${poem.id}">Delete</button>
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
              await addComment({ poem_id: poem.id, user_id: currentUser.id, comment_text: text });
              input.value = '';
              await renderComments();
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
