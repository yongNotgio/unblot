// Auth module for Poetry Share app
import { dom } from './dom.js';
import { utils } from './utils.js';

export let currentUser = null;

export async function fetchCurrentUser(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  updateNav();
  return user;
}

export function updateNav() {
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
    if (typeof window.setNavAuthState === 'function') window.setNavAuthState(true);
  } else {
    if (dom.navLogin) dom.navLogin.classList.remove('hidden');
    if (dom.navRegister) dom.navRegister.classList.remove('hidden');
    if (dom.navLogout) dom.navLogout.classList.add('hidden');
    if (dom.navMyPoems) dom.navMyPoems.classList.add('hidden');
    if (dom.navAddPoem) dom.navAddPoem.classList.add('hidden');
    if (dom.currentUserId) dom.currentUserId.classList.add('hidden');
    if (typeof window.setNavAuthState === 'function') window.setNavAuthState(false);
  }
}
