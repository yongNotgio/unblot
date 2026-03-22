// views/admin.js
// Admin Dashboard view for managing poems, comments, likes, and viewing stats
import { supabase } from '../utils/supabase.js';
import { currentUser } from '../auth.js';
import { utils } from '../utils.js';
import { navigate } from '../router.js';
import { ADMIN_USER_IDS } from '../env.js';

/**
 * Check if current user is an admin
 */
export function isAdmin() {
  if (!currentUser) return false;
  return ADMIN_USER_IDS.includes(currentUser.id);
}

// ─── Lookup Maps ─────────────────────────────────────────────
// Built once per render and shared across all table builders

let poemMap = {};    // poem_id → { title, content, user_id, ... }
let userEmailMap = {}; // user_id → email string

// ─── Data Fetching ───────────────────────────────────────────

async function fetchStats() {
  const [poemsRes, commentsRes, likesRes, poemUsersRes, commentUsersRes, likeUsersRes] = await Promise.all([
    supabase.from('poems').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    supabase.from('likes').select('*', { count: 'exact', head: true }),
    supabase.from('poems').select('user_id'),
    supabase.from('comments').select('user_id'),
    supabase.from('likes').select('user_id'),
  ]);

  const uniqueUsers = new Set();
  (poemUsersRes.data || []).forEach(r => { if (r.user_id) uniqueUsers.add(r.user_id); });
  (commentUsersRes.data || []).forEach(r => { if (r.user_id) uniqueUsers.add(r.user_id); });
  (likeUsersRes.data || []).forEach(r => { if (r.user_id) uniqueUsers.add(r.user_id); });

  const { data: viewRows } = await supabase.from('poems').select('views_count');
  const totalViews = (viewRows || []).reduce((sum, r) => sum + (r.views_count || 0), 0);

  return {
    totalPoems: poemsRes.count || 0,
    totalComments: commentsRes.count || 0,
    totalLikes: likesRes.count || 0,
    totalUsers: uniqueUsers.size,
    totalViews,
  };
}

