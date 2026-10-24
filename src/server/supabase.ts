import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseSecretKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseSecretKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
