import Image from "next/image";
import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";
import { NavScroll } from "./NavScroll";

const PUBLIC_LINKS = [
  { href: "/directory", label: "Directory" },
  { href: "/rewind", label: "Rewind" },
  { href: "/stats", label: "Stats" },
  { href: "/about", label: "About" },
];

function Brand() {
  return (
    <Link href="/" className="jf-nav-logo">
      <Image src="/logo.png" alt="Fraser '26" width={36} height={36} />
      <span>Fraser &apos;26</span>
    </Link>
  );
}

function Links({ isAdmin }: { isAdmin: boolean }) {
  return (
    <ul className="jf-nav-links">
      {PUBLIC_LINKS.map((link) => (
        <li key={link.href}>
          <Link href={link.href}>{link.label}</Link>
        </li>
      ))}
      {isAdmin ? (
        <li>
          <Link href="/admin" className="jf-nav-admin">
            Admin
          </Link>
        </li>
      ) : null}
      <li>
        <Link href="/survey" className="jf-nav-cta">
          Take Survey
        </Link>
      </li>
    </ul>
  );
}

export function NavFallback() {
  return (
    <NavScroll brand={<Brand />} menu={<Links isAdmin={false} />} />
  );
}

export async function Nav() {
  const session = await auth();
  const user = session?.user;
  const isAdmin = user?.role === "admin";

  const menu = (
    <>
      <Links isAdmin={isAdmin} />
      <div className="jf-nav-auth">
        {user ? (
          <>
            {user.email ? (
              <span className="jf-nav-user">{user.email}</span>
            ) : null}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="jf-nav-ghost">
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
            <button type="submit" className="jf-nav-ghost">
              Sign in
            </button>
          </form>
        )}
      </div>
    </>
  );

  return <NavScroll brand={<Brand />} menu={menu} />;
}
