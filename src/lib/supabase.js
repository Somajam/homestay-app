import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://mhfzsultlocaepkvyznp.supabase.co';
const defaultKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oZnpzdWx0bG9jYWVwa3Z5em5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2Mjc3MDgsImV4cCI6MjEwOTIwMzcwOH0.zWeDsyeNfA1fWjSS5iGMCs_CATu7ImtcEq0subggp4U';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
