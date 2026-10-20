// Client-side /submit-poem view.
// Renders the exact same markup the server emits from api/submit.js,
// and dynamically updates the hero poem card with the most-interacted poem in real-time.

import { submissionsBodyHtml, updateHeroCardWithPoem } from '../shared/submissionsContent.js';
import { setRouteSeo } from '../seo.js';
import { fetchTrendingPoems } from '../poems.js';

export async function renderSubmitPoetry(dom) {
  dom.app.innerHTML = submissionsBodyHtml();
  setRouteSeo('/submit-poem');
  window.scrollTo(0, 0);

  // Dynamically load the poem with the most interactions and show live metrics
  try {
    const trending = await fetchTrendingPoems(1);
    if (trending && trending.length > 0) {
      updateHeroCardWithPoem(trending[0]);
    }
  } catch (err) {
    console.warn('[renderSubmitPoetry] Failed to fetch top poem for hero card:', err);
  }
}
