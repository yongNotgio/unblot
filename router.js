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
    
    // Parse page parameter from URL
    let page = 1;
    if (param && param.includes('?')) {
      const [id, queryString] = param.split('?');
      const urlParams = new URLSearchParams(queryString);
      const pageParam = urlParams.get('page');
      if (pageParam) {
        page = parseInt(pageParam) || 1;
      }
      return { route, param: id, page };
    }
    
    return { route, param, page };
  }
  async function routeHandler() {
    utils.showLoading(dom, false);
    await fetchCurrentUser(supabase);
    const { route, param, page } = getRoute();
    if (routes[route]) {
      await routes[route](param, page);
    } else {
      await routes['#home'](param, page);
    }
  }
  window.addEventListener('hashchange', routeHandler);
  return { navigate, routeHandler };
}
