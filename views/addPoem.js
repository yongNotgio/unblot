// views/addPoem.js
// Add new poem view
import { addPoem } from '../poems.js';
import { currentUser } from '../auth.js';
import { utils } from '../utils.js';

export function renderAddPoem(dom) {
  if (!currentUser) {
    dom.app.innerHTML = `<div class="text-center text-lg mt-12">You must be logged in to add a poem.</div>`;
    return;
  }
  dom.app.innerHTML = `
    <form id="add-poem-form" class="cozy-card flex flex-col gap-5 border border-blue-100 shadow-lg bg-white/90" style="max-width: 520px; margin: 2.5em auto 0 auto;">
      <h2 class="text-3xl font-bold mb-0 text-center text-blue-800" style="font-family: 'Quicksand', sans-serif;">Add a new poem</h2>
      <div class="text-center text-gray-500 text-base mb-2" style="font-family: 'Quicksand', sans-serif;">Share your thoughts, feelings, or stories in verse.</div>
      <input type="text" id="poem-title" class="rounded-lg border border-blue-200 px-4 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition text-lg" placeholder="Title" required style="font-family: 'Quicksand', sans-serif;" />
      <textarea id="poem-content" class="rounded-lg border border-blue-200 px-4 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition text-base" placeholder="Your thoughts..." rows="7" required style="font-family: 'Quicksand', sans-serif;"></textarea>
      <input type="text" id="poem-tags" class="rounded-lg border border-blue-200 px-4 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition text-base" placeholder="Tags (comma separated)" style="font-family: 'Quicksand', sans-serif;" />
      <div class="flex gap-3 mt-2">
        <button type="submit" class="nav-btn flex-1 text-lg" style="font-family: 'Quicksand', sans-serif;">Add Poem</button>
        <button type="button" id="cancel-btn" class="nav-btn flex-1 bg-gray-100 text-blue-700 border border-blue-100 hover:bg-blue-100" style="color: #64748b; font-family: 'Quicksand', sans-serif;">Cancel</button>
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