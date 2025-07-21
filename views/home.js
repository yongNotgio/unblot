// views/home.js
// Public discover/home view
import { fetchPoems } from '../poems.js';
import { utils } from '../utils.js';

export async function renderHome(dom) {
  dom.app.innerHTML = `<div class="text-center text-lg">Loading poems...</div>`;
  utils.showLoading(dom, true);
  try {
    const poems = await fetchPoems(); // Fetch all poems, most recent first
    let html = `<div class="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <div class="font-bold text-2xl mb-4 text-center">Discover Poems</div>
      <ul class="grid gap-4">`;
    if (poems.length === 0) {
      html += `<li class="text-center text-gray-500">No poems found. Be the first to share!</li>`;
    } else {
      html += poems.slice(0, 10).map(poem => `
        <li class="p-4 bg-gray-50 rounded-lg shadow hover:shadow-md transition">
          <a href="#view-poem/${poem.id}" class="block">
            <div class="text-xl font-semibold text-blue-700 hover:underline mb-1">${utils.escapeHTML(poem.title)}</div>
            <div class="text-xs text-gray-400 mb-2">By: <span class="font-mono">${poem.user_id.slice(0, 8)}</span> • ${utils.formatDate(poem.created_at)}</div>
            <div class="text-gray-700 line-clamp-3">${utils.escapeHTML(poem.content).slice(0, 120)}${poem.content.length > 120 ? '...' : ''}</div>
          </a>
        </li>
      `).join('');
    }
    html += `</ul></div>`;
    dom.app.innerHTML = html;
  } catch (err) {
    dom.app.innerHTML = `<div class="text-center text-red-600">Failed to load poems: ${err.message || err}</div>`;
  } finally {
    utils.showLoading(dom, false);
  }
} 