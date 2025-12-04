// views/reset.js
// Password reset view
import { utils } from '../utils.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../env.js';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function renderReset(dom) {
  // Check for Supabase password reset link (type=recovery in hash)
  const hash = window.location.hash;
  const isRecovery = hash.includes('type=recovery');
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const accessToken = params.get('access_token');
  if (isRecovery && accessToken) {
    // Show new password form
    dom.app.innerHTML = `
      <div class="w-full max-w-md mx-auto animate-fade-in">
        <form id="new-password-form" class="cozy-card">
          <div class="text-center mb-8">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔐</div>
            <h2 class="section-header" style="margin-bottom: 0.5rem;">Set New Password</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Choose a secure password for your account</p>
          </div>
          <div class="flex flex-col gap-5">
            <div class="relative">
              <input type="password" id="new-password" class="modern-input" placeholder="New password" required minlength="6" />
              <svg class="absolute right-4 top-1/2 transform -translate-y-1/2" width="18" height="18" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <button type="submit" class="action-btn action-btn-primary w-full justify-center py-3" style="font-size: 1rem;">Update Password</button>
          </div>
        </form>
      </div>
    `;
    document.getElementById('new-password-form').onsubmit = async (e) => {
      e.preventDefault();
      utils.showLoading(dom, true);
      const newPassword = document.getElementById('new-password').value;
      try {
        // Set the access_token for this session
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: params.get('refresh_token') });
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        utils.showToast(dom, 'Password updated! You can now log in.');
        setTimeout(() => window.location.hash = '#login', 2000);
      } catch (err) {
        utils.showModal(dom, 'Password update failed: ' + (err.message || err));
      } finally {
        utils.showLoading(dom, false);
      }
    };
  } else {
    // Show email form to request reset link
    dom.app.innerHTML = `
      <div class="w-full max-w-md mx-auto animate-fade-in">
        <form id="reset-form" class="cozy-card">
          <div class="text-center mb-8">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔑</div>
            <h2 class="section-header" style="margin-bottom: 0.5rem;">Reset Password</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">We'll send you a link to reset your password</p>
          </div>
          <div class="flex flex-col gap-5">
            <div class="relative">
              <input type="email" id="reset-email" class="modern-input" placeholder="Email address" required />
              <svg class="absolute right-4 top-1/2 transform -translate-y-1/2" width="18" height="18" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <button type="submit" class="action-btn action-btn-primary w-full justify-center py-3" style="font-size: 1rem;">Send Reset Link</button>
          </div>
          <div class="text-center mt-6 pt-6" style="border-top: 1px solid var(--border);">
            <button type="button" id="to-login" style="color: var(--primary); font-weight: 600; background: none; border: none; cursor: pointer; font-size: 0.875rem;">← Back to Sign In</button>
          </div>
        </form>
      </div>
    `;
    document.getElementById('to-login').onclick = () => window.location.hash = '#login';
    document.getElementById('reset-form').onsubmit = async (e) => {
      e.preventDefault();
      utils.showLoading(dom, true);
      const email = document.getElementById('reset-email').value;
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        utils.showToast(dom, 'Password reset email sent! Check your inbox.');
        setTimeout(() => window.location.hash = '#login', 2000);
      } catch (err) {
        utils.showModal(dom, 'Reset failed: ' + (err.message || err));
      } finally {
        utils.showLoading(dom, false);
      }
    };
  }
}