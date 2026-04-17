"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function checkMemberExists(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("member")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return !!data;
}
