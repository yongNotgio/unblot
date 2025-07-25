// Main entry for Poetry Share app
import { dom } from './dom.js';
import { utils } from './utils.js';
import { currentUser, fetchCurrentUser, updateNav } from './auth.js';
import { setupRouter } from './router.js';
import { renderHome } from './views/home.js';
import { renderLogin } from './views/login.js';
import { renderRegister } from './views/register.js';
import { renderReset } from './views/reset.js';
import { renderMyPoems } from './views/myPoems.js';
import { renderAddPoem } from './views/addPoem.js';
import { renderViewPoem } from './views/viewPoem.js';
import { renderEditPoem } from './views/editPoem.js';
import { renderDiscover } from './views/discover.js';

// --- ENVIRONMENT VARIABLES ---
const SUPABASE_URL = 'https://ioflunfjwnirkakrsxuw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZmx1bmZqd25pcmtha3JzeHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMDQ4MzIsImV4cCI6MjA2ODY4MDgzMn0.Ejp25pZKGCZn3H7FjB09phT8MaEuvXHX_afSMDIZUNg';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- VIEWS ---
// (You would import or define your view functions here, e.g. renderHome, renderLogin, etc.)
// For brevity, only a placeholder is shown:
const routes = {
  '#home': async () => { renderHome(dom); },
  '#login': async () => { renderLogin(dom); },
  '#register': async () => { renderRegister(dom); },
  '#reset': async () => { renderReset(dom); },
  '#discover': async () => { renderDiscover(dom); },
  '#my-poems': async () => { renderMyPoems(dom); },
  '#add-poem': async () => { renderAddPoem(dom); },
  '#view-poem': async (id) => { renderViewPoem(dom, id); },
  '#edit-poem': async (id) => { renderEditPoem(dom, id); },
};

// --- DISCOVER TAB HANDLER ---
dom.navDiscover.onclick = (e) => { e.preventDefault(); window.location.hash = '#discover'; };

// --- ROUTER ---
const { navigate, routeHandler } = setupRouter(routes, supabase);

// --- NAVIGATION BAR HANDLERS ---
dom.navLogin.onclick = (e) => { e.preventDefault(); window.location.hash = '#login'; };
dom.navRegister.onclick = (e) => { e.preventDefault(); window.location.hash = '#register'; };
dom.navMyPoems.onclick = (e) => { e.preventDefault(); window.location.hash = '#my-poems'; };
dom.navAddPoem.onclick = (e) => { e.preventDefault(); window.location.hash = '#add-poem'; };
dom.currentUserId.onclick = (e) => { e.preventDefault(); window.location.hash = '#my-poems'; };
export async function handleLogout(e) {
  if (e) e.preventDefault();
  utils.showLoading(dom, true);
  try {
    await supabase.auth.signOut();
    utils.showToast(dom, 'Logged out!');
    setTimeout(() => window.location.hash = '#home', 1000);
  } catch (err) {
    utils.showModal(dom, 'Logout failed: ' + (err.message || err), [
      { label: 'OK', className: 'bg-blue-600 text-white' }
    ]);
  } finally {
    utils.showLoading(dom, false);
  }
}
dom.navLogout.onclick = handleLogout;

dom.modalBg.onclick = e => { if (e.target === dom.modalBg) utils.hideModal(dom); };

// --- INITIAL LOAD ---
fetchCurrentUser(supabase).then(routeHandler);
