"use client";

import { useActionState, useState } from "react";
import { type ActionState } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface FeedbackFormProps {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}

export function FeedbackForm({ action }: FeedbackFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [state, formAction, isPending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await action(prev, fd);
    if (result === null) setSubmitted(true);
    return result;
  }, null);

  if (submitted) {
    return <p className="text-sm text-neutral-500">Thanks — message sent.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.status === "error" && (
        <p role="alert" className="text-sm text-danger">{state.error}</p>
      )}
      <textarea
        name="message"
        rows={5}
        placeholder="Your message…"
        disabled={isPending}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-app-text placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 resize-none"
      />
      <Button type="submit" loading={isPending}>
        Send
      </Button>
    </form>
  );
}
