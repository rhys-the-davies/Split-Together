"use client";

import { useActionState, useState } from "react";
import { type ActionState } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CreateOccasionFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}

export function CreateOccasionForm({ action }: CreateOccasionFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [recurrence, setRecurrence] = useState<"one_off" | "annual">("one_off");

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state?.status === "error" && (
        <div
          role="alert"
          className="rounded-md border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {state.error}
        </div>
      )}

      <FormField label="Occasion title" htmlFor="title" required>
        <Input
          id="title"
          name="title"
          type="text"
          placeholder="e.g. Mum's birthday"
          required
          disabled={isPending}
        />
      </FormField>

      <FormField label="Gift recipient" htmlFor="recipient_name" required>
        <Input
          id="recipient_name"
          name="recipient_name"
          type="text"
          placeholder="e.g. Mum"
          required
          disabled={isPending}
        />
      </FormField>

      <FormField label="Recurrence" htmlFor="recurrence">
        <Select
          id="recurrence"
          name="recurrence"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as "one_off" | "annual")}
          disabled={isPending}
        >
          <option value="one_off">One-off</option>
          <option value="annual">Annual (repeats every year)</option>
        </Select>
      </FormField>

      {recurrence === "annual" && (
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Month" htmlFor="recurrence_month" required>
            <Select
              id="recurrence_month"
              name="recurrence_month"
              defaultValue=""
              disabled={isPending}
            >
              <option value="" disabled>
                Select month
              </option>
              {MONTHS.map((month, i) => (
                <option key={month} value={i + 1}>
                  {month}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Day" htmlFor="recurrence_day" required>
            <Input
              id="recurrence_day"
              name="recurrence_day"
              type="number"
              min={1}
              max={31}
              placeholder="e.g. 15"
              disabled={isPending}
            />
          </FormField>
        </div>
      )}

      <Button type="submit" loading={isPending} fullWidth>
        Create occasion
      </Button>
    </form>
  );
}
