// views/myPoems.js
// 'My Poems' list view
import { fetchPoemsPaginated } from '../poems.js';
import { currentUser } from '../auth.js';
import { utils } from '../utils.js';
import { navigate } from '../router.js';

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
      limit: 50 
    });
    const { data: poems, ...paginationData } = result;
    let html = `<div class="w-full max-w-2xl mx-auto animate-fade-in">
      <div class="cozy-card mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="section-header" style="text-align: left; margin-bottom: 0.5rem; font-size: 1.75rem;">Your Poetry</h1>

          </div>
          <button id="add-poem-btn" class="action-btn action-btn-primary">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Poem
          </button>
        </div>
      </div>
      
      <div class="grid gap-4">`;
    if (poems.length === 0) {
      html += `
        <div class="cozy-card text-center py-8">

          <p style="font-family: 'Playfair Display', serif; font-size: 1.25rem; color: var(--text-primary); margin-bottom: 0.5rem;">No poems yet</p>
          <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1.5rem;">Start your journey by writing your first poem!</p>
          <button id="write-first-poem-btn" class="action-btn action-btn-primary">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            Write Your First Poem
          </button>
        </div>`;
    } else {
      html += poems.map((poem, index) => `
        <a href="#/view-poem/${poem.id}" class="poem-card block stagger-${(index % 4) + 1}" style="text-decoration: none; cursor: pointer;">
          <div class="flex justify-between items-start">
            <h2 class="poem-title-link text-lg" style="font-weight: 600;">${utils.escapeHTML(poem.title)}</h2>
            <span class="date-text">${utils.formatDate(poem.created_at)}</span>
          </div>
        </a>
      `).join('');
    }
    html += `</div>`;
    
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
    
    document.getElementById('add-poem-btn').onclick = () => navigate('/add-poem');
    // Handle empty state button if present
    const writeFirstBtn = document.getElementById('write-first-poem-btn');
    if (writeFirstBtn) writeFirstBtn.onclick = () => navigate('/add-poem');
  } catch (err) {
    dom.app.innerHTML = `<div class="text-center text-red-600">Failed to load poems: ${err.message || err}</div>`;
  } finally {
    utils.showLoading(dom, false);
  }
} 