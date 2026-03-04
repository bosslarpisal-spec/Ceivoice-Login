import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL or Anon Key is missing. Check your .env.local file.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

if (!serviceKey) {
  console.warn(
    'Supabase Service Key missing - Admin actions will fail.'
  );
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);