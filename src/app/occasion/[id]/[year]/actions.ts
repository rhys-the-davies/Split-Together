"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedMember } from "@/lib/auth";
import { sendContributionNotices } from "@/lib/email/sendContributionNotices";
import { type ActionState } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function verifyIsBuyer(instanceId: string, memberId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("occasion_instance")
    .select("buyer_id")
    .eq("id", instanceId)
    .single();
  return data?.buyer_id === memberId;
}

type SuggestionFields = { title: string; url: string | null; price: number };

function parseSuggestionForm(formData: FormData): SuggestionFields | { status: "error"; error: string } {
  const title = (formData.get("title") as string)?.trim();
  const url = (formData.get("url") as string)?.trim() || null;
  const price = parseFloat(formData.get("price") as string);
  if (!title) return { status: "error", error: "Title is required." };
  if (isNaN(price) || price < 0) return { status: "error", error: "Enter a valid price." };
  return { title, url, price };
}

// ─── Add suggestion ───────────────────────────────────────────────────────────

export async function addSuggestion(
  instanceId: string,
  occasionId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  const parsed = parseSuggestionForm(formData);
  if ("status" in parsed) return parsed;

  const { error } = await supabaseAdmin.from("gift_suggestion").insert({
    instance_id: instanceId,
    proposed_by: member.id,
    title: parsed.title,
    url: parsed.url,
    price: parsed.price,
  });

  if (error) return { status: "error", error: "Could not add suggestion." };

  revalidatePath(`/occasion/${occasionId}`);
  return null;
}

// ─── Edit suggestion ──────────────────────────────────────────────────────────

export async function editSuggestion(
  suggestionId: string,
  occasionId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  const parsed = parseSuggestionForm(formData);
  if ("status" in parsed) return parsed;

  const { error } = await supabaseAdmin
    .from("gift_suggestion")
    .update({ title: parsed.title, url: parsed.url, price: parsed.price })
    .eq("id", suggestionId)
    .eq("proposed_by", member.id);

  if (error) return { status: "error", error: "Could not save changes." };

  revalidatePath(`/occasion/${occasionId}`);
  return null;
}

// ─── Delete suggestion ────────────────────────────────────────────────────────

export async function deleteSuggestion(
  suggestionId: string,
  occasionId: string,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  const { error } = await supabaseAdmin
    .from("gift_suggestion")
    .delete()
    .eq("id", suggestionId)
    .eq("proposed_by", member.id);

  if (error) return { status: "error", error: "Could not delete suggestion." };

  revalidatePath(`/occasion/${occasionId}`);
  return null;
}

// ─── Toggle vote ──────────────────────────────────────────────────────────────

export async function toggleVote(
  suggestionId: string,
  hasVoted: boolean,
  occasionId: string,
  _formData: FormData
): Promise<void> {
  const member = await getAuthenticatedMember();
  if (!member) return;

  if (hasVoted) {
    await supabaseAdmin
      .from("gift_vote")
      .delete()
      .eq("suggestion_id", suggestionId)
      .eq("member_id", member.id);
  } else {
    await supabaseAdmin
      .from("gift_vote")
      .insert({ suggestion_id: suggestionId, member_id: member.id });
  }

  revalidatePath(`/occasion/${occasionId}`);
}

// ─── Assign buyer ─────────────────────────────────────────────────────────────

