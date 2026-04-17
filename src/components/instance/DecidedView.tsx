"use client";

import { useActionState } from "react";
import { type ActionState } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { isHttpUrl } from "@/lib/utils";

interface Split {
  id: string;
  member_id: string;
  amount: number;
  memberName: string;
}

interface DecidedGift {
  title: string;
  price: number;
  url: string | null;
}

interface DecidedViewProps {
  decidedGift: DecidedGift;
  splits: Split[];
  buyerName: string | null;
  bankDetails: string | null;
  isBuyer: boolean;
  revertAction: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  updateSplitsAction: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  saveBankDetailsAction: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  markPurchasedAction: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}

export function DecidedView({
  decidedGift,
  splits,
  buyerName,
  bankDetails,
  isBuyer,
  revertAction,
  updateSplitsAction,
  saveBankDetailsAction,
  markPurchasedAction,
}: DecidedViewProps) {
  const [revertState, revertFormAction, isReverting] = useActionState(revertAction, null);
  const [splitsState, splitsFormAction, isSavingSplits] = useActionState(updateSplitsAction, null);
  const [bankState, bankFormAction, isSavingBank] = useActionState(saveBankDetailsAction, null);
  const [purchasedState, purchasedFormAction, isMarkingPurchased] = useActionState(markPurchasedAction, null);

  const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
  const canPurchase = !!bankDetails;
  const bankDetailsIsUrl = bankDetails ? isHttpUrl(bankDetails) : false;

  return (
    <div className="mb-8 flex flex-col gap-6">
      {/* Orientation banner */}
      <div className="rounded-xl border border-success/20 bg-success/5 px-4 py-3">
        <p className="font-semibold text-app-text">Gift decided! 🎉</p>
        <p className="mt-0.5 text-sm text-neutral-500">
          {isBuyer
            ? "You're buying — confirm the split and add payment details, then mark it purchased."
            : buyerName
            ? `${buyerName} is buying. You'll get an email when it's time to pay your share.`
            : "Waiting for the buyer to confirm payment details."}
        </p>
      </div>

      {/* Decided gift summary */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Decided gift
        </p>
        <p className="font-semibold text-app-text">{decidedGift.title}</p>
        <p className="mt-0.5 text-sm font-semibold text-neutral-700">
          £{decidedGift.price.toFixed(2)}
        </p>
        {decidedGift.url && <ExternalLink href={decidedGift.url} className="mt-1 block" />}
        {buyerName && (
          <p className="mt-2 text-xs text-neutral-500">
            Buyer: <span className="font-medium text-neutral-700">{buyerName}</span>
          </p>
        )}

        {isBuyer && (
          <form action={revertFormAction} className="mt-3">
            {revertState?.status === "error" && (
              <p role="alert" className="mb-2 text-xs text-danger">{revertState.error}</p>
            )}
            <button
              type="submit"
              disabled={isReverting}
              className="text-xs text-neutral-500 hover:text-neutral-700 disabled:opacity-50 transition-colors"
            >
              {isReverting ? "Reverting…" : "← Back to planning"}
            </button>
          </form>
        )}
      </div>

      {/* Split editor */}
      {splits.length > 0 && (
        <Card>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Contributions
          </p>

          <form action={splitsFormAction} className="flex flex-col gap-3">
            {splitsState?.status === "error" && (
              <p role="alert" className="text-sm text-danger">{splitsState.error}</p>
            )}

            {splits.map((split) => (
              <div key={split.id} className="flex items-center gap-3">
                <span className="flex-1 text-sm text-app-text">{split.memberName}</span>
                {isBuyer ? (
                  <Input
                    name={`amount_${split.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={split.amount}
                    disabled={isSavingSplits}
                    className="w-28 text-right"
                  />
                ) : (
                  <span className="text-sm font-medium text-neutral-700">
                    £{split.amount.toFixed(2)}
                  </span>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-neutral-100 pt-2">
              <span className="text-xs text-neutral-500">Total contributions</span>
              <span className={[
                "text-sm font-semibold",
                Math.abs(totalSplit - decidedGift.price) > 0.01
                  ? "text-warning"
                  : "text-neutral-700",
              ].join(" ")}>
                £{totalSplit.toFixed(2)}
                {Math.abs(totalSplit - decidedGift.price) > 0.01 && (
                  <span className="ml-1 text-xs font-normal text-warning">
                    (gift is £{decidedGift.price.toFixed(2)})
                  </span>
                )}
              </span>
            </div>

            {isBuyer && (
              <Button type="submit" variant="secondary" loading={isSavingSplits} className="mt-1">
                Save splits
              </Button>
            )}
          </form>
        </Card>
      )}

      {/* Bank details (buyer editable) */}
      {isBuyer && (
        <Card>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
            How to pay you back
          </p>
          <p className="mb-3 text-xs text-neutral-500">
            Add a payment link from your bank app (Monzo, Starling, Revolut, etc.) or your sort code and account number. Contributors will receive this when you mark the gift as purchased. If anyone in the group is abroad, consider adding your IBAN or other international transfer details too.
          </p>

          <form action={bankFormAction} className="flex flex-col gap-3">
            {bankState?.status === "error" && (
              <p role="alert" className="text-sm text-danger">{bankState.error}</p>
            )}
            <textarea
              name="bank_details"
              rows={3}
              defaultValue={bankDetails ?? ""}
              placeholder="Paste a payment link or enter your sort code and account number"
              disabled={isSavingBank}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-app-text placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 resize-none"
            />
            <Button type="submit" variant="secondary" loading={isSavingBank}>
              {bankDetails ? "Update" : "Save"}
            </Button>
          </form>
        </Card>
      )}

      {/* Bank details (read-only for non-buyers) */}
      {!isBuyer && bankDetails && (
        <Card>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
            How to pay {buyerName ?? "the buyer"} back
          </p>
          {bankDetailsIsUrl ? (
            <a
              href={bankDetails}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Pay now →
            </a>
          ) : (
            <p className="whitespace-pre-wrap font-mono text-sm text-app-text">{bankDetails}</p>
          )}
        </Card>
      )}

      {/* Mark as purchased */}
      {isBuyer && (
        <Card>
          <form action={purchasedFormAction} className="flex flex-col gap-3">
            {purchasedState?.status === "error" && (
              <p role="alert" className="text-sm text-danger">{purchasedState.error}</p>
            )}
            {canPurchase ? (
              <p className="text-xs text-neutral-500">
                This will email everyone their share and lock in the split.
              </p>
            ) : (
              <p className="text-xs text-neutral-500">
                Save payment details above to continue.
              </p>
            )}
            <Button
              type="submit"
              disabled={!canPurchase}
              loading={isMarkingPurchased}
            >
              I&apos;ve bought it
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
