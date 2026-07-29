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
import { renderTrending } from './views/trending.js';
import { renderCollections } from './views/collections.js';
import { renderNotifications } from './views/notifications.js';
import { renderLiked } from './views/liked.js';
import { renderHistory } from './views/history.js';
import { renderAbout } from './views/about.js';
import { renderArchive } from './views/archive.js';
import { renderNotFound } from './views/notFound.js';
import { setRouteSeo } from './seo.js';

// --- VIEWS ---
// Each route sets its own head metadata before rendering. renderViewPoem sets
// its own (it needs the fetched poem to build the description and JSON-LD).
const routes = {
  '#home': async (param, page) => { setRouteSeo('/'); renderHome(dom, page); },
  '#login': async () => { setRouteSeo('/login'); renderLogin(dom); },
  '#register': async () => { setRouteSeo('/register'); renderRegister(dom); },
  '#reset': async () => { setRouteSeo('/reset'); renderReset(dom); },
  // Internal search results are deliberately kept out of the index — they are
  // thin, unbounded, and duplicate content that already exists on poem pages.
  '#discover': async (search, page) => {
    setRouteSeo(
      '/discover',
      search
        ? {
            title: `Poems matching “${search}” — Unblot`,
            path: `/discover?q=${encodeURIComponent(search)}`,
            noindex: true,
          }
        : {}
    );
    renderDiscover(dom, search, page);
  },
  '#my-poems': async (param, page) => { setRouteSeo('/my-poems'); renderMyPoems(dom, page); },
  '#add-poem': async (promptTitle) => { setRouteSeo('/add-poem'); renderAddPoem(dom, promptTitle); },
  '#view-poem': async (id) => { renderViewPoem(dom, id); },
  '#edit-poem': async (id) => { setRouteSeo('/edit-poem'); renderEditPoem(dom, id); },
  '#admin': async () => { setRouteSeo('/admin'); renderAdmin(dom); },
  '#trending': async () => { setRouteSeo('/trending'); renderTrending(dom); },
  '#collections': async () => { setRouteSeo('/collections'); renderCollections(dom); },
  '#notifications': async () => { setRouteSeo('/notifications'); renderNotifications(dom); },
  '#liked': async () => { setRouteSeo('/liked'); renderLiked(dom); },
  '#history': async () => { setRouteSeo('/history'); renderHistory(dom); },
  '#about': async () => { renderAbout(dom); },
  '#poems': async (page) => { renderArchive(dom, page); },
  '#not-found': async () => { renderNotFound(dom); },
};

// --- SIDEBAR NAV HANDLERS ---
if (dom.navHome) dom.navHome.onclick = (e) => { e.preventDefault(); navigate('/home'); };
if (dom.navDiscover) dom.navDiscover.onclick = (e) => { e.preventDefault(); navigate('/discover'); };
if (dom.navTrending) dom.navTrending.onclick = (e) => { e.preventDefault(); navigate('/trending'); };
if (dom.navCollections) dom.navCollections.onclick = (e) => { e.preventDefault(); navigate('/collections'); };
if (dom.navNotifications) dom.navNotifications.onclick = (e) => { e.preventDefault(); navigate('/notifications'); };
if (dom.navMyPoems) dom.navMyPoems.onclick = (e) => { e.preventDefault(); navigate('/my-poems'); };
if (dom.navLiked) dom.navLiked.onclick = (e) => { e.preventDefault(); navigate('/liked'); };
if (dom.navHistory) dom.navHistory.onclick = (e) => { e.preventDefault(); navigate('/history'); };
if (dom.navAddPoem) dom.navAddPoem.onclick = (e) => { e.preventDefault(); navigate('/add-poem'); };
if (dom.navAdmin) dom.navAdmin.onclick = (e) => { e.preventDefault(); navigate('/admin'); };
if (dom.navLogin) dom.navLogin.onclick = (e) => { e.preventDefault(); navigate('/login'); };
if (dom.navRegister) dom.navRegister.onclick = (e) => { e.preventDefault(); navigate('/register'); };

// --- ROUTER ---
const router = setupRouter(routes);

// --- LOGOUT ---
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

// Mobile searchbar expand/collapse (new mobile topbar)
if (dom.mobileSearchToggle && dom.mobileSearchBar && dom.mobileSearchForm && dom.mobileSearchInput && dom.mobileSearchClose) {
  dom.mobileSearchToggle.addEventListener('click', function() {
    dom.mobileSearchBar.style.display = 'block';
    dom.mobileSearchInput.focus();
  });
  dom.mobileSearchClose.addEventListener('click', function() {
    dom.mobileSearchBar.style.display = 'none';
    dom.mobileSearchInput.value = '';
  });
  dom.mobileSearchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = dom.mobileSearchInput.value.trim();
    if (query) {
      navigate(`/discover?q=${encodeURIComponent(query)}`);
      dom.mobileSearchBar.style.display = 'none';
      dom.mobileSearchInput.value = '';
    }
  });
}

// Legacy mobile searchbar expand/collapse
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
