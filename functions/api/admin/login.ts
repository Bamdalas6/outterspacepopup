// POST /api/admin/login {email, password}: signs an admin in with a session cookie.

import { checkPassword, createSession, isHttps, sessionCookie } from "../../../server/auth";
import type { Fn } from "../../../server/env";
import { clientIp, fail, json, readJson, str } from "../../../server/http";
import { allow } from "../../../server/rate-limit";

export const onRequestPost: Fn = async ({ request, env }) => {
  const body = await readJson(request);
  const email = str(body?.email).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return fail(400, "Enter your email and password.");
  // Slow down password guessing: 10 tries per 15 minutes from one connection, and per account.
  const ip = clientIp(request);
  if (!(await allow(env.DB, `login:${ip}`, 10, 900)) || !(await allow(env.DB, `login:${email}`, 10, 900))) {
    return fail(429, "Too many sign-in attempts. Wait 15 minutes and try again.");
  }
  const row = await env.DB.prepare("SELECT email, password_hash FROM admins WHERE email = ?1").bind(email).first<{ email: string; password_hash: string }>();
  if (!(await checkPassword(password, row?.password_hash ?? null)) || !row) {
    return fail(401, "That email and password do not match an admin account.");
  }
  const token = await createSession(row.email, env.SESSION_SECRET!);
  return json({ email: row.email }, 200, { "Set-Cookie": sessionCookie(token, isHttps(request)) });
};
