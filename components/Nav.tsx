import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";

const PUBLIC_LINKS = [
  { href: "/directory", label: "Directory" },
  { href: "/stats", label: "Stats" },
  { href: "/rewind", label: "Rewind" },
  { href: "/about", label: "About" },
];

function NavShell({ children }: { children: React.ReactNode }) {
  return (
    <header className="border-b border-black/8 dark:border-white/12">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          Class of 2026
        </Link>
        {children}
      </nav>
    </header>
  );
}

export function NavFallback() {
  return (
    <NavShell>
      <div className="h-6" aria-hidden />
    </NavShell>
  );
}

export async function Nav() {
  const session = await auth();
  const user = session?.user;
  const isAdmin = user?.role === "admin";

  return (
    <NavShell>
      <ul className="hidden gap-6 text-sm text-zinc-600 sm:flex dark:text-zinc-300">
        {PUBLIC_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="hover:text-black dark:hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
        {isAdmin ? (
          <li>
            <Link
              href="/admin"
              className="font-medium text-black hover:underline dark:text-white"
            >
              Admin
            </Link>
          </li>
        ) : null}
      </ul>
      <div className="flex items-center gap-3 text-sm">
        {user ? (
          <>
            <span className="hidden text-zinc-500 sm:inline">{user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/4 dark:border-white/15 dark:hover:bg-white/6"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/4 dark:border-white/15 dark:hover:bg-white/6"
            >
              Sign in
            </button>
          </form>
        )}
      </div>
    </NavShell>
  );
}
