// Utility functions for the Poetry Share app
const TOAST_ICONS = {
  default: '',
  success: '<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>',
  error: '<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
  warning: '<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
};

export const utils = {
  // --- Loading ---
  showLoading(dom, show = true) {
    if (show) {
      dom.loading.classList.remove('hidden', 'fade-out');
    } else {
      dom.loading.classList.add('fade-out');
      setTimeout(() => dom.loading.classList.add('hidden'), 300);
    }
  },

  // --- Modal ---
  showModal(dom, message, actions = []) {
    dom.modalMessage.textContent = message;
    dom.modalMessage.style.fontFamily = "'Quicksand', sans-serif";
    dom.modalMessage.style.textAlign = "center";
    dom.modalActions.innerHTML = '';
    if (actions.length === 0) {
      // Auto-dismiss info modal after 2.5s
      actions = [{ label: 'OK', className: 'action-btn action-btn-primary', onClick: null }];
    }
    actions.forEach(({ label, onClick, className = '' }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.className = `rounded-lg px-4 py-2 font-semibold ${className}`;
      btn.style.fontFamily = "'Quicksand', sans-serif";
      btn.style.textAlign = "center";
      btn.onclick = () => {
        utils.hideModal(dom);
        if (onClick) onClick();
      };
      dom.modalActions.appendChild(btn);
    });
    dom.modalBg.classList.remove('hidden');
  },

  hideModal(dom) {
    dom.modalBg.classList.add('hidden');
  },

  // --- Toast (real notifications) ---
  showToast(dom, message, duration = 2500, type = 'default') {
    const container = dom.toastContainer || document.getElementById('toast-container');
    if (!container) {
      // Fallback to modal if toast container doesn't exist
      utils.showModal(dom, message);
      setTimeout(() => utils.hideModal(dom), duration);
      return;
    }

    const toast = document.createElement('div');
    const icon = TOAST_ICONS[type] || TOAST_ICONS.default;
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `${icon}<span>${utils.escapeHTML(message)}</span>`;
    container.appendChild(toast);

    // Trigger show animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });
    });

    // Auto-dismiss
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('toast-hiding');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      // Safety cleanup
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 500);
    }, duration);
  },

  // --- Parsing & Formatting ---
  parseTags(str) {
    return str.split(',').map(t => t.trim()).filter(Boolean);
  },

  tagsToString(tags) {
    return Array.isArray(tags) ? tags.join(', ') : '';
  },

  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  },

  formatDate(date) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  },

  // --- Pagination (placeholder) ---
  createPaginationControls(paginationData, onPageChange, baseRoute = '') {
    return '';
  },

  attachPaginationHandlers(onPageChange) {
    const existingBtns = document.querySelectorAll('.pagination-btn');
    existingBtns.forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });

    const paginationBtns = document.querySelectorAll('.pagination-btn');
    paginationBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(btn.getAttribute('data-page'));
        const baseRoute = btn.getAttribute('data-base-route') || '';
        if (page && !btn.disabled) {
          let newHash = baseRoute;
          if (page > 1) {
            const separator = newHash.includes('?') ? '&' : '?';
            newHash += `${separator}page=${page}`;
          }
          window.location.hash = newHash;
          if (onPageChange) onPageChange(page);
        }
      });
    });
  },
};
