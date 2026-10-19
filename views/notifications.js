// views/notifications.js — Notifications list view
import { utils } from '../utils.js';
import { currentUser } from '../auth.js';
import { navigate } from '../router.js';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  fetchUnreadCount,
  updateNotifBadges,
} from '../notifications.js';
import { getAvatarColor, getCommenterAlias } from '../comments.js';
import { poemPath } from '../shared/site.js';

const PAGE_SIZE = 20;

function notifIcon(type) {
  if (type === 'like') {
    return `<svg width="16" height="16" fill="var(--rust)" stroke="var(--rust)" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`;
  }
  return `<svg width="16" height="16" fill="none" stroke="var(--primary)" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`;
}

function renderNotifItem(n) {
  const avatarColor = getAvatarColor(n.actor_id);
  const alias = getCommenterAlias(n.actor_id);
  const action = n.type === 'like' ? 'liked your poem' : 'commented on your poem';
  const poemTitle = n.poem_title ? `"${utils.escapeHTML(n.poem_title)}"` : 'your poem';
  const unreadClass = n.is_read ? '' : ' notif-unread';
  const timeAgo = utils.formatDate(n.created_at);
  const rawTitle = n.poem_title || '';

  return `
    <li class="notif-item${unreadClass}" data-nid="${n.id}" data-pid="${n.poem_id}" data-ptitle="${utils.escapeHTML(rawTitle)}">
      <div class="notif-avatar" style="background:${avatarColor};">
        <svg width="14" height="14" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div class="notif-body">
        <div class="notif-text">
          <span class="notif-alias">${alias}</span> ${action} <span class="notif-poem-title">${poemTitle}</span>
        </div>
        <div class="notif-meta">
          <span class="notif-type-icon">${notifIcon(n.type)}</span>
          <span class="notif-time">${timeAgo}</span>
        </div>
      </div>
      ${!n.is_read ? '<span class="notif-dot" title="Unread"></span>' : ''}
    </li>`;
}

export async function renderNotifications(dom) {
  if (!currentUser) {
    dom.app.innerHTML = `<div class="text-center" style="padding:3rem 0;color:var(--text-secondary);"><p style="font-size:1.25rem;">Please log in to see your notifications.</p></div>`;
    return;
  }

  dom.app.innerHTML = `
    <div class="w-full" style="max-width: 800px; margin: 0 auto; padding: 0 1rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <span style="font-size: 1.5rem; font-weight: 600;">Notifications</span>
        <button id="notif-mark-all" class="notif-mark-all-btn" title="Mark all as read" style="display:none;">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          Mark all read
        </button>
      </div>
      <div id="notif-loading" class="text-center py-12" style="color: var(--text-muted); font-size: 0.9rem;">
        Loading notifications...
      </div>
      <ul id="notif-list" class="notif-list" style="display:none;"></ul>
      <div id="notif-empty" class="text-center py-12" style="display:none; color: var(--text-secondary);">
        <p style="font-size: 1.25rem;">No notifications yet.</p>
        <p style="font-size: 0.875rem; margin-top: 0.5rem;">When someone likes or comments on your poems, you'll see them here!</p>
      </div>
      <div id="notif-load-more" style="display:none; text-align:center; padding: 1.5rem 0;">
        <button id="notif-more-btn" class="notif-more-btn">Load more</button>
      </div>
    </div>`;

  const listEl = document.getElementById('notif-list');
  const loadingEl = document.getElementById('notif-loading');
  const emptyEl = document.getElementById('notif-empty');
  const loadMoreEl = document.getElementById('notif-load-more');
  const moreBtn = document.getElementById('notif-more-btn');
  const markAllBtn = document.getElementById('notif-mark-all');

  let offset = 0;
  let allLoaded = false;

  async function loadPage() {
    try {
      const notifs = await fetchNotifications(currentUser.id, { limit: PAGE_SIZE, offset });

      if (offset === 0 && notifs.length === 0) {
        loadingEl.style.display = 'none';
        emptyEl.style.display = 'block';
        markAllBtn.style.display = 'none';
        return;
      }

      loadingEl.style.display = 'none';
      listEl.style.display = '';
      markAllBtn.style.display = 'inline-flex';

      notifs.forEach(n => {
        listEl.insertAdjacentHTML('beforeend', renderNotifItem(n));
      });

      offset += notifs.length;
      if (notifs.length < PAGE_SIZE) {
        allLoaded = true;
        loadMoreEl.style.display = 'none';
      } else {
        loadMoreEl.style.display = '';
      }
    } catch (err) {
      loadingEl.innerHTML = `<p style="color:var(--error);">Failed to load notifications.</p>`;
      console.error('Notifications fetch error:', err);
    }
  }

  // Initial load
  await loadPage();

  // Load more
  if (moreBtn) {
    moreBtn.addEventListener('click', async () => {
      moreBtn.disabled = true;
      moreBtn.textContent = 'Loading...';
      await loadPage();
      moreBtn.disabled = false;
      moreBtn.textContent = 'Load more';
    });
  }

  // Click to navigate to poem + mark as read
  listEl.addEventListener('click', async (e) => {
    const item = e.target.closest('.notif-item');
    if (!item) return;
    const nid = item.dataset.nid;
    const pid = item.dataset.pid;
    // Mark as read
    if (item.classList.contains('notif-unread')) {
      try {
        await markAsRead(nid);
        item.classList.remove('notif-unread');
        const dot = item.querySelector('.notif-dot');
        if (dot) dot.remove();
        // Update badges
        const count = await fetchUnreadCount(currentUser.id);
        updateNotifBadges(count);
      } catch (err) {
        console.error('Mark read error:', err);
      }
    }
    // Navigate to poem
    if (pid) {
      const ptitle = item.dataset.ptitle;
      navigate(poemPath({ id: pid, title: ptitle }));
    }
  });

  // Mark all as read
  if (markAllBtn) {
    markAllBtn.addEventListener('click', async () => {
      try {
        await markAllAsRead(currentUser.id);
        listEl.querySelectorAll('.notif-unread').forEach(el => {
          el.classList.remove('notif-unread');
          const dot = el.querySelector('.notif-dot');
          if (dot) dot.remove();
        });
        updateNotifBadges(0);
        utils.showToast(dom, 'All notifications marked as read', 2000, 'success');
      } catch (err) {
        console.error('Mark all read error:', err);
        utils.showToast(dom, 'Failed to mark all as read', 2000, 'error');
      }
    });
  }
}
