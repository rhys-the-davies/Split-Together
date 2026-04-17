"use client";

import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { type ActionState } from "@/lib/types";

interface LeaveOccasionButtonProps {
  leaveAction: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  deleteAction: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  isSoleMember: boolean;
  isActiveBuyer: boolean;
}

export function LeaveOccasionButton({
  leaveAction,
  deleteAction,
  isSoleMember,
  isActiveBuyer,
}: LeaveOccasionButtonProps) {
  if (isSoleMember) {
    return (
      <ConfirmActionButton
        action={deleteAction}
        label="Delete occasion"
        confirmMessage="This will permanently delete the occasion and all its data. Are you sure?"
        confirmLabel="Yes, delete"
        pendingLabel="Deleting…"
      />
    );
  }

  if (isActiveBuyer) {
    return (
      <p className="text-sm text-neutral-400">
        You&apos;re the buyer for the active gift round — reassign the buyer before leaving.
      </p>
    );
  }

  return (
    <ConfirmActionButton
      action={leaveAction}
      label="Leave occasion"
      confirmMessage="Are you sure you want to leave this occasion?"
      confirmLabel="Yes, leave"
      pendingLabel="Leaving…"
    />
  );
}
