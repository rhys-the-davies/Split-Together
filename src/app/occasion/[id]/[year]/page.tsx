import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedMember } from "@/lib/auth";
import { StatusPill } from "@/components/ui/StatusPill";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { SuggestionCard } from "@/components/instance/SuggestionCard";
import { AddSuggestionForm } from "@/components/instance/AddSuggestionForm";
import { BuyerPicker } from "@/components/instance/BuyerPicker";
import { DecidedView } from "@/components/instance/DecidedView";
import { PurchasedView } from "@/components/instance/PurchasedView";
import {
  addSuggestion,
  editSuggestion,
  deleteSuggestion,
  toggleVote,
  assignBuyer,
  markDecided,
  revertToPlanning,
  updateSplits,
  saveBankDetails,
  markPurchased,
  markContributionMade,
  markDone,
  unarchiveInstance,
  revertPurchase,
} from "./actions";

interface PageProps {
  params: Promise<{ id: string; year: string }>;
}

export default async function InstancePage({ params }: PageProps) {
  const { id: occasionId, year: yearStr } = await params;
  const year = parseInt(yearStr, 10);
  if (isNaN(year)) notFound();

  const currentMember = await getAuthenticatedMember();
  if (!currentMember) redirect("/login");

  const [{ data: membership }, { data: occasion }] = await Promise.all([
    supabaseAdmin
      .from("occasion_member")
      .select("occasion_id")
      .eq("occasion_id", occasionId)
      .eq("member_id", currentMember.id)
      .maybeSingle(),
    supabaseAdmin
      .from("occasion")
      .select("id, title, recipient_name, recurrence")
      .eq("id", occasionId)
      .single(),
  ]);
  if (!membership) notFound();
  if (!occasion) notFound();

  const [{ data: instance }, { data: memberships }] = await Promise.all([
    supabaseAdmin
      .from("occasion_instance")
      .select("id, year, status, buyer_id, buyer_bank_details, decided_gift_id, archived_at")
      .eq("occasion_id", occasionId)
      .eq("year", year)
      .single(),
    supabaseAdmin
      .from("occasion_member")
      .select("member:member_id(id, name)")
      .eq("occasion_id", occasionId),
  ]);
  if (!instance) notFound();

  const members = (memberships ?? [])
    .map((m) => m.member as { id: string; name: string } | null)
    .filter((m): m is { id: string; name: string } => !!m);

  const buyer = instance.buyer_id
    ? (members.find((m) => m.id === instance.buyer_id) ?? null)
    : null;
  const isBuyer = instance.buyer_id === currentMember.id;

  const isPlanning = instance.status === "planning";
  const isDecided = instance.status === "decided";
  const isPurchased = instance.status === "purchased";
  const isDone = instance.status === "done";

  const [
    { data: rawSuggestions },
    prevGiftResult,
    splitsResult,
    contributionsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("gift_suggestion")
      .select("id, title, url, price, is_decided, proposed_by, gift_vote(member_id)")
      .eq("instance_id", instance.id)
      .order("created_at", { ascending: true }),
    occasion.recurrence === "annual"
      ? supabaseAdmin
          .from("occasion_instance")
          .select("decided_gift:decided_gift_id(title, price, url)")
          .eq("occasion_id", occasionId)
          .lt("year", year)
          .not("decided_gift_id", "is", null)
          .order("year", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    isDecided || isPurchased
      ? supabaseAdmin
          .from("split")
          .select("id, member_id, amount")
          .eq("instance_id", instance.id)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: null }),
    isPurchased || isDone
      ? supabaseAdmin
          .from("contribution")
          .select("id, contributor_id, amount, made_at")
          .eq("instance_id", instance.id)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: null }),
  ]);

  type RawSuggestion = {
    id: string;
    title: string;
    url: string | null;
    price: number;
    is_decided: boolean;
    proposed_by: string;
    gift_vote: { member_id: string }[];
  };

  const suggestions = (rawSuggestions as RawSuggestion[] ?? []).map((s) => ({
    ...s,
    voteCount: s.gift_vote.length,
    hasVoted: s.gift_vote.some((v) => v.member_id === currentMember.id),
  }));

  type PrevGift = { title: string; price: number; url: string | null } | null;
  const previousGift: PrevGift = (prevGiftResult.data?.decided_gift as PrevGift) ?? null;

  type Split = { id: string; member_id: string; amount: number; memberName: string };
  const splits: Split[] = (splitsResult.data ?? []).map((s) => ({
    ...s,
    memberName: members.find((m) => m.id === s.member_id)?.name ?? "Unknown",
  }));

  type Contribution = {
    id: string;
    contributorId: string;
    contributorName: string;
    amount: number;
    madeAt: string | null;
  };
  const contributions: Contribution[] = (contributionsResult.data ?? []).map((c) => ({
    id: c.id,
    contributorId: c.contributor_id,
    contributorName: members.find((m) => m.id === c.contributor_id)?.name ?? "Unknown",
    amount: c.amount,
    madeAt: c.made_at,
  }));

  const decidedGift = suggestions.find((s) => s.is_decided) ?? null;

  const boundAddSuggestion = addSuggestion.bind(null, instance.id, occasionId);
  const boundAssignBuyer = assignBuyer.bind(null, instance.id, occasionId);
  const boundRevert = revertToPlanning.bind(null, instance.id, occasionId, year);
  const boundUpdateSplits = updateSplits.bind(null, instance.id, occasionId, year);
  const boundSaveBankDetails = saveBankDetails.bind(null, instance.id, occasionId, year);
  const boundMarkPurchased = markPurchased.bind(null, instance.id, occasionId, year);
  const boundMarkDone = markDone.bind(null, instance.id, occasionId);
  const boundUnarchive = unarchiveInstance.bind(null, instance.id, occasionId, year);
  const boundRevertPurchase = revertPurchase.bind(null, instance.id, occasionId, year);
  const markContributionActions = Object.fromEntries(
    contributions.map((c) => [
      c.id,
      markContributionMade.bind(null, c.id, occasionId, year),
    ])
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 pb-16">
      <Link
        href={`/occasion/${occasionId}`}
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        ← {occasion.title}
      </Link>

      <div className="mt-6 mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-app-text">
            {occasion.recipient_name}&rsquo;s {year} gift
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {occasion.title}
          </p>
        </div>
        <StatusPill status={instance.status} />
      </div>

      {(isPurchased || isDone) && decidedGift && (
        <div className="mb-8">
          <PurchasedView
            decidedGiftTitle={decidedGift.title}
            decidedGiftPrice={decidedGift.price}
            buyerName={buyer?.name ?? null}
            bankDetails={instance.buyer_bank_details ?? null}
            contributions={contributions}
            currentMemberId={currentMember.id}
            isBuyer={isBuyer && !isDone}
            isDone={isDone}
            markContributionActions={markContributionActions}
            markDoneAction={boundMarkDone}
            unarchiveAction={boundUnarchive}
            revertPurchaseAction={boundRevertPurchase}
          />
        </div>
      )}

      {previousGift && (
        <Card className="mb-6 bg-neutral-50">
          <SectionHeading>Last year&rsquo;s gift</SectionHeading>
          <p className="mt-1 font-medium text-app-text">{previousGift.title}</p>
          <p className="text-sm text-neutral-500">£{previousGift.price.toFixed(2)}</p>
          {previousGift.url && <ExternalLink href={previousGift.url} className="mt-1 block" />}
        </Card>
      )}

      {isDecided && decidedGift && (
        <DecidedView
          decidedGift={decidedGift}
          splits={splits}
          buyerName={buyer?.name ?? null}
          bankDetails={instance.buyer_bank_details ?? null}
          isBuyer={isBuyer}
          revertAction={boundRevert}
          updateSplitsAction={boundUpdateSplits}
          saveBankDetailsAction={boundSaveBankDetails}
          markPurchasedAction={boundMarkPurchased}
        />
      )}

      {(isPlanning || isDecided) && (
        <section className="mb-8">
          <SectionHeading>
            {suggestions.length > 0 ? `Gift suggestions (${suggestions.length})` : "Gift suggestions"}
          </SectionHeading>

          <div className="mt-3 flex flex-col gap-3">
            {suggestions.map((s) => {
              const boundEdit = editSuggestion.bind(null, s.id, occasionId);
              const boundDelete = deleteSuggestion.bind(null, s.id, occasionId);
              const boundToggle = toggleVote.bind(null, s.id, s.hasVoted, occasionId);
              const boundMarkDecided = isBuyer && isPlanning
                ? markDecided.bind(null, s.id, instance.id, occasionId, year)
                : undefined;

              return (
                <SuggestionCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  url={s.url}
                  price={s.price}
                  voteCount={s.voteCount}
                  hasVoted={s.hasVoted}
                  isOwn={s.proposed_by === currentMember.id}
                  isDecided={s.is_decided}
                  readOnly={!isPlanning}
                  toggleVoteAction={isPlanning ? boundToggle : undefined}
                  editAction={isPlanning ? boundEdit : undefined}
                  deleteAction={isPlanning ? boundDelete : undefined}
                  markDecidedAction={boundMarkDecided}
                />
              );
            })}

            {isPlanning && <AddSuggestionForm action={boundAddSuggestion} />}
          </div>
        </section>
      )}

      {isPlanning && (
        <section>
          <SectionHeading>Who&apos;s buying?</SectionHeading>
          <div className="mt-3">
            <BuyerPicker
              members={members}
              currentBuyerId={instance.buyer_id}
              currentBuyerName={buyer?.name ?? null}
              action={boundAssignBuyer}
            />
          </div>
        </section>
      )}
    </main>
  );
}
