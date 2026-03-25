import { betterAuth } from "better-auth";
import { pool } from "@/config/db.config.js";
import { admin, lastLoginMethod, multiSession, openAPI } from "better-auth/plugins";
import { emailHarmony, phoneHarmony } from 'better-auth-harmony';


const plugins = [admin(), lastLoginMethod({
    storeInDatabase: true,
}), multiSession(), emailHarmony(), phoneHarmony(), ...(process.env.APP_ENV === "development" ? [openAPI()] : [])];

const isProduction =
  process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";

const configuredBaseUrl =
  process.env.BETTER_AUTH_URL ||
  (isProduction
    ? process.env.BASE_URL || `http://localhost:${process.env.PORT}`
    : undefined);

const trustedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    ...(configuredBaseUrl ? { baseURL: configuredBaseUrl } : {}),
    trustedOrigins: (request) => {
        const requestOrigin = new URL(request.url).origin;
        return Array.from(new Set([...trustedOrigins, requestOrigin]));
    },
    advanced: {
        useSecureCookies: isProduction,
    },
    database: pool,
    emailAndPassword: {
        enabled: true,
    },
    plugins,
});
