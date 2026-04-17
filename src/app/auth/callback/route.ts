import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Auth callback route.
 * Supabase redirects here after a magic link is clicked.
 *
 * Steps:
 * 1. Exchange the one-time code for a session.
 * 2. Link the auth.users row (auth_id) to the member row created during join.
 * 3. Redirect to the `next` param (defaults to /).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    // No code — redirect home rather than showing a raw error.
    return Response.redirect(`${origin}/`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    // Expired or already-used link.
    return Response.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Magic link expired or already used. Please request a new one.")}`
    );
  }

  const { id: authId, email } = data.user;

  if (email) {
    // Link auth_id to the member row. Two cases handled:
    // 1. Fresh join: auth_id is null → set it.
    // 2. Returning user whose Supabase auth entry was recreated (e.g. after
    //    a test wipe): auth_id may already be set to a stale UUID. We update
    //    it unconditionally by email so the member stays accessible.
    const { data: memberCheck } = await supabaseAdmin
      .from("member")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!memberCheck) {
      // No member row for this email — the user has never joined an occasion.
      // Redirect to login with a clear explanation.
      return Response.redirect(
        `${origin}/login?error=${encodeURIComponent("No account found. Please join an occasion first using your invite link.")}`
      );
    }

    await supabaseAdmin
      .from("member")
      .update({ auth_id: authId })
      .eq("email", email);
  }

  return Response.redirect(`${origin}${next}`);
}
