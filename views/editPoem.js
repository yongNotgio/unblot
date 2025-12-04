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
      dom.app.innerHTML = `
        <div class="text-center py-12 animate-fade-in">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
          <p style="font-family: 'Playfair Display', serif; font-size: 1.25rem; color: var(--text-primary);">You are not authorized to edit this poem.</p>
          <button onclick="window.location.hash='#discover'" class="action-btn action-btn-secondary mt-4">Go to Discover</button>
        </div>`;
      return;
    }
    dom.app.innerHTML = `
      <div class="w-full max-w-xl mx-auto animate-fade-in">
        <form id="edit-poem-form" class="cozy-card">
          <div class="text-center mb-8">
            <div style="font-size: 3rem; margin-bottom: 1rem;">✏️</div>
            <h2 class="section-header" style="margin-bottom: 0.5rem;">Edit Your Poem</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Refine your words</p>
          </div>
          <div class="flex flex-col gap-5">
            <div>
              <label style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.5rem;">Title</label>
              <input type="text" id="poem-title" class="modern-input" placeholder="Poem title" value="${utils.escapeHTML(poem.title)}" required />
            </div>
            <div>
              <label style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.5rem;">Your Poem</label>
              <textarea id="poem-content" class="modern-input" placeholder="Your poem content..." rows="8" required style="resize: vertical; min-height: 200px; font-family: 'Playfair Display', serif; font-size: 1.1rem; line-height: 1.8;">${utils.escapeHTML(poem.content)}</textarea>
            </div>
            <div>
              <label style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.5rem;">Tags</label>
              <input type="text" id="poem-tags" class="modern-input" placeholder="love, nature, reflection (comma separated)" value="${utils.tagsToString(poem.tags)}" />
            </div>
            <div class="flex gap-3 mt-4">
              <button type="submit" class="action-btn action-btn-primary flex-1 justify-center py-3" style="font-size: 1rem;">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Changes
              </button>
              <button type="button" id="cancel-btn" class="action-btn action-btn-secondary flex-1 justify-center py-3" style="font-size: 1rem;">Cancel</button>
            </div>
          </div>
        </form>
      </div>
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