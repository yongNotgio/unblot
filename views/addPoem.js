// views/addPoem.js
// Add new poem view
import { addPoem } from '../poems.js';
import { currentUser } from '../auth.js';
import { utils } from '../utils.js';
import { navigate } from '../router.js';
import { supabase } from '../utils/supabase.js';

export function renderAddPoem(dom, promptTitle = null) {
  if (!currentUser) {
    dom.app.innerHTML = `
      <div class="text-center py-12 animate-fade-in">

        <p style="font-size: 1.25rem; color: var(--text-primary);">You must be logged in to add a poem.</p>
        <button id="login-redirect-btn" class="action-btn action-btn-primary mt-4">Sign In</button>
      </div>`;
    document.getElementById('login-redirect-btn').onclick = () => navigate('/login');
    return;
  }

  const isPrompt = !!promptTitle;
  const decodedTitle = promptTitle ? decodeURIComponent(promptTitle) : '';

  dom.app.innerHTML = `
    <div class="w-full max-w-xl mx-auto animate-fade-in">
      <form id="add-poem-form" class="cozy-card">
        <div class="text-center mb-8">
          <div style="font-size: 3rem; margin-bottom: 1rem;">${isPrompt ? '💡' : '✍️'}</div>
          <h2 class="section-header" style="margin-bottom: 0.5rem;">${isPrompt ? 'Write from Prompt' : 'Share Your Words'}</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">${isPrompt ? 'Respond to today\'s writing prompt' : 'Let your thoughts flow freely'}</p>
          ${isPrompt ? `<div style="margin-top: 0.75rem;"><span class="prompt-day-tag"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Prompt: ${utils.escapeHTML(decodedTitle)}</span></div>` : ''}
        </div>
        <div class="flex flex-col gap-5">
          <div>
            <label style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.5rem;">Title</label>
            <input type="text" id="poem-title" class="modern-input" placeholder="Give your poem a title" required />
          </div>
          <div>
            <label style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.5rem;">Your Poem</label>
            <textarea id="poem-content" class="modern-input" placeholder="Write your heart out..." rows="8" required style="resize: vertical; min-height: 200px; font-family: 'EB Garamond', Georgia, serif; font-size: 1.1rem; line-height: 1.8;"></textarea>
          </div>
          <div>
            <label style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.5rem;">Tags</label>
            <input type="text" id="poem-tags" class="modern-input" placeholder="love, nature, reflection (comma separated)" />
          </div>
          <div>
            <label style="display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.5rem;">Image <span style="color: var(--text-muted); font-weight: 400;">(optional)</span></label>
            <div id="image-upload-area" class="image-upload-area">
              <input type="file" id="poem-image" accept="image/*" style="display: none;" />
              <div id="image-upload-placeholder" class="image-upload-placeholder">
                <svg width="32" height="32" fill="none" stroke="var(--text-muted)" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                <span style="font-size: 0.85rem; color: var(--text-muted);">Click or drag to upload an image</span>
              </div>
              <div id="image-preview-container" class="image-preview-container" style="display: none;">
                <img id="image-preview" class="image-preview" />
                <button type="button" id="remove-image-btn" class="remove-image-btn" title="Remove image">&times;</button>
              </div>
            </div>
          </div>
          <div class="flex gap-3 mt-4">
            <button type="submit" class="action-btn action-btn-primary flex-1 justify-center py-3" style="font-size: 1rem;">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              Publish Poem
            </button>
            <button type="button" id="cancel-btn" class="action-btn action-btn-secondary flex-1 justify-center py-3" style="font-size: 1rem;">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  `;
  document.getElementById('cancel-btn').onclick = () => navigate('/my-poems');

  // Image upload handling
  const imageInput = document.getElementById('poem-image');
  const uploadArea = document.getElementById('image-upload-area');
  const placeholder = document.getElementById('image-upload-placeholder');
  const previewContainer = document.getElementById('image-preview-container');
  const previewImg = document.getElementById('image-preview');
  const removeBtn = document.getElementById('remove-image-btn');
  let selectedFile = null;

  uploadArea.addEventListener('click', () => { if (!selectedFile) imageInput.click(); });
  uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
  uploadArea.addEventListener('dragleave', () => { uploadArea.classList.remove('drag-over'); });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) { selectedFile = file; showPreview(file); }
  });
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) { selectedFile = file; showPreview(file); }
  });
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedFile = null;
    imageInput.value = '';
    previewContainer.style.display = 'none';
    placeholder.style.display = 'flex';
  });
  function showPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewContainer.style.display = 'block';
      placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  document.getElementById('add-poem-form').onsubmit = async (e) => {
    e.preventDefault();
    utils.showLoading(dom, true);
    const title = document.getElementById('poem-title').value.trim();
    const content = document.getElementById('poem-content').value.trim();
    const tags = utils.parseTags(document.getElementById('poem-tags').value);
    try {
      let imageUrl = null;
      if (selectedFile) {
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
      }
      // If written from a daily prompt, store today's date (Philippine time) and prompt title
      let promptDate = null;
      let promptTitleVal = null;
      if (isPrompt) {
        promptDate = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];
        promptTitleVal = decodedTitle;
      }
      await addPoem({ title, content, tags, user_id: currentUser.id, image: imageUrl, prompt_date: promptDate, prompt_title: promptTitleVal });
      utils.showToast(dom, 'Poem added!');
      setTimeout(() => navigate('/my-poems'), 1000);
    } catch (err) {
      utils.showModal(dom, 'Failed to add poem: ' + (err.message || err));
    } finally {
      utils.showLoading(dom, false);
    }
  };
} 