export function renderNotifications(dom) {
  dom.app.innerHTML = `
    <div style="max-width:700px;margin:2rem auto;padding:0 1rem;">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:3rem 2rem;text-align:center;">
        <svg width="64" height="64" fill="none" stroke="var(--rust)" stroke-width="2" viewBox="0 0 24 24" style="margin: 0 auto 1rem; display: block;">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <h2 style="font-size:1.75rem;color:var(--text-primary);margin-bottom:0.5rem;">Notifications</h2>
        <p style="color:var(--text-secondary);font-size:1rem;line-height:1.6;max-width:400px;margin:0 auto;">
          Stay updated on likes, comments, and new followers. Coming soon.
        </p>
      </div>
    </div>`;
}
