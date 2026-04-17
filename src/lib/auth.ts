import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Returns the member record for the currently authenticated user.
 * Tries auth_id first; falls back to email (case-insensitive) and
 * re-links auth_id when found — handles stale sessions after a
 * Supabase auth user is recreated during testing.
 */
export async function getAuthenticatedMember(): Promise<{ id: string; email: string; authId: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: byAuthId } = await supabaseAdmin
    .from("member")
    .select("id, email")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (byAuthId) return { ...byAuthId, authId: user.id };

  if (user.email) {
    const { data: byEmail } = await supabaseAdmin
      .from("member")
      .select("id, email")
      .ilike("email", user.email)
      .maybeSingle();

    if (byEmail) {
      await supabaseAdmin
        .from("member")
        .update({ auth_id: user.id })
        .eq("id", byEmail.id);
      return { ...byEmail, authId: user.id };
    }
  }

  return null;
}
