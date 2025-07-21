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
        <li class="p-6 bg-white rounded-lg shadow flex flex-col gap-2">
          <div class="flex justify-between items-center mb-1">
            <div class="text-xl font-semibold text-blue-700">${utils.escapeHTML(poem.title)}</div>
            <div class="text-xs text-gray-400">${utils.formatDate(poem.created_at)}</div>
          </div>
          <div class="text-xs text-gray-400 mb-2">By: <span class="font-mono">${poem.user_id.slice(0, 8)}</span></div>
          <div class="text-gray-700 whitespace-pre-line mb-2">${utils.escapeHTML(poem.content)}</div>
          <div class="flex gap-2 mb-2">
            <button class="like-btn rounded-lg px-4 py-2 font-semibold bg-gray-200 text-gray-800" data-id="${poem.id}">❤️ Like</button>
            <span class="like-count text-sm text-gray-600" id="like-count-${poem.id}"></span>
            <button class="toggle-comments-btn nav-btn px-3 py-1 text-xs" data-id="${poem.id}">💬 Comments <span class="comments-count" id="comments-count-${poem.id}"></span></button>
          </div>
          <div class="comments-section mt-2 hidden" id="comments-section-${poem.id}">
            <div class="font-semibold text-sm text-blue-900 mb-1">Comments</div>
            <ul class="comments-list text-sm mb-2" id="comments-list-${poem.id}"></ul>
            <form class="comment-form flex gap-2" data-id="${poem.id}">
              <input type="text" class="comment-input flex-1 rounded border px-2 py-1" placeholder="Add a comment..." required />
              <button type="submit" class="nav-btn">Post</button>
            </form>
          </div>
        </li>
      `).join('');
    }
    html += `</ul></div>`;
    dom.app.innerHTML = html;
    // Like and comment logic
    poems.forEach(async poem => {
      // Like count
      const likeCount = await fetchLikeCount(poem.id);
      document.getElementById(`like-count-${poem.id}`).textContent = `(${likeCount})`;
      // Like button
      const likeBtn = dom.app.querySelector(`.like-btn[data-id='${poem.id}']`);
      if (currentUser) {
        const liked = await hasUserLiked(poem.id, currentUser.id);
        if (liked) {
          likeBtn.classList.remove('bg-gray-200', 'text-gray-800');
          likeBtn.classList.add('bg-pink-600', 'text-white');
        }
        likeBtn.onclick = async () => {
          if (await hasUserLiked(poem.id, currentUser.id)) {
            await unlikePoem(poem.id, currentUser.id);
            likeBtn.classList.remove('bg-pink-600', 'text-white');
            likeBtn.classList.add('bg-gray-200', 'text-gray-800');
          } else {
            await likePoem(poem.id, currentUser.id);
            likeBtn.classList.remove('bg-gray-200', 'text-gray-800');
            likeBtn.classList.add('bg-pink-600', 'text-white');
          }
          const newCount = await fetchLikeCount(poem.id);
          document.getElementById(`like-count-${poem.id}`).textContent = `(${newCount})`;
        };
      } else {
        likeBtn.onclick = () => alert('Login to like poems!');
      }
      // Comments (collapsible)
      const commentsSection = dom.app.querySelector(`#comments-section-${poem.id}`);
      const toggleBtn = dom.app.querySelector(`.toggle-comments-btn[data-id='${poem.id}']`);
      toggleBtn.onclick = () => {
        commentsSection.classList.toggle('hidden');
      };
      async function renderComments() {
        const commentsList = dom.app.querySelector(`#comments-list-${poem.id}`);
        const comments = await fetchComments(poem.id);
        // Update comments count
        const commentsCount = dom.app.querySelector(`#comments-count-${poem.id}`);
        if (commentsCount) commentsCount.textContent = `(${comments.length})`;
        commentsList.innerHTML = comments.map(c => {
          const isOwner = currentUser && c.user_id === currentUser.id;
          return `<li class="mb-1 flex items-center gap-2" data-comment-id="${c.id}">
            <span class="font-semibold">${c.user_id.slice(0,8)}</span>: 
            <span class="comment-text">${utils.escapeHTML(c.content)}</span>
            <span class="text-xs text-gray-400">${utils.formatDate(c.created_at)}</span>
            ${isOwner ? `<button class="edit-comment-btn text-blue-600 text-xs" data-id="${c.id}">Edit</button><button class="delete-comment-btn text-red-600 text-xs" data-id="${c.id}">Delete</button>` : ''}
          </li>`;
        }).join('');
        // Edit comment
        commentsList.querySelectorAll('.edit-comment-btn').forEach(btn => {
          btn.onclick = () => {
            const li = btn.closest('li');
            const textSpan = li.querySelector('.comment-text');
            const oldText = textSpan.textContent;
            textSpan.innerHTML = `<input type='text' class='edit-comment-input border rounded px-1 py-0.5 text-xs' value="${oldText}"> <button class='save-edit-btn text-green-600 text-xs'>Save</button> <button class='cancel-edit-btn text-gray-400 text-xs'>Cancel</button>`;
            li.querySelector('.save-edit-btn').onclick = async () => {
              const newText = li.querySelector('.edit-comment-input').value.trim();
              if (!newText) return;
              await window.supabase.from('comments').update({ content: newText }).eq('id', btn.dataset.id);
              await renderComments();
            };
            li.querySelector('.cancel-edit-btn').onclick = () => renderComments();
          };
        });
        // Delete comment
        commentsList.querySelectorAll('.delete-comment-btn').forEach(btn => {
          btn.onclick = async () => {
            if (!confirm('Delete this comment?')) return;
            await window.supabase.from('comments').delete().eq('id', btn.dataset.id);
            await renderComments();
          };
        });
      }
      await renderComments();
      // Comment form
      const commentForm = dom.app.querySelector(`.comment-form[data-id='${poem.id}']`);
      commentForm.onsubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return alert('Login to comment!');
        const input = commentForm.querySelector('.comment-input');
        const content = input.value.trim();
        if (!content) return;
        await addComment({ poem_id: poem.id, user_id: currentUser.id, comment_text: content });
        input.value = '';
        await renderComments();
      };
    });
  } catch (err) {
    dom.app.innerHTML = `<div class="text-center text-red-600">Failed to load poems: ${err.message || err}</div>`;
  } finally {
    utils.showLoading(dom, false);
  }
}
