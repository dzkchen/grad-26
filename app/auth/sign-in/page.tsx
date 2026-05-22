import { signIn } from "@/lib/auth";

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        This site is for the John Fraser Class of 2026. Sign in with your{" "}
        <span className="font-mono">@pdsb.net</span> Google account.
      </p>
      <form
        className="mt-8"
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-md border border-black/10 bg-white px-5 text-sm font-medium text-black shadow-sm hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
}
