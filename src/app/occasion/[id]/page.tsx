import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedMember } from "@/lib/auth";
import { StatusPill } from "@/components/ui/StatusPill";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { InvitePanel } from "@/components/occasion/InvitePanel";
import { startNewInstance, leaveOccasion, deleteOccasion } from "./actions";
import { LeaveOccasionButton } from "@/components/occasion/LeaveOccasionButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function OccasionPage({ params }: PageProps) {
  const { id } = await params;

  const currentMember = await getAuthenticatedMember();
  if (!currentMember) redirect("/login");

  const [{ data: membership }, { data: occasion }] = await Promise.all([
    supabaseAdmin
      .from("occasion_member")
      .select("occasion_id")
      .eq("occasion_id", id)
      .eq("member_id", currentMember.id)
      .maybeSingle(),
    supabaseAdmin
      .from("occasion")
      .select("id, title, recipient_name, recurrence, recurrence_month, recurrence_day, invite_token")
      .eq("id", id)
      .single(),
  ]);
  if (!membership) notFound();
  if (!occasion) notFound();

  const [{ data: memberships }, { data: rawInstances }] = await Promise.all([
    supabaseAdmin
      .from("occasion_member")
      .select("member:member_id(id, name)")
      .eq("occasion_id", id),
    supabaseAdmin
      .from("occasion_instance")
      .select("id, year, status, archived_at, buyer_id, decided_gift:decided_gift_id(title)")
      .eq("occasion_id", id)
      .order("year", { ascending: false }),
  ]);

  const members = (memberships ?? [])
    .map((m) => m.member as { id: string; name: string } | null)
    .filter((m): m is { id: string; name: string } => !!m);

  const instances = (rawInstances ?? []).map((i) => ({
    ...i,
    decidedGiftTitle: (i.decided_gift as { title: string } | null)?.title ?? null,
  }));

  const currentYear = new Date().getFullYear();
  const activeInstance = instances.find((i) => !i.archived_at) ?? null;
  const archivedInstances = instances.filter((i) => i.archived_at);
  const hasCurrentYearInstance = instances.some((i) => i.year === currentYear);
  const isSoleMember = members.length === 1;
  const isActiveBuyer = !!activeInstance && activeInstance.buyer_id === currentMember.id;

  const dateLabel =
    occasion.recurrence === "annual" && occasion.recurrence_month && occasion.recurrence_day
      ? `${MONTH_NAMES[occasion.recurrence_month - 1]} ${occasion.recurrence_day}`
      : "One-off";

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${occasion.invite_token}`;
  const boundStartNewInstance = startNewInstance.bind(null, id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 pb-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        ← Back
      </Link>

      <div className="mt-6 mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-2xl font-semibold text-app-text">
            {occasion.title}
          </h1>
          <Link
            href={`/occasion/${id}/edit`}
            className="shrink-0 text-sm text-neutral-400 hover:text-neutral-600 transition-colors mt-1"
          >
            Edit
          </Link>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Gift for {occasion.recipient_name} &middot; {dateLabel}
        </p>
      </div>

      <section className="mb-8">
        <SectionHeading>Members ({members.length})</SectionHeading>
        <div className="mt-3 flex flex-wrap gap-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5">
              <Avatar name={m.name} size="sm" />
              <span className="text-sm text-neutral-700">{m.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <SectionHeading>Invite link</SectionHeading>
        <div className="mt-3">
          <InvitePanel inviteUrl={inviteUrl} occasionId={id} />
        </div>
      </section>

      {occasion.recurrence === "one_off" ? (
        <section className="mb-8">
          {activeInstance ? (
            <Link
              href={`/occasion/${id}/${activeInstance.year}`}
              className="block rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-app-text">{occasion.title}</span>
                <StatusPill status={activeInstance.status} />
              </div>
              {activeInstance.decidedGiftTitle && (
                <p className="mt-1 truncate text-sm text-neutral-500">
                  {activeInstance.decidedGiftTitle}
                </p>
              )}
            </Link>
          ) : (
            <Card className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">No gift round started yet.</p>
              <form action={boundStartNewInstance}>
                <button
                  type="submit"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  + Start gift round
                </button>
              </form>
            </Card>
          )}
        </section>
      ) : (
        <>
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <SectionHeading>This year&rsquo;s gift</SectionHeading>
              {!hasCurrentYearInstance && (
                <form action={boundStartNewInstance}>
                  <button
                    type="submit"
                    className="text-sm text-primary hover:underline"
                  >
                    + Start {currentYear}
                  </button>
                </form>
              )}
            </div>

            {activeInstance ? (
              <Link
                href={`/occasion/${id}/${activeInstance.year}`}
                className="block rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-app-text">
                    {occasion.title} gift {activeInstance.year}
                  </span>
                  <StatusPill status={activeInstance.status} />
                </div>
                {activeInstance.decidedGiftTitle && (
                  <p className="mt-1 truncate text-sm text-neutral-500">
                    {activeInstance.decidedGiftTitle}
                  </p>
                )}
              </Link>
            ) : (
              <Card className="text-center text-sm text-neutral-400">
                No gift round started yet.
              </Card>
            )}
          </section>

          {archivedInstances.length > 0 && (
            <section>
              <SectionHeading>Past gifts</SectionHeading>
              <ul className="mt-3 flex flex-col gap-2">
                {archivedInstances.map((i) => (
                  <li key={i.id}>
                    <Link
                      href={`/occasion/${id}/${i.year}`}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 transition-colors hover:border-neutral-300"
                    >
                      <span className="text-sm font-medium text-app-text">
                        {occasion.title} gift {i.year}
                      </span>
                      <div className="flex items-center gap-3">
                        {i.decidedGiftTitle && (
                          <span className="max-w-[180px] truncate text-sm text-neutral-500">
                            {i.decidedGiftTitle}
                          </span>
                        )}
                        <StatusPill status={i.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <div className="mt-12 border-t border-neutral-100 pt-6">
        <LeaveOccasionButton
          leaveAction={leaveOccasion.bind(null, id)}
          deleteAction={deleteOccasion.bind(null, id)}
          isSoleMember={isSoleMember}
          isActiveBuyer={isActiveBuyer}
        />
      </div>
    </main>
  );
}
