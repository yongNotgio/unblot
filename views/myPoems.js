// views/myPoems.js
// 'My Poems' list view
import { fetchPoems } from '../poems.js';
import { currentUser } from '../auth.js';
import { utils } from '../utils.js';

export async function renderMyPoems(dom) {
  dom.app.innerHTML = `<div class="text-center text-lg">Loading your poems...</div>`;
  utils.showLoading(dom, true);
  try {
    if (!currentUser) {
      dom.app.innerHTML = `<div class="text-center text-lg">You must be logged in to view your poems.</div>`;
      return;
    }
    const poems = await fetchPoems(currentUser.id);
    let html = `<div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <div class="flex justify-between items-center mb-4">
        <div class="font-bold text-xl">My Poems</div>
        <button id="add-poem-btn" class="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold">Add New Poem</button>
      </div>
      <div class="mb-2 text-gray-500">User: <span class="font-mono">${currentUser.id}</span></div>
      <ul class="divide-y">`;
    if (poems.length === 0) {
      html += `<li class="py-4 text-center text-gray-500">No poems yet. Click 'Add New Poem' to create your first poem!</li>`;
    } else {
      html += poems.map(poem => `
        <li class="py-4">
          <a href="#view-poem/${poem.id}" class="text-blue-700 hover:underline text-lg font-semibold">${utils.escapeHTML(poem.title)}</a>
          <div class="text-xs text-gray-400">Created: ${utils.formatDate(poem.created_at)}</div>
        </li>
      `).join('');
    }
    html += `</ul></div>`;
    dom.app.innerHTML = html;
    document.getElementById('add-poem-btn').onclick = () => window.location.hash = '#add-poem';
  } catch (err) {
    dom.app.innerHTML = `<div class="text-center text-red-600">Failed to load poems: ${err.message || err}</div>`;
  } finally {
    utils.showLoading(dom, false);
  }
} 