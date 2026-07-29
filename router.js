// Router module using Navigo for Poetry Share app.
//
// Uses the History API (clean paths like /poem/<slug>-<uuid>) rather than hash
// fragments. Search engines never treat a #fragment as a distinct URL, so hash
// routing made every page but the home page impossible to index. Vercel rewrites
// unknown paths to index.html so deep links resolve.

import { fetchCurrentUser, currentUser } from './auth.js';
import { utils } from './utils.js';
import { dom } from './dom.js';
import { extractPoemId } from './shared/site.js';

let router = null;

/**
 * Navigate to a route programmatically
 */
export function navigate(path) {
  if (router) {
    router.navigate(path);
  } else {
    window.location.assign(path);
  }
}

/**
 * Hide view toggle containers (called before each route)
 */
function hideViewToggles() {
  const headerToggleContainer = document.getElementById('header-view-toggle-container');
  if (headerToggleContainer) {
    headerToggleContainer.classList.add('hidden');
  }
  const mobileHeaderToggleContainer = document.getElementById('mobile-header-toggle-container');
  if (mobileHeaderToggleContainer) {
    mobileHeaderToggleContainer.classList.add('hidden');
  }
}

/**
 * Cleanup view change handlers
 */
function cleanupViewHandlers() {
  if (window._homeViewChangeHandler) {
    window.removeEventListener('viewModeChanged', window._homeViewChangeHandler);
    window._homeViewChangeHandler = null;
  }
  if (window._discoverViewChangeHandler) {
    window.removeEventListener('viewModeChanged', window._discoverViewChangeHandler);
    window._discoverViewChangeHandler = null;
  }
}

/**
 * Update nav active states based on current route
 */
function updateNavActiveState(route) {
  // Sidebar nav buttons
  const navMap = {
    'home': 'nav-home',
    '': 'nav-home',
    'discover': 'nav-discover',
    'trending': 'nav-trending',
    'collections': 'nav-collections',
    'notifications': 'nav-notifications',
    'my-poems': 'nav-my-poems',
    'liked': 'nav-liked',
    'history': 'nav-history',
    'add-poem': 'nav-add-poem',
    'login': 'nav-login',
    'register': 'nav-register',
    'admin': 'nav-admin',
  };

  // Remove all active states from nav links
  const allNavBtns = document.querySelectorAll('.nav-sidebar-btn, .compose-btn');
  allNavBtns.forEach(btn => btn.classList.remove('nav-active'));

  // Set active on matching button
  const activeId = navMap[route];
  if (activeId) {
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('nav-active');
  }
}

/**
 * Treat ordinary in-app <a href="/..."> clicks as SPA navigation.
 *
 * Poem links are rendered as real anchors so that crawlers can follow them and
 * users can middle-click or copy them; this keeps that markup from costing a
 * full page reload.
 */
function interceptInternalLinks() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const link = e.target.closest('a[href]');
    if (!link) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download') || link.getAttribute('rel') === 'external') return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return;
    // Anything the SPA does not own (assets, the APK download) should load normally.
    if (/\.[a-z0-9]+$/i.test(url.pathname) || url.pathname.startsWith('/api/')) return;

    e.preventDefault();
    navigate(url.pathname + url.search);
  });
}

/**
 * Setup Navigo router with routes
 */
export function setupRouter(routes) {
  router = new Navigo('/');

  // Before hook - runs before every route, fetches user with caching
  router.hooks({
    before: async (done) => {
      utils.showLoading(dom, false);
      await fetchCurrentUser();
      hideViewToggles();
      cleanupViewHandlers();

      // Scroll to top on every route change
      window.scrollTo(0, 0);

      done();
    },
    after: () => {
      // Update nav active state after route completes
      setTimeout(() => {
        const segment = window.location.pathname.split('/').filter(Boolean)[0] || 'home';
        updateNavActiveState(segment);
      }, 10);
    }
  });

  // Define routes
  router
    .on('/', async () => {
      await routes['#home'](null, 1);
    })
    .on('/home', async ({ params }) => {
      const page = params?.page ? parseInt(params.page) : 1;
      await routes['#home'](null, page);
    })
    .on('/about', async () => {
      await routes['#about']();
    })
    .on('/poems', async ({ params }) => {
      const page = params?.page ? parseInt(params.page) : 1;
      await routes['#poems'](page);
    })
    .on('/login', async () => {
      await routes['#login']();
    })
    .on('/register', async () => {
      await routes['#register']();
    })
    .on('/reset', async () => {
      await routes['#reset']();
    })
    .on('/discover', async ({ params }) => {
      const page = params?.page ? parseInt(params.page) : 1;
      await routes['#discover'](params?.q || null, page);
    })
    .on('/my-poems', async ({ params }) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      const page = params?.page ? parseInt(params.page) : 1;
      await routes['#my-poems'](null, page);
    }, {
      before: (done) => {
        if (!currentUser) {
          done(false);
          navigate('/login');
        } else {
          done();
        }
      }
    })
    .on('/add-poem', async ({ params }) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      await routes['#add-poem'](params?.prompt_title || null);
    }, {
      before: (done) => {
        if (!currentUser) {
          done(false);
          navigate('/login');
        } else {
          done();
        }
      }
    })
    // Canonical poem URL. The slug is decorative; the trailing UUID identifies the poem.
    .on('/poem/:slug', async ({ data }) => {
      const id = extractPoemId(data.slug);
      if (!id) {
        await routes['#not-found']();
        return;
      }
      await routes['#view-poem'](id);
    })
    // Pre-clean-URL links still in the wild.
    .on('/view-poem/:id', async ({ data }) => {
      await routes['#view-poem'](data.id);
    })
    .on('/edit-poem/:id', async ({ data }) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      await routes['#edit-poem'](data.id);
    }, {
      before: (done) => {
        if (!currentUser) {
          done(false);
          navigate('/login');
        } else {
          done();
        }
      }
    })
    .on('/admin', async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      await routes['#admin']();
    }, {
      before: (done) => {
        if (!currentUser) {
          done(false);
          navigate('/login');
        } else {
          done();
        }
      }
    })
    .on('/trending', async () => {
      await routes['#trending']();
    })
    .on('/collections', async () => {
      await routes['#collections']();
    })
    .on('/notifications', async () => {
      if (!currentUser) { navigate('/login'); return; }
      await routes['#notifications']();
    }, {
      before: (done) => {
        if (!currentUser) { done(false); navigate('/login'); } else { done(); }
      }
    })
    .on('/liked', async () => {
      if (!currentUser) { navigate('/login'); return; }
      await routes['#liked']();
    }, {
      before: (done) => {
        if (!currentUser) { done(false); navigate('/login'); } else { done(); }
      }
    })
    .on('/history', async () => {
      if (!currentUser) { navigate('/login'); return; }
      await routes['#history']();
    }, {
      before: (done) => {
        if (!currentUser) { done(false); navigate('/login'); } else { done(); }
      }
    })
    .notFound(async () => {
      // A real 404 view. Falling back to the home feed made every mistyped URL
      // look like a valid page, which search engines record as a soft 404.
      await routes['#not-found']();
    });

  interceptInternalLinks();

  // Resolve the initial route
  router.resolve();

  return router;
}