export async function assignBuyer(
  instanceId: string,
  occasionId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  const buyerId = formData.get("buyer_id") as string;
  if (!buyerId) return { status: "error", error: "Select a member." };

  const { data: instance } = await supabaseAdmin
    .from("occasion_instance")
    .select("occasion_id, decided_gift_id")
    .eq("id", instanceId)
    .single();

  if (!instance) return { status: "error", error: "Instance not found." };

  let giftPrice = 0;
  if (instance.decided_gift_id) {
    const { data: gift } = await supabaseAdmin
      .from("gift_suggestion")
      .select("price")
      .eq("id", instance.decided_gift_id)
      .single();
    giftPrice = gift?.price ?? 0;
  }

  // Update buyer and fetch all members in parallel.
  const [{ error: updateError }, { data: contributors }] = await Promise.all([
    supabaseAdmin
      .from("occasion_instance")
      .update({ buyer_id: buyerId })
      .eq("id", instanceId),
    supabaseAdmin
      .from("occasion_member")
      .select("member_id")
      .eq("occasion_id", instance.occasion_id),
  ]);

  if (updateError) return { status: "error", error: "Could not assign buyer." };

  const n = contributors?.length ?? 0;
  const share = n > 0 ? Math.round((giftPrice / n) * 100) / 100 : 0;

  await supabaseAdmin.from("split").delete().eq("instance_id", instanceId);

  if (n > 0 && contributors) {
    await supabaseAdmin.from("split").insert(
      contributors.map((c) => ({
        instance_id: instanceId,
        member_id: c.member_id,
        amount: share,
      }))
    );
  }

  revalidatePath(`/occasion/${occasionId}`);
  return null;
}

// ─── Mark decided ─────────────────────────────────────────────────────────────

export async function markDecided(
  suggestionId: string,
  instanceId: string,
  occasionId: string,
  year: number,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  if (!(await verifyIsBuyer(instanceId, member.id))) {
    return { status: "error", error: "Only the buyer can mark a gift as decided." };
  }

  await supabaseAdmin
    .from("gift_suggestion")
    .update({ is_decided: false })
    .eq("instance_id", instanceId)
    .eq("is_decided", true);

  // Read the price back from the update response to avoid a separate SELECT.
  const { data: suggestionData, error: sErr } = await supabaseAdmin
    .from("gift_suggestion")
    .update({ is_decided: true })
    .eq("id", suggestionId)
    .select("price")
    .single();
  if (sErr) return { status: "error", error: "Could not mark gift as decided." };

  const { error: iErr } = await supabaseAdmin
    .from("occasion_instance")
    .update({ decided_gift_id: suggestionId, status: "decided" })
    .eq("id", instanceId);
  if (iErr) return { status: "error", error: "Could not update instance." };

  // Recalculate equal splits (all members including buyer) now that the gift price is known.
  if (suggestionData && suggestionData.price > 0) {
    const { data: existingSplits } = await supabaseAdmin
      .from("split")
      .select("id")
      .eq("instance_id", instanceId);

    const n = existingSplits?.length ?? 0;
    if (n > 0) {
      const share = Math.round((suggestionData.price / n) * 100) / 100;
      await supabaseAdmin
        .from("split")
        .update({ amount: share })
        .in("id", existingSplits!.map((s) => s.id));
    }
  }

  redirect(`/occasion/${occasionId}/${year}`);
}

// ─── Revert to planning ───────────────────────────────────────────────────────

export async function revertToPlanning(
  instanceId: string,
  occasionId: string,
  year: number,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  if (!(await verifyIsBuyer(instanceId, member.id))) {
    return { status: "error", error: "Only the buyer can revert to planning." };
  }

  await supabaseAdmin
    .from("gift_suggestion")
    .update({ is_decided: false })
    .eq("instance_id", instanceId)
    .eq("is_decided", true);

  const { error } = await supabaseAdmin
    .from("occasion_instance")
    .update({ decided_gift_id: null, status: "planning" })
    .eq("id", instanceId);
  if (error) return { status: "error", error: "Could not revert to planning." };

  redirect(`/occasion/${occasionId}/${year}`);
}

// ─── Update splits ────────────────────────────────────────────────────────────

