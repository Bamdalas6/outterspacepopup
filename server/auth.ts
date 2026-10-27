// Admin sign-in for /admin, with no outside service: passwords are PBKDF2-SHA256 hashes in D1, and a session is a
// short signed token in an HttpOnly cookie. Every request also re-checks that the admin still exists, so removing
// someone from the admins list signs them out straight away.

import type { Env } from "./env";

export const SESSION_COOKIE = "os_admin";
const SESSION_DAYS = 7;
const ITERATIONS = 100_000;             // the most Cloudflare Workers allow for PBKDF2
export const MIN_PASSWORD = 10;

const enc = new TextEncoder();
const b64 = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (bytes: ArrayBuffer | Uint8Array) => b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s: string) => unb64(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

/** "pbkdf2$<iterations>$<salt>$<hash>" */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(await pbkdf2(password, salt, ITERATIONS))}`;
}

export async function checkPassword(password: string, stored: string | null): Promise<boolean> {
  // With no stored hash, still do the work, so a wrong email takes as long as a wrong password.
  const [, iter, salt, hash] = (stored ?? `pbkdf2$${ITERATIONS}$${b64(new Uint8Array(16))}$`).split("$");
  const got = await pbkdf2(password, unb64(salt ?? ""), Number(iter) || ITERATIONS);
  return Boolean(stored) && sameBytes(got, unb64(hash ?? ""));
}

/** Compares two secrets in constant time. */
export function sameSecret(a: string, b: string): boolean {
  return sameBytes(enc.encode(a), enc.encode(b));
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSession(email: string, secret: string): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ e: email.toLowerCase(), x: Date.now() + SESSION_DAYS * 86_400_000 })));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

/** The admin's email if the token is genuine, unexpired and the admin still exists; otherwise null. */
export async function readSession(token: string | null, env: Env): Promise<string | null> {
  if (!token || !env.SESSION_SECRET) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(env.SESSION_SECRET), unb64url(sig), enc.encode(payload));
    if (!ok) return null;
    const { e, x } = JSON.parse(new TextDecoder().decode(unb64url(payload))) as { e?: string; x?: number };
    if (!e || !x || x < Date.now()) return null;
    const row = await env.DB.prepare("SELECT email FROM admins WHERE email = ?1").bind(e).first<{ email: string }>();
    return row ? row.email : null;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DAYS * 86_400}${secure ? "; Secure" : ""}`;
}

export function clearedCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;
}

export const isHttps = (request: Request) => new URL(request.url).protocol === "https:";
