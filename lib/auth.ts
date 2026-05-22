import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";
import { redirect } from "next/navigation";

declare module "next-auth" {
  interface Session {
    user: {
      role: "admin" | "student";
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "admin" | "student";
  }
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const ALLOWED_DOMAIN = "pdsb.net";

const pool = new Pool({ connectionString: process.env.DATABASE_URL_POOLED });

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          hd: ALLOWED_DOMAIN,
          prompt: "select_account",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      const email = (user.email ?? "").toLowerCase();
      if (!email) return false;
      if (ADMIN_EMAILS.includes(email)) return true;
      return email.endsWith(`@${ALLOWED_DOMAIN}`);
    },
    async jwt({ token, user }) {
      if (user) {
        const email = (user.email ?? "").toLowerCase();
        token.role = ADMIN_EMAILS.includes(email) ? "admin" : "student";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as "admin" | "student") ?? "student";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
  },
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in");
  return session.user;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/auth/forbidden");
  }
  return session.user;
}