async function fetchAllPoems() {
  const { data, error } = await supabase
    .from('poems')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchAllComments() {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchAllLikes() {
  const { data, error } = await supabase
    .from('likes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Try to fetch user emails via RPC function.
 * Falls back gracefully if the function doesn't exist.
 * Run the SQL in the Supabase dashboard to enable this feature (see bottom of file).
 */
async function fetchUserEmails(userIds) {
  if (!userIds.length) return {};
  try {
    const { data, error } = await supabase.rpc('get_user_emails', { user_ids: userIds });
    if (error) throw error;
    const map = {};
    (data || []).forEach(row => { map[row.id] = row.email; });
    return map;
  } catch (e) {
    console.warn('[Admin] get_user_emails RPC not available. User emails will not be shown. See admin.js for setup SQL.');
    return {};
  }
}

async function fetchAllPrompts() {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .order('active_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function adminDeletePoem(id) {
  await supabase.from('comments').delete().eq('poem_id', id);
  await supabase.from('likes').delete().eq('poem_id', id);
  const { error } = await supabase.from('poems').delete().eq('id', id);
  if (error) throw error;
}

async function adminDeleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}

async function adminDeleteLike(id) {
  const { error } = await supabase.from('likes').delete().eq('id', id);
  if (error) throw error;
}

async function adminCreatePrompt({ title, description, active_date }) {
  const { data, error } = await supabase
    .from('prompts')
    .insert({
      title,
      description: description || null,
      active_date,
      created_by: currentUser.id,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function adminDeletePrompt(id) {
  const { error } = await supabase.from('prompts').delete().eq('id', id);
  if (error) throw error;
}

async function adminTogglePrompt(id, currentActive) {
  const { error } = await supabase
    .from('prompts')
    .update({ is_active: !currentActive })
    .eq('id', id);
  if (error) throw error;
}

// ─── Helpers ─────────────────────────────────────────────────

function userDisplay(userId) {
  if (!userId) {
    return '<span class="admin-user-id">Unknown user</span>';
  }

  const email = userEmailMap[userId];
  const escapedId = utils.escapeHTML(userId);
  const shortId = `${escapedId.substring(0, 8)}...`;

  return `
    <span class="admin-user-email">${utils.escapeHTML(email || 'No email')}</span><br>
    <span class="admin-user-id" title="${escapedId}">${shortId}</span>`;
}

function poemTitleDisplay(poemId) {
  const poem = poemMap[poemId];
  if (poem) return `<span class="admin-poem-link" title="${poemId}">${utils.escapeHTML(poem.title)}</span>`;
  return `<span class="admin-user-id" title="${poemId}">${poemId.substring(0, 8)}…</span>`;
}

function truncate(str, len = 60) {
  if (!str) return '';
  const escaped = utils.escapeHTML(str.substring(0, len));
  return str.length > len ? escaped + '…' : escaped;
}

function buildPaginationControls(totalItems, currentPage, perPage) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  if (totalPages <= 1) return '';

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = startPage + maxVisible - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  let buttons = '';

  // Prev button
  buttons += `<button class="admin-page-btn admin-page-prev ${currentPage <= 1 ? 'disabled' : ''}" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>
    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
  </button>`;

  // First page + ellipsis
  if (startPage > 1) {
    buttons += `<button class="admin-page-btn" data-page="1">1</button>`;
    if (startPage > 2) buttons += `<span class="admin-page-ellipsis">…</span>`;
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    buttons += `<button class="admin-page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  // Last page + ellipsis
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) buttons += `<span class="admin-page-ellipsis">…</span>`;
    buttons += `<button class="admin-page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  // Next button
  buttons += `<button class="admin-page-btn admin-page-next ${currentPage >= totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>
    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
  </button>`;

  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  return `
    <div class="admin-pagination">
      <span class="admin-pagination-info">Showing ${startItem}–${endItem} of ${totalItems}</span>
      <div class="admin-pagination-buttons">${buttons}</div>
    </div>`;
}

// ─── HTML Builders ───────────────────────────────────────────

function statCard(icon, label, value, color) {
  return `
    <div class="admin-stat-card" style="--stat-color: ${color};">
      <div class="admin-stat-icon">${icon}</div>
      <div class="admin-stat-info">
        <span class="admin-stat-value">${value.toLocaleString()}</span>
        <span class="admin-stat-label">${label}</span>
      </div>
    </div>`;
}

function buildStatsSection(stats) {
  return `
    <div class="admin-stats-grid">
      ${statCard(
        '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>',
        'Total Poems', stats.totalPoems, 'var(--primary)'
      )}
      ${statCard(
        '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
        'Total Comments', stats.totalComments, 'var(--success)'
      )}
      ${statCard(
        '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
        'Total Likes', stats.totalLikes, 'var(--accent)'
      )}
      ${statCard(
        '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
        'Total Views', stats.totalViews, '#8b5cf6'
      )}
      ${statCard(
        '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        'Unique Authors', stats.totalUsers, 'var(--warning)'
      )}
    </div>`;
}

// ── Overview Tab ──

function buildOverviewTab(poems, comments, likes, stats) {
  // Top 5 most-viewed poems
  const topViewed = [...poems].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 5);
  // Top 5 most-liked poems
  const likeCounts = {};
  likes.forEach(l => { likeCounts[l.poem_id] = (likeCounts[l.poem_id] || 0) + 1; });
  const topLiked = [...poems].sort((a, b) => (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0)).slice(0, 5);
  // Top 5 most-commented poems
  const commentCounts = {};
  comments.forEach(c => { commentCounts[c.poem_id] = (commentCounts[c.poem_id] || 0) + 1; });
  const topCommented = [...poems].sort((a, b) => (commentCounts[b.id] || 0) - (commentCounts[a.id] || 0)).slice(0, 5);

  // Recent activity timeline (last 10 events from all types)
  const activities = [
    ...poems.slice(0, 15).map(p => ({ type: 'poem', title: p.title, user: p.user_id, time: p.created_at })),
    ...comments.slice(0, 15).map(c => ({ type: 'comment', title: poemMap[c.poem_id]?.title || 'Unknown poem', user: c.user_id, time: c.created_at, text: c.comment_text })),
    ...likes.slice(0, 15).map(l => ({ type: 'like', title: poemMap[l.poem_id]?.title || 'Unknown poem', user: l.user_id, time: l.created_at })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 12);

  const activityIcons = {
    poem: '<svg width="14" height="14" fill="none" stroke="var(--primary)" stroke-width="2" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>',
    comment: '<svg width="14" height="14" fill="none" stroke="var(--success)" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    like: '<svg width="14" height="14" fill="none" stroke="var(--accent)" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  };
  const activityLabels = {
    poem: 'published',
    comment: 'commented on',
    like: 'liked',
  };

  function leaderboard(title, items, valueFn, icon) {
    if (!items.length) return '';
    return `
      <div class="admin-leaderboard">
        <h3 class="admin-leaderboard-title">${icon} ${title}</h3>
        <ol class="admin-leaderboard-list">
          ${items.map((p, i) => `
            <li class="admin-leaderboard-item">
              <span class="admin-lb-rank">${i + 1}</span>
              <span class="admin-lb-title">${utils.escapeHTML(p.title)}</span>
              <span class="admin-lb-value">${valueFn(p)}</span>
            </li>`).join('')}
        </ol>
      </div>`;
  }

  return `
    <div class="admin-overview-grid">
      <div class="admin-overview-left">
        ${leaderboard('Most Viewed', topViewed, p => `${(p.views_count || 0).toLocaleString()} views`,
          '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
        )}
        ${leaderboard('Most Liked', topLiked, p => `${likeCounts[p.id] || 0} likes`,
          '<svg width="16" height="16" fill="none" stroke="var(--accent)" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
        )}
        ${leaderboard('Most Commented', topCommented, p => `${commentCounts[p.id] || 0} comments`,
          '<svg width="16" height="16" fill="none" stroke="var(--success)" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
        )}
      </div>
      <div class="admin-overview-right">
        <h3 class="admin-activity-title">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Recent Activity
        </h3>
        <div class="admin-activity-timeline">
          ${activities.length ? activities.map(a => `
            <div class="admin-activity-item">
              <div class="admin-activity-icon">${activityIcons[a.type]}</div>
              <div class="admin-activity-body">
                <span class="admin-activity-user">${userDisplay(a.user)}</span>
                <span class="admin-activity-action">${activityLabels[a.type]}</span>
                <span class="admin-activity-target">"${utils.escapeHTML((a.title || '').substring(0, 30))}"</span>
                ${a.text ? `<span class="admin-activity-preview">— "${utils.escapeHTML(a.text.substring(0, 40))}${a.text.length > 40 ? '…' : ''}"</span>` : ''}
              </div>
              <span class="admin-activity-time">${utils.formatDate(a.time)}</span>
            </div>`).join('') : '<p class="admin-empty">No recent activity.</p>'}
        </div>
      </div>
    </div>`;
}

// ── Poems Tab ──

function buildPoemsTable(poems, filter = '', page = 1) {
  let filtered = poems;
  if (filter) {
    const q = filter.toLowerCase();
    filtered = poems.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.content || '').toLowerCase().includes(q) ||
      (userEmailMap[p.user_id] || '').toLowerCase().includes(q) ||
      (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  }
  if (!filtered.length) return `<p class="admin-empty">No poems ${filter ? 'matching "' + utils.escapeHTML(filter) + '"' : 'found'}.</p>`;

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  page = Math.min(page, totalPages);
  _currentPages.poems = page;
  const start = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

  const rows = pageItems.map(p => `
    <tr>
      <td class="admin-td admin-td-title" title="${utils.escapeHTML(p.id)}">${utils.escapeHTML(p.title)}</td>
      <td class="admin-td admin-td-content">${truncate(p.content, 50)}</td>
      <td class="admin-td">${userDisplay(p.user_id)}</td>
      <td class="admin-td admin-td-tags">${Array.isArray(p.tags) ? p.tags.map(t => `<span class="admin-tag">${utils.escapeHTML(t)}</span>`).join(' ') : ''}</td>
      <td class="admin-td">${(p.views_count || 0).toLocaleString()}</td>
      <td class="admin-td">${utils.formatDate(p.created_at)}</td>
      <td class="admin-td admin-td-actions">
        <button class="admin-action-btn admin-view-btn" data-poem-id="${p.id}" title="View">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="admin-action-btn admin-delete-btn" data-delete-poem="${p.id}" title="Delete">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    </tr>`).join('');

  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Content</th>
            <th>Author</th>
            <th>Tags</th>
            <th>Views</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="admin-table-footer">${filtered.length} poem${filtered.length !== 1 ? 's' : ''}</div>
    ${buildPaginationControls(filtered.length, page, ITEMS_PER_PAGE)}`;
}

// ── Comments Tab ──

function buildCommentsTable(comments, filter = '', page = 1) {
  let filtered = comments;
  if (filter) {
    const q = filter.toLowerCase();
    filtered = comments.filter(c =>
      (c.comment_text || '').toLowerCase().includes(q) ||
      (poemMap[c.poem_id]?.title || '').toLowerCase().includes(q) ||
      (userEmailMap[c.user_id] || '').toLowerCase().includes(q)
    );
  }
  if (!filtered.length) return `<p class="admin-empty">No comments ${filter ? 'matching "' + utils.escapeHTML(filter) + '"' : 'found'}.</p>`;

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  page = Math.min(page, totalPages);
  _currentPages.comments = page;
  const start = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

  const rows = pageItems.map(c => `
    <tr>
      <td class="admin-td admin-td-content">${truncate(c.comment_text, 70)}</td>
      <td class="admin-td">${poemTitleDisplay(c.poem_id)}</td>
      <td class="admin-td">${userDisplay(c.user_id)}</td>
      <td class="admin-td">${utils.formatDate(c.created_at)}</td>
      <td class="admin-td admin-td-actions">
        <button class="admin-action-btn admin-view-btn" data-poem-id="${c.poem_id}" title="View Poem">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="admin-action-btn admin-delete-btn" data-delete-comment="${c.id}" title="Delete">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    </tr>`).join('');

  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Comment</th>
            <th>On Poem</th>
            <th>By User</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="admin-table-footer">${filtered.length} comment${filtered.length !== 1 ? 's' : ''}</div>
    ${buildPaginationControls(filtered.length, page, ITEMS_PER_PAGE)}`;
}

// ── Likes Tab ──

function buildLikesTable(likes, filter = '', page = 1) {
  let filtered = likes;
  if (filter) {
    const q = filter.toLowerCase();
    filtered = likes.filter(l =>
      (poemMap[l.poem_id]?.title || '').toLowerCase().includes(q) ||
      (userEmailMap[l.user_id] || '').toLowerCase().includes(q)
    );
  }
  if (!filtered.length) return `<p class="admin-empty">No likes ${filter ? 'matching "' + utils.escapeHTML(filter) + '"' : 'found'}.</p>`;

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  page = Math.min(page, totalPages);
  _currentPages.likes = page;
  const start = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

  const rows = pageItems.map(l => `
    <tr>
      <td class="admin-td">${poemTitleDisplay(l.poem_id)}</td>
      <td class="admin-td">${userDisplay(l.user_id)}</td>
      <td class="admin-td">${utils.formatDate(l.created_at)}</td>
      <td class="admin-td admin-td-actions">
        <button class="admin-action-btn admin-view-btn" data-poem-id="${l.poem_id}" title="View Poem">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="admin-action-btn admin-delete-btn" data-delete-like="${l.id}" title="Remove">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    </tr>`).join('');

  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Poem</th>
            <th>Liked By</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="admin-table-footer">${filtered.length} like${filtered.length !== 1 ? 's' : ''}</div>
    ${buildPaginationControls(filtered.length, page, ITEMS_PER_PAGE)}`;
}

// ── Users Tab ──

function buildUsersTable(poems, comments, likes) {
  // Gather all unique user_ids across tables
  const userSet = new Set();
  poems.forEach(p => userSet.add(p.user_id));
  comments.forEach(c => userSet.add(c.user_id));
  likes.forEach(l => userSet.add(l.user_id));

  // Build per-user stats
  const userStats = {};
  userSet.forEach(uid => {
    userStats[uid] = { poems: 0, comments: 0, likes: 0, lastActive: null };
  });
  poems.forEach(p => {
    userStats[p.user_id].poems++;
    const d = new Date(p.created_at);
    if (!userStats[p.user_id].lastActive || d > userStats[p.user_id].lastActive) userStats[p.user_id].lastActive = d;
  });
  comments.forEach(c => {
    userStats[c.user_id].comments++;
    const d = new Date(c.created_at);
    if (!userStats[c.user_id].lastActive || d > userStats[c.user_id].lastActive) userStats[c.user_id].lastActive = d;
  });
  likes.forEach(l => {
    userStats[l.user_id].likes++;
    const d = new Date(l.created_at);
    if (!userStats[l.user_id].lastActive || d > userStats[l.user_id].lastActive) userStats[l.user_id].lastActive = d;
  });

  // Sort by most active (total actions)
  const sortedUsers = [...userSet].sort((a, b) => {
    const aTotal = userStats[a].poems + userStats[a].comments + userStats[a].likes;
    const bTotal = userStats[b].poems + userStats[b].comments + userStats[b].likes;
    return bTotal - aTotal;
  });

  if (!sortedUsers.length) return '<p class="admin-empty">No users found.</p>';

  const page = _currentPages.users;
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  _currentPages.users = safePage;
  const start = (safePage - 1) * ITEMS_PER_PAGE;
  const pageUsers = sortedUsers.slice(start, start + ITEMS_PER_PAGE);

  const rows = pageUsers.map(uid => {
    const s = userStats[uid];
    return `
      <tr>
        <td class="admin-td">${userDisplay(uid)}</td>
        <td class="admin-td admin-td-id" title="${utils.escapeHTML(uid)}">${utils.escapeHTML(uid)}</td>
        <td class="admin-td">${s.poems}</td>
        <td class="admin-td">${s.comments}</td>
        <td class="admin-td">${s.likes}</td>
        <td class="admin-td">${s.lastActive ? utils.formatDate(s.lastActive) : '—'}</td>
      </tr>`;
  }).join('');

  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>ID</th>
            <th>Poems</th>
            <th>Comments</th>
            <th>Likes</th>
            <th>Last Active</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="admin-table-footer">${sortedUsers.length} user${sortedUsers.length !== 1 ? 's' : ''}</div>
    ${buildPaginationControls(sortedUsers.length, safePage, ITEMS_PER_PAGE)}`;
}

// ── Prompts Tab ──

function buildPromptsTab(prompts) {
  // Get today's date in Philippine time (Asia/Manila, UTC+8)
  const today = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];
  const todayPrompt = prompts.find(p => p.active_date === today && p.is_active);

  const rows = prompts.map(p => {
    const isToday = p.active_date === today;
    const isPast = p.active_date < today;
    const statusClass = !p.is_active ? 'admin-prompt-inactive' : isToday ? 'admin-prompt-today' : isPast ? 'admin-prompt-past' : 'admin-prompt-upcoming';
    const statusLabel = !p.is_active ? 'Disabled' : isToday ? 'Today' : isPast ? 'Past' : 'Upcoming';
    return `
      <tr class="${statusClass}">
        <td class="admin-td admin-td-title">${utils.escapeHTML(p.title)}</td>
        <td class="admin-td">${p.description ? truncate(p.description, 50) : '<span style="color:var(--text-muted)">—</span>'}</td>
        <td class="admin-td">${p.active_date}</td>
        <td class="admin-td"><span class="admin-prompt-status admin-prompt-status-${statusLabel.toLowerCase()}">${statusLabel}</span></td>
        <td class="admin-td admin-td-actions">
          <button class="admin-action-btn" data-toggle-prompt="${p.id}" data-prompt-active="${p.is_active}" title="${p.is_active ? 'Disable' : 'Enable'}">
            ${p.is_active
              ? '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
              : '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
            }
          </button>
          <button class="admin-action-btn admin-delete-btn" data-delete-prompt="${p.id}" data-prompt-title="${utils.escapeHTML(p.title)}" title="Delete">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </td>
      </tr>`;
  }).join('');

  return `
    <div class="admin-prompts-header">
      <div>
        ${todayPrompt
          ? `<p class="admin-prompts-today-label">Today's prompt: <strong>${utils.escapeHTML(todayPrompt.title)}</strong></p>`
          : `<p class="admin-prompts-today-label" style="color:var(--text-muted)">No prompt set for today</p>`
        }
      </div>
      <button class="admin-add-prompt-btn" id="admin-add-prompt-toggle">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Prompt
      </button>
    </div>

    <div class="admin-add-prompt-form hidden" id="admin-add-prompt-form">
      <form id="admin-prompt-form">
        <div class="admin-prompt-form-grid">
          <div class="admin-prompt-field">
            <label>Prompt Title <span style="color:var(--error)">*</span></label>
            <input type="text" id="admin-prompt-title" class="modern-input" placeholder="e.g. Whispers of Dawn" required />
          </div>
          <div class="admin-prompt-field">
            <label>Active Date <span style="color:var(--error)">*</span></label>
            <input type="date" id="admin-prompt-date" class="modern-input" required />
          </div>
          <div class="admin-prompt-field admin-prompt-field-full">
            <label>Description <span style="color:var(--text-muted)">(optional)</span></label>
            <textarea id="admin-prompt-desc" class="modern-input" placeholder="A brief description or context for this prompt…" rows="2"></textarea>
          </div>
        </div>
        <div class="admin-prompt-form-actions">
          <button type="submit" class="action-btn action-btn-primary">Create Prompt</button>
          <button type="button" class="action-btn action-btn-secondary" id="admin-prompt-cancel">Cancel</button>
        </div>
      </form>
    </div>

    ${prompts.length ? `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Active Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="admin-table-footer">${prompts.length} prompt${prompts.length !== 1 ? 's' : ''}</div>
    ` : '<p class="admin-empty">No prompts yet. Create one to get started!</p>'}
  `;
}

// ─── Main Render ─────────────────────────────────────────────

// Persistent state so search/pagination isn't lost on re-render from delete actions
let _activeTab = 'overview';
let _searchFilters = { poems: '', comments: '', likes: '' };
let _currentPages = { poems: 1, comments: 1, likes: 1, users: 1 };
const ITEMS_PER_PAGE = 15;

export async function renderAdmin(dom) {
  // Auth guard
  if (!currentUser) { navigate('/login'); return; }
  if (!isAdmin()) {
    dom.app.innerHTML = `
      <div class="admin-denied animate-fade-in">
        <svg width="48" height="48" fill="none" stroke="var(--error)" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
        <h2>Access Denied</h2>
        <p>You don't have admin privileges.</p>
        <button class="action-btn action-btn-primary" onclick="window.location.hash='#/home'">Go Home</button>
      </div>`;
    return;
  }

  // Loading skeleton
  dom.app.innerHTML = `
    <div class="admin-dashboard animate-fade-in" style="width:100%;max-width:1200px;">
      <div class="admin-header">
        <h1 class="admin-title">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Admin Dashboard
        </h1>
      </div>
      <div class="admin-loading"><div class="loader"></div><span>Loading dashboard data…</span></div>
    </div>`;

  utils.showLoading(dom, true);

  try {
    // Fetch all data in parallel
    const [stats, poems, comments, likes, prompts] = await Promise.all([
      fetchStats(),
      fetchAllPoems(),
      fetchAllComments(),
      fetchAllLikes(),
      fetchAllPrompts().catch(() => []), // Gracefully handle if table doesn't exist
    ]);

    // Build lookup maps
    poemMap = {};
    poems.forEach(p => { poemMap[p.id] = p; });

    // Collect all unique user_ids and try to fetch emails
    const allUserIds = new Set();
    poems.forEach(p => allUserIds.add(p.user_id));
    comments.forEach(c => allUserIds.add(c.user_id));
    likes.forEach(l => allUserIds.add(l.user_id));
    userEmailMap = await fetchUserEmails([...allUserIds]);

    // Render dashboard
    dom.app.innerHTML = `
      <div class="admin-dashboard animate-fade-in" style="width:100%;max-width:1200px;">
        <div class="admin-header">
          <div class="admin-header-top">
            <h1 class="admin-title">
              <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Admin Dashboard
            </h1>
            <div class="admin-header-actions">
              <button class="admin-refresh-btn" id="admin-refresh" title="Refresh data">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Refresh
              </button>
            </div>
          </div>
          <span class="admin-subtitle">Manage content and monitor platform activity</span>
          ${Object.keys(userEmailMap).length === 0 ? '<span class="admin-notice">Tip: Run the SQL function in Supabase to show user emails. See console for details.</span>' : ''}
        </div>

        ${buildStatsSection(stats)}

        <!-- Tabs -->
        <div class="admin-tabs">
          <button class="admin-tab ${_activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Overview
          </button>
          <button class="admin-tab ${_activeTab === 'poems' ? 'active' : ''}" data-tab="poems">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            Poems <span class="admin-tab-count">${stats.totalPoems}</span>
          </button>
          <button class="admin-tab ${_activeTab === 'comments' ? 'active' : ''}" data-tab="comments">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Comments <span class="admin-tab-count">${stats.totalComments}</span>
          </button>
          <button class="admin-tab ${_activeTab === 'likes' ? 'active' : ''}" data-tab="likes">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Likes <span class="admin-tab-count">${stats.totalLikes}</span>
          </button>
          <button class="admin-tab ${_activeTab === 'users' ? 'active' : ''}" data-tab="users">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Users <span class="admin-tab-count">${stats.totalUsers}</span>
          </button>
          <button class="admin-tab ${_activeTab === 'prompts' ? 'active' : ''}" data-tab="prompts">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg>
            Prompts <span class="admin-tab-count">${prompts.length}</span>
          </button>
        </div>

        <!-- Search bar (shown for data tabs) -->
        <div class="admin-search-bar ${_activeTab === 'overview' || _activeTab === 'users' || _activeTab === 'prompts' ? 'hidden' : ''}" id="admin-search-bar">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="admin-search-input" class="admin-search-input" placeholder="Search ${_activeTab}…" value="${utils.escapeHTML(_searchFilters[_activeTab] || '')}" />
          <button class="admin-search-clear ${_searchFilters[_activeTab] ? '' : 'hidden'}" id="admin-search-clear" title="Clear">&times;</button>
        </div>

        <!-- Tab Contents -->
        <div class="admin-tab-content ${_activeTab === 'overview' ? '' : 'hidden'}" id="admin-tab-overview">
          ${buildOverviewTab(poems, comments, likes, stats)}
        </div>
        <div class="admin-tab-content ${_activeTab === 'poems' ? '' : 'hidden'}" id="admin-tab-poems">
          ${buildPoemsTable(poems, _searchFilters.poems, _currentPages.poems)}
        </div>
        <div class="admin-tab-content ${_activeTab === 'comments' ? '' : 'hidden'}" id="admin-tab-comments">
          ${buildCommentsTable(comments, _searchFilters.comments, _currentPages.comments)}
        </div>
        <div class="admin-tab-content ${_activeTab === 'likes' ? '' : 'hidden'}" id="admin-tab-likes">
          ${buildLikesTable(likes, _searchFilters.likes, _currentPages.likes)}
        </div>
        <div class="admin-tab-content ${_activeTab === 'users' ? '' : 'hidden'}" id="admin-tab-users">
          ${buildUsersTable(poems, comments, likes)}
        </div>
        <div class="admin-tab-content ${_activeTab === 'prompts' ? '' : 'hidden'}" id="admin-tab-prompts">
          ${buildPromptsTab(prompts)}
        </div>
      </div>`;

    // ── Attach handlers ──
    attachTabHandlers(dom, poems, comments, likes);
    attachSearchHandler(dom, poems, comments, likes);
    attachActionHandlers(dom);
    attachPaginationHandlers(dom, poems, comments, likes);
    attachPromptHandlers(dom);
    attachRefreshHandler(dom);

  } catch (err) {
    dom.app.innerHTML = `
      <div class="admin-denied animate-fade-in">
        <svg width="48" height="48" fill="none" stroke="var(--error)" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h2>Error Loading Dashboard</h2>
        <p>${utils.escapeHTML(err.message || 'Unknown error')}</p>
        <button class="action-btn action-btn-primary admin-retry-btn">Retry</button>
      </div>`;
    const retryBtn = dom.app.querySelector('.admin-retry-btn');
    if (retryBtn) retryBtn.onclick = () => renderAdmin(dom);
  } finally {
    utils.showLoading(dom, false);
  }
}

// ─── Event Handlers ──────────────────────────────────────────

function attachTabHandlers(dom, poems, comments, likes) {
  const tabs = dom.app.querySelectorAll('.admin-tab');
  const searchBar = dom.app.querySelector('#admin-search-bar');
  const searchInput = dom.app.querySelector('#admin-search-input');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      dom.app.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));

      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      _activeTab = target;

      const content = dom.app.querySelector(`#admin-tab-${target}`);
      if (content) content.classList.remove('hidden');

      // Show/hide search bar
      if (target === 'overview' || target === 'users' || target === 'prompts') {
        searchBar.classList.add('hidden');
      } else {
        searchBar.classList.remove('hidden');
        if (searchInput) {
          searchInput.placeholder = `Search ${target}…`;
          searchInput.value = _searchFilters[target] || '';
        }
      }
    });
  });
}

function attachSearchHandler(dom, poems, comments, likes) {
  const searchInput = dom.app.querySelector('#admin-search-input');
  const clearBtn = dom.app.querySelector('#admin-search-clear');
  if (!searchInput) return;

  let debounceTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const val = searchInput.value.trim();
      _searchFilters[_activeTab] = val;
      _currentPages[_activeTab] = 1; // Reset to page 1 on search
      clearBtn.classList.toggle('hidden', !val);
      rerenderTabContent(dom, _activeTab, poems, comments, likes);
    }, 250);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      _searchFilters[_activeTab] = '';
      _currentPages[_activeTab] = 1; // Reset to page 1 on clear
      clearBtn.classList.add('hidden');
      rerenderTabContent(dom, _activeTab, poems, comments, likes);
      searchInput.focus();
    });
  }
}

