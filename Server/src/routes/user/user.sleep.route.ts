import {Hono} from "hono";
import type {AuthSession, AuthUser} from "@/types/auth.types";
import {requireAuth} from "@/middleware/requireAuth";
import {sleepService} from "@/services/sleep.service";

export const userSleepRouter = new Hono<{ Variables: { user: AuthUser | null; session: AuthSession | null } }>();

userSleepRouter.use("*", requireAuth());

userSleepRouter.post("/start", async (c) => {
    const body = await c.req.json().catch(() => ({} as any));

    const userId: string = c.get("user")!.id;
    const note: string | null = body?.note || null;
    const startAt: string = body.startAt || new Date().toISOString();

    try {
        const entry = await sleepService.startSleep(userId, startAt, note);
        return c.json(entry, 201);
    } catch (e: any) {
        const message = e?.message || "Failed to start sleep";
        return c.json({error: message}, 400);
    }
});

userSleepRouter.post("/end", async (c) => {
    const body = await c.req.json().catch(() => ({} as any));

    const userId: string = c.get("user")!.id;
    const endAt: string = body?.endAt || new Date().toISOString();

    try {
        const entry = await sleepService.endSleep(userId, endAt);
        return c.json(entry, 200);
    } catch (e: any) {
        const msg = e?.message || "Failed to end sleep";
        const status = /no active sleep entry/i.test(msg) ? 400 : 500;
        return c.json({error: msg}, status);
    }
});

userSleepRouter.post("/new", async (c) => {
    const body = await c.req.json().catch(() => ({} as any));

    const userId: string = c.get("user")!.id;
    const startAt: string = body?.startAt || new Date().toISOString();
    const endAt: string | null = body?.endAt ?? null;
    const note: string | null = body?.note ?? null;

    try {
        const entry = await sleepService.addSleepEntry(userId, startAt, endAt, note);
        return c.json(entry, 201);
    } catch (e: any) {
        const msg = e?.message || "Failed to create sleep entry";
        const status = /earlier than/i.test(msg) ? 400 : 500;
        return c.json({error: msg}, status);
    }
});

userSleepRouter.get("/", async (c) => {
    const userId: string = c.get("user")!.id;

    try {
        const entries = await sleepService.getAllSleepEntries(userId);
        return c.json(entries, 200);
    } catch (e: any) {
        const msg = e?.message || "Failed to fetch sleep entries";
        return c.json({error: msg}, 500);
    }
});

userSleepRouter.get("/:id", async (c) => {
    const userId: string = c.get("user")!.id;
    const sleepEntryId = decodeURIComponent(c.req.param("id"));

    try {
        const entry = await sleepService.getSleepEntry(userId, sleepEntryId);
        return c.json(entry, 200);
    } catch (e: any) {
        const msg = e?.message || "Failed to fetch sleep entry";
        const status = /not found/i.test(msg) ? 404 : 500;
        return c.json({error: msg}, status);
    }
});

userSleepRouter.patch("/:id", async (c) => {
    const userId: string = c.get("user")!.id;
    const sleepEntryId = decodeURIComponent(c.req.param("id"));
    const body = await c.req.json().catch(() => ({} as any));

    try {
        const existing = await sleepService.getSleepEntry(userId, sleepEntryId);
        const startAt: string = body?.startAt ?? (existing.sleep_start as unknown as string);
        const endAt: string | null = (Object.prototype.hasOwnProperty.call(body, "endAt") ? body.endAt : existing.sleep_end) ?? null;
        const note: string | null = (Object.prototype.hasOwnProperty.call(body, "note") ? body.note : existing.note) ?? null;

        const updated = await sleepService.alterSleepEntry(userId, sleepEntryId, startAt, endAt, note);
        return c.json(updated, 200);
    } catch (e: any) {
        const msg = e?.message || "Failed to update sleep entry";
        const status = /not found/i.test(msg) ? 404 : /earlier than/i.test(msg) ? 400 : 500;
        return c.json({error: msg}, status);
    }
});

userSleepRouter.delete("/:id", async (c) => {
    const userId: string = c.get("user")!.id;
    const sleepEntryId = decodeURIComponent(c.req.param("id"));

    try {
        await sleepService.deleteSleepEntry(userId, sleepEntryId);
        return c.body(null, 204);
    } catch (e: any) {
        const msg = e?.message || "Failed to delete sleep entry";
        const status = /not found/i.test(msg) ? 404 : 500;
        return c.json({error: msg}, status);
    }
});