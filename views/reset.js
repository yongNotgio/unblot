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
      <form id="new-password-form" class="cozy-card flex flex-col gap-4" style="max-width: 400px; margin: 0 auto;">
        <h2 class="text-2xl font-bold mb-2 text-center" style="font-family: 'EB Garamond', serif; color: var(--main-blue);">Set New Password</h2>
        <input type="password" id="new-password" class="rounded-lg border border-blue-200 px-3 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition" placeholder="New Password" required minlength="6" />
        <button type="submit" class="nav-btn">Update Password</button>
      </form>
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
      <form id="reset-form" class="cozy-card flex flex-col gap-4" style="max-width: 400px; margin: 0 auto;">
        <h2 class="text-2xl font-bold mb-2 text-center" style="font-family: 'EB Garamond', serif; color: var(--main-blue);">Send Link</h2>
        <input type="email" id="reset-email" class="rounded-lg border border-blue-200 px-3 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition" placeholder="Email" required />
        <button type="submit" class="nav-btn">Send Link</button>
        <button type="button" id="to-login" class="text-blue-600 ">Back to Login</button>
      </form>
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