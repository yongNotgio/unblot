// Utility functions for the Poetry Share app
export const utils = {
  showLoading(dom, show = true) {
    dom.loading.classList.toggle('hidden', !show);
  },
  showModal(dom, message, actions = []) {
    dom.modalMessage.textContent = message;
    dom.modalMessage.style.fontFamily = "'Quicksand', sans-serif";
    dom.modalMessage.style.textAlign = "center";
    dom.modalActions.innerHTML = '';
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
  showToast(dom, message, duration = 2000) {
    utils.showModal(dom, message);
    dom.modalMessage.style.fontFamily = "'Quicksand', sans-serif";
    dom.modalMessage.style.textAlign = "center";
    setTimeout(() => utils.hideModal(dom), duration);
  },
  parseTags(str) {
    return str.split(',').map(t => t.trim()).filter(Boolean);
  },
  tagsToString(tags) {
    return Array.isArray(tags) ? tags.join(', ') : '';
  },
  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c];
    });
  },
  formatDate(date) {
    return new Date(date).toLocaleString();
  },
  createPaginationControls(paginationData, onPageChange, baseRoute = '') {
    const { page, totalPages, hasNextPage, hasPrevPage } = paginationData;
    
    if (totalPages <= 1) return '';
    
    let paginationHTML = '<div class="flex justify-center items-center gap-2 mt-6 mb-4">';
    
    // Previous button
    if (hasPrevPage) {
      paginationHTML += `
        <button class="pagination-btn nav-btn px-3 py-2 text-sm" data-page="${page - 1}" data-base-route="${baseRoute}">
          ← Previous
        </button>
      `;
    } else {
      paginationHTML += `
        <button class="pagination-btn nav-btn px-3 py-2 text-sm opacity-50 cursor-not-allowed" disabled>
          ← Previous
        </button>
      `;
    }
    
    // Page numbers (show up to 5 pages around current page)
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    
    if (startPage > 1) {
      paginationHTML += `
        <button class="pagination-btn nav-btn px-3 py-2 text-sm" data-page="1" data-base-route="${baseRoute}">1</button>
      `;
      if (startPage > 2) {
        paginationHTML += '<span class="px-2 text-gray-500">...</span>';
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === page;
      const activeClass = isActive ? ' pagination-active' : '';
      paginationHTML += `
        <button class="pagination-btn nav-btn px-3 py-2 text-sm${activeClass}" data-page="${i}" data-base-route="${baseRoute}" ${isActive ? 'disabled' : ''}>
          ${i}
        </button>
      `;
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += '<span class="px-2 text-gray-500">...</span>';
      }
      paginationHTML += `
        <button class="pagination-btn nav-btn px-3 py-2 text-sm" data-page="${totalPages}" data-base-route="${baseRoute}">
          ${totalPages}
        </button>
      `;
    }
    
    // Next button
    if (hasNextPage) {
      paginationHTML += `
        <button class="pagination-btn nav-btn px-3 py-2 text-sm" data-page="${page + 1}" data-base-route="${baseRoute}">
          Next →
        </button>
      `;
    } else {
      paginationHTML += `
        <button class="pagination-btn nav-btn px-3 py-2 text-sm opacity-50 cursor-not-allowed" disabled>
          Next →
        </button>
      `;
    }
    
    paginationHTML += '</div>';
    
    return paginationHTML;
  },
  attachPaginationHandlers(onPageChange) {
    // Remove existing handlers
    const existingBtns = document.querySelectorAll('.pagination-btn');
    existingBtns.forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    
    // Attach new handlers
    const paginationBtns = document.querySelectorAll('.pagination-btn');
    paginationBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(btn.getAttribute('data-page'));
        const baseRoute = btn.getAttribute('data-base-route') || '';
        
        if (page && !btn.disabled) {
          // Update URL with page parameter
          let newHash = baseRoute;
          if (page > 1) {
            const separator = newHash.includes('?') ? '&' : '?';
            newHash += `${separator}page=${page}`;
          }
          
          // Update URL and call the page change handler
          window.location.hash = newHash;
          if (onPageChange) {
            onPageChange(page);
          }
        }
      });
    });
  },
};
