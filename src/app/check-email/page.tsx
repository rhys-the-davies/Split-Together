export default function CheckEmailPage() {
  return (
    <main className="flex items-start justify-center px-4 pt-12">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-4xl" role="img" aria-label="Email">
          ✉️
        </div>
        <h1 className="font-display text-2xl font-semibold text-app-text">
          Check your email
        </h1>
        <p className="mt-3 text-neutral-500">
          We&rsquo;ve sent you a magic link. Click it to join the group — no
          password needed.
        </p>
        <p className="mt-4 text-sm text-neutral-400">
          The link expires in 1 hour. If you don&rsquo;t see it, check your
          spam folder.
        </p>
      </div>
    </main>
  );
}
