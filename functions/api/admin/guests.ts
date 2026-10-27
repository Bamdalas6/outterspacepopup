// GET    /api/admin/guests          every registration, newest first
// DELETE /api/admin/guests?id=...   removes one (a test entry, or a guest who asks to be removed)
// Admins only (see _middleware.ts).

import type { Fn } from "../../../server/env";
import { fail, json } from "../../../server/http";
import type { GuestRow } from "../../../src/lib/guest-rules";

export const onRequestGet: Fn = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT id, created_at, name, email, phone, coming_as, instagram, city, guests, favourite_look, consent, email_status
     FROM guest_list ORDER BY created_at DESC`,
  ).all<Omit<GuestRow, "consent"> & { consent: number }>();
  const guests: GuestRow[] = results.map((r) => ({ ...r, consent: r.consent === 1 }));
  return json({ guests });
};

export const onRequestDelete: Fn = async ({ request, env }) => {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) return fail(400, "Say which registration to remove.");
  const res = await env.DB.prepare("DELETE FROM guest_list WHERE id = ?1").bind(id).run();
  if (!res.meta.changes) return fail(404, "That registration was already removed.");
  return json({ ok: true });
};
