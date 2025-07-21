// views/editPoem.js
// Edit poem view
import { fetchPoemById, updatePoem } from '../poems.js';
import { currentUser } from '../auth.js';
import { utils } from '../utils.js';

export async function renderEditPoem(dom, poemId) {
  dom.app.innerHTML = `<div class="text-center text-lg">Loading poem...</div>`;
  utils.showLoading(dom, true);
  try {
    const poem = await fetchPoemById(poemId);
    if (!poem) throw new Error('Poem not found');
    if (!currentUser || currentUser.id !== poem.user_id) {
      dom.app.innerHTML = `<div class="text-center text-lg">You are not authorized to edit this poem.</div>`;
      return;
    }
    dom.app.innerHTML = `
      <form id="edit-poem-form" class="cozy-card flex flex-col gap-4" style="max-width: 480px; margin: 0 auto;">
        <h2 class="text-2xl font-bold mb-2 text-center" style="font-family: 'EB Garamond', serif; color: var(--main-blue);">Edit Poem</h2>
        <input type="text" id="poem-title" class="rounded-lg border border-blue-200 px-3 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition" placeholder="Title" value="${utils.escapeHTML(poem.title)}" required style="font-family: 'EB Garamond', serif; font-size: 1.1em;" />
        <textarea id="poem-content" class="rounded-lg border border-blue-200 px-3 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition" placeholder="Poem content" rows="6" required style="font-family: 'EB Garamond', serif; font-size: 1.08em;">${utils.escapeHTML(poem.content)}</textarea>
        <input type="text" id="poem-tags" class="rounded-lg border border-blue-200 px-3 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition" placeholder="Tags (comma separated)" value="${utils.tagsToString(poem.tags)}" style="font-size: 1em;" />
        <div class="flex gap-2">
          <button type="submit" class="nav-btn flex-1">Save Changes</button>
          <button type="button" id="cancel-btn" class="nav-btn flex-1" style="background: #f1f5f9; color: #64748b;">Cancel</button>
        </div>
      </form>
    `;
    document.getElementById('cancel-btn').onclick = () => window.location.hash = `#view-poem/${poemId}`;
    document.getElementById('edit-poem-form').onsubmit = async (e) => {
      e.preventDefault();
      utils.showLoading(dom, true);
      const title = document.getElementById('poem-title').value.trim();
      const content = document.getElementById('poem-content').value.trim();
      const tags = utils.parseTags(document.getElementById('poem-tags').value);
      try {
        await updatePoem(poemId, { title, content, tags });
        utils.showToast(dom, 'Poem updated!');
        setTimeout(() => window.location.hash = `#view-poem/${poemId}`, 1000);
      } catch (err) {
        utils.showModal(dom, 'Failed to update poem: ' + (err.message || err));
      } finally {
        utils.showLoading(dom, false);
      }
    };
  } catch (err) {
    dom.app.innerHTML = `<div class="text-center text-red-600">Failed to load poem: ${err.message || err}</div>`;
  } finally {
    utils.showLoading(dom, false);
  }
} 