import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/**
 * Service-role Supabase client. Bypasses RLS entirely.
 *
 * !! SERVER-ONLY — NEVER import this file in Client Components !!
 * !! NEVER use this for user-facing reads — always use createClient() from server.ts !!
 *
 * Permitted uses:
 *   1. Resolving invite tokens before a user is authenticated (join flow)
 *   2. Upserting member rows during join (no auth.uid() exists yet)
 *   3. Calling snapshot_contributions() on purchase
 *   4. Fetching member emails for pg_cron notification emails
 */
export const supabaseAdmin = createClient<Database>(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
