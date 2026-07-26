import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export let supabase = null;

export function initSupabase(url, key) {
  if (url && key && url.startsWith("https://")) {
    try {
      supabase = createClient(url, key);
      return supabase;
    } catch (e) {
      console.error("Failed to initialize Supabase client dynamically:", e);
    }
  }
  return null;
}
