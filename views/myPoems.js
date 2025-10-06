// views/myPoems.js
// 'My Poems' list view
import { fetchPoemsPaginated } from '../poems.js';
import { currentUser } from '../auth.js';
import { utils } from '../utils.js';

export async function renderMyPoems(dom, page = 1) {
  dom.app.innerHTML = `<div class="text-center text-lg">Loading your poems...</div>`;
  utils.showLoading(dom, true);
  try {
    if (!currentUser) {
      dom.app.innerHTML = `<div class="text-center text-lg">You must be logged in to view your poems.</div>`;
      return;
    }
    const result = await fetchPoemsPaginated({ 
      userId: currentUser.id, 
      page, 
      limit: 10 
    });
    const { data: poems, ...paginationData } = result;
    let html = `<div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <div class="flex justify-between items-center mb-4">
        <div class="font-bold text-xl">The Unsaid</div>
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
    html += `</ul>`;
    
    // Add pagination controls
    html += utils.createPaginationControls(paginationData, (newPage) => {
      renderMyPoems(dom, newPage);
    }, '#my-poems');
    
    html += `</div>`;
    dom.app.innerHTML = html;
    
    // Attach pagination handlers
    utils.attachPaginationHandlers((newPage) => {
      renderMyPoems(dom, newPage);
    });
    
    document.getElementById('add-poem-btn').onclick = () => window.location.hash = '#add-poem';
  } catch (err) {
    dom.app.innerHTML = `<div class="text-center text-red-600">Failed to load poems: ${err.message || err}</div>`;
  } finally {
    utils.showLoading(dom, false);
  }
} 