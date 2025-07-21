// utils/imageExport.js
// Export a poem as an image using html2canvas
export async function exportPoemAsImage(poemId) {
  const poemElem = document.querySelector(`[data-poem-id='${poemId}']`);
  if (!poemElem) return;
  const html2canvas = (await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm')).default;
  const canvas = await html2canvas(poemElem, { backgroundColor: null });
  const link = document.createElement('a');
  link.download = `poem-${poemId}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  setTimeout(() => document.body.removeChild(link), 100);
  // Fallback: open image in new tab if download is blocked
  setTimeout(() => {
    if (!link.download) {
      window.open(link.href, '_blank');
    }
  }, 200);
}
