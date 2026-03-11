import { utils } from '../utils.js';
import { supabase } from '../utils/supabase.js';
import { navigate } from '../router.js';

export function renderRegister(dom) {
  dom.app.innerHTML = `
    <div class="w-full max-w-md mx-auto animate-fade-in">
      <form id="register-form" class="cozy-card">
        <div class="text-center mb-8">

          <h2 class="section-header" style="margin-bottom: 0.5rem;">Join Unblot</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Start your journey of sharing poetry</p>
        </div>
        <div class="flex flex-col gap-5">
          <div class="relative">
            <input type="email" id="register-email" class="modern-input" placeholder="Email address" required />
            <svg class="absolute right-4 top-1/2 transform -translate-y-1/2" width="18" height="18" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div class="relative">
            <input type="password" id="register-password" class="modern-input" placeholder="Create password" required style="padding-right: 48px;" />
            <button type="button" id="toggle-register-password" class="absolute right-4 top-1/2 transform -translate-y-1/2" style="background: none; border: none; cursor: none; padding: 4px; color: var(--text-muted); display: flex; align-items: center; justify-content: center;" title="Toggle password visibility">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="eye-icon">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="eye-off-icon" style="display: none;">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <button type="submit" class="action-btn action-btn-primary w-full justify-center py-3" style="font-size: 1rem;">
            Create Account
          </button>
        </div>
        <div class="text-center mt-6 pt-6" style="border-top: 1px solid var(--border);">
          <button type="button" id="to-login" style="color: var(--primary); font-weight: 600; background: none; border: none; cursor: pointer; font-size: 0.875rem;">
            Already have an account? Sign in →
          </button>
        </div>
      </form>
    </div>
  `;
  document.getElementById('to-login').onclick = () => navigate('/login');
  
  // Password visibility toggle
  const toggleBtn = document.getElementById('toggle-register-password');
  const passwordInput = document.getElementById('register-password');
  const eyeIcon = toggleBtn.querySelector('.eye-icon');
  const eyeOffIcon = toggleBtn.querySelector('.eye-off-icon');
  
  toggleBtn.onclick = () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    eyeIcon.style.display = isPassword ? 'none' : 'block';
    eyeOffIcon.style.display = isPassword ? 'block' : 'none';
  };
  
  document.getElementById('register-form').onsubmit = async (e) => {
    e.preventDefault();
    utils.showLoading(dom, true);
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      utils.showToast(dom, 'Registration successful! Please check your email to confirm.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      utils.showModal(dom, 'Registration failed: ' + (err.message || err));
    } finally {
      utils.showLoading(dom, false);
    }
  };
} 