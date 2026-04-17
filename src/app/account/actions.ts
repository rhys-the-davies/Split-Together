"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedMember } from "@/lib/auth";
import { type ActionState } from "@/lib/types";

export async function deleteAccount(
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

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

  // Null auth_id first to preserve historical member data, then delete the auth user.
  await supabaseAdmin.from("member").update({ auth_id: null }).eq("id", member.id);
  await supabaseAdmin.auth.admin.deleteUser(member.authId);

  redirect("/login");
}
