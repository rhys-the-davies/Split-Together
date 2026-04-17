"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedMember } from "@/lib/auth";

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
