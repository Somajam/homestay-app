import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://vbsvpvvatfoeybmdvuet.supabase.co';
const defaultKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZic3ZwdnZhdGZvZXlibWR2dWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzQ1OTYsImV4cCI6MjEwMzMxMDU5Nn0.n6U-Vu_xanxH_ncWHoQZBRFLlf06bUJ_CHFb9o4Y8yI';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
