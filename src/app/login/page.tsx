"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { checkMemberExists } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ?? null
  );
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const normalised = email.trim().toLowerCase();

    const exists = await checkMemberExists(normalised);
    if (!exists) {
      setError("No account found for that email. Please sign up first.");
      setIsPending(false);
      return;
    }

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalised,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (otpError) {
      const msg = otpError.message?.toLowerCase().includes("rate limit")
        ? "Too many sign-in attempts. Please wait a few minutes and try again."
        : "Could not send magic link. Please try again.";
      setError(msg);
      setIsPending(false);
      return;
    }

    router.push("/check-email");
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && (
          <div
            role="alert"
            className="rounded-md border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error}
          </div>
        )}

        <FormField label="Email address" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending}
          />
        </FormField>

        <Button type="submit" loading={isPending} fullWidth>
          Send magic link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Don&rsquo;t have an account?{" "}
        <Link
          href={next !== "/" ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="text-primary hover:underline"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-start justify-center px-4 pt-12 pb-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-app-text">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter your email to receive a magic link.
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
