import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedMember } from "@/lib/auth";
import { CreateOccasionForm } from "@/components/occasion/CreateOccasionForm";
import { updateOccasion } from "./actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOccasionPage({ params }: PageProps) {
  const { id } = await params;

  const member = await getAuthenticatedMember();
  if (!member) redirect("/login");

  const [{ data: membership }, { data: occasion }] = await Promise.all([
    supabaseAdmin
      .from("occasion_member")
      .select("member_id")
      .eq("occasion_id", id)
      .eq("member_id", member.id)
      .maybeSingle(),
    supabaseAdmin
      .from("occasion")
      .select("id, title, recipient_name, recurrence, recurrence_month, recurrence_day")
      .eq("id", id)
      .single(),
  ]);

  if (!membership || !occasion) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/occasion/${id}`}
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        ← Back
      </Link>

      <div className="mt-6 mb-8">
        <h1 className="font-display text-2xl font-semibold text-app-text">Edit occasion</h1>
      </div>

      <CreateOccasionForm
        action={updateOccasion.bind(null, id)}
        defaultValues={{
          title: occasion.title,
          recipientName: occasion.recipient_name,
          recurrence: occasion.recurrence,
          recurrenceMonth: occasion.recurrence_month,
          recurrenceDay: occasion.recurrence_day,
        }}
        submitLabel="Save changes"
      />
    </main>
  );
}
