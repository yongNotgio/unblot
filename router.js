// Router module using Navigo for Poetry Share app
import { fetchCurrentUser, currentUser } from './auth.js';
import { utils } from './utils.js';
import { dom } from './dom.js';

let router = null;

/**
 * Navigate to a route programmatically
 */
export function navigate(path) {
  if (router) {
    router.navigate(path);
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
 * Setup Navigo router with routes
 */
export function setupRouter(routes) {
  router = new Navigo('/', { hash: true });
  
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
        const hash = window.location.hash.replace('#/', '').replace('#', '').split('/')[0].split('?')[0];
        updateNavActiveState(hash || 'home');
      }, 10);
    }
  });

  // Protected routes that require authentication
  const protectedRoutes = ['/my-poems', '/add-poem', '/edit-poem', '/admin'];
  
  function isProtected(path) {
    return protectedRoutes.some(r => path.startsWith(r));
  }

  // Define routes
  router
    .on('/', async () => {
      await routes['#home'](null, 1);
    })
    .on('/home', async ({ params }) => {
      const page = params?.page ? parseInt(params.page) : 1;
      await routes['#home'](null, page);
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
    .on('/view-poem/:id', async ({ data, params }) => {
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
      // Fallback to home
      await routes['#home'](null, 1);
    });

  // Resolve the initial route
  router.resolve();
  
  return router;
}
