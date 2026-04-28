import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { admins } from "../drizzle/schema";

declare module "next-auth" {
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

        const [admin] = await db
          .select()
          .from(admins)
          .where(eq(admins.email, credentials.email as string))
          .limit(1);

        if (!admin) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          admin.password_hash
        );
        if (!valid) return null;

        return { id: admin.id, email: admin.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id) token.id = user.id;
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && token?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
});
