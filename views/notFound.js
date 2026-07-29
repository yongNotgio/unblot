// Real 404 view. The router used to fall back to the home feed for any unknown
// path, which made every bad URL look like a valid page to a crawler (a soft 404).

import { setNotFoundSeo } from '../seo.js';

export function renderNotFound(dom) {
  setNotFoundSeo(window.location.pathname);

  dom.app.innerHTML = `<section class="seo-doc">
    <h1>Page not found</h1>
    <p class="seo-doc-lede">
      That link does not point to anything on Unblot. The poem may have been deleted,
      or the address may have been mistyped.
    </p>
    <div class="seo-cta">
      <a href="/">Back to the latest poems</a>
      <a href="/discover">Search the collection</a>
    </div>
    <nav class="seo-sitelinks" aria-label="Browse Unblot">
      <a href="/poems">All poems</a>
      <a href="/trending">Trending</a>
      <a href="/collections">Collections</a>
      <a href="/about">About Unblot</a>
    </nav>
  </section>`;
  window.scrollTo(0, 0);
}
