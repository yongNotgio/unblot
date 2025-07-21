// views/register.js
// Registration view
import { utils } from '../utils.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../env.js';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function renderRegister(dom) {
  dom.app.innerHTML = `
    <form id="register-form" class="cozy-card flex flex-col gap-4" style="max-width: 400px; margin: 0 auto;">
      <h2 class="text-2xl font-bold mb-2 text-center" style="font-family: 'EB Garamond', serif; color: var(--main-blue);">Register</h2>
      <input type="email" id="register-email" class="rounded-lg border border-blue-200 px-3 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition" placeholder="Email" required />
      <input type="password" id="register-password" class="rounded-lg border border-blue-200 px-3 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition" placeholder="Password" required />
      <button type="submit" class="nav-btn">Register</button>
      <button type="button" id="to-login" class="text-blue-600 underline">Already have an account? Login</button>
    </form>
  `;
  document.getElementById('to-login').onclick = () => window.location.hash = '#login';
  document.getElementById('register-form').onsubmit = async (e) => {
    e.preventDefault();
    utils.showLoading(dom, true);
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      utils.showToast(dom, 'Registration successful! Please check your email to confirm.');
      setTimeout(() => window.location.hash = '#login', 2000);
    } catch (err) {
      utils.showModal(dom, 'Registration failed: ' + (err.message || err));
    } finally {
      utils.showLoading(dom, false);
    }
  };
} 