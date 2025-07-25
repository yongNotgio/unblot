// views/discover.js
// Now simply re-exports the Home page logic for Discover, so both are unified
import { renderHome } from './home.js';

export async function renderDiscover(dom) {
  // Pass search query from hash to renderHome
  await renderHome(dom);
}
