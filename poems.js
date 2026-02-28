// poems.js
// Poem CRUD and real-time logic for Poetry Share app
import { supabase } from './utils/supabase.js';

/**
 * Fetch all poems for a given user (or all, if no userId)
 */
export async function fetchPoems(userId = null) {
  let query = supabase.from('poems').select('*').order('created_at', { ascending: false });
  if (userId && typeof userId === 'string') query = query.eq('user_id', userId);
  // If userId is an object, treat as options
  if (userId && typeof userId === 'object') {
    if (userId.userId) query = query.eq('user_id', userId.userId);
    if (userId.search && userId.search.trim()) {
      // Supabase doesn't support LIKE on multiple columns, so filter after fetch
      const { data, error } = await query;
      if (error) throw error;
      const search = userId.search.trim().toLowerCase();
      return data.filter(poem => {
        if (poem.title && poem.title.toLowerCase().includes(search)) return true;
        if (poem.content && poem.content.toLowerCase().includes(search)) return true;
        if (poem.tags) {
          if (Array.isArray(poem.tags)) {
            return poem.tags.some(tag => tag && tag.toLowerCase().includes(search));
          } else if (typeof poem.tags === 'string') {
            return poem.tags.toLowerCase().includes(search);
          }
        }
        return false;
      });
    }
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetch poems with pagination support
 */
export async function fetchPoemsPaginated(options = {}) {
  const {
    userId = null,
    search = '',
    page = 1,
    limit = 10,
    orderBy = 'created_at',
    ascending = false
  } = options;

  let query = supabase
    .from('poems')
    .select('*', { count: 'exact' })
    .order(orderBy, { ascending });

  if (userId) query = query.eq('user_id', userId);

  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  // If search is provided, filter after fetch (since Supabase doesn't support multi-column LIKE)
  let filteredData = data;
  if (search && search.trim()) {
    const searchLower = search.trim().toLowerCase();
    filteredData = data.filter(poem => {
      if (poem.title && poem.title.toLowerCase().includes(searchLower)) return true;
      if (poem.content && poem.content.toLowerCase().includes(searchLower)) return true;
      if (poem.tags) {
        if (Array.isArray(poem.tags)) {
          return poem.tags.some(tag => tag && tag.toLowerCase().includes(searchLower));
        } else if (typeof poem.tags === 'string') {
          return poem.tags.toLowerCase().includes(searchLower);
        }
      }
      return false;
    });
  }

  return {
    data: filteredData,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
    hasNextPage: page < Math.ceil((count || 0) / limit),
    hasPrevPage: page > 1
  };
}

/**
 * Fetch poems with smart sorting: recent poems first (last 2 days), then randomized
 */
export async function fetchPoemsWithSmartSort(userId = null, options = {}) {
  // First, fetch all poems
  let query = supabase.from('poems').select('*');
  if (userId && typeof userId === 'string') query = query.eq('user_id', userId);
  if (options.userId) query = query.eq('user_id', options.userId);
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Filter by search if provided
  let filteredPoems = data;
  if (options.search && options.search.trim()) {
    const search = options.search.trim().toLowerCase();
    filteredPoems = data.filter(poem => {
      if (poem.title && poem.title.toLowerCase().includes(search)) return true;
      if (poem.content && poem.content.toLowerCase().includes(search)) return true;
      if (poem.tags) {
        if (Array.isArray(poem.tags)) {
          return poem.tags.some(tag => tag && tag.toLowerCase().includes(search));
        } else if (typeof poem.tags === 'string') {
          return poem.tags.toLowerCase().includes(search);
        }
      }
      return false;
    });
  }
  
  // Separate recent poems (last 2 days) from older ones
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
  
  const recentPoems = [];
  const olderPoems = [];
  
  filteredPoems.forEach(poem => {
    const poemDate = new Date(poem.created_at);
    if (poemDate >= twoDaysAgo) {
      recentPoems.push(poem);
    } else {
      olderPoems.push(poem);
    }
  });
  
  // Sort recent poems by creation date (newest first)
  recentPoems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  // Shuffle older poems randomly
  const shuffledOlderPoems = [...olderPoems].sort(() => Math.random() - 0.5);
  
  // Combine: recent poems first, then randomized older poems
  return [...recentPoems, ...shuffledOlderPoems];
}

/**
 * Fetch poems with smart sorting and pagination support
 * Optimized: Uses server-side filtering when possible
 */
export async function fetchPoemsWithSmartSortPaginated(options = {}) {
  const {
    userId = null,
    search = '',
    page = 1,
    limit = 10
  } = options;

  let query = supabase.from('poems').select('*', { count: 'exact' });
  if (userId) query = query.eq('user_id', userId);
  
  // Apply server-side search filtering using ilike for title and content
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    query = query.or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`);
  }
  
  const { data, error, count } = await query;
  if (error) throw error;
  
  let filteredPoems = data;
  
  // Additional client-side tag filtering if search is provided
  // (Supabase array contains with ilike is limited)
  if (search && search.trim()) {
    const searchLower = search.trim().toLowerCase();
    filteredPoems = data.filter(poem => {
      // Already matched by server-side title/content filter, or check tags
      if (poem.tags) {
        if (Array.isArray(poem.tags)) {
          return poem.tags.some(tag => tag && tag.toLowerCase().includes(searchLower));
        } else if (typeof poem.tags === 'string') {
          return poem.tags.toLowerCase().includes(searchLower);
        }
      }
      return true; // Keep poems matched by server-side filter
    });
  }
  
  // Separate recent poems (last 2 days) from older ones
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
  
  const recentPoems = [];
  const olderPoems = [];
  
  filteredPoems.forEach(poem => {
    const poemDate = new Date(poem.created_at);
    if (poemDate >= twoDaysAgo) {
      recentPoems.push(poem);
    } else {
      olderPoems.push(poem);
    }
  });
  
  // Sort recent poems by creation date (newest first)
  recentPoems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  // Shuffle older poems randomly
  const shuffledOlderPoems = [...olderPoems].sort(() => Math.random() - 0.5);
  
  // Combine: recent poems first, then randomized older poems
  const allPoems = [...recentPoems, ...shuffledOlderPoems];
  
  // Apply pagination to the combined and sorted results
  const offset = (page - 1) * limit;
  const paginatedPoems = allPoems.slice(offset, offset + limit);
  
  return {
    data: paginatedPoems,
    total: filteredPoems.length,
    page,
    limit,
    totalPages: Math.ceil(filteredPoems.length / limit),
    hasNextPage: page < Math.ceil(filteredPoems.length / limit),
    hasPrevPage: page > 1
  };
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
export async function addPoem({ title, content, tags, user_id, image = null, original_image = null, aspect_ratio = null, prompt_date = null, prompt_title = null }) {
  const row = { title, content, tags, user_id };
  if (image) row.image = image;
  if (original_image) row.original_image = original_image;
  if (aspect_ratio) row.aspect_ratio = aspect_ratio;
  if (prompt_date) row.prompt_date = prompt_date;
  if (prompt_title) row.prompt_title = prompt_title;
  const { data, error } = await supabase.from('poems').insert([row]).select().single();
  if (error) throw error;
  return data;
}

/**
 * Update a poem by id
 */
export async function updatePoem(id, { title, content, tags, image, original_image, aspect_ratio }) {
  const updates = { title, content, tags };
  if (image !== undefined) updates.image = image;
  if (original_image !== undefined) updates.original_image = original_image;
  if (aspect_ratio !== undefined) updates.aspect_ratio = aspect_ratio;
  const { data, error } = await supabase.from('poems').update(updates).eq('id', id).select().single();
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