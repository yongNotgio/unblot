// views/addPoem.js
// Add new poem view
import { addPoem } from '../poems.js';
import { currentUser } from '../auth.js';
import { utils } from '../utils.js';

export function renderAddPoem(dom) {
  if (!currentUser) {
    dom.app.innerHTML = `
      <div class="text-center py-12 animate-fade-in">

        <p style="font-family: 'Playfair Display', serif; font-size: 1.25rem; color: var(--text-primary);">You must be logged in to add a poem.</p>
        <button onclick="window.location.hash='#login'" class="action-btn action-btn-primary mt-4">Sign In</button>
      </div>`;
    return;
  }
  dom.app.innerHTML = `
    <div class="w-full max-w-xl mx-auto animate-fade-in">
      <form id="add-poem-form" class="cozy-card">
        <div class="text-center mb-8">
          <div style="font-size: 3rem; margin-bottom: 1rem;">✍️</div>
          <h2 class="section-header" style="margin-bottom: 0.5rem;">Share Your Words</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Let your thoughts flow freely</p>
        </div>
        <div class="flex flex-col gap-5">
          <div>
            <label style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.5rem;">Title</label>
            <input type="text" id="poem-title" class="modern-input" placeholder="Give your poem a title" required />
          </div>
          <div>
            <label style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.5rem;">Your Poem</label>
            <textarea id="poem-content" class="modern-input" placeholder="Write your heart out..." rows="8" required style="resize: vertical; min-height: 200px; font-family: 'Playfair Display', serif; font-size: 1.1rem; line-height: 1.8;"></textarea>
          </div>
          <div>
            <label style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.5rem;">Tags</label>
            <input type="text" id="poem-tags" class="modern-input" placeholder="love, nature, reflection (comma separated)" />
          </div>
          <div class="flex gap-3 mt-4">
            <button type="submit" class="action-btn action-btn-primary flex-1 justify-center py-3" style="font-size: 1rem;">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              Publish Poem
            </button>
            <button type="button" id="cancel-btn" class="action-btn action-btn-secondary flex-1 justify-center py-3" style="font-size: 1rem;">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  `;
  document.getElementById('cancel-btn').onclick = () => window.location.hash = '#my-poems';
  document.getElementById('add-poem-form').onsubmit = async (e) => {
    e.preventDefault();
    utils.showLoading(dom, true);
    const title = document.getElementById('poem-title').value.trim();
    const content = document.getElementById('poem-content').value.trim();
    const tags = utils.parseTags(document.getElementById('poem-tags').value);
    try {
      await addPoem({ title, content, tags, user_id: currentUser.id });
      utils.showToast(dom, 'Poem added!');
      setTimeout(() => window.location.hash = '#my-poems', 1000);
    } catch (err) {
      utils.showModal(dom, 'Failed to add poem: ' + (err.message || err));
    } finally {
      utils.showLoading(dom, false);
    }
  };
} 