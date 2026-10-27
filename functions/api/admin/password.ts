// POST /api/admin/password {current, next}: changes the signed-in admin's own password.
// Admins only (see _middleware.ts).

import { MIN_PASSWORD, checkPassword, hashPassword } from "../../../server/auth";
import type { Fn } from "../../../server/env";
import { fail, json, readJson } from "../../../server/http";

export const onRequestPost: Fn = async ({ request, env, data }) => {
  const body = await readJson(request);
  const current = typeof body?.current === "string" ? body.current : "";
  const next = typeof body?.next === "string" ? body.next : "";
  if (next.length < MIN_PASSWORD) return fail(400, `Use a new password of at least ${MIN_PASSWORD} characters.`);
  const row = await env.DB.prepare("SELECT password_hash FROM admins WHERE email = ?1").bind(data.admin!).first<{ password_hash: string }>();
  if (!(await checkPassword(current, row?.password_hash ?? null))) return fail(401, "Your current password is not right.");
  await env.DB.prepare("UPDATE admins SET password_hash = ?1 WHERE email = ?2").bind(await hashPassword(next), data.admin!).run();
  return json({ ok: true });
};
