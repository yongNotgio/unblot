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
  const navUserProfile = document.getElementById('nav-user-profile');
  const navAuthSection = document.getElementById('nav-auth-section');
  const navUserName = document.getElementById('nav-user-name');
  const navLiked = document.getElementById('nav-liked');
  const navHistory = document.getElementById('nav-history');

  if (currentUser) {
    if (dom.navLogin) dom.navLogin.classList.add('hidden');
    if (dom.navRegister) dom.navRegister.classList.add('hidden');
    if (dom.navLogout) dom.navLogout.classList.remove('hidden');
    if (dom.navMyPoems) dom.navMyPoems.classList.remove('hidden');
    if (dom.navAddPoem) dom.navAddPoem.classList.remove('hidden');
    if (navLiked) navLiked.classList.remove('hidden');
    if (navHistory) navHistory.classList.remove('hidden');

    // Hide auth section, show user profile
    if (navAuthSection) navAuthSection.style.display = 'none';
    if (navUserProfile) navUserProfile.classList.remove('hidden');

    if (dom.currentUserId) {
      dom.currentUserId.textContent = '';
      dom.currentUserId.classList.add('hidden');
    }
    // Show avatar (anonymous)
    if (navAvatar) {
      navAvatar.classList.remove('hidden');
      if (avatarInitial) avatarInitial.textContent = 'U';
      if (navUserName) navUserName.textContent = 'Poet';
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
    if (navLiked) navLiked.classList.add('hidden');
    if (navHistory) navHistory.classList.add('hidden');

    // Show auth section, hide user profile
    if (navAuthSection) navAuthSection.style.display = '';
    if (navUserProfile) navUserProfile.classList.add('hidden');

    if (dom.currentUserId) dom.currentUserId.classList.add('hidden');
    if (navAvatar) navAvatar.classList.add('hidden');
    if (typeof window.setNavAuthState === 'function') window.setNavAuthState(false, false);
  }
}
