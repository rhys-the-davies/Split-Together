"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedMember } from "@/lib/auth";
import { type ActionState } from "@/lib/types";

export async function updateOccasion(
  occasionId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  // Verify membership.
  const { data: membership } = await supabaseAdmin
    .from("occasion_member")
    .select("member_id")
    .eq("occasion_id", occasionId)
    .eq("member_id", member.id)
    .maybeSingle();
  if (!membership) return { status: "error", error: "Not a member of this occasion." };

  const title = (formData.get("title") as string)?.trim();
  const recipientName = (formData.get("recipient_name") as string)?.trim();
  const recurrence = formData.get("recurrence") as "one_off" | "annual";
  const recurrenceMonthRaw = formData.get("recurrence_month") as string | null;
  const recurrenceDayRaw = formData.get("recurrence_day") as string | null;

  if (!title || !recipientName) {
    return { status: "error", error: "Title and recipient name are required." };
  }

  if (recurrence === "annual") {
    const month = parseInt(recurrenceMonthRaw ?? "", 10);
    const day = parseInt(recurrenceDayRaw ?? "", 10);
    if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      return { status: "error", error: "Annual occasions require a valid month and day." };
    }
  }

  const { error } = await supabaseAdmin
    .from("occasion")
    .update({
      title,
      recipient_name: recipientName,
      recurrence,
      recurrence_month: recurrence === "annual" ? parseInt(recurrenceMonthRaw!, 10) : null,
      recurrence_day: recurrence === "annual" ? parseInt(recurrenceDayRaw!, 10) : null,
    })
    .eq("id", occasionId);

  if (error) return { status: "error", error: "Could not save changes. Please try again." };

  redirect(`/occasion/${occasionId}`);
}
