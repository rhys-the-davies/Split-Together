import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { OccasionList } from "@/components/home/OccasionList";
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
  } | null;
}

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get the member record.
  const { data: currentMember } = await supabaseAdmin
    .from("member")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!currentMember) redirect("/login");

  // Fetch occasion IDs this member belongs to.
  const { data: memberships } = await supabaseAdmin
    .from("occasion_member")
    .select("occasion_id")
    .eq("member_id", currentMember.id);

  const occasionIds = (memberships ?? []).map((m) => m.occasion_id);

  let occasions: OccasionRow[] = [];

  if (occasionIds.length > 0) {
    const { data: rows } = await supabaseAdmin
      .from("occasion")
      .select("id, title, recipient_name, recurrence, recurrence_month, recurrence_day, occasion_instance(id, year, status, archived_at)")
      .in("id", occasionIds)
      .order("created_at", { ascending: false });

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
        instance: active ? { id: active.id, year: active.year, status: active.status } : null,
      };
    });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <OccasionList occasions={occasions} />
    </main>
  );
}
