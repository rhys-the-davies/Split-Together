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

export async function createMember(
  name: string,
  email: string
): Promise<{ error: string } | null> {
  const { error } = await supabaseAdmin
    .from("member")
    .insert({ name: name.trim(), email: email.trim().toLowerCase() });

  if (error) {
    // Unique constraint — member was created between the check and now
    if (error.code === "23505") return null;
    return { error: "Could not create account. Please try again." };
  }

  return null;
}
