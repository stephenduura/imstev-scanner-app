import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

/**
 * Initializes the Supabase client dynamically at startup using keys parsed from the local .env.
 */
export function initSupabase(url, key) {
  if (url && key && url.startsWith("https://")) {
    try {
      return createClient(url, key);
    } catch (e) {
      console.error("Failed to initialize Supabase client dynamically:", e);
    }
  }
  return null;
}
