import { betterAuth } from "better-auth";
import { pool } from "./config/db";
import { admin, lastLoginMethod, multiSession } from "better-auth/plugins";

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    database: pool,
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        admin(),
        lastLoginMethod({ storeInDatabase: true }),
        multiSession(),
    ],
});
