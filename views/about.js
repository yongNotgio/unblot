// Client-side /about. Renders the exact same markup the server emits from
// api/about.js, so a crawled render and an in-app navigation never diverge.

import { aboutBodyHtml } from '../shared/content.js';
import { setRouteSeo } from '../seo.js';

export function renderAbout(dom) {
  dom.app.innerHTML = aboutBodyHtml();
  setRouteSeo('/about');
  window.scrollTo(0, 0);
}
