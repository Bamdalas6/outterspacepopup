// The guest list rules, shared by the form in the browser and by /api/register on Cloudflare, so both check exactly
// the same things. No browser or server APIs in here.

/** Who is coming: asked of every guest so the pop-up can be planned around them. Must match the check in migrations/. */
export const COMING_AS = ["New Buyer", "Repeat Buyer", "Content Creator", "Fashion Enthusiast", "Window Shopping", "Community"] as const;

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE = /^\+?[\d\s()-]{7,20}$/;

/**
 * Turns whatever a guest types for Instagram (@handle, handle, or a pasted instagram.com/handle link) into "@handle",
 * or returns null if it is not a valid Instagram username (1–30 letters, numbers, dots and underscores).
 */
export function instagramHandle(input: string): string | null {
  let s = input.trim();
  const link = s.match(/instagram\.com\/([^/?#\s]+)/i);
  if (link) s = link[1]!;
  s = s.replace(/^@+/, "");
  return /^(?!.*\.\.)(?!\.)[A-Za-z0-9._]{1,30}(?<!\.)$/.test(s) ? `@${s}` : null;
}

/** What the form sends to /api/register. */
export type Rsvp = {
  name: string;
  email: string;
  phone: string;
  comingAs: string;
  instagram: string;
  city: string;
  guests: number;
  look: string;
  consent: boolean;
};

/** A registration as stored in the guest list (and as /api/admin/guests returns it). */
export type GuestRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  coming_as: string;
  instagram: string | null;
  city: string | null;
  guests: number;
  favourite_look: string | null;
  consent: boolean;
  email_status: string | null;
};

export type FieldError = { field: keyof Rsvp; message: string };

/** Checks and tidies a registration. Returns the clean values, or the first problem found. */
export function checkRsvp(input: Partial<Record<keyof Rsvp, unknown>>): { ok: true; value: Rsvp } | { ok: false; error: FieldError } {
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = str(input.name, 120);
  const email = str(input.email, 200).toLowerCase();
  const phone = str(input.phone, 30);
  const comingAs = str(input.comingAs, 40);
  const instagram = instagramHandle(str(input.instagram, 120));
  const guests = Number(input.guests ?? 1);
  if (name.length < 2) return { ok: false, error: { field: "name", message: "Add your full name." } };
  if (!PHONE.test(phone)) return { ok: false, error: { field: "phone", message: "Add the WhatsApp number we can reach you on, with the country code (e.g. +234)." } };
  if (!instagram) return { ok: false, error: { field: "instagram", message: "Add your Instagram username." } };
  if (!EMAIL.test(email)) return { ok: false, error: { field: "email", message: "Check your email address. Your receipt is sent here." } };
  if (!(COMING_AS as readonly string[]).includes(comingAs)) return { ok: false, error: { field: "comingAs", message: "Choose how you are coming." } };
  if (!Number.isInteger(guests) || guests < 1 || guests > 4) return { ok: false, error: { field: "guests", message: "Choose how many people are coming." } };
  if (input.consent !== true) return { ok: false, error: { field: "consent", message: "Tick this so we can send you the date and venue." } };
  return { ok: true, value: { name, email, phone, comingAs, instagram, city: str(input.city, 80), guests, look: str(input.look, 80), consent: true } };
}
