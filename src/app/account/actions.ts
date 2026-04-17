"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type ActionState } from "@/lib/types";

export async function deleteAccount(
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  // Block if they're the buyer on any active (non-archived) instance.
  const { data: activeBuyer } = await supabaseAdmin
    .from("occasion_instance")
    .select("id")
    .eq("buyer_id", member.id)
    .is("archived_at", null)
    .maybeSingle();

  if (activeBuyer) {
    return {
      status: "error",
      error: "You can't delete your account while you're the buyer for an active gift round. Reassign the buyer first.",
    };
  }

  // Get the Supabase auth user ID.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Not signed in." };

  // Remove auth_id from member row (preserves history) then delete auth user.
  await supabaseAdmin
    .from("member")
    .update({ auth_id: null })
    .eq("id", member.id);

  await supabaseAdmin.auth.admin.deleteUser(user.id);

  redirect("/login");
}
