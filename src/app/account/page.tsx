import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedMember } from "@/lib/auth";
import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";
import { deleteAccount } from "./actions";

export default async function AccountPage() {
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

      <h1 className="mt-6 font-display text-2xl font-semibold text-app-text">Account</h1>

      <div className="mt-2 text-sm text-neutral-500">{member.email}</div>

      <div className="mt-12 border-t border-neutral-100 pt-6">
        <h2 className="text-sm font-medium text-neutral-700">Delete account</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Removes your access. Your name will remain visible on past gift rounds you were part of.
        </p>
        <div className="mt-4">
          <DeleteAccountButton action={deleteAccount} />
        </div>
      </div>
    </main>
  );
}
