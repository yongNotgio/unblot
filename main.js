// Main entry for Poetry Share app
import { dom } from './dom.js';
import { utils } from './utils.js';
import { currentUser, fetchCurrentUser, forceRefreshUser, clearUser } from './auth.js';
import { setupRouter, navigate } from './router.js';
import { supabase } from './utils/supabase.js';
import { renderHome } from './views/home.js';
import { renderLogin } from './views/login.js';
import { renderRegister } from './views/register.js';
import { renderReset } from './views/reset.js';
import { renderMyPoems } from './views/myPoems.js';
import { renderAddPoem } from './views/addPoem.js';
import { renderViewPoem } from './views/viewPoem.js';
import { renderEditPoem } from './views/editPoem.js';
import { renderDiscover } from './views/discover.js';
import { renderAdmin } from './views/admin.js';

// --- VIEWS ---
const routes = {
  '#home': async (param, page) => { renderHome(dom, page); },
  '#login': async () => { renderLogin(dom); },
  '#register': async () => { renderRegister(dom); },
  '#reset': async () => { renderReset(dom); },
  '#discover': async (search, page) => { renderDiscover(dom, search, page); },
  '#my-poems': async (param, page) => { renderMyPoems(dom, page); },
  '#add-poem': async () => { renderAddPoem(dom); },
  '#view-poem': async (id) => { renderViewPoem(dom, id); },
  '#edit-poem': async (id) => { renderEditPoem(dom, id); },
  '#admin': async () => { renderAdmin(dom); },
};

// --- DISCOVER TAB HANDLER ---
dom.navDiscover.onclick = (e) => { e.preventDefault(); navigate('/discover'); };
if (dom.navHome) dom.navHome.onclick = (e) => { e.preventDefault(); navigate('/home'); };

// --- ROUTER ---
const router = setupRouter(routes);

// --- NAVIGATION BAR HANDLERS ---
dom.navLogin.onclick = (e) => { e.preventDefault(); navigate('/login'); };
dom.navRegister.onclick = (e) => { e.preventDefault(); navigate('/register'); };
dom.navMyPoems.onclick = (e) => { e.preventDefault(); navigate('/my-poems'); };
dom.navAddPoem.onclick = (e) => { e.preventDefault(); navigate('/add-poem'); };
if (dom.navAdmin) dom.navAdmin.onclick = (e) => { e.preventDefault(); navigate('/admin'); };
dom.currentUserId.onclick = (e) => { e.preventDefault(); navigate('/my-poems'); };
export async function handleLogout(e) {
  if (e) e.preventDefault();
  utils.showLoading(dom, true);
  try {
    await supabase.auth.signOut();
    clearUser();
    utils.showToast(dom, 'Logged out!');
    setTimeout(() => navigate('/home'), 1000);
  } catch (err) {
    utils.showModal(dom, 'Logout failed: ' + (err.message || err), [
      { label: 'OK', className: 'action-btn action-btn-primary' }
    ]);
  } finally {
    utils.showLoading(dom, false);
  }
}
if (dom.navLogout) dom.navLogout.onclick = handleLogout;

dom.modalBg.onclick = e => { if (e.target === dom.modalBg) utils.hideModal(dom); };

// --- INITIAL LOAD ---
// Router initializes and handles initial route automatically

// --- SEARCH BAR HANDLER ---
if (dom.headerSearchForm && dom.headerSearchInput) {
  dom.headerSearchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = dom.headerSearchInput.value.trim();
    if (query) {
      navigate(`/discover?q=${encodeURIComponent(query)}`);
    }
  });
}

// Mobile searchbar expand/collapse
if (dom.headerSearchIcon && dom.headerSearchFormMobile && dom.headerSearchInputMobile) {
  dom.headerSearchIcon.addEventListener('click', function() {
    // Show mobile searchbar, focus input
    dom.headerSearchFormMobile.style.display = 'flex';
    dom.headerSearchInputMobile.focus();
    dom.headerSearchIcon.style.display = 'none';
  });
  // Hide mobile searchbar on blur (optional, or add a close button if needed)
  dom.headerSearchInputMobile.addEventListener('blur', function() {
    setTimeout(() => {
      dom.headerSearchFormMobile.style.display = 'none';
      dom.headerSearchIcon.style.display = 'flex';
    }, 200);
  });
  dom.headerSearchFormMobile.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = dom.headerSearchInputMobile.value.trim();
    if (query) {
      navigate(`/discover?q=${encodeURIComponent(query)}`);
      dom.headerSearchFormMobile.style.display = 'none';
      dom.headerSearchIcon.style.display = 'flex';
    }
  });
}
