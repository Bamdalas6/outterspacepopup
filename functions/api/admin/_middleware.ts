// Guards everything under /api/admin/: only a signed-in admin gets through, except the sign-in, sign-out, session
// check and first-admin setup endpoints. The admin's email is passed on to the endpoint as data.admin.

import { SESSION_COOKIE, readSession } from "../../../server/auth";
import type { Fn } from "../../../server/env";
import { fail, getCookie } from "../../../server/http";

const OPEN = new Set(["login", "logout", "session", "setup"]);

export const onRequest: Fn = async ({ request, env, next, data }) => {
  const last = new URL(request.url).pathname.replace(/\/$/, "").split("/").pop() ?? "";
  if (!env.DB) return fail(500, "The guest list database is not connected yet.");
  if (!env.SESSION_SECRET) return fail(500, "SESSION_SECRET is not set, so admin sign-in is switched off.");
  if (OPEN.has(last)) return next();
  const admin = await readSession(getCookie(request, SESSION_COOKIE), env);
  if (!admin) return fail(401, "Sign in first.");
  data.admin = admin;
  return next();
};
