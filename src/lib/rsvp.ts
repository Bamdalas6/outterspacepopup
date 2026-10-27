// The pop-up guest list, from the browser's side. Each registration is sent to /api/register (a Cloudflare Pages
// Function, see functions/api/register.ts), which checks it again, saves it in the D1 database and emails the guest
// their receipt. The owner sees everyone at /admin and can download the list as Excel. Registering also opens the full
// lookbook on this device.

export { COMING_AS, EMAIL, PHONE, instagramHandle, type GuestRow, type Rsvp } from "./guest-rules";
import type { Rsvp } from "./guest-rules";

export const GUEST_KEY = "outterspace-guest";

/** The registered guest on this device, if any: their first name opens the lookbook and greets them. */
export function readGuest(): string | null {
  try { return localStorage.getItem(GUEST_KEY); } catch { return null; }
}
export function setGuest(firstName: string) {
  try { localStorage.setItem(GUEST_KEY, firstName); } catch { /* storage blocked: unlocked for this visit only */ }
  window.dispatchEvent(new CustomEvent("os:guest", { detail: firstName }));
}

export type SaveResult = "saved" | "already";

/** A problem the server found with one field, so the form can show it next to that field. */
export class RsvpError extends Error {
  constructor(message: string, public field?: string) { super(message); }
}

/**
 * Saves one registration. "already" means this email is on the list (one registration per email), which the form
 * treats as a success. Throws on any other failure, so the guest is asked to try again and is never told they are on
 * the list when nothing was saved.
 */
export async function saveRsvp(r: Rsvp, gotcha = ""): Promise<SaveResult> {
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...r, _gotcha: gotcha }),
  });
  const body = (await res.json().catch(() => ({}))) as { status?: SaveResult; error?: string; field?: string };
  if (res.ok && (body.status === "saved" || body.status === "already")) return body.status;
  throw new RsvpError(body.error || "Could not save the registration", body.field);
}
