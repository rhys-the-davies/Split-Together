import { redirect } from "next/navigation";
import { getAuthenticatedMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { OccasionList } from "@/components/home/OccasionList";
import { OutstandingPanel, type OwedToMeItem } from "@/components/home/OutstandingPanel";
import type { Enums } from "@/lib/database.types";

interface OccasionRow {
  id: string;
  title: string;
  recipient_name: string;
  recurrence: Enums<"recurrence_type">;
  recurrence_month: number | null;
  recurrence_day: number | null;
  instance: {
    id: string;
    year: number;
    status: Enums<"instance_status">;
    unpaidCount: number;
  } | null;
}

export default async function HomePage() {
  const currentMember = await getAuthenticatedMember();
  if (!currentMember) redirect("/login");

  const { data: memberships } = await supabaseAdmin
    .from("occasion_member")
    .select("occasion_id")
    .eq("member_id", currentMember.id);

  const occasionIds = (memberships ?? []).map((m) => m.occasion_id);

  let occasions: OccasionRow[] = [];
  const owedToMeItems: OwedToMeItem[] = [];

  if (occasionIds.length > 0) {
    const { data: rows } = await supabaseAdmin
      .from("occasion")
      .select("id, title, recipient_name, recurrence, recurrence_month, recurrence_day, occasion_instance(id, year, status, archived_at, buyer_id)")
      .in("id", occasionIds)
      .order("created_at", { ascending: false });

    // Purchased instances where the current member is the buyer (for badge counts + "You're owed" panel).
    const purchasedBuyerInstanceIds = (rows ?? [])
      .flatMap((row) => row.occasion_instance ?? [])
      .filter((i: { status: string; archived_at: string | null; buyer_id: string | null }) =>
        i.status === "purchased" && !i.archived_at && i.buyer_id === currentMember.id
      )
      .map((i: { id: string }) => i.id);

    const unpaidByInstance: Record<string, number> = {};

    type RawBuyerInst = { year: number; occasion_id: string; occasion: { title: string } | null } | null;

    const { data: unpaidRows } = purchasedBuyerInstanceIds.length > 0
      ? await supabaseAdmin
          .from("contribution")
          .select(`
            id, amount, instance_id,
            contributor:member!contributor_id(name),
            instance:instance_id(year, occasion_id, occasion:occasion_id(title))
          `)
          .in("instance_id", purchasedBuyerInstanceIds)
          .is("made_at", null)
      : { data: null };

    for (const row of unpaidRows ?? []) {
      unpaidByInstance[row.instance_id] = (unpaidByInstance[row.instance_id] ?? 0) + 1;
      const inst = row.instance as RawBuyerInst;
      const contributor = row.contributor as { name: string } | null;
      if (inst && contributor) {
        owedToMeItems.push({
          contributionId: row.id,
          instanceId: row.instance_id,
          occasionId: inst.occasion_id,
          occasionTitle: inst.occasion?.title ?? "",
          year: inst.year,
          contributorName: contributor.name,
          amount: Number(row.amount),
        });
      }
    }

    occasions = (rows ?? []).map((row) => {
      const active = (row.occasion_instance ?? [])
        .filter((i: { archived_at: string | null }) => !i.archived_at)
        .sort((a: { year: number }, b: { year: number }) => b.year - a.year)[0] ?? null;

      return {
        id: row.id,
        title: row.title,
        recipient_name: row.recipient_name,
        recurrence: row.recurrence,
        recurrence_month: row.recurrence_month,
        recurrence_day: row.recurrence_day,
        instance: active
          ? {
              id: active.id,
              year: active.year,
              status: active.status,
              unpaidCount: unpaidByInstance[active.id] ?? 0,
            }
          : null,
      };
    });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <OutstandingPanel owedToMe={owedToMeItems} />
      <OccasionList occasions={occasions} />
    </main>
  );
}
