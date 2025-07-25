// utils/imageExport.js
// Export a poem as an image using html2canvas
export async function exportPoemAsImage(poemId) {
  const poemElem = document.querySelector(`[data-poem-id='${poemId}']`);
  if (!poemElem) return;
  // Get poem data
  const title = poemElem.querySelector('.poem-title-link, .text-2xl, .text-xl, .font-bold')?.textContent || '';
  const content = poemElem.querySelector('.poem-content, .text-gray-700, .whitespace-pre-line, .whitespace-pre-wrap')?.textContent || '';
  const tags = poemElem.querySelector('.text-sm.text-gray-500')?.textContent || '';
  // Create styled container
  const container = document.createElement('div');
  container.style.background = 'linear-gradient(90deg, #e0e7ff 0%, #fff 100%)';
  container.style.borderRadius = '1.2em';
  container.style.boxShadow = '0 4px 24px 0 rgba(37,99,235,0.07)';
  container.style.padding = '2em 2.5em';
  container.style.fontFamily = "'Quicksand', 'EB Garamond', Arial, sans-serif";
  container.style.color = '#1e293b';
  container.style.width = '600px';
  container.style.maxWidth = '100%';
  // Header: logo and tagline
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.7em;margin-bottom:0.5em;">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;"><path d="M10 36 Q18 18 34 6 Q36 4 37 7 Q38 10 36 13 Q32 19 22 28 Q16 33 10 36 Z" fill="#44bfa3" stroke="#2563eb" stroke-width="2"/><path d="M13 33 Q20 25 32 13" stroke="#2563eb" stroke-width="2.2" fill="none"/></svg>
      <span style="font-family:'EB Garamond',serif;font-size:2rem;color:#2563eb;letter-spacing:0.04em;text-shadow:0 2px 8px #e0e7ff;font-weight:bold;display:flex;align-items:center;">Unblot</span>
    </div>
    <div style="font-family:'EB Garamond',serif;font-size:1.1em;color:#2563eb;font-style:italic;margin-bottom:1.5em;">For the words that won't disappear.</div>
    <div style="background:#fff;border-radius:1.2em;box-shadow:0 4px 24px 0 rgba(37,99,235,0.07);padding:1.5em 2em;margin-bottom:1em;">
      <div style="font-family:'EB Garamond',serif;font-size:1.5em;font-weight:bold;color:#2563eb;margin-bottom:0.5em;">${title}</div>
      <div style="font-size:1.15em;line-height:1.7;color:#334155;white-space:pre-line;margin-bottom:1em;">${content}</div>
    </div>
    <div style="font-size:0.9em;color:#a5b4fc;text-align:right;">unblot.vercel.app</div>
  `;
  document.body.appendChild(container);
  const html2canvas = (await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm')).default;
  const canvas = await html2canvas(container, { backgroundColor: null });
  const link = document.createElement('a');
  link.download = `poem-${poemId}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    document.body.removeChild(container);
  }, 100);
  // Fallback: open image in new tab if download is blocked
  setTimeout(() => {
    if (!link.download) {
      window.open(link.href, '_blank');
    }
  }, 200);
}
