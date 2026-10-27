// GET    /api/admin/admins                     who can sign in to /admin
// POST   /api/admin/admins {email, password}   adds an admin with a starting password (share it with them privately)
// DELETE /api/admin/admins?email=...           removes an admin (not yourself, and never the last one)
// Admins only (see _middleware.ts).

import { MIN_PASSWORD, hashPassword } from "../../../server/auth";
import type { Fn } from "../../../server/env";
import { fail, json, readJson, str } from "../../../server/http";
import { EMAIL } from "../../../src/lib/guest-rules";

export const onRequestGet: Fn = async ({ env }) => {
  const { results } = await env.DB.prepare("SELECT email, created_at, added_by FROM admins ORDER BY created_at").all();
  return json({ admins: results });
};

export const onRequestPost: Fn = async ({ request, env, data }) => {
  const body = await readJson(request);
  const email = str(body?.email).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";
  if (!EMAIL.test(email)) return fail(400, "Enter a valid email address.");
  if (password.length < MIN_PASSWORD) return fail(400, `Give them a starting password of at least ${MIN_PASSWORD} characters.`);
  try {
    await env.DB.prepare("INSERT INTO admins (email, password_hash, added_by) VALUES (?1, ?2, ?3)")
      .bind(email, await hashPassword(password), data.admin ?? null)
      .run();
  } catch (e) {
    if (/UNIQUE|PRIMARY/i.test(String(e))) return fail(409, `${email} is already an admin.`);
    throw e;
  }
  return json({ ok: true });
};

export const onRequestDelete: Fn = async ({ request, env, data }) => {
  const email = (new URL(request.url).searchParams.get("email") ?? "").toLowerCase();
  if (!email) return fail(400, "Say which admin to remove.");
  if (email === (data.admin ?? "").toLowerCase()) return fail(400, "You cannot remove yourself. Ask another admin to do it.");
  const res = await env.DB.prepare("DELETE FROM admins WHERE email = ?1 AND (SELECT count(*) FROM admins) > 1").bind(email).run();
  if (!res.meta.changes) return fail(404, "That admin was not found, or is the last one.");
  return json({ ok: true });
};
