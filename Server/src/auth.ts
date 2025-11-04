import { betterAuth } from "better-auth";
import { pool } from "@/config/db.config.js";
import { admin, lastLoginMethod, multiSession, openAPI } from "better-auth/plugins";
import { emailHarmony, phoneHarmony } from 'better-auth-harmony';


const plugins = [admin(), lastLoginMethod({
    storeInDatabase: true,
}), multiSession(), emailHarmony(), phoneHarmony(), ...(process.env.APP_ENV === "development" ? [openAPI()] : [])];

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: `http://localhost:${process.env.PORT}`,
    database: pool,
    emailAndPassword: {
        enabled: true,
    },
    plugins,
});
