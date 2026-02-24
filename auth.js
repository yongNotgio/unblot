// Auth module for Poetry Share app
import { dom } from './dom.js';
import { utils } from './utils.js';
import { getCurrentUser, refreshUser, clearUserCache } from './utils/supabase.js';
import { ADMIN_USER_IDS } from './env.js';

export let currentUser = null;

/**
 * Fetch current user with caching - only hits network on first call or after auth changes
 */
export async function fetchCurrentUser() {
  currentUser = await getCurrentUser();
  updateNav();
  return currentUser;
}

/**
 * Force refresh user from server (use after login/logout)
 */
export async function forceRefreshUser() {
  currentUser = await refreshUser();
  updateNav();
  return currentUser;
}

/**
 * Clear user cache on logout
 */
export function clearUser() {
  clearUserCache();
  currentUser = null;
  updateNav();
}

export function updateNav() {
  const navAvatar = document.getElementById('nav-user-avatar');
  const avatarInitial = document.getElementById('nav-avatar-initial');
  if (currentUser) {
    if (dom.navLogin) dom.navLogin.classList.add('hidden');
    if (dom.navRegister) dom.navRegister.classList.add('hidden');
    if (dom.navLogout) dom.navLogout.classList.remove('hidden');
    if (dom.navMyPoems) dom.navMyPoems.classList.remove('hidden');
    if (dom.navAddPoem) dom.navAddPoem.classList.remove('hidden');
    if (dom.currentUserId) {
      dom.currentUserId.textContent = `User: ${currentUser.id}`;
      dom.currentUserId.classList.remove('hidden');
    }
    // Show avatar
    if (navAvatar) {
      navAvatar.classList.remove('hidden');
      if (avatarInitial) {
        const email = currentUser.email || currentUser.id || 'U';
        avatarInitial.textContent = email.charAt(0).toUpperCase();
      }
    }
    // Show admin button only for admin users
    const isAdminUser = ADMIN_USER_IDS.includes(currentUser.id);
    if (dom.navAdmin) {
      if (isAdminUser) dom.navAdmin.classList.remove('hidden');
      else dom.navAdmin.classList.add('hidden');
    }
    if (typeof window.setNavAuthState === 'function') window.setNavAuthState(true, isAdminUser);
  } else {
    if (dom.navLogin) dom.navLogin.classList.remove('hidden');
    if (dom.navRegister) dom.navRegister.classList.add('hidden');
    if (dom.navLogout) dom.navLogout.classList.add('hidden');
    if (dom.navMyPoems) dom.navMyPoems.classList.add('hidden');
    if (dom.navAddPoem) dom.navAddPoem.classList.add('hidden');
    if (dom.navAdmin) dom.navAdmin.classList.add('hidden');
    if (dom.currentUserId) dom.currentUserId.classList.add('hidden');
    if (navAvatar) navAvatar.classList.add('hidden');
    if (typeof window.setNavAuthState === 'function') window.setNavAuthState(false, false);
  }
}
