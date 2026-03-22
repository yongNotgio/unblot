import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function getFirstEnv(names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return '';
}

function requireEnv(names, label) {
  const value = getFirstEnv(names);
  if (!value) {
    throw new Error(`Missing required environment variable: ${label} (checked: ${names.join(', ')})`);
  }
  return value;
}

function normalizeId(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

function parseAdminUserIds(raw) {
  const value = String(raw || '').trim();
  if (!value) return [];

  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeId).filter(Boolean);
      }
    } catch {
      // Fall through to delimiter parsing.
    }
  }

  return value
    .split(/[;,\n]/)
    .map(normalizeId)
    .filter(Boolean);
}

const supabaseUrl = requireEnv(['SUPABASE_URL', 'VITE_SUPABASE_URL'], 'SUPABASE_URL');
const supabaseAnonKey = requireEnv(['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'], 'SUPABASE_ANON_KEY');
const adminUserIdsRaw = getFirstEnv(['ADMIN_USER_IDS', 'VITE_ADMIN_USER_IDS']);
const adminUserIds = parseAdminUserIds(adminUserIdsRaw);

if (!adminUserIds.length) {
  console.warn('No ADMIN_USER_IDS detected. Admin navigation will be hidden for all users.');
}

const envLoaderContent = `// Auto-generated at build time. Do not commit.\nwindow.SUPABASE_URL = ${JSON.stringify(supabaseUrl)};\nwindow.SUPABASE_ANON_KEY = ${JSON.stringify(supabaseAnonKey)};\nwindow.ADMIN_USER_IDS = ${JSON.stringify(adminUserIds, null, 2)};\n`;

const envModuleContent = `// Auto-generated at build time. Do not commit.\nexport const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || window.SUPABASE_URL;\nexport const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY;\nexport const ADMIN_USER_IDS = window.ADMIN_USER_IDS || [];\n`;

writeFileSync(resolve(process.cwd(), 'env.loader.js'), envLoaderContent, 'utf8');
writeFileSync(resolve(process.cwd(), 'env.js'), envModuleContent, 'utf8');

console.log('Generated env.loader.js and env.js from environment variables.');
