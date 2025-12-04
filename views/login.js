// views/login.js
// Login view
import { utils } from '../utils.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../env.js';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function renderLogin(dom) {
  dom.app.innerHTML = `
    <div class="w-full max-w-md mx-auto animate-fade-in">
      <form id="login-form" class="cozy-card">
        <div class="text-center mb-8">

          <h2 class="section-header" style="margin-bottom: 0.5rem;">Welcome Back</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Sign in to continue sharing your poetry</p>
        </div>
        <div class="flex flex-col gap-5">
          <div class="relative">
            <input type="email" id="login-email" class="modern-input" placeholder="Email address" required />
            <svg class="absolute right-4 top-1/2 transform -translate-y-1/2" width="18" height="18" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div class="relative">
            <input type="password" id="login-password" class="modern-input" placeholder="Password" required />
            <svg class="absolute right-4 top-1/2 transform -translate-y-1/2" width="18" height="18" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <button type="submit" class="action-btn action-btn-primary w-full justify-center py-3" style="font-size: 1rem;">
            Sign In
          </button>
        </div>
        <div class="flex flex-col gap-3 mt-6 pt-6" style="border-top: 1px solid var(--border);">
          <button type="button" id="to-reset" class="action-btn action-btn-secondary w-full justify-center">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/></svg>
            One tap sign-in
          </button>
          <button type="button" id="to-register" style="color: var(--primary); font-weight: 600; background: none; border: none; cursor: pointer; font-size: 0.875rem;">
            New here? Create an account →
          </button>
        </div>
      </form>
    </div>
  `;
  document.getElementById('to-register').onclick = () => window.location.hash = '#register';
  document.getElementById('to-reset').onclick = () => window.location.hash = '#reset';
  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    utils.showLoading(dom, true);
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      utils.showToast(dom, 'Login successful!');
      setTimeout(() => window.location.hash = '#my-poems', 1000);
    } catch (err) {
      utils.showModal(dom, 'Login failed: ' + (err.message || err));
    } finally {
      utils.showLoading(dom, false);
    }
  };
} 