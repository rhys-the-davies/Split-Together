/**
 * Server-side environment variable validation.
 * Throws at module load time if any required variable is missing.
 *
 * IMPORTANT: This file must only be imported in server-side code
 * (Server Components, Server Actions, Route Handlers).
 * Never import it in Client Components — it contains server-only secrets.
 *
 * For Client Components, access NEXT_PUBLIC_* vars directly via process.env.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Ensure it is set in .env.local (development) or your Vercel project settings (production).`
    );
  }
  return value;
}

export const env = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  appUrl: requireEnv("NEXT_PUBLIC_APP_URL"),
  // Resend vars are validated in src/lib/resend.ts (added in M7).
} as const;
