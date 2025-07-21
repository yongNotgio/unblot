// poems.js
// Poem CRUD and real-time logic for Poetry Share app
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env.js';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch all poems for a given user (or all, if no userId)
 */
export async function fetchPoems(userId = null) {
  let query = supabase.from('poems').select('*').order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetch a single poem by id
 */
export async function fetchPoemById(id) {
  const { data, error } = await supabase.from('poems').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

/**
 * Add a new poem
 */
export async function addPoem({ title, content, tags, user_id }) {
  const { data, error } = await supabase.from('poems').insert([{ title, content, tags, user_id }]).single();
  if (error) throw error;
  return data;
}

/**
 * Update a poem by id
 */
export async function updatePoem(id, { title, content, tags }) {
  const { data, error } = await supabase.from('poems').update({ title, content, tags }).eq('id', id).single();
  if (error) throw error;
  return data;
}

/**
 * Delete a poem by id
 */
export async function deletePoem(id) {
  const { error } = await supabase.from('poems').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Increment views_count for a poem
 */
export async function incrementPoemViews(id) {
  const { error } = await supabase.rpc('increment_views', { poem_id: id });
  if (error) throw error;
}

/**
 * Subscribe to real-time updates for poems (optionally filtered by userId)
 */
export function subscribeToPoems(callback, userId = null) {
  let channel = supabase.channel('poems').on('postgres_changes', { event: '*', schema: 'public', table: 'poems' }, payload => {
    if (!userId || payload.new.user_id === userId) callback(payload);
  });
  channel.subscribe();
  return channel;
} 