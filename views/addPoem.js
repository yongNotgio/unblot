// views/addPoem.js
// Add new poem view
import { addPoem } from '../poems.js';
import { currentUser } from '../auth.js';
import { utils } from '../utils.js';

export function renderAddPoem(dom) {
  if (!currentUser) {
    dom.app.innerHTML = `<div class="text-center text-lg">You must be logged in to add a poem.</div>`;
    return;
  }
  dom.app.innerHTML = `
    <form id="add-poem-form" class="cozy-card flex flex-col gap-4" style="max-width: 480px; margin: 0 auto;">
      <h2 class="text-2xl font-bold mb-2 text-center" style="font-family: 'EB Garamond', serif; color: var(--main-blue);">Add New Poem</h2>
      <input type="text" id="poem-title" class="rounded-lg border border-blue-200 px-3 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition" placeholder="Title" required style="font-family: 'EB Garamond', serif; font-size: 1.1em;" />
      <textarea id="poem-content" class="rounded-lg border border-blue-200 px-3 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition" placeholder="Poem content" rows="6" required style="font-family: 'EB Garamond', serif; font-size: 1.08em;"></textarea>
      <input type="text" id="poem-tags" class="rounded-lg border border-blue-200 px-3 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition" placeholder="Tags (comma separated)" style="font-size: 1em;" />
      <div class="flex gap-2">
        <button type="submit" class="nav-btn flex-1">Add Poem</button>
        <button type="button" id="cancel-btn" class="nav-btn flex-1" style="background: #f1f5f9; color: #64748b;">Cancel</button>
      </div>
    </form>
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