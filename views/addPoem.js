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
    <form id="add-poem-form" class="max-w-md mx-auto p-6 bg-white rounded-lg shadow flex flex-col gap-4">
      <h2 class="text-2xl font-bold mb-2 text-center">Add New Poem</h2>
      <input type="text" id="poem-title" class="rounded-lg border px-3 py-2" placeholder="Title" required />
      <textarea id="poem-content" class="rounded-lg border px-3 py-2" placeholder="Poem content" rows="6" required></textarea>
      <input type="text" id="poem-tags" class="rounded-lg border px-3 py-2" placeholder="Tags (comma separated)" />
      <div class="flex gap-2">
        <button type="submit" class="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold flex-1">Add Poem</button>
        <button type="button" id="cancel-btn" class="bg-gray-300 text-gray-800 rounded-lg px-4 py-2 font-semibold flex-1">Cancel</button>
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