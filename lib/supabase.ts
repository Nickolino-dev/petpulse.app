import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Forza il salvataggio della sessione nel localStorage/Cookie
    autoRefreshToken: true, // Refresh automatico del token per non essere buttati fuori
    detectSessionInUrl: true, // Serve per gestire i login social o i link di conferma
  },
});
