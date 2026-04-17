"use client";

import { Suspense, useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createAccount } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";

function SignupForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(createAccount, null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  useEffect(() => {
    if (state?.status !== "success") return;

    const sendOtp = async () => {
      setIsSendingOtp(true);
      setOtpError(null);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: state.email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(state.next)}`,
        },
      });
      if (error) {
        setOtpError("Could not send magic link. Please try again.");
        setIsSendingOtp(false);
        return;
      }
      router.push("/check-email");
    };

    sendOtp();
  }, [state, router]);

  const errorMessage = otpError ?? (state?.status === "error" ? state.error : null);
  const isLoading = isPending || isSendingOtp;

  return (
    <>
      <form action={formAction} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="next" value={next} />

        {errorMessage && (
          <div
            role="alert"
            className="rounded-md border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {errorMessage}
          </div>
        )}

        <FormField label="Your name" htmlFor="name" required>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Jane Smith"
            required
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Email address" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="jane@example.com"
            required
            disabled={isLoading}
          />
        </FormField>

        <Button type="submit" loading={isLoading} fullWidth>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-start justify-center px-4 pt-12 pb-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-app-text">
            Create account
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter your details to get started.
          </p>
        </div>
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </main>
  );
}
