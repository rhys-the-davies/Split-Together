import Link from "next/link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-center px-4 h-14">
        <Link
          href="/"
          className="font-display text-lg font-semibold text-primary tracking-tight"
        >
          Split Together
        </Link>
      </div>
    </header>
  );
}