export async function updateSplits(
  instanceId: string,
  occasionId: string,
  year: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  if (!(await verifyIsBuyer(instanceId, member.id))) {
    return { status: "error", error: "Only the buyer can edit splits." };
  }

  const updates: { id: string; amount: number }[] = [];
  for (const [key, val] of formData.entries()) {
    if (!key.startsWith("amount_")) continue;
    const splitId = key.slice("amount_".length);
    const amount = parseFloat(val as string);
    if (isNaN(amount) || amount < 0) {
      return { status: "error", error: "All amounts must be valid non-negative numbers." };
    }
    updates.push({ id: splitId, amount });
  }

  const results = await Promise.all(
    updates.map(({ id, amount }) =>
      supabaseAdmin.from("split").update({ amount }).eq("id", id).eq("instance_id", instanceId)
    )
  );
  if (results.some((r) => r.error)) return { status: "error", error: "Could not update splits." };

  revalidatePath(`/occasion/${occasionId}/${year}`);
  return null;
}

// ─── Save bank details ────────────────────────────────────────────────────────

export async function saveBankDetails(
  instanceId: string,
  occasionId: string,
  year: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  if (!(await verifyIsBuyer(instanceId, member.id))) {
    return { status: "error", error: "Only the buyer can enter bank details." };
  }

  const bankDetails = (formData.get("bank_details") as string)?.trim();
  if (!bankDetails) return { status: "error", error: "Bank details cannot be empty." };

  const { error } = await supabaseAdmin
    .from("occasion_instance")
    .update({ buyer_bank_details: bankDetails })
    .eq("id", instanceId);
  if (error) return { status: "error", error: "Could not save bank details." };

  revalidatePath(`/occasion/${occasionId}/${year}`);
  return null;
}

// ─── Mark purchased ───────────────────────────────────────────────────────────

export async function markPurchased(
  instanceId: string,
  occasionId: string,
  year: number,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  if (!(await verifyIsBuyer(instanceId, member.id))) {
    return { status: "error", error: "Only the buyer can mark as purchased." };
  }

  // Buyer is the sole member: insert a self-split so the DB trigger's count check passes.
  // snapshot_contributions excludes the buyer, so no contribution row is created for this split.
  const { count: splitCount } = await supabaseAdmin
    .from("split")
    .select("*", { count: "exact", head: true })
    .eq("instance_id", instanceId);

  if (splitCount === 0) {
    await supabaseAdmin.from("split").insert({
      instance_id: instanceId,
      member_id: member.id,
      amount: 0,
    });
  }

  const { error } = await supabaseAdmin
    .from("occasion_instance")
    .update({ status: "purchased" })
    .eq("id", instanceId);

  if (error) {
    const msg = error.message?.includes("bank details")
      ? "Add bank details before marking as purchased."
      : error.message?.includes("decided gift")
      ? "A gift must be decided before marking as purchased."
      : error.message?.includes("splits")
      ? "Splits must be set before marking as purchased."
      : "Could not mark as purchased. Ensure all requirements are met.";
    return { status: "error", error: msg };
  }

  const { error: snapError } = await supabaseAdmin.rpc("snapshot_contributions", {
    p_instance_id: instanceId,
  });

  if (snapError) {
    console.error("snapshot_contributions failed:", snapError, { instanceId });
    return {
      status: "error",
      error: "Purchase recorded, but contribution records could not be created. Please refresh and try again.",
    };
  }

  try {
    const [{ data: instanceData }, { data: contributionRows }, { data: buyerRow }] = await Promise.all([
      supabaseAdmin
        .from("occasion_instance")
        .select("buyer_bank_details, occasion:occasion_id(title, recipient_name), gift_suggestion!decided_gift_id(title, price)")
        .eq("id", instanceId)
        .single(),
      supabaseAdmin
        .from("contribution")
        .select("contributor_id, amount, contributor:contributor_id(name, email)")
        .eq("instance_id", instanceId),
      supabaseAdmin
        .from("member")
        .select("name")
        .eq("id", member.id)
        .single(),
    ]);

    if (instanceData && contributionRows && buyerRow) {
      const occasion = instanceData.occasion as { title: string; recipient_name: string } | null;
      const gift = instanceData.gift_suggestion as { title: string; price: number } | null;

      const contributors = contributionRows
        .map((c) => {
          const m = c.contributor;
          if (!m || typeof m !== "object" || Array.isArray(m)) return null;
          const { name, email } = m as { name: string; email: string };
          return { name, email, amount: c.amount };
        })
        .filter((c): c is { name: string; email: string; amount: number } => c !== null);

      if (occasion && gift && contributors.length > 0 && instanceData.buyer_bank_details) {
        await sendContributionNotices({
          occasionTitle: occasion.title,
          recipientName: occasion.recipient_name,
          giftTitle: gift.title,
          giftPrice: gift.price,
          buyerName: buyerRow.name,
          bankDetails: instanceData.buyer_bank_details,
          year,
          contributors,
        });
      }
    }
  } catch (emailErr) {
    console.error("Failed to send contribution notices:", emailErr);
  }

  redirect(`/occasion/${occasionId}/${year}`);
}

