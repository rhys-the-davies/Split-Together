import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { JoinButton } from "@/components/join/JoinButton";
import { joinOccasion } from "./actions";

interface PageProps {
  params: Promise<{ invite_token: string }>;
}

export default async function JoinPage({ params }: PageProps) {
  const { invite_token } = await params;

  // Resolve the occasion first so we can show its details (or 404).
  const { data: occasion } = await supabaseAdmin
    .from("occasion")
    .select("id, title, recipient_name")
    .eq("invite_token", invite_token)
    .single();

  if (!occasion) {
    return (
      <main className="flex items-start justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-xl font-semibold text-app-text">
            Invalid invite link
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            This link may have expired or been regenerated. Ask the group for a
            new one.
          </p>
        </div>
      </main>
    );
  }

  // Check if user is authenticated.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not signed in — redirect to signup, preserving the join destination.
    redirect(`/signup?next=/join/${invite_token}`);
  }

  // Bind invite token to the action.
  const boundAction = joinOccasion.bind(null, invite_token);

  return (
    <main className="flex items-start justify-center px-4 pt-12 pb-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-app-text">
            Split Together
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            You&rsquo;ve been invited to join a group gift.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            You&rsquo;re joining
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-app-text">
            {occasion.title}
          </p>
          <p className="mt-0.5 text-sm text-neutral-500">
            Gift for {occasion.recipient_name}
          </p>
        </div>

        <div className="mt-6">
          <JoinButton action={boundAction} />
        </div>
      </div>
    </main>
  );
}
