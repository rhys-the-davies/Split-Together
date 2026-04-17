"use client";

import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { type ActionState } from "@/lib/types";

interface LeaveOccasionButtonProps {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}

export function LeaveOccasionButton({ action }: LeaveOccasionButtonProps) {
  return (
    <ConfirmActionButton
      action={action}
      label="Leave occasion"
      confirmMessage="Are you sure you want to leave this occasion?"
      confirmLabel="Yes, leave"
      pendingLabel="Leaving…"
    />
  );
}
