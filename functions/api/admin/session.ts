// GET /api/admin/session: who is signed in ({email}), or 401 with needsSetup: true when no admin exists yet (then
// /admin shows the first-admin form).

import { SESSION_COOKIE, readSession } from "../../../server/auth";
import type { Fn } from "../../../server/env";
import { getCookie, json } from "../../../server/http";

export const onRequestGet: Fn = async ({ request, env }) => {
  const email = await readSession(getCookie(request, SESSION_COOKIE), env);
  if (email) return json({ email });
  const row = await env.DB.prepare("SELECT count(*) AS n FROM admins").first<{ n: number }>();
  return json({ email: null, needsSetup: (row?.n ?? 0) === 0, setupAllowed: Boolean(env.ADMIN_SETUP_CODE) }, 401);
};
