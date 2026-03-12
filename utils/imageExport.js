// utils/imageExport.js
// Export a poem as an image using html2canvas

const COLOR_SCHEMES = {
  cream: {
    name: 'Warm Cream',
    background: '#f0ebe0',
    textColor: '#0f0e0b',
    brandColor: '#c17445',
    contentBg: '#ffffff',
    contentTextColor: '#0f0e0b',
    borderColor: '#0f0e0b',
    type: 'solid'
  },
  paper: {
    name: 'Classic Paper',
    background: '#ffffff',
    textColor: '#0f0e0b',
    brandColor: '#c17445',
    contentBg: '#f0ebe0',
    contentTextColor: '#0f0e0b',
    borderColor: '#0f0e0b',
    type: 'solid'
  },
  rust: {
    name: 'Bold Rust',
    background: '#c17445',
    textColor: '#ffffff',
    brandColor: '#ffffff',
    contentBg: '#f0ebe0',
    contentTextColor: '#0f0e0b',
    borderColor: '#0f0e0b',
    type: 'solid'
  },
  midnight: {
    name: 'Midnight Ink',
    background: '#0f0e0b',
    textColor: '#f0ebe0',
    brandColor: '#d4a574',
    contentBg: '#1a1916',
    contentTextColor: '#f0ebe0',
    borderColor: '#d4a574',
    type: 'solid'
  },
  gold: {
    name: 'Golden Hour',
    background: '#d4a574',
    textColor: '#0f0e0b',
    brandColor: '#0f0e0b',
    contentBg: '#f0ebe0',
    contentTextColor: '#0f0e0b',
    borderColor: '#0f0e0b',
    type: 'solid'
  },
  minimal: {
    name: 'Minimal White',
    background: '#ffffff',
    textColor: '#0f0e0b',
    brandColor: '#0f0e0b',
    contentBg: '#ffffff',
    contentTextColor: '#0f0e0b',
    borderColor: '#0f0e0b',
    type: 'solid'
  }
};

// Create and show color scheme selection modal
function showColorSchemeModal(poemId) {
  return new Promise((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: var(--paper, #ffffff);
      border: 3px solid var(--ink, #0f0e0b);
      padding: 32px;
      max-width: 700px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.1);
    `;

    modal.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px 0; font-family: 'Playfair Display', serif; font-size: 28px; color: var(--ink, #0f0e0b); font-weight: 700;">Choose Export Style</h2>
        <p style="margin: 0; color: var(--text-muted, #0f0e0b); font-size: 15px; opacity: 0.7;">Select a color scheme for your poem image</p>
      </div>
      <div id="color-schemes-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;"></div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancel-export" style="
          padding: 12px 24px;
          border: 2px solid var(--ink, #0f0e0b);
          background: var(--paper, #ffffff);
          color: var(--ink, #0f0e0b);
          font-weight: 600;
          cursor: none;
          font-size: 14px;
          box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.1);
          transition: all 0.15s;
        ">Cancel</button>
      </div>
    `;

    // Create color scheme options
    const grid = modal.querySelector('#color-schemes-grid');
    Object.entries(COLOR_SCHEMES).forEach(([key, scheme]) => {
      const option = document.createElement('div');
      
      // Set background based on scheme type
      option.style.cssText = `
        border: 3px solid ${scheme.borderColor};
        padding: 20px;
        cursor: none;
        transition: all 0.15s;
        background: ${scheme.background};
        box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.1);
      `;
      
      option.innerHTML = `
        <div style="
          background: ${scheme.contentBg};
          border: 2px solid ${scheme.borderColor};
          padding: 16px;
          margin-bottom: 12px;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        ">
          <div style="
            font-family: 'Playfair Display', serif;
            font-weight: 700;
            color: ${scheme.contentTextColor};
            font-size: 18px;
            margin-bottom: 6px;
          ">Sample Poem Title</div>
          <div style="
            color: ${scheme.contentTextColor};
            font-size: 13px;
            line-height: 1.6;
            opacity: 0.8;
          ">This is how your poem will look in this scheme...</div>
        </div>
        <div style="
          color: ${scheme.textColor};
          font-weight: 700;
          font-size: 15px;
          text-align: center;
          font-family: 'Playfair Display', serif;
        ">${scheme.name}</div>
      `;

      option.addEventListener('mouseenter', () => {
        option.style.transform = 'translate(-2px, -2px)';
        option.style.boxShadow = '6px 6px 0 rgba(0, 0, 0, 0.15)';
      });

      option.addEventListener('mouseleave', () => {
        option.style.transform = 'translate(0, 0)';
        option.style.boxShadow = '4px 4px 0 rgba(0, 0, 0, 0.1)';
      });

      option.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(key);
      });

      grid.appendChild(option);
    });

    // Cancel button
    const cancelBtn = modal.querySelector('#cancel-export');
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(null);
    });
    
    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.transform = 'translate(-2px, -2px)';
      cancelBtn.style.boxShadow = '5px 5px 0 rgba(0, 0, 0, 0.15)';
    });
    
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.transform = 'translate(0, 0)';
      cancelBtn.style.boxShadow = '3px 3px 0 rgba(0, 0, 0, 0.1)';
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        resolve(null);
      }
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  });
}

