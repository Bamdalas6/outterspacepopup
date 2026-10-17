// The pop-up guest list. Each registration is saved to the Supabase table `guest_list` (see supabase/schema.sql), where
// the owner can browse it in the Supabase dashboard or download it as Excel from /admin. Registering also opens the
// full lookbook on this device.

import { supabase, supabaseReady } from "./supabase";

export const GUEST_KEY = "outterspace-guest";

/** Who is coming: asked of every guest so the pop-up can be planned around them. Must match the check in schema.sql. */
export const COMING_AS = ["New Buyer", "Repeat Buyer", "Content Creator", "Fashion Enthusiast", "Window Shopping", "Community"] as const;

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

/** A row as stored in Supabase. */
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
};

/** The registered guest on this device, if any: their first name opens the lookbook and greets them. */
export function readGuest(): string | null {
  try { return localStorage.getItem(GUEST_KEY); } catch { return null; }
}
export function setGuest(firstName: string) {
  try { localStorage.setItem(GUEST_KEY, firstName); } catch { /* storage blocked: unlocked for this visit only */ }
  window.dispatchEvent(new CustomEvent("os:guest", { detail: firstName }));
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE = /^\+?[\d\s()-]{7,20}$/;

export type SaveResult = "saved" | "already";

/**
 * Saves one registration. "already" means this email is on the list (the database allows one registration per email),
 * which the form treats as a success. Throws on any other failure, including a site built without its Supabase
 * settings, so the guest is asked to try again and is never told they are on the list when nothing was saved.
 */
export async function saveRsvp(r: Rsvp): Promise<SaveResult> {
  if (!supabaseReady) {
    console.error("Supabase is not set up: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY were missing when this site was built.");
    throw new Error("Guest list is not connected");
  }
  const { error } = await supabase().from("guest_list").insert({
    name: r.name,
    email: r.email,
    phone: r.phone,
    coming_as: r.comingAs,
    instagram: r.instagram || null,
    city: r.city || null,
    guests: r.guests,
    favourite_look: r.look || null,
    consent: r.consent,
  });
  if (!error) return "saved";
  if (error.code === "23505") return "already";
  throw new Error(error.message);
}
