// Supabase client with full access, for SERVER code only.
//
// Uses the secret key, which bypasses the database's security rules, so it
// must never reach the browser. The "server-only" import makes the build
// fail if browser code ever imports this file.
import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/** Returns null when Supabase isn't set up yet (no keys in .env.local). */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  client = url && secret
    ? createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  return client;
}
