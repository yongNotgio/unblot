// views/discover.js
// Discover view with smart sorting: recent poems first, then randomized
import { fetchPoemsWithSmartSort } from '../poems.js';
import { utils } from '../utils.js';

export async function renderDiscover(dom) {
  // Get search query from location hash if present
  let search = '';
  if (window.location.hash.startsWith('#discover?q=')) {
    const q = window.location.hash.split('=')[1];
    if (q) search = decodeURIComponent(q);
  }
  
  dom.app.innerHTML = `<div class="text-center text-lg">Loading poems...</div>`;
  utils.showLoading(dom, true);
  
  try {
    const poems = await fetchPoemsWithSmartSort(null, { search }); // Use smart sorting for discover
    
    let html = `<div class="w-full max-w-2xl mx-auto">
      <div class="font-bold text-2xl mb-4 text-center">Discover Poems</div>
      <ul class="grid gap-6">`;
      
    if (poems.length === 0) {
      html += `<li class="text-center text-gray-500">No poems found. Be the first to share!</li>`;
    } else {
      html += poems.map(poem => {
        const content = utils.escapeHTML(poem.content);
        const isLong = content.length > 500;
        let shortContent = content;
        if (isLong) {
          shortContent = content.slice(0, 500);
        }
        return `
        <li class="p-6 bg-white rounded-lg shadow flex flex-col gap-2" data-poem-id="${poem.id}">
          <div class="flex justify-between items-center mb-1">
          <a href="#view-poem/${poem.id}" class="poem-title-link text-xl font-semibold text-blue-700 hover:underline focus:underline" style="cursor:pointer;" data-poem-id="${poem.id}">${utils.escapeHTML(poem.title)}</a>
          <div class="text-xs text-gray-400">${utils.formatDate(poem.created_at)}</div>
          </div>
          <div class="text-xs text-gray-400 mb-2">By: <span class="font-mono">Anonymous</span></div>
          <div class="text-gray-700 mb-2 poem-content" data-id="${poem.id}" style="font-family: 'Quicksand', sans-serif; font-size: 1.15rem; line-height: 1.7;">
            <span style="white-space: pre-line;">${shortContent}${isLong ? '... ' : ''}${isLong ? `<button class=\"see-more-btn text-blue-600 ml-0\" data-id=\"${poem.id}\" style=\"font-family: 'Quicksand', sans-serif; font-size: 1.15rem; line-height: 1.7; border:none;background:none;padding:0;\">see more</button>` : ''}</span>
          </div>
          <div class="mb-4 text-sm text-gray-500">Tags: ${utils.tagsToString(poem.tags)}</div>
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
      `;
      }).join('');
    }
    
    html += `</ul></div>`;
    dom.app.innerHTML = html;

    // Add click handler to poem title links
    setTimeout(() => {
      const links = dom.app.querySelectorAll('.poem-title-link');
      links.forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const poemId = link.getAttribute('data-poem-id');
          window.location.hash = '#view-poem/' + poemId;
        });
      });
      
      // See more functionality
      dom.app.querySelectorAll('.see-more-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
          const id = btn.getAttribute('data-id');
          const poem = poems.find(p => p.id == id);
          if (!poem) return;
          const contentDiv = dom.app.querySelector(`.poem-content[data-id='${id}']`);
          if (contentDiv) {
            contentDiv.innerHTML = `<span style="white-space: pre-line;">${utils.escapeHTML(poem.content)}</span>`;
            contentDiv.style.fontFamily = "'Quicksand', sans-serif";
            contentDiv.style.fontSize = "1.15rem";
            contentDiv.style.lineHeight = "1.7";
          }
        });
      });
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
                  likeBtn.classList.remove('bg-gray-200', 'text-gray-800');
                  likeBtn.classList.add('bg-pink-600', 'text-white');
                } else {
                  likeBtn.classList.remove('bg-pink-600', 'text-white');
                  likeBtn.classList.add('bg-gray-200', 'text-gray-800');
                }
                likeBtn.onclick = async () => {
                  const isLiked = await hasUserLiked(poem.id, currentUser.id);
                  if (isLiked) {
                    await unlikePoem(poem.id, currentUser.id);
                    likeBtn.classList.remove('bg-pink-600', 'text-white');
                    likeBtn.classList.add('bg-gray-200', 'text-gray-800');
                  } else {
                    await likePoem(poem.id, currentUser.id);
                    likeBtn.classList.remove('bg-gray-200', 'text-gray-800');
                    likeBtn.classList.add('bg-pink-600', 'text-white');
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
