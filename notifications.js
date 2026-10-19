// notifications.js
// Notification logic for Unblot — handles creation, fetching, badges, and realtime
import { supabase } from './utils/supabase.js';

/**
 * Create a notification for the poem author.
 * Skips self-notifications (when actor === recipient).
 * Silently ignores duplicate like notifications (unique index).
 */
export async function createNotification({ user_id, actor_id, type, poem_id, comment_id = null }) {
  if (!actor_id || !type || !poem_id) return null;

  let recipientId = user_id;
  if (!recipientId) {
    try {
      const { data } = await supabase.from('poems').select('user_id').eq('id', poem_id).single();
      recipientId = data?.user_id;
    } catch (e) {
      // ignore
    }
  }

  if (!recipientId) return null;

  const row = { user_id: recipientId, actor_id, type, poem_id };
  if (comment_id) row.comment_id = comment_id;

  const { error } = await supabase
    .from('notifications')
    .insert([row]);

  // Silently ignore duplicate like notifications (unique constraint)
  if (error && error.code === '23505') return null;
  if (error) {
    console.warn('createNotification failed:', error);
    return null;
  }
  return true;
}

/**
 * Fetch notifications for a user, newest first.
 * Joins poem title via poem_id.
 */
export async function fetchNotifications(userId, { limit = 20, offset = 0 } = {}) {
  let { data, error } = await supabase
    .from('notifications')
    .select('*, poems:poem_id(title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    // Resilient fallback: fetch notifications without join if FK is not yet cached
    const fallback = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (fallback.error) throw fallback.error;
    data = fallback.data;

    const poemIds = [...new Set((data || []).map(n => n.poem_id).filter(Boolean))];
    if (poemIds.length > 0) {
      const { data: poemsData } = await supabase.from('poems').select('id, title').in('id', poemIds);
      const titleMap = new Map((poemsData || []).map(p => [p.id, p.title]));
      return (data || []).map(n => ({
        ...n,
        poem_title: titleMap.get(n.poem_id) || null
      }));
    }
  }

  // Flatten poem title into each notification object
  return (data || []).map(n => ({
    ...n,
    poem_title: n.poems?.title || null,
    poems: undefined, // remove nested object
  }));
}

/**
 * Fetch unread notification count for a user.
 */
export async function fetchUnreadCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('fetchUnreadCount error:', error);
    return 0;
  }
  return count || 0;
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notifId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notifId);
  if (error) throw error;
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllAsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

/**
 * Delete a notification (e.g. on unlike).
 */
export async function deleteNotification({ actor_id, poem_id, type }) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('actor_id', actor_id)
    .eq('poem_id', poem_id)
    .eq('type', type);
  // Silently ignore errors — the notification might not exist
  if (error) console.error('deleteNotification error:', error);
}

/**
 * Update all notification badge indicators across the app.
 * - Sidebar badge (#nav-notif-badge)
 * - Desktop topbar dot (#topbar-notif-dot)
 * - Mobile topbar dot (#mobile-notif-dot)
 */
export function updateNotifBadges(count) {
  const sidebarBadge = document.getElementById('nav-notif-badge');
  const desktopDot = document.getElementById('topbar-notif-dot');
  const mobileDot = document.getElementById('mobile-notif-dot');

  if (sidebarBadge) {
    if (count > 0) {
      sidebarBadge.textContent = count > 99 ? '99+' : String(count);
      sidebarBadge.style.display = 'inline-block';
    } else {
      sidebarBadge.style.display = 'none';
    }
  }

  if (desktopDot) {
    desktopDot.style.display = count > 0 ? 'block' : 'none';
  }

  if (mobileDot) {
    mobileDot.style.display = count > 0 ? 'block' : 'none';
  }
}

/**
 * Subscribe to realtime notification inserts for the current user.
 * Returns the channel so it can be unsubscribed later.
 */
export function subscribeToNotifications(userId, callback) {
  const channel = supabase
    .channel('notif-' + userId.slice(0, 8))
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    );
  channel.subscribe();
  return channel;
}

/**
 * Initialize notification badges and realtime for the current user.
 * Called once on auth state change (login).
 * Returns cleanup function.
 */
export async function initNotifications(userId) {
  // Fetch initial unread count
  const count = await fetchUnreadCount(userId);
  updateNotifBadges(count);

  // Subscribe to realtime updates
  const channel = subscribeToNotifications(userId, async () => {
    // On new notification, re-fetch count
    const newCount = await fetchUnreadCount(userId);
    updateNotifBadges(newCount);
  });

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
    updateNotifBadges(0);
  };
}