// Main export function that shows the color picker
export async function exportPoemAsImage(poemId) {
  try {
    console.log('Starting export for poem:', poemId);
    const selectedScheme = await showColorSchemeModal(poemId);
    if (!selectedScheme) {
      console.log('Export cancelled by user');
      return;
    }
    
    console.log('Selected scheme:', selectedScheme);
    return await generatePoemImage(poemId, selectedScheme);
  } catch (error) {
    console.error('Error in exportPoemAsImage:', error);
    alert('Failed to export poem. Please check the console for details.');
  }
}

// Internal function to generate the actual image
async function generatePoemImage(poemId, colorScheme = 'cream') {
  // Get the selected color scheme
  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.cream;
  
  // Import and fetch the full poem data from the database instead of DOM
  const { fetchPoemById } = await import('../poems.js');
  const poem = await fetchPoemById(poemId);
  
  if (!poem) {
    console.error('Poem not found');
    return;
  }

  // Use the full poem data from the database
  const title = poem.title || '';
  const content = poem.content || '';  // This gets the full content, not truncated
  const tags = poem.tags || [];
  
  // Format tags for display
  const tagsString = Array.isArray(tags) ? tags.join(', ') : (tags || '');
  
  // Create styled container
  const container = document.createElement('div');
  
  // Set background
  container.style.background = colors.background;
  container.style.border = `4px solid ${colors.borderColor}`;
  container.style.boxShadow = '12px 12px 0 rgba(0, 0, 0, 0.15)';
  container.style.padding = '48px';
  container.style.fontFamily = "'Playfair Display', serif";
  container.style.color = colors.textColor;
  container.style.width = '700px';
  container.style.maxWidth = '100%';

  // Header: brand text and tagline (no logo icon)
  container.innerHTML = `
    <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:3px solid ${colors.borderColor};">
      <div style="font-family:'Playfair Display',serif;font-size:2.2rem;color:${colors.brandColor};font-weight:900;letter-spacing:-0.02em;line-height:1;">Un<span style="color:${colors.brandColor};">blot</span></div>
      <div style="font-family:'Playfair Display',serif;font-size:0.95rem;color:${colors.textColor};font-style:italic;margin-top:6px;opacity:0.7;">For the words that won't disappear.</div>
    </div>
    <div style="background:${colors.contentBg};border:3px solid ${colors.borderColor};box-shadow:6px 6px 0 rgba(0, 0, 0, 0.1);padding:32px;margin:24px 0;">
      <div style="font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:900;color:${colors.contentTextColor};margin-bottom:20px;line-height:1.2;letter-spacing:-0.02em;">${title}</div>
      <div style="font-size:1.1em;line-height:1.8;color:${colors.contentTextColor};white-space:pre-line;font-family:'EB Garamond',serif;">${content}</div>
    </div>
    <div style="font-size:0.85rem;color:${colors.textColor};text-align:right;opacity:0.6;font-weight:600;font-family:'Space Mono',monospace;margin-top:16px;">www.unblot.app</div>
  `;
  
  document.body.appendChild(container);
  
  // Wait for images to load before capturing
  const images = container.querySelectorAll('img');
  await Promise.all(Array.from(images).map(img => {
    return new Promise((resolve) => {
      if (img.complete) {
        resolve();
      } else {
        img.onload = resolve;
        img.onerror = resolve; // Still resolve even if image fails to load
      }
    });
  }));
  
  // Small additional delay to ensure rendering is complete
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const html2canvas = (await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm')).default;
  const canvas = await html2canvas(container, { 
    backgroundColor: null,
    scale: 2, // Higher quality
    useCORS: true, // Allow cross-origin images
    allowTaint: true // Allow tainted canvas
  });
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

// Export the color schemes for use in other parts of the app if needed
export { COLOR_SCHEMES };