// ─── Revert purchase ──────────────────────────────────────────────────────────

export async function revertPurchase(
  instanceId: string,
  occasionId: string,
  year: number,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  if (!(await verifyIsBuyer(instanceId, member.id))) {
    return { status: "error", error: "Only the buyer can revert a purchase." };
  }

  const { error: deleteErr } = await supabaseAdmin
    .from("contribution")
    .delete()
    .eq("instance_id", instanceId);

  if (deleteErr) return { status: "error", error: "Could not remove contribution records." };

  const { error } = await supabaseAdmin
    .from("occasion_instance")
    .update({ status: "decided" })
    .eq("id", instanceId);

  if (error) return { status: "error", error: "Could not revert purchase." };

  redirect(`/occasion/${occasionId}/${year}`);
}

// ─── Mark contribution made ───────────────────────────────────────────────────

export async function markContributionMade(
  contributionId: string,
  occasionId: string,
  year: number,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  const { data: contribution } = await supabaseAdmin
    .from("contribution")
    .select("contributor_id, instance_id, occasion_instance(buyer_id)")
    .eq("id", contributionId)
    .single();

  if (!contribution) return { status: "error", error: "Contribution not found." };

  const buyerId = (contribution.occasion_instance as { buyer_id: string | null } | null)?.buyer_id;
  const isContributor = contribution.contributor_id === member.id;
  const isBuyer = buyerId === member.id;

  if (!isContributor && !isBuyer) {
    return { status: "error", error: "Not authorised." };
  }

  const { error } = await supabaseAdmin
    .from("contribution")
    .update({ made_at: new Date().toISOString(), marked_made_by: member.id })
    .eq("id", contributionId);

  if (error) return { status: "error", error: "Could not mark contribution." };

  revalidatePath(`/occasion/${occasionId}/${year}`);
  return null;
}

// ─── Mark done ────────────────────────────────────────────────────────────────

export async function markDone(
  instanceId: string,
  occasionId: string,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  if (!(await verifyIsBuyer(instanceId, member.id))) {
    return { status: "error", error: "Only the buyer can close this gift round." };
  }

  const { error } = await supabaseAdmin
    .from("occasion_instance")
    .update({ status: "done" })
    .eq("id", instanceId);

  if (error) return { status: "error", error: "Could not close this gift round." };

  redirect("/");
}

// ─── Unarchive ────────────────────────────────────────────────────────────────

export async function unarchiveInstance(
  instanceId: string,
  occasionId: string,
  year: number,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const member = await getAuthenticatedMember();
  if (!member) return { status: "error", error: "Not signed in." };

  const { data: membership } = await supabaseAdmin
    .from("occasion_member")
    .select("occasion_id")
    .eq("occasion_id", occasionId)
    .eq("member_id", member.id)
    .maybeSingle();
  if (!membership) return { status: "error", error: "Not a member of this occasion." };

  const { error } = await supabaseAdmin
    .from("occasion_instance")
    .update({ status: "purchased", archived_at: null })
    .eq("id", instanceId)
    .eq("status", "done");

  if (error) return { status: "error", error: "Could not reopen this gift round." };

  redirect(`/occasion/${occasionId}/${year}`);
}
