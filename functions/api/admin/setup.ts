// POST /api/admin/setup {code, email, password}: creates the FIRST admin. Only works while there are no admins, and
// only with the ADMIN_SETUP_CODE secret, so nobody else can claim the guest list. After that, admins add each other
// from /admin.

import { MIN_PASSWORD, createSession, hashPassword, isHttps, sameSecret, sessionCookie } from "../../../server/auth";
import type { Fn } from "../../../server/env";
import { clientIp, fail, json, readJson, str } from "../../../server/http";
import { allow } from "../../../server/rate-limit";
import { EMAIL } from "../../../src/lib/guest-rules";

export const onRequestPost: Fn = async ({ request, env }) => {
  if (!env.ADMIN_SETUP_CODE) return fail(403, "Set the ADMIN_SETUP_CODE secret in Cloudflare first (see CLOUDFLARE_SETUP.md).");
  if (!(await allow(env.DB, `setup:${clientIp(request)}`, 10, 900))) return fail(429, "Too many tries. Wait 15 minutes.");
  const body = await readJson(request);
  const code = str(body?.code);
  const email = str(body?.email).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";
  if (!sameSecret(code, env.ADMIN_SETUP_CODE)) return fail(401, "That setup code is not right.");
  if (!EMAIL.test(email)) return fail(400, "Enter a valid email address.");
  if (password.length < MIN_PASSWORD) return fail(400, `Use a password of at least ${MIN_PASSWORD} characters.`);

  const hash = await hashPassword(password);
  // Insert only if the admins table is still empty, in one statement, so two people cannot both set it up.
  const res = await env.DB.prepare(
    "INSERT INTO admins (email, password_hash, added_by) SELECT ?1, ?2, 'setup' WHERE NOT EXISTS (SELECT 1 FROM admins)",
  ).bind(email, hash).run();
  if (!res.meta.changes) return fail(409, "An admin already exists. Sign in instead.");
  const token = await createSession(email, env.SESSION_SECRET!);
  return json({ email }, 200, { "Set-Cookie": sessionCookie(token, isHttps(request)) });
};
