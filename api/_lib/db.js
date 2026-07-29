// Read-only Supabase access for the server-rendered crawler pages.
// Talks to PostgREST directly over fetch so the functions stay dependency-free.
// Uses the anon key, so it can only ever see what an anonymous visitor sees.

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export function isConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// The poems table has no updated_at column; created_at is the only timestamp.
const POEM_COLUMNS = 'id,title,content,tags,created_at,views_count,image,prompt_title,prompt_date';

async function rest(path, { headers = {}, signal } = {}) {
  if (!isConfigured()) {
    throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY are not set');
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
      ...headers,
    },
    signal,
  });
  if (!res.ok) {
    throw new Error(`Supabase ${res.status} on ${path}: ${await res.text()}`);
  }
  return res;
}

/** Total row count for a table, read from the Content-Range header. */
async function countRows(table, filter = '') {
  const res = await rest(`${table}?select=id${filter ? `&${filter}` : ''}`, {
    headers: { Prefer: 'count=exact', Range: '0-0' },
  });
  const range = res.headers.get('content-range') || '';
  const total = Number(range.split('/')[1]);
  return Number.isFinite(total) ? total : 0;
}

export async function getPoem(id) {
  const res = await rest(`poems?select=${POEM_COLUMNS}&id=eq.${encodeURIComponent(id)}&limit=1`);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

export async function listPoems({ limit = 20, offset = 0, order = 'created_at.desc' } = {}) {
  const res = await rest(
    `poems?select=${POEM_COLUMNS}&order=${encodeURIComponent(order)}&limit=${limit}&offset=${offset}`
  );
  return res.json();
}

/** Lightweight projection used to build the sitemap. */
export async function listPoemStubs({ limit = 5000 } = {}) {
  const res = await rest(`poems?select=id,title,created_at&order=created_at.desc&limit=${limit}`);
  return res.json();
}

export async function countPoems() {
  return countRows('poems');
}

/** Like and comment totals for one poem, used for InteractionCounter markup. */
export async function getEngagement(poemId) {
  const filter = `poem_id=eq.${encodeURIComponent(poemId)}`;
  const [likes, comments] = await Promise.all([
    countRows('likes', filter).catch(() => 0),
    countRows('comments', filter).catch(() => 0),
  ]);
  return { likes, comments };
}

/** A few other poems to link to, so every rendered page feeds the crawl graph. */
export async function listRelatedPoems(excludeId, limit = 6) {
  const rows = await listPoems({ limit: limit + 1 });
  return rows.filter((p) => p.id !== excludeId).slice(0, limit);
}
