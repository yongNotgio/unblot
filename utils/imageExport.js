// utils/imageExport.js
// Export a poem as an image using html2canvas

const COLOR_SCHEMES = {
  lavender: {
    name: 'Soft Lavender',
    gradient: 'linear-gradient(135deg, #e8e4ff 0%, #f3f0ff 50%, #fff 100%)',
    textColor: '#4a5568',
    brandColor: '#7c3aed',
    contentBg: 'rgba(255, 255, 255, 0.85)',
    contentTextColor: '#2d3748',
    type: 'gradient'
  },
  blush: {
    name: 'Rose Blush',
    gradient: 'linear-gradient(135deg, #fed7d7 0%, #fed7e2 50%, #fef5e7 100%)',
    textColor: '#744210',
    brandColor: '#d53f8c',
    contentBg: 'rgba(255, 255, 255, 0.9)',
    contentTextColor: '#2d3748',
    type: 'gradient'
  },
  mint: {
    name: 'Fresh Mint',
    gradient: 'linear-gradient(135deg, #d4edda 0%, #e6fffa 50%, #f0fff4 100%)',
    textColor: '#276749',
    brandColor: '#38a169',
    contentBg: 'rgba(255, 255, 255, 0.85)',
    contentTextColor: '#2d3748',
    type: 'gradient'
  },
  sky: {
    name: 'Gentle Sky',
    gradient: 'linear-gradient(135deg, #e0f2fe 0%, #e6f3ff 50%, #f0f9ff 100%)',
    textColor: '#2b6cb0',
    brandColor: '#3182ce',
    contentBg: 'rgba(255, 255, 255, 0.9)',
    contentTextColor: '#2d3748',
    type: 'gradient'
  },
  peach: {
    name: 'Soft Peach',
    gradient: 'linear-gradient(135deg, #fed7cc 0%, #feebc8 50%, #fff5f5 100%)',
    textColor: '#c05621',
    brandColor: '#dd6b20',
    contentBg: 'rgba(255, 255, 255, 0.9)',
    contentTextColor: '#2d3748',
    type: 'gradient'
  },
  classic: {
    name: 'Classic Light',
    gradient: 'linear-gradient(135deg, #e0e7ff 0%, #f7fafc 50%, #fff 100%)',
    textColor: '#4a5568',
    brandColor: '#4f46e5',
    contentBg: 'rgba(255, 255, 255, 0.85)',
    contentTextColor: '#2d3748',
    type: 'gradient'
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
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    `;

    modal.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="margin: 0 0 8px 0; font-family: 'EB Garamond', serif; font-size: 24px; color: #2d3748;">Choose Export Style</h2>
        <p style="margin: 0; color: #718096; font-size: 14px;">Select a color scheme for your poem image</p>
      </div>
      <div id="color-schemes-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 20px;"></div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancel-export" style="
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #4a5568;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        ">Cancel</button>
      </div>
    `;

    // Create color scheme options
    const grid = modal.querySelector('#color-schemes-grid');
    Object.entries(COLOR_SCHEMES).forEach(([key, scheme]) => {
      const option = document.createElement('div');
      
      // Set background based on scheme type
      option.style.cssText = `
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s;
        background: ${scheme.gradient};
      `;
      
      option.innerHTML = `
        <div style="
          background: ${scheme.contentBg};
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 8px;
          min-height: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        ">
          <div style="
            font-family: 'EB Garamond', serif;
            font-weight: bold;
            color: ${scheme.brandColor};
            font-size: 16px;
            margin-bottom: 4px;
          ">Sample Poem Title</div>
          <div style="
            color: ${scheme.contentTextColor};
            font-size: 12px;
            line-height: 1.4;
          ">This is how your poem content will look in this beautiful color scheme...</div>
        </div>
        <div style="
          color: ${scheme.brandColor};
          font-weight: 600;
          font-size: 14px;
          text-align: center;
        ">${scheme.name}</div>
      `;

      option.addEventListener('mouseenter', () => {
        option.style.borderColor = scheme.brandColor;
        option.style.transform = 'translateY(-2px)';
        option.style.boxShadow = '0 8px 25px -5px rgba(0, 0, 0, 0.1)';
      });

      option.addEventListener('mouseleave', () => {
        option.style.borderColor = '#e2e8f0';
        option.style.transform = 'translateY(0)';
        option.style.boxShadow = 'none';
      });

      option.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(key);
      });

      grid.appendChild(option);
    });

    // Cancel button
    modal.querySelector('#cancel-export').addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(null);
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
async function generatePoemImage(poemId, colorScheme = 'classic') {
  // Get the selected color scheme
  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.classic;
  
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
  container.style.background = colors.gradient;
  container.style.borderRadius = '0';
  container.style.boxShadow = '0 4px 24px 0 rgba(37,99,235,0.07)';
  container.style.padding = '2em 2.5em';
  container.style.fontFamily = "'Quicksand', 'EB Garamond', Arial, sans-serif";
  container.style.color = colors.textColor;
  container.style.width = '600px';
  container.style.maxWidth = '100%';
  // Create an SVG logo that matches the color scheme
  function createColoredSVG(brandColor) {
    return `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
      <path d="M10 36 Q18 18 34 6 Q36 4 37 7 Q38 10 36 13 Q32 19 22 28 Q16 33 10 36 Z" fill="#44bfa3" stroke="${brandColor}" stroke-width="2"/>
      <path d="M13 33 Q20 25 32 13" stroke="${brandColor}" stroke-width="2.2" fill="none"/>
    </svg>`;
  }

  // Header: logo and tagline
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.7em;margin-bottom:0.5em;">
      ${createColoredSVG(colors.brandColor)}
      <span style="font-family:'EB Garamond',serif;font-size:2rem;color:${colors.brandColor};letter-spacing:0.04em;text-shadow:0 2px 8px #e0e7ff;font-weight:bold;display:flex;align-items:center;">Unblot</span>
    </div>
    <div style="font-family:'EB Garamond',serif;font-size:1.1em;color:${colors.brandColor};font-style:italic;margin-bottom:1.5em;">For the words that won't disappear.</div>
    <div style="background:${colors.contentBg};border-radius:1.2em;box-shadow:0 4px 24px 0 rgba(37,99,235,0.07);padding:1.5em 2em;margin-bottom:1em;">
      <div style="font-family:'EB Garamond',serif;font-size:1.5em;font-weight:bold;color:${colors.brandColor};margin-bottom:0.5em;">${title}</div>
      <div style="font-size:1.15em;line-height:1.7;color:${colors.contentTextColor};white-space:pre-line;margin-bottom:1em;">${content}</div>
    </div>
    <div style="font-size:0.9em;color:${colors.textColor};text-align:right;opacity:0.7;">unblot.vercel.app</div>
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
