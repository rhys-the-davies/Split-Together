"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedMember } from "@/lib/auth";
import { type ActionState } from "@/lib/types";

export async function joinOccasion(
  inviteToken: string,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "You must be signed in to join an occasion." };

  const { data: occasion, error: occasionError } = await supabaseAdmin
    .from("occasion")
    .select("id")
    .eq("invite_token", inviteToken)
    .single();

  if (occasionError || !occasion) {
    return { status: "error", error: "Invalid invite link. Please ask the group for a new one." };
  }

  // Upsert is idempotent — the unique constraint on (occasion_id, member_id) makes this safe.
  const { error: membershipError } = await supabaseAdmin
    .from("occasion_member")
    .upsert(
      { occasion_id: occasion.id, member_id: member.id },
      { onConflict: "occasion_id,member_id", ignoreDuplicates: true }
    );

  if (membershipError) {
    return { status: "error", error: "Could not join the occasion. Please try again." };
  }

  redirect(`/occasion/${occasion.id}`);
}
