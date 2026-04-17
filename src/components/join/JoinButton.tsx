"use client";

import { useActionState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ActionState } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface JoinButtonProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}

export function JoinButton({ action }: JoinButtonProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const pathname = usePathname();
  const isAuthError = state?.status === "error" && state.error.toLowerCase().includes("sign in");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.status === "error" && (
        <div
          role="alert"
          className="rounded-md border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {state.error}
          {isAuthError && (
            <div className="mt-2">
              <Link
                href={`/auth/signout?next=${encodeURIComponent(`/login?next=${pathname}`)}`}
                className="font-medium underline underline-offset-2 hover:opacity-80"
              >
                Sign in →
              </Link>
            </div>
          )}
        </div>
      )}
      {!isAuthError && (
        <Button type="submit" loading={isPending} fullWidth>
          Join this occasion
        </Button>
      )}
    </form>
  );
}
