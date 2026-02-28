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

  // --- Prompt Day Tag ---
  promptDayTag(promptDate, promptTitle = '') {
    if (!promptDate) return '';
    const d = new Date(promptDate + 'T00:00:00');
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const titleText = promptTitle ? ` &middot; ${utils.escapeHTML(promptTitle)}` : '';
    return `<span class="prompt-day-tag" data-prompt-date="${promptDate}" title="Click to view prompt details"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>${label}${titleText}</span>`;
  },

  // --- Show Prompt Details Modal ---
  async showPromptDetails(dom, promptDate) {
    if (!promptDate) return;
    try {
      const { supabase } = await import('./utils/supabase.js');
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('active_date', promptDate)
        .single();
      if (error || !data) {
        utils.showModal(dom, 'Prompt details not found for this date.');
        return;
      }
      const d = new Date(promptDate + 'T00:00:00');
      const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const modalMsg = `\u{1F4A1} Daily Prompt \u2014 ${dateLabel}`;
      dom.modalMessage.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;">${dateLabel}</div>
          <div style="font-family: 'EB Garamond', Georgia, serif; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.75rem;">${utils.escapeHTML(data.title)}</div>
          <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">${utils.escapeHTML(data.description || 'Write a poem inspired by this prompt.')}</div>
        </div>`;
      dom.modalActions.innerHTML = '';
      const btn = document.createElement('button');
      btn.textContent = 'Close';
      btn.className = 'action-btn action-btn-secondary';
      btn.onclick = () => utils.hideModal(dom);
      dom.modalActions.appendChild(btn);
      dom.modalBg.classList.remove('hidden');
    } catch (e) {
      utils.showModal(dom, 'Could not load prompt details.');
    }
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

  /**
   * Opens a fullscreen lightbox for an image. Click anywhere to close.
   */
  openImageLightbox(src) {
    const lb = document.createElement('div');
    lb.className = 'image-lightbox';
    lb.innerHTML = `
      <button class="image-lightbox-close" title="Close">&times;</button>
      <img src="${src}" alt="Full image" />
    `;
    const close = () => lb.remove();
    lb.addEventListener('click', close);
    lb.querySelector('img').addEventListener('click', (e) => e.stopPropagation());
    lb.querySelector('.image-lightbox-close').addEventListener('click', close);
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
    });
    document.body.appendChild(lb);
  },

  /**
   * Opens a crop/pan modal for the given image file or URL.
   * Accepts a File object or a URL string.
   * Returns a Promise that resolves with { file: File, dataUrl: string } or null if cancelled.
   */
  openImageCropper(source) {
    return new Promise((resolve) => {
      function startCropper(imgSrc, fileName) {

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'image-crop-overlay';
        overlay.innerHTML = `
          <div class="image-crop-modal">
            <div class="image-crop-header">
              <div>
                <h3>Adjust Image</h3>
                <p>Drag to reposition &middot; Scroll or slide to zoom</p>
              </div>
            </div>
            <div class="image-crop-viewport" id="crop-viewport">
              <img id="crop-img" src="${imgSrc}" draggable="false" crossorigin="anonymous" />
            </div>
            <div class="image-crop-controls">
              <label>Zoom</label>
              <input type="range" id="crop-zoom" min="100" max="300" value="100" step="1" />
            </div>
            <div class="image-crop-actions">
              <button type="button" class="action-btn action-btn-secondary" id="crop-cancel">Cancel</button>
              <button type="button" class="action-btn action-btn-primary" id="crop-confirm">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                Crop &amp; Use
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);

        const viewport = overlay.querySelector('#crop-viewport');
        const img = overlay.querySelector('#crop-img');
        const zoomSlider = overlay.querySelector('#crop-zoom');
        const cancelBtn = overlay.querySelector('#crop-cancel');
        const confirmBtn = overlay.querySelector('#crop-confirm');

        let scale = 1;
        let imgX = 0, imgY = 0;
        let dragging = false;
        let dragStartX = 0, dragStartY = 0;
        let startImgX = 0, startImgY = 0;
        let naturalW = 0, naturalH = 0;

        // Shared mouse handlers (need outer scope for cleanup)
        function onMouseMove(ev) {
          if (!dragging) return;
          imgX = startImgX + (ev.clientX - dragStartX);
          imgY = startImgY + (ev.clientY - dragStartY);
          if (_applyTransform) _applyTransform();
        }
        function onMouseUp() { dragging = false; }
        let _applyTransform = null;

        function cleanup() {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          overlay.remove();
        }

        // Wait for image to load to get natural dimensions
        const imgEl = new Image();
        imgEl.crossOrigin = 'anonymous';
        imgEl.onload = () => {
          naturalW = imgEl.naturalWidth;
          naturalH = imgEl.naturalHeight;

          // Fit image to fill the viewport initially
          const vpRect = viewport.getBoundingClientRect();
          const scaleW = vpRect.width / naturalW;
          const scaleH = vpRect.height / naturalH;
          const fitScale = Math.max(scaleW, scaleH);
          // Use fitScale as our base (100% on slider)
          const baseScale = fitScale;

          function applyTransform() {
            const currentScale = baseScale * scale;
            const displayW = naturalW * currentScale;
            const displayH = naturalH * currentScale;
            img.style.width = displayW + 'px';
            img.style.height = displayH + 'px';

            // Clamp so viewport is always filled
            const maxX = 0;
            const minX = vpRect.width - displayW;
            const maxY = 0;
            const minY = vpRect.height - displayH;
            imgX = Math.min(maxX, Math.max(minX, imgX));
            imgY = Math.min(maxY, Math.max(minY, imgY));
            img.style.left = imgX + 'px';
            img.style.top = imgY + 'px';
          }
          _applyTransform = applyTransform;

          // Initial position — centered
          const initW = naturalW * baseScale;
          const initH = naturalH * baseScale;
          imgX = (vpRect.width - initW) / 2;
          imgY = (vpRect.height - initH) / 2;
          applyTransform();

          // Zoom slider
          zoomSlider.addEventListener('input', () => {
            const oldScale = scale;
            scale = parseInt(zoomSlider.value) / 100;
            // Zoom toward center of viewport
            const cx = vpRect.width / 2;
            const cy = vpRect.height / 2;
            imgX = cx - (cx - imgX) * (scale / oldScale);
            imgY = cy - (cy - imgY) * (scale / oldScale);
            applyTransform();
          });

          // Mouse wheel zoom
          viewport.addEventListener('wheel', (ev) => {
            ev.preventDefault();
            const oldScale = scale;
            const delta = ev.deltaY > 0 ? -5 : 5;
            const newVal = Math.min(300, Math.max(100, parseInt(zoomSlider.value) + delta));
            zoomSlider.value = newVal;
            scale = newVal / 100;
            const rect = viewport.getBoundingClientRect();
            const cx = ev.clientX - rect.left;
            const cy = ev.clientY - rect.top;
            imgX = cx - (cx - imgX) * (scale / oldScale);
            imgY = cy - (cy - imgY) * (scale / oldScale);
            applyTransform();
          }, { passive: false });

          // Drag to pan (mouse)
          viewport.addEventListener('mousedown', (ev) => {
            ev.preventDefault();
            dragging = true;
            dragStartX = ev.clientX;
            dragStartY = ev.clientY;
            startImgX = imgX;
            startImgY = imgY;
          });
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);

          // Drag to pan (touch)
          viewport.addEventListener('touchstart', (ev) => {
            if (ev.touches.length === 1) {
              dragging = true;
              dragStartX = ev.touches[0].clientX;
              dragStartY = ev.touches[0].clientY;
              startImgX = imgX;
              startImgY = imgY;
            }
          }, { passive: true });
          viewport.addEventListener('touchmove', (ev) => {
            if (!dragging || ev.touches.length !== 1) return;
            ev.preventDefault();
            imgX = startImgX + (ev.touches[0].clientX - dragStartX);
            imgY = startImgY + (ev.touches[0].clientY - dragStartY);
            applyTransform();
          }, { passive: false });
          viewport.addEventListener('touchend', () => { dragging = false; });

          // Cancel
          cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(null);
          });

          // Confirm — render to canvas
          confirmBtn.addEventListener('click', () => {
            const canvas = document.createElement('canvas');
            canvas.width = vpRect.width * 2;   // 2x for retina
            canvas.height = vpRect.height * 2;
            const ctx = canvas.getContext('2d');
            const currentScale = baseScale * scale;
            const sx = -imgX / currentScale;
            const sy = -imgY / currentScale;
            const sw = vpRect.width / currentScale;
            const sh = vpRect.height / currentScale;
            ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              const croppedFile = new File([blob], fileName.replace(/\.[^.]+$/, '') + '_cropped.jpg', { type: 'image/jpeg' });
              const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
              cleanup();
              resolve({ file: croppedFile, dataUrl });
            }, 'image/jpeg', 0.92);
          });
        };
        imgEl.src = imgSrc;
      }

      // Accept File or URL string
      if (typeof source === 'string') {
        startCropper(source, 'image');
      } else {
        const reader = new FileReader();
        reader.onload = (e) => startCropper(e.target.result, source.name || 'image');
        reader.readAsDataURL(source);
      }
    });
  },
};
