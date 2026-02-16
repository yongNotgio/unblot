// comments.js
// Comment logic for Poetry Share app
import { supabase } from './utils/supabase.js';

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
  const { data, error } = await supabase.from('comments').insert([{ poem_id, user_id, comment_text }]).single();
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

/**
 * Update a comment by id
 */
export async function updateComment(id, comment_text) {
  const { error } = await supabase.from('comments').update({ comment_text }).eq('id', id);
  if (error) throw error;
} 