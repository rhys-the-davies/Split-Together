"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type SignupActionState =
  | { status: "error"; error: string }
  | { status: "success"; email: string; next: string }
  | null;

export async function createAccount(
  _prevState: SignupActionState,
  formData: FormData
): Promise<SignupActionState> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const next = (formData.get("next") as string) || "/";

  if (!name || !email) {
    return { status: "error", error: "Name and email are required." };
  }

  // Check if a member with this email already exists.
  const { data: existing } = await supabaseAdmin
    .from("member")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return {
      status: "error",
      error: "An account with this email already exists. Please sign in instead.",
    };
  }

  // Create the member row.
  const { error: insertError } = await supabaseAdmin
    .from("member")
    .insert({ name, email });

  if (insertError) {
    return { status: "error", error: "Could not create account. Please try again." };
  }

  // Return success — the client calls signInWithOtp (browser PKCE).
  return { status: "success", email, next };
}
