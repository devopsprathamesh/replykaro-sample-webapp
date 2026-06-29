import type { NextAuthConfig } from "next-auth";
import Facebook from "next-auth/providers/facebook";

// Edge-safe config — no Prisma, no Node-only modules
export const authConfig: NextAuthConfig = {
  providers: [
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "email,public_profile,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_comments,instagram_manage_messages,pages_manage_metadata",
        },
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url ?? null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  session: { strategy: "jwt" },
};
