import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.linktoreader.com",
  secret: process.env.BETTER_AUTH_SECRET!,
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "https://linktoreader.com",
    "https://www.linktoreader.com"
  ],
  // Use simple database URL instead of Drizzle adapter to avoid Neon compatibility issues
  database: {
    connectionString: process.env.DATABASE_URL!,
    type: "postgres",
  },
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
