// POST /api/register: adds a guest to the pop-up guest list, then emails them their receipt.
// Answers {status: "saved"} or {status: "already"} (that email is on the list), or an error with the field to fix.

import { checkRsvp } from "../../src/lib/guest-rules";
import { sendReceipt } from "../../server/email";
import type { Fn } from "../../server/env";
import { clientIp, fail, json, readJson } from "../../server/http";
import { allow } from "../../server/rate-limit";

export const onRequestPost: Fn = async ({ request, env, waitUntil }) => {
  if (!env.DB) return fail(500, "The guest list database is not connected yet.");
  const body = await readJson(request);
  if (!body) return fail(400, "Send the registration as JSON.");
  // A bot that filled the hidden field gets the same answer as everyone else, and nothing is saved.
  if (typeof body._gotcha === "string" && body._gotcha.trim()) return json({ status: "saved" });

  if (!(await allow(env.DB, `register:${clientIp(request)}`, 20, 3600))) {
    return fail(429, "Too many sign-ups from this connection. Try again in an hour.");
  }
  const checked = checkRsvp(body);
  if (!checked.ok) return fail(400, checked.error.message, { field: checked.error.field });
  const g = checked.value;

  const id = crypto.randomUUID();
  try {
    await env.DB.prepare(
      `INSERT INTO guest_list (id, name, email, phone, coming_as, instagram, city, guests, favourite_look, consent)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 1)`,
    )
      .bind(id, g.name, g.email, g.phone, g.comingAs, g.instagram, g.city || null, g.guests, g.look || null)
      .run();
  } catch (e) {
    if (/UNIQUE/i.test(String(e))) return json({ status: "already" });
    console.error("register: insert failed", e);
    return fail(500, "We could not save your registration just now. Try again in a moment.");
  }

  // The receipt goes out after the answer, so the guest is not kept waiting; the result is noted on their row.
  const site = (env.SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  waitUntil(
    sendReceipt(env, { name: g.name, email: g.email, phone: g.phone, instagram: g.instagram, coming_as: g.comingAs, guests: g.guests, favourite_look: g.look || null }, site)
      .then((status) => env.DB.prepare("UPDATE guest_list SET email_status = ?1 WHERE id = ?2").bind(status, id).run())
      .catch((e) => console.error("register: receipt bookkeeping failed", e)),
  );
  return json({ status: "saved" });
};
