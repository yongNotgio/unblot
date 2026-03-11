// Password reset view with OTP support
import { utils } from '../utils.js';
import { supabase } from '../utils/supabase.js';
import { navigate } from '../router.js';

let resetEmail = '';
let otpSent = false;
let otpVerified = false;

export function renderReset(dom) {
  const hash = window.location.hash;
  const isRecovery = hash.includes('type=recovery');
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const accessToken = params.get('access_token');
  
  if (isRecovery && accessToken) {
    // Legacy: Show new password form for magic link users
    renderNewPasswordForm(dom, accessToken, params.get('refresh_token'));
  } else if (otpVerified) {
    // Step 3: OTP verified, show new password form
    renderNewPasswordFormOTP(dom);
  } else if (otpSent) {
    // Step 2: OTP sent, show verification form
    renderOTPVerificationForm(dom);
  } else {
    // Step 1: Show email form to request OTP
    renderEmailForm(dom);
  }
}

function renderEmailForm(dom) {
  dom.app.innerHTML = `
    <div class="w-full max-w-md mx-auto animate-fade-in">
      <form id="reset-form" class="cozy-card">
        <div class="text-center mb-8">
          <svg width="64" height="64" fill="none" stroke="var(--rust)" stroke-width="2" viewBox="0 0 24 24" style="margin: 0 auto; display: block;">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <h2 class="section-header" style="margin-bottom: 0.5rem; margin-top: 1rem;">Reset Password</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">We'll send you a 6-digit code to verify your identity</p>
        </div>
        <div class="flex flex-col gap-5">
          <div class="relative">
            <input type="email" id="reset-email" class="modern-input" placeholder="Email address" required />
            <svg class="absolute right-4 top-1/2 transform -translate-y-1/2" width="18" height="18" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <button type="submit" class="action-btn action-btn-primary w-full justify-center py-3" style="font-size: 1rem;">Send Verification Code</button>
        </div>
        <div class="text-center mt-6 pt-6" style="border-top: 1px solid var(--border);">
          <button type="button" id="to-login" style="color: var(--primary); font-weight: 600; background: none; border: none; cursor: pointer; font-size: 0.875rem;">← Back to Sign In</button>
        </div>
      </form>
    </div>
  `;
  
  document.getElementById('to-login').onclick = () => {
    resetState();
    navigate('/login');
  };
  
  document.getElementById('reset-form').onsubmit = async (e) => {
    e.preventDefault();
    utils.showLoading(dom, true);
    resetEmail = document.getElementById('reset-email').value;
    
    try {
      // Send OTP for password recovery
      const { error } = await supabase.auth.signInWithOtp({
        email: resetEmail,
        options: {
          shouldCreateUser: false // Don't create new user, only send to existing
        }
      });
      
      if (error) throw error;
      
      otpSent = true;
      utils.showToast(dom, 'Verification code sent! Check your email.');
      renderReset(dom); // Re-render to show OTP form
    } catch (err) {
      utils.showModal(dom, 'Failed to send code: ' + (err.message || err));
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
          <svg width="64" height="64" fill="none" stroke="var(--rust)" stroke-width="2" viewBox="0 0 24 24" style="margin: 0 auto; display: block;">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <h2 class="section-header" style="margin-bottom: 0.5rem; margin-top: 1rem;">Enter Verification Code</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">We sent a 6-digit code to <strong>${resetEmail}</strong></p>
        </div>
        <div class="flex flex-col gap-5">
          <div class="relative">
            <input type="text" id="otp-code" class="modern-input" placeholder="Enter 6-digit code" 
                   required pattern="[0-9]{6}" maxlength="6" inputmode="numeric" 
                   style="text-align: center; font-size: 1.5rem; letter-spacing: 0.5rem;" />
          </div>
          <button type="submit" class="action-btn action-btn-primary w-full justify-center py-3" style="font-size: 1rem;">Verify Code</button>
        </div>
        <div class="flex flex-col gap-3 mt-6 pt-6" style="border-top: 1px solid var(--border);">
          <button type="button" id="resend-otp" style="color: var(--primary); font-weight: 600; background: none; border: none; cursor: pointer; font-size: 0.875rem;">Resend Code</button>
          <button type="button" id="change-email" style="color: var(--text-secondary); background: none; border: none; cursor: pointer; font-size: 0.875rem;">← Use different email</button>
        </div>
      </form>
    </div>
  `;
  
  document.getElementById('change-email').onclick = () => {
    resetState();
    renderReset(dom);
  };
  
  document.getElementById('resend-otp').onclick = async () => {
    utils.showLoading(dom, true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: resetEmail,
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
        email: resetEmail,
        token: token,
        type: 'email'
      });
      
      if (error) throw error;
      
      otpVerified = true;
      utils.showToast(dom, 'Code verified! Set your new password.');
      renderReset(dom); // Re-render to show password form
    } catch (err) {
      utils.showModal(dom, 'Invalid code: ' + (err.message || err));
    } finally {
      utils.showLoading(dom, false);
    }
  };
}

function renderNewPasswordFormOTP(dom) {
  dom.app.innerHTML = `
    <div class="w-full max-w-md mx-auto animate-fade-in">
      <form id="new-password-form" class="cozy-card">
        <div class="text-center mb-8">
          <svg width="64" height="64" fill="none" stroke="var(--rust)" stroke-width="2" viewBox="0 0 24 24" style="margin: 0 auto; display: block;">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <h2 class="section-header" style="margin-bottom: 0.5rem; margin-top: 1rem;">Set New Password</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Choose a secure password for your account</p>
        </div>
        <div class="flex flex-col gap-5">
          <div class="relative">
            <input type="password" id="new-password" class="modern-input" placeholder="New password" required minlength="6" style="padding-right: 48px;" />
            <button type="button" id="toggle-new-password" class="absolute right-4 top-1/2 transform -translate-y-1/2" style="background: none; border: none; padding: 0; cursor: none; width: 18px; height: 18px;" title="Toggle password visibility">
              <svg class="eye-icon" width="18" height="18" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg class="eye-off-icon" width="18" height="18" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24" style="display: none;">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <div class="relative">
            <input type="password" id="confirm-password" class="modern-input" placeholder="Confirm password" required minlength="6" style="padding-right: 48px;" />
            <button type="button" id="toggle-confirm-password" class="absolute right-4 top-1/2 transform -translate-y-1/2" style="background: none; border: none; padding: 0; cursor: none; width: 18px; height: 18px;" title="Toggle password visibility">
              <svg class="eye-icon" width="18" height="18" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg class="eye-off-icon" width="18" height="18" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24" style="display: none;">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <button type="submit" class="action-btn action-btn-primary w-full justify-center py-3" style="font-size: 1rem;">Update Password</button>
        </div>
      </form>
    </div>
  `;
  
  document.getElementById('new-password-form').onsubmit = async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
      utils.showModal(dom, 'Passwords do not match');
      return;
    }
    
    utils.showLoading(dom, true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      // Sign out after password change for security
      await supabase.auth.signOut();
      resetState();
      
      utils.showToast(dom, 'Password updated! Please sign in with your new password.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      utils.showModal(dom, 'Password update failed: ' + (err.message || err));
    } finally {
      utils.showLoading(dom, false);
    }
  };
  
  // Password visibility toggles
  const toggleNewPassword = document.getElementById('toggle-new-password');
  const newPasswordInput = document.getElementById('new-password');
  const eyeIconNew = toggleNewPassword.querySelector('.eye-icon');
  const eyeOffIconNew = toggleNewPassword.querySelector('.eye-off-icon');
  
  toggleNewPassword.onclick = () => {
    const isPassword = newPasswordInput.type === 'password';
    newPasswordInput.type = isPassword ? 'text' : 'password';
    eyeIconNew.style.display = isPassword ? 'none' : 'block';
    eyeOffIconNew.style.display = isPassword ? 'block' : 'none';
  };
  
  const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const eyeIconConfirm = toggleConfirmPassword.querySelector('.eye-icon');
  const eyeOffIconConfirm = toggleConfirmPassword.querySelector('.eye-off-icon');
  
  toggleConfirmPassword.onclick = () => {
    const isPassword = confirmPasswordInput.type === 'password';
    confirmPasswordInput.type = isPassword ? 'text' : 'password';
    eyeIconConfirm.style.display = isPassword ? 'none' : 'block';
    eyeOffIconConfirm.style.display = isPassword ? 'block' : 'none';
  };
}

// Legacy: for magic link users
function renderNewPasswordForm(dom, accessToken, refreshToken) {
  dom.app.innerHTML = `
    <div class="w-full max-w-md mx-auto animate-fade-in">
      <form id="new-password-form" class="cozy-card">
        <div class="text-center mb-8">
          <svg width="64" height="64" fill="none" stroke="var(--rust)" stroke-width="2" viewBox="0 0 24 24" style="margin: 0 auto; display: block;">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <h2 class="section-header" style="margin-bottom: 0.5rem; margin-top: 1rem;">Set New Password</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Choose a secure password for your account</p>
        </div>
        <div class="flex flex-col gap-5">
          <div class="relative">
            <input type="password" id="new-password" class="modern-input" placeholder="New password" required minlength="6" style="padding-right: 48px;" />
            <button type="button" id="toggle-new-password" class="absolute right-4 top-1/2 transform -translate-y-1/2" style="background: none; border: none; padding: 0; cursor: none; width: 18px; height: 18px;" title="Toggle password visibility">
              <svg class="eye-icon" width="18" height="18" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg class="eye-off-icon" width="18" height="18" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24" style="display: none;">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
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
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      utils.showToast(dom, 'Password updated! You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      utils.showModal(dom, 'Password update failed: ' + (err.message || err));
    } finally {
      utils.showLoading(dom, false);
    }
  };
  
  // Password visibility toggle
  const toggleNewPassword = document.getElementById('toggle-new-password');
  const newPasswordInput = document.getElementById('new-password');
  const eyeIcon = toggleNewPassword.querySelector('.eye-icon');
  const eyeOffIcon = toggleNewPassword.querySelector('.eye-off-icon');
  
  toggleNewPassword.onclick = () => {
    const isPassword = newPasswordInput.type === 'password';
    newPasswordInput.type = isPassword ? 'text' : 'password';
    eyeIcon.style.display = isPassword ? 'none' : 'block';
    eyeOffIcon.style.display = isPassword ? 'block' : 'none';
  };
}

function resetState() {
  resetEmail = '';
  otpSent = false;
  otpVerified = false;
}