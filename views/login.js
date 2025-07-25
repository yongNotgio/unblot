// views/login.js
// Login view
import { utils } from '../utils.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../env.js';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function renderLogin(dom) {
  dom.app.innerHTML = `
    <form id="login-form" class="cozy-card flex flex-col gap-4" style="max-width: 400px; margin: 0 auto;">
      <h2 class="text-2xl font-bold mb-2 text-center" style="font-family: 'EB Garamond', serif; color: var(--main-blue);">Login</h2>
      <input type="email" id="login-email" class="rounded-lg border border-blue-200 px-3 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition" placeholder="Email" required />
      <input type="password" id="login-password" class="rounded-lg border border-blue-200 px-3 py-2 bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition" placeholder="Password" required />
      <button type="submit" class="nav-btn">Login</button>
      <button type="button" id="to-reset" class="text-blue-600">Forgot Password?</button>
      <button type="button" id="to-register" class="text-blue-600 ">New here? Register</button>
      
    </form>
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