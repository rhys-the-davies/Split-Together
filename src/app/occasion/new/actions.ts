"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedMember } from "@/lib/auth";
import { type ActionState } from "@/lib/types";

export async function createOccasion(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "You must be signed in to create an occasion." };

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

  const recurrenceMonth = recurrence === "annual" ? parseInt(recurrenceMonthRaw!, 10) : null;
  const recurrenceDay = recurrence === "annual" ? parseInt(recurrenceDayRaw!, 10) : null;
  const currentYear = new Date().getFullYear();

  const { data: occasion, error: occasionError } = await supabaseAdmin
    .from("occasion")
    .insert({
      title,
      recipient_name: recipientName,
      recurrence,
      recurrence_month: recurrenceMonth,
      recurrence_day: recurrenceDay,
      created_by: member.id,
    })
    .select("id")
    .single();

  if (occasionError || !occasion) {
    return { status: "error", error: "Could not create occasion. Please try again." };
  }

  await Promise.all([
    supabaseAdmin
      .from("occasion_member")
      .insert({ occasion_id: occasion.id, member_id: member.id }),
    supabaseAdmin
      .from("occasion_instance")
      .insert({ occasion_id: occasion.id, year: currentYear }),
  ]);

  redirect(`/occasion/${occasion.id}`);
}