function rerenderTabContent(dom, tab, poems, comments, likes) {
  const container = dom.app.querySelector(`#admin-tab-${tab}`);
  if (!container) return;

  if (tab === 'poems') container.innerHTML = buildPoemsTable(poems, _searchFilters.poems, _currentPages.poems);
  else if (tab === 'comments') container.innerHTML = buildCommentsTable(comments, _searchFilters.comments, _currentPages.comments);
  else if (tab === 'likes') container.innerHTML = buildLikesTable(likes, _searchFilters.likes, _currentPages.likes);
  else if (tab === 'users') container.innerHTML = buildUsersTable(poems, comments, likes);

  // Re-attach action + pagination handlers for the refreshed content
  attachActionHandlers(dom);
  attachPaginationHandlers(dom, poems, comments, likes);
}

function attachPromptHandlers(dom) {
  const toggleBtn = dom.app.querySelector('#admin-add-prompt-toggle');
  const formWrap = dom.app.querySelector('#admin-add-prompt-form');
  const cancelBtn = dom.app.querySelector('#admin-prompt-cancel');
  const form = dom.app.querySelector('#admin-prompt-form');

  if (toggleBtn && formWrap) {
    toggleBtn.addEventListener('click', () => {
      formWrap.classList.toggle('hidden');
      if (!formWrap.classList.contains('hidden')) {
        const dateInput = dom.app.querySelector('#admin-prompt-date');
        if (dateInput && !dateInput.value) {
          dateInput.value = new Date().toISOString().split('T')[0];
        }
        dom.app.querySelector('#admin-prompt-title')?.focus();
      }
    });
  }

  if (cancelBtn && formWrap) {
    cancelBtn.addEventListener('click', () => formWrap.classList.add('hidden'));
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = dom.app.querySelector('#admin-prompt-title').value.trim();
      const description = dom.app.querySelector('#admin-prompt-desc').value.trim();
      const active_date = dom.app.querySelector('#admin-prompt-date').value;
      if (!title || !active_date) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating…';
      try {
        await adminCreatePrompt({ title, description, active_date });
        utils.showToast(dom, 'Prompt created!', 2500, 'success');
        await renderAdmin(dom);
      } catch (err) {
        const msg = err.message || String(err);
        if (msg.includes('duplicate') || msg.includes('unique')) {
          utils.showToast(dom, 'A prompt already exists for that date.', 3000, 'error');
        } else {
          utils.showToast(dom, 'Failed to create prompt: ' + msg, 3000, 'error');
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Prompt';
      }
    });
  }

  // Toggle active
  dom.app.querySelectorAll('[data-toggle-prompt]:not([data-bound])').forEach(btn => {
    btn.setAttribute('data-bound', '1');
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-toggle-prompt');
      const isActive = btn.getAttribute('data-prompt-active') === 'true';
      btn.disabled = true;
      try {
        await adminTogglePrompt(id, isActive);
        utils.showToast(dom, isActive ? 'Prompt disabled' : 'Prompt enabled', 2500, 'success');
        await renderAdmin(dom);
      } catch (err) {
        utils.showToast(dom, 'Failed to update prompt: ' + err.message, 3000, 'error');
        btn.disabled = false;
      }
    });
  });

  // Delete prompt
  dom.app.querySelectorAll('[data-delete-prompt]:not([data-bound])').forEach(btn => {
    btn.setAttribute('data-bound', '1');
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-prompt');
      const title = btn.getAttribute('data-prompt-title');
      if (!confirm(`Delete prompt "${title}"? This cannot be undone.`)) return;
      btn.disabled = true;
      btn.innerHTML = '<span class="admin-spinner"></span>';
      try {
        await adminDeletePrompt(id);
        utils.showToast(dom, 'Prompt deleted', 2500, 'success');
        await renderAdmin(dom);
      } catch (err) {
        utils.showToast(dom, 'Failed to delete prompt: ' + err.message, 3000, 'error');
        btn.disabled = false;
      }
    });
  });
}

