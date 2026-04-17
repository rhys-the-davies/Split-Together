"use server";

import { getAuthenticatedMember } from "@/lib/auth";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { type ActionState } from "@/lib/types";

export async function submitFeedback(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  const message = (formData.get("message") as string)?.trim();
  if (!message) return { status: "error", error: "Please enter a message." };

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: "rhys.michael.davies@gmail.com",
    subject: `Feedback from ${member.email}`,
    text: `From: ${member.email}\n\n${message}`,
  });

  if (error) {
    console.error("[feedback] Failed to send:", error);
    return { status: "error", error: "Could not send feedback. Please try again." };
  }

  return { status: "success" };
}
