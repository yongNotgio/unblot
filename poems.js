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
      // Server-side search filtering using ilike (* is the PostgREST wildcard in .or())
      const searchTerm = userId.search.trim();
      query = query.or(`title.ilike.*${searchTerm}*,content.ilike.*${searchTerm}*`);
    }
  }
  const { data, error } = await query;
  if (error) throw error;
  
  // Additional client-side tag filtering if search is provided
  if (userId && typeof userId === 'object' && userId.search && userId.search.trim()) {
    const search = userId.search.trim().toLowerCase();
    return data.filter(poem => {
      // Already matched by server-side title/content filter, or check tags
      if (poem.tags) {
        if (Array.isArray(poem.tags)) {
          return poem.tags.some(tag => tag && tag.toLowerCase().includes(search));
        } else if (typeof poem.tags === 'string') {
          return poem.tags.toLowerCase().includes(search);
        }
      }
      return true; // Keep poems that matched title/content
    });
  }
  
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

  // Server-side search filtering using ilike (* is the PostgREST wildcard in .or())
  if (search && search.trim()) {
    const searchTerm = search.trim();
    query = query.or(`title.ilike.*${searchTerm}*,content.ilike.*${searchTerm}*`);
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data || [],
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
  
  // Server-side search filtering using ilike (* is the PostgREST wildcard in .or())
  if (options.search && options.search.trim()) {
    const searchTerm = options.search.trim();
    query = query.or(`title.ilike.*${searchTerm}*,content.ilike.*${searchTerm}*`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Additional client-side tag filtering if search is provided
  let filteredPoems = data;
  if (options.search && options.search.trim()) {
    const search = options.search.trim().toLowerCase();
    filteredPoems = data.filter(poem => {
      // Already matched by server-side title/content filter, or check tags
      if (poem.tags) {
        if (Array.isArray(poem.tags)) {
          return poem.tags.some(tag => tag && tag.toLowerCase().includes(search));
        } else if (typeof poem.tags === 'string') {
          return poem.tags.toLowerCase().includes(search);
        }
      }
      return true; // Keep poems that matched title/content
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

  console.log('[fetchPoemsWithSmartSortPaginated] search:', search);

  let query = supabase.from('poems').select('*', { count: 'exact' });
  if (userId) query = query.eq('user_id', userId);
  
  const { data, error, count } = await query;
  if (error) throw error;
  
  console.log('[fetchPoemsWithSmartSortPaginated] fetched poems:', data?.length);
  
  let filteredPoems = data;
  
  // Client-side search filtering for title, content, and tags
  if (search && search.trim()) {
    const searchLower = search.trim().toLowerCase();
    console.log('[fetchPoemsWithSmartSortPaginated] filtering with:', searchLower);
    filteredPoems = data.filter(poem => {
      const titleMatch = poem.title && poem.title.toLowerCase().includes(searchLower);
      const contentMatch = poem.content && poem.content.toLowerCase().includes(searchLower);
      let tagMatch = false;
      if (poem.tags) {
        if (Array.isArray(poem.tags)) {
          tagMatch = poem.tags.some(tag => tag && tag.toLowerCase().includes(searchLower));
        } else if (typeof poem.tags === 'string') {
          tagMatch = poem.tags.toLowerCase().includes(searchLower);
        }
      }
      return titleMatch || contentMatch || tagMatch;
    });
    console.log('[fetchPoemsWithSmartSortPaginated] filtered to:', filteredPoems.length);
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

// ---- Trending: poems ranked by engagement (likes + comments + views) ----
export async function fetchTrendingPoems(limit = 50) {
  // Fetch all poems
  const { data: poems, error } = await supabase.from('poems').select('*');
  if (error) throw error;
  if (!poems || poems.length === 0) return [];

  // Fetch like counts
  const { data: likeCounts, error: likeErr } = await supabase
    .from('likes')
    .select('poem_id');
  const likeMap = {};
  if (!likeErr && likeCounts) {
    likeCounts.forEach(l => { likeMap[l.poem_id] = (likeMap[l.poem_id] || 0) + 1; });
  }

  // Fetch comment counts
  const { data: commentCounts, error: commentErr } = await supabase
    .from('comments')
    .select('poem_id');
  const commentMap = {};
  if (!commentErr && commentCounts) {
    commentCounts.forEach(c => { commentMap[c.poem_id] = (commentMap[c.poem_id] || 0) + 1; });
  }

  // Score = likes*3 + comments*2 + views*1
  const scored = poems.map(p => ({
    ...p,
    _likes: likeMap[p.id] || 0,
    _comments: commentMap[p.id] || 0,
    _views: p.views_count || 0,
    _score: (likeMap[p.id] || 0) * 3 + (commentMap[p.id] || 0) * 2 + (p.views_count || 0),
  }));
  scored.sort((a, b) => b._score - a._score);

  return scored.slice(0, limit);
}

// ---- Liked poems for a user, most recent like first ----
export async function fetchLikedPoems(userId) {
  const { data: likes, error: likeErr } = await supabase
    .from('likes')
    .select('poem_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (likeErr) throw likeErr;
  if (!likes || likes.length === 0) return [];

  const poemIds = likes.map(l => l.poem_id);
  const { data: poems, error } = await supabase.from('poems').select('*').in('id', poemIds);
  if (error) throw error;

  // Maintain order by like date
  const poemMap = {};
  (poems || []).forEach(p => { poemMap[p.id] = p; });
  return likes.map(l => poemMap[l.poem_id]).filter(Boolean);
}

// ---- Viewing history for a user, most recent view first ----
export async function fetchViewHistory(userId) {
  const { data, error } = await supabase
    .from('poem_views')
    .select('poem_id, viewed_at')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false });
  if (error) throw error;
  if (!data || data.length === 0) return [];

  // De-duplicate: keep only the most recent view per poem
  const seen = new Set();
  const uniqueViews = [];
  data.forEach(v => {
    if (!seen.has(v.poem_id)) {
      seen.add(v.poem_id);
      uniqueViews.push(v);
    }
  });

  const poemIds = uniqueViews.map(v => v.poem_id);
  const { data: poems, error: pErr } = await supabase.from('poems').select('*').in('id', poemIds);
  if (pErr) throw pErr;

  const poemMap = {};
  (poems || []).forEach(p => { poemMap[p.id] = p; });
  return uniqueViews.map(v => poemMap[v.poem_id]).filter(Boolean);
}

// ---- Record a poem view (for history tracking) ----
export async function recordPoemView(poemId, userId) {
  if (!userId) return;
  const { error } = await supabase.from('poem_views').insert([{ poem_id: poemId, user_id: userId }]);
  if (error) console.error('Failed to record view:', error);
}

// ---- Saved poems / Collections ----
export async function fetchSavedPoems(userId) {
  const { data, error } = await supabase
    .from('saved_poems')
    .select('poem_id, collection_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const poemIds = [...new Set(data.map(s => s.poem_id))];
  const { data: poems, error: pErr } = await supabase.from('poems').select('*').in('id', poemIds);
  if (pErr) throw pErr;

  const poemMap = {};
  (poems || []).forEach(p => { poemMap[p.id] = p; });
  return data.map(s => ({ ...poemMap[s.poem_id], _collection_id: s.collection_id, _saved_at: s.created_at })).filter(r => r.id);
}

export async function savePoem(poemId, userId, collectionId = null) {
  const row = { poem_id: poemId, user_id: userId };
  if (collectionId) row.collection_id = collectionId;
  const { data, error } = await supabase.from('saved_poems').insert([row]).select().single();
  if (error) throw error;
  return data;
}

export async function unsavePoem(poemId, userId) {
  const { error } = await supabase.from('saved_poems').delete().eq('poem_id', poemId).eq('user_id', userId);
  if (error) throw error;
}

export async function hasUserSaved(poemId, userId) {
  const { data, error } = await supabase.from('saved_poems').select('id').eq('poem_id', poemId).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function fetchCollections(userId) {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createCollection(userId, name, description = '') {
  const { data, error } = await supabase
    .from('collections')
    .insert([{ user_id: userId, name, description }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCollection(id) {
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw error;
}

export async function moveSavedPoemToCollection(poemId, userId, collectionId) {
  const { error } = await supabase
    .from('saved_poems')
    .update({ collection_id: collectionId })
    .eq('poem_id', poemId)
    .eq('user_id', userId);
  if (error) throw error;
}