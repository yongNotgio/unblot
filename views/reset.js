// views/reset.js
// Password reset view
import { utils } from '../utils.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../env.js';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function renderReset(dom) {
  dom.app.innerHTML = `
    <form id="reset-form" class="cozy-card flex flex-col gap-4" style="max-width: 400px; margin: 0 auto;">
      <h2 class="text-2xl font-bold mb-2 text-center" style="font-family: 'EB Garamond', serif; color: var(--main-blue);">Reset Password</h2>
      <input type="email" id="reset-email" class="rounded-lg border border-blue-200 px-3 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition" placeholder="Email" required />
      <button type="submit" class="nav-btn">Send Reset Link</button>
      <button type="button" id="to-login" class="text-blue-600 underline">Back to Login</button>
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