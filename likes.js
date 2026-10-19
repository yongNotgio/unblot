// likes.js
// Like logic for Poetry Share app
import { supabase } from './utils/supabase.js';
import { createNotification, deleteNotification } from './notifications.js';

/**
 * Fetch like count for a poem
 */
export async function fetchLikeCount(poem_id) {
  const { count, error } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('poem_id', poem_id);
  if (error) throw error;
  return count;
}

/**
 * Check if a user has liked a poem
 */
export async function hasUserLiked(poem_id, user_id) {
  const { data, error } = await supabase.from('likes').select('*').eq('poem_id', poem_id).eq('user_id', user_id).maybeSingle();
  if (error) throw error;
  return !!data;
}

/**
 * Like a poem — also creates a notification for the poem author.
 * @param {string} poem_id
 * @param {string} user_id - the liker
 * @param {string} [poem_author_id] - the poem's author (recipient)
 */
export async function likePoem(poem_id, user_id, poem_author_id) {
  const { data, error } = await supabase.from('likes').insert([{ poem_id, user_id }]).select().single();
  if (error) throw error;

  // Fire-and-forget notification (don't block the like)
  createNotification({
    user_id: poem_author_id,
    actor_id: user_id,
    type: 'like',
    poem_id,
  }).catch((err) => {
    console.warn('Like notification failed:', err);
  });

  return data;
}

/**
 * Unlike a poem — also removes the like notification.
 */
export async function unlikePoem(poem_id, user_id) {
  const { error } = await supabase.from('likes').delete().eq('poem_id', poem_id).eq('user_id', user_id);
  if (error) throw error;

  // Fire-and-forget notification cleanup
  deleteNotification({ actor_id: user_id, poem_id, type: 'like' }).catch(() => {});
} 