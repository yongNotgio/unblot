// Supabase singleton with session caching
// This is the ONLY place where the Supabase client should be created

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../env.js';

// Create a single Supabase client instance
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cache for current user session
let cachedUser = null;
let sessionInitialized = false;

/**
 * Get current user from cache or fetch if needed
 * Uses onAuthStateChange listener for reactive updates
 */
export async function getCurrentUser() {
  if (!sessionInitialized) {
    // Initialize session on first call
    const { data: { user } } = await supabase.auth.getUser();
    cachedUser = user;
    sessionInitialized = true;
  }
  return cachedUser;
}

/**
 * Force refresh user from server (use after login/logout)
 */
export async function refreshUser() {
  const { data: { user } } = await supabase.auth.getUser();
  cachedUser = user;
  sessionInitialized = true;
  return user;
}

/**
 * Clear cached user (call on logout)
 */
export function clearUserCache() {
  cachedUser = null;
  sessionInitialized = false;
}

// Listen for auth state changes to keep cache in sync
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    cachedUser = session?.user || null;
    sessionInitialized = true;
  } else if (event === 'SIGNED_OUT') {
    cachedUser = null;
    sessionInitialized = true;
  }
  
  // Dispatch custom event for components to react
  window.dispatchEvent(new CustomEvent('authStateChanged', { 
    detail: { event, user: cachedUser } 
  }));
});

export { supabase };