function attachRefreshHandler(dom) {
  const btn = dom.app.querySelector('#admin-refresh');
  if (btn) btn.addEventListener('click', () => renderAdmin(dom));
}

function attachPaginationHandlers(dom, poems, comments, likes) {
  dom.app.querySelectorAll('.admin-pagination-buttons .admin-page-btn:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.getAttribute('data-page'), 10);
      if (isNaN(page) || page < 1) return;
      _currentPages[_activeTab] = page;
      rerenderTabContent(dom, _activeTab, poems, comments, likes);
      // Scroll table into view
      const tabContent = dom.app.querySelector(`#admin-tab-${_activeTab}`);
      if (tabContent) tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function attachActionHandlers(dom) {
  // Use :not([data-bound]) to prevent duplicate handlers when called from rerenderTabContent

  // View poem
  dom.app.querySelectorAll('.admin-view-btn:not([data-bound])').forEach(btn => {
    btn.setAttribute('data-bound', '1');
    btn.addEventListener('click', () => {
      const poemId = btn.getAttribute('data-poem-id');
      if (poemId) navigate(`/view-poem/${poemId}`);
    });
  });

  // Delete poem
  dom.app.querySelectorAll('[data-delete-poem]:not([data-bound])').forEach(btn => {
    btn.setAttribute('data-bound', '1');
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-poem');
      const poem = poemMap[id];
      if (!confirm(`Delete "${poem ? poem.title : id}" and all its comments/likes? This cannot be undone.`)) return;
      btn.disabled = true;
      btn.innerHTML = '<span class="admin-spinner"></span>';
      try {
        await adminDeletePoem(id);
        utils.showToast(dom, 'Poem deleted successfully', 2500, 'success');
        await renderAdmin(dom);
      } catch (err) {
        utils.showToast(dom, 'Failed to delete poem: ' + err.message, 3000, 'error');
        btn.disabled = false;
        btn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
      }
    });
  });

  // Delete comment
  dom.app.querySelectorAll('[data-delete-comment]:not([data-bound])').forEach(btn => {
    btn.setAttribute('data-bound', '1');
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-comment');
      if (!confirm('Delete this comment? This cannot be undone.')) return;
      btn.disabled = true;
      btn.innerHTML = '<span class="admin-spinner"></span>';
      try {
        await adminDeleteComment(id);
        utils.showToast(dom, 'Comment deleted successfully', 2500, 'success');
        await renderAdmin(dom);
      } catch (err) {
        utils.showToast(dom, 'Failed to delete comment: ' + err.message, 3000, 'error');
        btn.disabled = false;
        btn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
      }
    });
  });

  // Delete like
  dom.app.querySelectorAll('[data-delete-like]:not([data-bound])').forEach(btn => {
    btn.setAttribute('data-bound', '1');
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-like');
      if (!confirm('Remove this like?')) return;
      btn.disabled = true;
      btn.innerHTML = '<span class="admin-spinner"></span>';
      try {
        await adminDeleteLike(id);
        utils.showToast(dom, 'Like removed successfully', 2500, 'success');
        await renderAdmin(dom);
      } catch (err) {
        utils.showToast(dom, 'Failed to remove like: ' + err.message, 3000, 'error');
        btn.disabled = false;
        btn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
      }
    });
  });
}

/*
 * ─── SUPABASE SETUP FOR USER EMAILS ──────────────────────────
 *
 * To show user email addresses in the admin dashboard, run this SQL
 * in your Supabase SQL Editor (Dashboard → SQL Editor → New Query):
 *
 * CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids uuid[])
 * RETURNS TABLE(id uuid, email text)
 * LANGUAGE sql
 * SECURITY DEFINER
 * SET search_path = ''
 * AS $$
 *   SELECT au.id, au.email::text
 *   FROM auth.users au
 *   WHERE au.id = ANY(user_ids);
 * $$;
 *
 * -- Grant access to the anon role so the client can call it
 * GRANT EXECUTE ON FUNCTION public.get_user_emails(uuid[]) TO anon;
 * GRANT EXECUTE ON FUNCTION public.get_user_emails(uuid[]) TO authenticated;
 *
 */
