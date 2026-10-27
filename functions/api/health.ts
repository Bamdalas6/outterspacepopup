// GET /api/health: a quick check of how the live site is set up. It only says WHETHER each setting exists (true /
// false), never its value, so it is safe to leave public.

import type { Fn } from "../../server/env";
import { json } from "../../server/http";

export const onRequestGet: Fn = async ({ env }) => {
  let database: "connected" | "missing" | "not migrated" = "missing";
  let adminsSetUp: boolean | null = null;
  if (env.DB) {
    try {
      const row = await env.DB.prepare("SELECT count(*) AS n FROM admins").first<{ n: number }>();
      database = "connected";
      adminsSetUp = (row?.n ?? 0) > 0;
    } catch {
      database = "not migrated";
    }
  }
  const has = (v?: string) => Boolean((v ?? "").trim());
  return json({
    database,
    adminsSetUp,
    settings: {
      SESSION_SECRET: has(env.SESSION_SECRET),
      ADMIN_SETUP_CODE: has(env.ADMIN_SETUP_CODE),
      RESEND_API_KEY: has(env.RESEND_API_KEY),
      EMAIL_FROM: has(env.EMAIL_FROM),
      EMAIL_REPLY_TO: has(env.EMAIL_REPLY_TO),
      SITE_URL: has(env.SITE_URL),
    },
  });
};
