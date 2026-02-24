// Notifications view placeholder
export function renderNotifications(dom) {
  dom.app.innerHTML = `
    <div style="max-width:700px;margin:2rem auto;padding:0 1rem;">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:3rem 2rem;text-align:center;">
        <div style="font-size:3rem;margin-bottom:1rem;">🔔</div>
        <h2 style="font-family:'Playfair Display',serif;font-size:1.75rem;color:var(--text-primary);margin-bottom:0.5rem;">Notifications</h2>
        <p style="color:var(--text-secondary);font-size:1rem;line-height:1.6;max-width:400px;margin:0 auto;">
          Stay updated on likes, comments, and new followers. Coming soon.
        </p>
      </div>
    </div>`;
}
