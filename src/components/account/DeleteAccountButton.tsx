"use client";

import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { type ActionState } from "@/lib/types";

interface DeleteAccountButtonProps {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}

export function DeleteAccountButton({ action }: DeleteAccountButtonProps) {
  return (
    <ConfirmActionButton
      action={action}
      label="Delete account"
      confirmMessage="This can't be undone. Are you sure?"
      confirmLabel="Yes, delete my account"
      pendingLabel="Deleting…"
    />
  );
}
