"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkMemberExists, createMember } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";

function AuthForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const router = useRouter();

  const [step, setStep] = useState<"email" | "name">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("error") ?? null);
  const [isPending, setIsPending] = useState(false);

  async function sendMagicLink(emailAddress: string) {
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: emailAddress,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (otpError) {
      setError(
        otpError.message?.toLowerCase().includes("rate limit")
          ? "Too many attempts. Please wait a few minutes and try again."
          : "Could not send magic link. Please try again."
      );
      setIsPending(false);
      return;
    }

    router.push("/check-email");
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const normalised = email.trim().toLowerCase();
    const exists = await checkMemberExists(normalised);

    if (exists) {
      await sendMagicLink(normalised);
    } else {
      setIsPending(false);
      setStep("name");
    }
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const normalised = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      setIsPending(false);
      return;
    }

    const result = await createMember(trimmedName, normalised);
    if (result?.error) {
      setError(result.error);
      setIsPending(false);
      return;
    }

    await sendMagicLink(normalised);
  }

  if (step === "name") {
    return (
      <>
        <p className="mb-6 text-sm text-neutral-500 text-center">
          No account found for <strong>{email}</strong>. Enter your name to get started.
        </p>

        <form onSubmit={handleNameSubmit} className="flex flex-col gap-5" noValidate>
          {error && (
            <div role="alert" className="rounded-md border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <FormField label="Your name" htmlFor="name" required>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isPending}
              autoFocus
            />
          </FormField>

          <Button type="submit" loading={isPending} fullWidth>
            Send magic link
          </Button>

          <button
            type="button"
            onClick={() => { setStep("email"); setError(null); }}
            className="text-sm text-neutral-500 hover:text-neutral-700 text-center"
          >
            ← Use a different email
          </button>
        </form>
      </>
    );
  }

  return (
    <form onSubmit={handleEmailSubmit} className="flex flex-col gap-5" noValidate>
      {error && (
        <div role="alert" className="rounded-md border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
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
        Continue
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-start justify-center px-4 pt-12 pb-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-app-text">
            Split Together
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter your email to sign in or create an account.
          </p>
        </div>
        <Suspense>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
