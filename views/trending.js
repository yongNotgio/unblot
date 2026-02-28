// Trending view placeholder
export function renderTrending(dom) {
  dom.app.innerHTML = `
    <div style="max-width:700px;margin:2rem auto;padding:0 1rem;">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:3rem 2rem;text-align:center;">
        <div style="font-size:3rem;margin-bottom:1rem;">🔥</div>
        <h2 style="font-size:1.75rem;color:var(--text-primary);margin-bottom:0.5rem;">Trending</h2>
        <p style="color:var(--text-secondary);font-size:1rem;line-height:1.6;max-width:400px;margin:0 auto;">
          Discover what's resonating with the community. Trending poems and poets coming soon.
        </p>
      </div>
    </div>`;
}
