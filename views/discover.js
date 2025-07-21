// views/discover.js
// Now simply re-exports the Home page logic for Discover, so both are unified
import { renderHome } from './home.js';

export async function renderDiscover(dom) {
  // Optionally, you can change the title to 'Discover' if needed, or just call renderHome
  await renderHome(dom);
}
