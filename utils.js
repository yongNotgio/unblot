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
};
