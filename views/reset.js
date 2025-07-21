// views/reset.js
// Password reset view
import { utils } from '../utils.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../env.js';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function renderReset(dom) {
  dom.app.innerHTML = `
    <form id="reset-form" class="max-w-md mx-auto p-6 bg-white rounded-lg shadow flex flex-col gap-4">
      <h2 class="text-2xl font-bold mb-2 text-center">Reset Password</h2>
      <input type="email" id="reset-email" class="rounded-lg border px-3 py-2" placeholder="Email" required />
      <button type="submit" class="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold">Send Reset Link</button>
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