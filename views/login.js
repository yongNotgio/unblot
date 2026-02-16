// views/login.js
// Login view with OTP support
import { utils } from '../utils.js';
import { supabase } from '../utils/supabase.js';
import { forceRefreshUser } from '../auth.js';
import { navigate } from '../router.js';

// Track OTP state
let otpEmail = '';
let otpSent = false;

export function renderLogin(dom) {
  if (otpSent) {
    renderOTPVerificationForm(dom);
  } else {
    renderLoginForm(dom);
  }
}

function renderLoginForm(dom) {
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
          <button type="button" id="otp-sign-in" class="action-btn action-btn-secondary w-full justify-center">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Sign in with code
          </button>
          <button type="button" id="to-reset" style="color: var(--text-secondary); background: none; border: none; cursor: pointer; font-size: 0.875rem;">
            Forgot password?
          </button>
          <button type="button" id="to-register" style="color: var(--primary); font-weight: 600; background: none; border: none; cursor: pointer; font-size: 0.875rem;">
            New here? Create an account →
          </button>
        </div>
      </form>
    </div>
  `;
  
  document.getElementById('to-register').onclick = () => navigate('/register');
  document.getElementById('to-reset').onclick = () => navigate('/reset');
  
  // OTP sign-in button
  document.getElementById('otp-sign-in').onclick = async () => {
    const email = document.getElementById('login-email').value;
    if (!email) {
      utils.showModal(dom, 'Please enter your email address first');
      return;
    }
    
    utils.showLoading(dom, true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: { shouldCreateUser: false }
      });
      
      if (error) throw error;
      
      otpEmail = email;
      otpSent = true;
      utils.showToast(dom, 'Verification code sent! Check your email.');
      renderLogin(dom);
    } catch (err) {
      utils.showModal(dom, 'Failed to send code: ' + (err.message || err));
    } finally {
      utils.showLoading(dom, false);
    }
  };
  
  // Password sign-in form
  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    utils.showLoading(dom, true);
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await forceRefreshUser();
      utils.showToast(dom, 'Login successful!');
      setTimeout(() => navigate('/my-poems'), 1000);
    } catch (err) {
      utils.showModal(dom, 'Login failed: ' + (err.message || err));
    } finally {
      utils.showLoading(dom, false);
    }
  };
}

function renderOTPVerificationForm(dom) {
  dom.app.innerHTML = `
    <div class="w-full max-w-md mx-auto animate-fade-in">
      <form id="otp-form" class="cozy-card">
        <div class="text-center mb-8">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📬</div>
          <h2 class="section-header" style="margin-bottom: 0.5rem;">Enter Verification Code</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">We sent a 6-digit code to <strong>${otpEmail}</strong></p>
        </div>
        <div class="flex flex-col gap-5">
          <div class="relative">
            <input type="text" id="otp-code" class="modern-input" placeholder="Enter 6-digit code" 
                   required pattern="[0-9]{6}" maxlength="6" inputmode="numeric" 
                   style="text-align: center; font-size: 1.5rem; letter-spacing: 0.5rem;" />
          </div>
          <button type="submit" class="action-btn action-btn-primary w-full justify-center py-3" style="font-size: 1rem;">Verify & Sign In</button>
        </div>
        <div class="flex flex-col gap-3 mt-6 pt-6" style="border-top: 1px solid var(--border);">
          <button type="button" id="resend-otp" style="color: var(--primary); font-weight: 600; background: none; border: none; cursor: pointer; font-size: 0.875rem;">Resend Code</button>
          <button type="button" id="back-to-login" style="color: var(--text-secondary); background: none; border: none; cursor: pointer; font-size: 0.875rem;">← Back to login</button>
        </div>
      </form>
    </div>
  `;
  
  document.getElementById('back-to-login').onclick = () => {
    resetOTPState();
    renderLogin(dom);
  };
  
  document.getElementById('resend-otp').onclick = async () => {
    utils.showLoading(dom, true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: { shouldCreateUser: false }
      });
      if (error) throw error;
      utils.showToast(dom, 'New code sent!');
    } catch (err) {
      utils.showModal(dom, 'Failed to resend: ' + (err.message || err));
    } finally {
      utils.showLoading(dom, false);
    }
  };
  
  document.getElementById('otp-form').onsubmit = async (e) => {
    e.preventDefault();
    utils.showLoading(dom, true);
    const token = document.getElementById('otp-code').value;
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: token,
        type: 'email'
      });
      
      if (error) throw error;
      
      await forceRefreshUser();
      resetOTPState();
      utils.showToast(dom, 'Login successful!');
      setTimeout(() => navigate('/my-poems'), 1000);
    } catch (err) {
      utils.showModal(dom, 'Invalid code: ' + (err.message || err));
    } finally {
      utils.showLoading(dom, false);
    }
  };
}

function resetOTPState() {
  otpEmail = '';
  otpSent = false;
} 