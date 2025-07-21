// likes.js
// Like logic for Poetry Share app
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env.js';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  const { data, error } = await supabase.from('likes').select('*').eq('poem_id', poem_id).eq('user_id', user_id).single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116: No rows found
  return !!data;
}

/**
 * Like a poem
 */
export async function likePoem(poem_id, user_id) {
  const { data, error } = await supabase.from('likes').insert([{ poem_id, user_id }]).single();
  if (error) throw error;
  return data;
}

/**
 * Unlike a poem
 */
export async function unlikePoem(poem_id, user_id) {
  const { error } = await supabase.from('likes').delete().eq('poem_id', poem_id).eq('user_id', user_id);
  if (error) throw error;
} 