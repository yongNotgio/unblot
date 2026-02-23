// env.js
// Export environment variables for Poetry Share app
export const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || window.SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY;

// Admin user IDs - add your Supabase user UUIDs here to grant admin access
export const ADMIN_USER_IDS = window.ADMIN_USER_IDS || [
  'b60e3506-07fb-4f80-bac1-d1756a6cafc2'
];
