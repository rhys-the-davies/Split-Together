"use client";

import { useActionState } from "react";
import { type ActionState } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface Member {
  id: string;
  name: string;
}

interface BuyerPickerProps {
  members: Member[];
  currentBuyerId: string | null;
  currentBuyerName: string | null;
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}

export function BuyerPicker({
  members,
  currentBuyerId,
  currentBuyerName,
  action,
}: BuyerPickerProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <Card>
      {currentBuyerId ? (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-primary/8 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {(currentBuyerName ?? "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-neutral-500">Buying the gift</p>
            <p className="font-semibold text-app-text">{currentBuyerName ?? "Unknown"}</p>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm text-neutral-500">
          No buyer assigned yet — someone needs to front the cost and collect contributions.
        </p>
      )}

      <form action={formAction} className="flex gap-2">
        {state?.status === "error" && (
          <p role="alert" className="mb-2 w-full text-sm text-danger">
            {state.error}
          </p>
        )}
        <Select
          name="buyer_id"
          defaultValue={currentBuyerId ?? ""}
          disabled={isPending}
          className="flex-1"
        >
          <option value="" disabled>
            {currentBuyerId ? "Reassign buyer…" : "Choose who's buying…"}
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary" loading={isPending}>
          {currentBuyerId ? "Reassign" : "Assign"}
        </Button>
      </form>
    </Card>
  );
}
