import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedMember } from "@/lib/auth";
import { FeedbackForm } from "@/components/FeedbackForm";
import { submitFeedback } from "./actions";

export default async function FeedbackPage() {
  const member = await getAuthenticatedMember();
  if (!member) redirect("/login");

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        ← Back
      </Link>

      <div className="mt-6 mb-8">
        <h1 className="font-display text-2xl font-semibold text-app-text">Feedback</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Let Rhys know if you have any feedback, suggestions, or issues.
        </p>
      </div>

      <FeedbackForm action={submitFeedback} />
    </main>
  );
}
