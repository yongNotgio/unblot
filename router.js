// Router module for Poetry Share app
import { fetchCurrentUser } from './auth.js';
import { utils } from './utils.js';
import { dom } from './dom.js';

export function setupRouter(routes, supabase) {
  function navigate(hash) {
    window.location.hash = hash;
  }
  function getRoute() {
    const hash = window.location.hash || '#home';
    const [route, param] = hash.split('/');
    return { route, param };
  }
  async function routeHandler() {
    utils.showLoading(dom, false);
    await fetchCurrentUser(supabase);
    const { route, param } = getRoute();
    if (routes[route]) {
      await routes[route](param);
    } else {
      await routes['#home']();
    }
  }
  window.addEventListener('hashchange', routeHandler);
  return { navigate, routeHandler };
}
