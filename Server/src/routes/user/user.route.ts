import {requireAuth} from "@/middleware/requireAuth";
import {Hono} from "hono";
import type {AuthSession, AuthUser} from "@/types/auth.types";

export const UserRouter = new Hono<{ Variables: { user: AuthUser | null; session: AuthSession | null } }>();

UserRouter.use("*", requireAuth());
