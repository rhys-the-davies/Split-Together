"use client";

import { useActionState, useState } from "react";
import { type ActionState } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";

interface AddSuggestionFormProps {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}

export function AddSuggestionForm({ action }: AddSuggestionFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      const result = await action(prev, fd);
      if (!result) setOpen(false); // null = success
      return result;
    },
    null
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-neutral-300 bg-white py-3 text-sm text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition-colors"
      >
        + Add suggestion
      </button>
    );
  }

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-4">
        {state?.status === "error" && (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}

        <FormField label="Gift title" htmlFor="add-title" required>
          <Input
            id="add-title"
            name="title"
            type="text"
            placeholder="e.g. Le Creuset casserole dish"
            required
            disabled={isPending}
          />
        </FormField>

        <FormField label="URL" htmlFor="add-url" helper="Optional — link to where it can be bought.">
          <Input
            id="add-url"
            name="url"
            type="url"
            placeholder="https://…"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Price (£)" htmlFor="add-price" required>
          <Input
            id="add-price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            required
            disabled={isPending}
          />
        </FormField>

        <div className="flex gap-2">
          <Button type="submit" loading={isPending}>
            Add
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
