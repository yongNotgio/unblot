// comments.js
// Comment logic for Poetry Share app
import { supabase } from './utils/supabase.js';
import { utils } from './utils.js';

// Color palette for avatars
export const AVATAR_COLORS = ['#8b5cf6','#ec4899','#f59e0b','#22c55e','#3b82f6','#ef4444','#14b8a6','#f97316'];

export function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getCommenterAlias(userId) {
  const code = userId ? String(userId).slice(-4).toUpperCase() : '0000';
  return `Anonymous Poet #${code}`;
}

/**
 * Render a single comment item HTML with avatar, alias, author badge, timestamp, text, and owner actions.
 */
export function renderCommentItem(c, poemAuthorId, currentUser) {
  const avatarColor = getAvatarColor(c.user_id);
  const alias = getCommenterAlias(c.user_id);
  const isAuthor = Boolean(poemAuthorId && c.user_id && c.user_id === poemAuthorId);
  const isOwner = Boolean(currentUser && currentUser.id === c.user_id);

  return `
    <li class="comment-item" data-cid="${c.id}">
      <div class="comment-header">
        <div class="comment-avatar" style="background: ${avatarColor};" title="${alias}">
          <svg width="12" height="12" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <span class="comment-alias">${alias}</span>
        ${isAuthor ? `<span class="comment-author-badge" title="Author of this poem">Author</span>` : ''}
        <span class="comment-date">${utils.formatDate(c.created_at)}</span>
      </div>
      <div class="comment-text">${utils.escapeHTML(c.comment_text)}</div>
      ${isOwner ? `
        <div class="comment-actions">
          <button class="edit-comment-btn" style="font-size: 0.7rem; color: var(--primary); background: none; border: none; cursor: pointer; font-weight: 600;" data-cid="${c.id}" data-pid="${c.poem_id}">Edit</button>
          <button class="delete-comment-btn" style="font-size: 0.7rem; color: var(--error); background: none; border: none; cursor: pointer; font-weight: 600;" data-cid="${c.id}" data-pid="${c.poem_id}">Delete</button>
        </div>
      ` : ''}
    </li>
  `;
}

/**
 * Fetch all comments for a given poem
 */
export async function fetchComments(poem_id) {
  const { data, error } = await supabase.from('comments').select('*').eq('poem_id', poem_id).order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Add a new comment to a poem
 */
export async function addComment({ poem_id, user_id, comment_text }) {
  const { data, error } = await supabase.from('comments').insert([{ poem_id, user_id, comment_text }]).select().single();
  if (error) throw error;
  return data;
}

/**
 * Delete a comment by id
 */
export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}

export async function updateComment(id, comment_text) {
  const { error } = await supabase.from('comments').update({ comment_text }).eq('id', id);
  if (error) throw error;
}