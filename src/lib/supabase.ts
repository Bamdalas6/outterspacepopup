"use client";

// The Supabase client for the browser. The URL and the public (anon / publishable) key are safe to ship in the site:
// the database's Row Level Security only lets this key add guest list rows, and only signed-in admins can read them.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export const supabaseReady = Boolean(url && key);

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!supabaseReady) throw new Error("Supabase is not set up: add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local");
  client ??= createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}
