import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        // Dynamic imports keep Edge middleware bundles smaller/safer.
        const [{ db }, { admins }, { eq }, bcryptMod] = await Promise.all([
          import("@/lib/db"),
          import("../drizzle/schema"),
          import("drizzle-orm"),
          import("bcryptjs"),
        ]);

        const bcryptCompare =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (bcryptMod as any).compare ??
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (bcryptMod as any).default?.compare;

        if (typeof bcryptCompare !== "function") {
          throw new Error("bcryptjs compare function not available");
        }

        const email = String(credentials.email).toLowerCase();
        const [admin] = await db
          .select()
          .from(admins)
          .where(eq(admins.email, email))
          .limit(1);

        if (!admin) return null;

        const valid = await bcryptCompare(String(credentials.password), admin.password_hash);
        if (!valid) return null;

        return { id: admin.id, email: admin.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
