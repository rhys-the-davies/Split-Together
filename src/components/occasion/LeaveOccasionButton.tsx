"use client";

import { useActionState, useState } from "react";
import { type ActionState } from "@/lib/types";

interface LeaveOccasionButtonProps {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}

export function LeaveOccasionButton({ action }: LeaveOccasionButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-neutral-400 hover:text-danger transition-colors"
      >
        Leave occasion
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {state?.status === "error" && (
        <p role="alert" className="text-sm text-danger">{state.error}</p>
      )}
      <p className="text-sm text-neutral-500">Are you sure you want to leave this occasion?</p>
      <div className="flex items-center gap-3">
        <form action={formAction}>
          <button
            type="submit"
            disabled={isPending}
            className="text-sm font-medium text-danger hover:text-danger/80 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Leaving…" : "Yes, leave"}
          </button>
        </form>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
