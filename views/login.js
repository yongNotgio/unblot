// views/login.js
// Login view
import { utils } from '../utils.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../env.js';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function renderLogin(dom) {
  dom.app.innerHTML = `
    <form id="login-form" class="max-w-md mx-auto p-6 bg-white rounded-lg shadow flex flex-col gap-4">
      <h2 class="text-2xl font-bold mb-2 text-center">Login</h2>
      <input type="email" id="login-email" class="rounded-lg border px-3 py-2" placeholder="Email" required />
      <input type="password" id="login-password" class="rounded-lg border px-3 py-2" placeholder="Password" required />
      <button type="submit" class="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold">Login</button>
      <button type="button" id="to-register" class="text-blue-600 underline">Don't have an account? Register</button>
      <button type="button" id="to-reset" class="text-blue-600 underline">Forgot password?</button>
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