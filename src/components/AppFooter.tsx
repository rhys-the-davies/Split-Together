import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="px-4 py-6 mt-8 flex justify-center gap-6 border-t border-neutral-100">
      <Link href="/account" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors">
        Account settings
      </Link>
      <Link href="/feedback" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors">
        Feedback
      </Link>
    </footer>
  );
}
