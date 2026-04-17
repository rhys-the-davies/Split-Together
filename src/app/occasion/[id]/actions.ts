"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedMember } from "@/lib/auth";
import { type ActionState } from "@/lib/types";

async function verifyMembership(occasionId: string, memberId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("occasion_member")
    .select("member_id")
    .eq("occasion_id", occasionId)
    .eq("member_id", memberId)
    .maybeSingle();
  return !!data;
}

export async function startNewInstance(occasionId: string, _formData: FormData) {
  const member = await getAuthenticatedMember();
  if (!member) return;
  if (!(await verifyMembership(occasionId, member.id))) return;

  const year = new Date().getFullYear();
  await supabaseAdmin
    .from("occasion_instance")
    .insert({ occasion_id: occasionId, year, status: "planning" });

  revalidatePath(`/occasion/${occasionId}`);
}

export async function leaveOccasion(
  occasionId: string,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  const { data: activeBuyer } = await supabaseAdmin
    .from("occasion_instance")
    .select("id")
    .eq("occasion_id", occasionId)
    .eq("buyer_id", member.id)
    .is("archived_at", null)
    .maybeSingle();

  if (activeBuyer) {
    return {
      status: "error",
      error: "You can't leave while you're the buyer for an active gift round. Reassign the buyer first.",
    };
  }

  await supabaseAdmin
    .from("occasion_member")
    .delete()
    .eq("occasion_id", occasionId)
    .eq("member_id", member.id);

  redirect("/");
}

export async function deleteOccasion(
  occasionId: string,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  // Only allow deletion if this member is the sole remaining member.
  const { data: memberships } = await supabaseAdmin
    .from("occasion_member")
    .select("member_id")
    .eq("occasion_id", occasionId);

  if (!memberships || memberships.length !== 1 || memberships[0].member_id !== member.id) {
    return { status: "error", error: "You can only delete an occasion when you're the only member." };
  }

  // occasion_instance has ON DELETE RESTRICT, so delete instances first.
  // Null decided_gift_id first to break the circular FK with gift_suggestion.
  await supabaseAdmin
    .from("occasion_instance")
    .update({ decided_gift_id: null })
    .eq("occasion_id", occasionId);

  // Deleting instances cascades to gift_suggestion, gift_vote, split, contribution.
  await supabaseAdmin
    .from("occasion_instance")
    .delete()
    .eq("occasion_id", occasionId);

  // Deleting the occasion cascades to occasion_member.
  const { error } = await supabaseAdmin
    .from("occasion")
    .delete()
    .eq("id", occasionId);

  if (error) {
    console.error("[deleteOccasion] Failed:", error);
    return { status: "error", error: "Could not delete the occasion. Please try again." };
  }

  redirect("/");
}

export async function regenerateToken(occasionId: string, _formData: FormData) {
  const member = await getAuthenticatedMember();
  if (!member) return;
  if (!(await verifyMembership(occasionId, member.id))) return;

  await supabaseAdmin
    .from("occasion")
    .update({ invite_token: crypto.randomUUID() })
    .eq("id", occasionId);

  revalidatePath(`/occasion/${occasionId}`);
}
