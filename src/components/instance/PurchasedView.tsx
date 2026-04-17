"use client";

import { useActionState } from "react";
import { type ActionState } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Contribution {
  id: string;
  contributorId: string;
  contributorName: string;
  amount: number;
  madeAt: string | null;
}

interface PurchasedViewProps {
  decidedGiftTitle: string;
  decidedGiftPrice: number;
  buyerName: string | null;
  bankDetails: string | null;
  contributions: Contribution[];
  currentMemberId: string;
  isBuyer: boolean;
  isDone: boolean;
  markContributionActions: Record<string, (prev: ActionState, fd: FormData) => Promise<ActionState>>;
  markDoneAction: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  unarchiveAction: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  revertPurchaseAction: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}

function ContributionRow({
  contribution,
  isOwn,
  isBuyer,
  action,
}: {
  contribution: Contribution;
  isOwn: boolean;
  isBuyer: boolean;
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  const paid = !!contribution.madeAt;
  const canMark = (isOwn || isBuyer) && !paid;

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-app-text">{contribution.contributorName}</p>
        <p className="text-sm text-neutral-500">£{contribution.amount.toFixed(2)}</p>
        {state?.status === "error" && (
          <p role="alert" className="text-xs text-danger">{state.error}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {paid ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            ✓ Paid
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500">
            Unpaid
          </span>
        )}
        {canMark && (
          <form action={formAction}>
            <button
              type="submit"
              disabled={isPending}
              className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Saving…" : isOwn ? "I've paid" : "Mark paid"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function PurchasedView({
  decidedGiftTitle,
  decidedGiftPrice,
  buyerName,
  bankDetails,
  contributions,
  currentMemberId,
  isBuyer,
  isDone,
  markContributionActions,
  markDoneAction,
  unarchiveAction,
  revertPurchaseAction,
}: PurchasedViewProps) {
  const [doneState, doneFormAction, isClosing] = useActionState(markDoneAction, null);
  const [unarchiveState, unarchiveFormAction, isUnarchiving] = useActionState(unarchiveAction, null);
  const [revertState, revertFormAction, isReverting] = useActionState(revertPurchaseAction, null);
  const allPaid = contributions.every((c) => !!c.madeAt);

  return (
    <div className="flex flex-col gap-6">
      {/* Gift summary */}
      <Card>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
          Gift purchased
        </p>
        <p className="font-semibold text-app-text">{decidedGiftTitle}</p>
        <p className="mt-0.5 text-sm text-neutral-500">£{decidedGiftPrice.toFixed(2)}</p>
        {buyerName && (
          <p className="mt-2 text-xs text-neutral-500">
            Bought by <span className="font-medium text-neutral-700">{buyerName}</span>
          </p>
        )}
      </Card>

      {/* Bank details */}
      {bankDetails && (
        <Card>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Payment details
          </p>
          <p className="whitespace-pre-wrap text-sm text-app-text">{bankDetails}</p>
        </Card>
      )}

      {/* Contributions */}
      <Card>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
          Contributions
        </p>
        <div className="divide-y divide-neutral-100">
          {buyerName && (
            <div className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-app-text">{buyerName}</p>
                <p className="text-sm text-neutral-500">£{decidedGiftPrice.toFixed(2)}</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                Fronted cost
              </span>
            </div>
          )}
          {contributions.map((c) => (
            <ContributionRow
              key={c.id}
              contribution={c}
              isOwn={c.contributorId === currentMemberId}
              isBuyer={isBuyer}
              action={markContributionActions[c.id]}
            />
          ))}
        </div>
      </Card>

      {/* Revert purchase (buyer only, purchased state) */}
      {isBuyer && !isDone && (
        <Card>
          <form action={revertFormAction} className="flex flex-col gap-3">
            {revertState?.status === "error" && (
              <p role="alert" className="text-sm text-danger">{revertState.error}</p>
            )}
            <p className="text-xs text-neutral-500">
              Made a mistake? Revert to the decided state to adjust splits or bank details before purchasing again.
            </p>
            <button
              type="submit"
              disabled={isReverting}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50 transition-colors text-left"
            >
              {isReverting ? "Reverting…" : "← Undo purchase"}
            </button>
          </form>
        </Card>
      )}

      {/* Close round (buyer only, purchased state) */}
      {isBuyer && !isDone && (
        <Card>
          <form action={doneFormAction} className="flex flex-col gap-3">
            {doneState?.status === "error" && (
              <p role="alert" className="text-sm text-danger">{doneState.error}</p>
            )}
            {!allPaid && (
              <p className="text-xs text-neutral-500">
                Some contributions are still unpaid — you can still close the round if you&apos;re happy to.
              </p>
            )}
            <Button variant="secondary" loading={isClosing}>
              Close &amp; archive this gift round
            </Button>
          </form>
        </Card>
      )}

      {/* Unarchive (done state) */}
      {isDone && (
        <Card>
          <form action={unarchiveFormAction} className="flex flex-col gap-3">
            {unarchiveState?.status === "error" && (
              <p role="alert" className="text-sm text-danger">{unarchiveState.error}</p>
            )}
            <p className="text-xs text-neutral-500">
              Archived by mistake? You can reopen this round.
            </p>
            <Button variant="secondary" loading={isUnarchiving}>
              Reopen this gift round
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
