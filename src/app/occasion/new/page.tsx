import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateOccasionForm } from "@/components/occasion/CreateOccasionForm";
import { createOccasion } from "./actions";

export default async function NewOccasionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <main className="flex min-h-screen items-start justify-center px-4 pt-12 pb-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-app-text">
            New occasion
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Set up a group gift for someone special.
          </p>
        </div>

        <CreateOccasionForm action={createOccasion} />
      </div>
    </main>
  );
}
