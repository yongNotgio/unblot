// Edit poem view
import { fetchPoemById, updatePoem } from '../poems.js';
import { currentUser } from '../auth.js';
import { utils } from '../utils.js';
import { navigate } from '../router.js';
import { supabase } from '../utils/supabase.js';

export async function renderEditPoem(dom, poemId) {
  dom.app.innerHTML = `<div class="text-center text-lg">Loading poem...</div>`;
  utils.showLoading(dom, true);
  try {
    const poem = await fetchPoemById(poemId);
    if (!poem) throw new Error('Poem not found');
    if (!currentUser || currentUser.id !== poem.user_id) {
      dom.app.innerHTML = `
        <div class="text-center py-12 animate-fade-in">

          <p style="font-size: 1.25rem; color: var(--text-primary);">You are not authorized to edit this poem.</p>
          <button id="unauthorized-discover-btn" class="action-btn action-btn-secondary mt-4">Go to Discover</button>
        </div>`;
      document.getElementById('unauthorized-discover-btn').onclick = () => navigate('/discover');
      return;
    }
    dom.app.innerHTML = `
      <div class="w-full max-w-xl mx-auto animate-fade-in">
        <form id="edit-poem-form" class="cozy-card">
          <div class="text-center mb-8">

            <h2 class="section-header" style="margin-bottom: 0.5rem;">Edit Your Poem</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Refine your words</p>
          </div>
          <div class="flex flex-col gap-5">
            <div>
              <label style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.5rem;">Title</label>
              <input type="text" id="poem-title" class="modern-input" placeholder="Poem title" value="${utils.escapeHTML(poem.title)}" required />
            </div>
            <div>
              <label style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.5rem;">Your Poem</label>
              <textarea id="poem-content" class="modern-input" placeholder="Your poem content..." rows="8" required style="resize: vertical; min-height: 200px; font-family: 'EB Garamond', Georgia, serif; font-size: 1.1rem; line-height: 1.8;">${utils.escapeHTML(poem.content)}</textarea>
            </div>
            <div>
              <label style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.5rem;">Tags</label>
              <input type="text" id="poem-tags" class="modern-input" placeholder="love, nature, reflection (comma separated)" value="${utils.tagsToString(poem.tags)}" />
            </div>
            <div>
              <label style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.5rem;">Image <span style="color: var(--text-muted); font-weight: 400;">(optional)</span></label>
              <div id="image-upload-area" class="image-upload-area">
                <input type="file" id="poem-image" accept="image/*" style="display: none;" />
                <div id="image-upload-placeholder" class="image-upload-placeholder" style="${poem.image ? 'display: none;' : ''}">
                  <svg width="32" height="32" fill="none" stroke="var(--text-muted)" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  <span style="font-size: 0.85rem; color: var(--text-muted);">Click or drag to upload an image</span>
                </div>
                <div id="image-preview-container" class="image-preview-container" style="${poem.image ? '' : 'display: none;'}">
                  <img id="image-preview" class="image-preview" ${poem.image ? `src="${poem.image}"` : ''} style="cursor: pointer;" title="Click to adjust crop" />
                  <button type="button" id="recrop-image-btn" class="remove-image-btn" title="Adjust crop" style="right: 2.5rem; background: rgba(0,0,0,0.6);">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2v4H2"/><path d="M18 22v-4h4"/><path d="M2 6l4-4"/><path d="M22 18l-4 4"/><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                  </button>
                  <button type="button" id="remove-image-btn" class="remove-image-btn" title="Remove image">&times;</button>
                </div>
              </div>
            </div>
            <div class="flex gap-3 mt-4">
              <button type="submit" class="action-btn action-btn-primary flex-1 justify-center py-3" style="font-size: 1rem;">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Changes
              </button>
              <button type="button" id="cancel-btn" class="action-btn action-btn-secondary flex-1 justify-center py-3" style="font-size: 1rem;">Cancel</button>
            </div>
          </div>
        </form>
      </div>
    `;
    document.getElementById('cancel-btn').onclick = () => navigate(`/view-poem/${poemId}`);

    // Image upload handling
    const imageInput = document.getElementById('poem-image');
    const uploadArea = document.getElementById('image-upload-area');
    const placeholder = document.getElementById('image-upload-placeholder');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview');
    const removeBtn = document.getElementById('remove-image-btn');
    const recropBtn = document.getElementById('recrop-image-btn');
    let selectedFile = null;
    let imageRemoved = false;
    let existingImage = poem.image || null;
    let originalFile = null;
    let originalImageSrc = poem.original_image || poem.image || null;
    let chosenAspectRatio = poem.aspect_ratio || '4:3';

    uploadArea.addEventListener('click', () => { if (!previewImg.src || imageRemoved) imageInput.click(); });
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
    uploadArea.addEventListener('dragleave', () => { uploadArea.classList.remove('drag-over'); });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) handleImageFile(file);
    });
    imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      if (file) handleImageFile(file);
    });
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedFile = null;
      imageRemoved = true;
      originalFile = null;
      originalImageSrc = null;
      chosenAspectRatio = '4:3';
      imageInput.value = '';
      previewContainer.style.display = 'none';
      placeholder.style.display = 'flex';
    });
    // Re-crop: click the crop button or the image itself to re-adjust
    recropBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!originalImageSrc) return;
      const result = await utils.openImageCropper(originalImageSrc, chosenAspectRatio);
      if (result) {
        selectedFile = result.file;
        imageRemoved = false;
        previewImg.src = result.dataUrl;
        chosenAspectRatio = result.aspectRatio;
        previewImg.style.aspectRatio = '';
      }
    });
    previewImg.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!originalImageSrc) return;
      const result = await utils.openImageCropper(originalImageSrc, chosenAspectRatio);
      if (result) {
        selectedFile = result.file;
        imageRemoved = false;
        previewImg.src = result.dataUrl;
        chosenAspectRatio = result.aspectRatio;
        previewImg.style.aspectRatio = '';
      }
    });
    async function handleImageFile(file) {
      // Store the original uncropped file and data URL for re-crop
      originalFile = file;
      const reader = new FileReader();
      reader.onload = (e) => { originalImageSrc = e.target.result; };
      reader.readAsDataURL(file);
      const result = await utils.openImageCropper(file);
      if (result) {
        selectedFile = result.file;
        imageRemoved = false;
        previewImg.src = result.dataUrl;
        chosenAspectRatio = result.aspectRatio;
        previewContainer.style.display = 'block';
        placeholder.style.display = 'none';
      } else {
        imageInput.value = '';
      }
    }

    document.getElementById('edit-poem-form').onsubmit = async (e) => {
      e.preventDefault();
      utils.showLoading(dom, true);
      const title = document.getElementById('poem-title').value.trim();
      const content = document.getElementById('poem-content').value.trim();
      const tags = utils.parseTags(document.getElementById('poem-tags').value);
      try {
        let imageUrl = existingImage;
        let originalImageUrl = poem.original_image || null;
        if (selectedFile) {
          // Upload cropped image
          const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, selectedFile, { 
            cacheControl: '3600',
            upsert: true,
            contentType: selectedFile.type
          });
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(uploadError.message || 'Failed to upload image');
        }
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
          // Upload original uncropped image if a new file was uploaded
          if (originalFile) {
            const origExt = originalFile.name.split('.').pop();
            const origFileName = `original_${Date.now()}-${Math.random().toString(36).substring(7)}.${origExt}`;
            const { error: origUploadError } = await supabase.storage
              .from('images')
              .upload(origFileName, originalFile, {
                cacheControl: '3600',
                upsert: true,
                contentType: originalFile.type
              });
            if (!origUploadError) {
              const { data: origUrlData } = supabase.storage.from('images').getPublicUrl(origFileName);
              originalImageUrl = origUrlData.publicUrl;
            }
          }
        } else if (imageRemoved) {
          imageUrl = null;
          originalImageUrl = null;
        }
        await updatePoem(poemId, { title, content, tags, image: imageUrl, original_image: originalImageUrl, aspect_ratio: imageUrl ? chosenAspectRatio : null });
        utils.showToast(dom, 'Poem updated!');
        setTimeout(() => navigate(`/view-poem/${poemId}`), 1000);
      } catch (err) {
        utils.showModal(dom, 'Failed to update poem: ' + (err.message || err));
      } finally {
        utils.showLoading(dom, false);
      }
    };
  } catch (err) {
    dom.app.innerHTML = `<div class="text-center text-red-600">Failed to load poem: ${err.message || err}</div>`;
  } finally {
    utils.showLoading(dom, false);
  }
} 