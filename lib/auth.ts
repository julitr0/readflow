// import { db } from "@/db/drizzle";
// import { account, session, user, verification } from "@/db/schema";
import { betterAuth } from "better-auth";
// import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.linktoreader.com",
  secret: process.env.BETTER_AUTH_SECRET!,
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "https://linktoreader.com",
    "https://www.linktoreader.com"
  ],
  // Temporarily remove database adapter to test if OAuth flow works
  // database: drizzleAdapter(db, {
  //   provider: "pg",
  //   schema: {
  //     user,
  //     session,
  //     account,
  //     verification,
  //   },
  // }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    nextCookies(),
  ],
});
