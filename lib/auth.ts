import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";
import { redirect } from "next/navigation";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
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

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: "admin" | "student";
};

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
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
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

export async function requireUser(): Promise<AuthUser> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) redirect("/auth/sign-in");
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
    role: session.user.role,
  };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/auth/forbidden");
  }
  return user;
}
