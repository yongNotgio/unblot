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
    dom.navLogin.classList.add('hidden');
    dom.navRegister.classList.add('hidden');
    dom.navLogout.classList.remove('hidden');
    dom.navMyPoems.classList.remove('hidden');
    dom.navAddPoem.classList.remove('hidden');
    dom.currentUserId.textContent = `User: ${currentUser.id}`;
    dom.currentUserId.classList.remove('hidden');
  } else {
    dom.navLogin.classList.remove('hidden');
    dom.navRegister.classList.remove('hidden');
    dom.navLogout.classList.add('hidden');
    dom.navMyPoems.classList.add('hidden');
    dom.navAddPoem.classList.add('hidden');
    dom.currentUserId.classList.add('hidden');
  }
}
