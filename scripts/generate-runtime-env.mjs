import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

const supabaseUrl = requireEnv('SUPABASE_URL');
const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');
const adminUserIdsRaw = process.env.ADMIN_USER_IDS || '';
const adminUserIds = adminUserIdsRaw
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

const envLoaderContent = `// Auto-generated at build time. Do not commit.\nwindow.SUPABASE_URL = ${JSON.stringify(supabaseUrl)};\nwindow.SUPABASE_ANON_KEY = ${JSON.stringify(supabaseAnonKey)};\nwindow.ADMIN_USER_IDS = ${JSON.stringify(adminUserIds, null, 2)};\n`;

const envModuleContent = `// Auto-generated at build time. Do not commit.\nexport const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || window.SUPABASE_URL;\nexport const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY;\nexport const ADMIN_USER_IDS = window.ADMIN_USER_IDS || [];\n`;

writeFileSync(resolve(process.cwd(), 'env.loader.js'), envLoaderContent, 'utf8');
writeFileSync(resolve(process.cwd(), 'env.js'), envModuleContent, 'utf8');

console.log('Generated env.loader.js and env.js from environment variables.');
