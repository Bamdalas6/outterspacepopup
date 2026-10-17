"use client";

import { useEffect, useState } from "react";
import { readGuest, GUEST_KEY } from "./rsvp";

/** The registered guest's first name on this device, or null. Updates the moment someone registers. */
export function useGuest() {
  const [guest, setGuestState] = useState<string | null>(null);
  useEffect(() => {
    setGuestState(readGuest());
    const on = (e: Event) => setGuestState((e as CustomEvent<string>).detail);
    const onStorage = (e: StorageEvent) => { if (e.key === GUEST_KEY) setGuestState(e.newValue); };
    addEventListener("os:guest", on);
    addEventListener("storage", onStorage);
    return () => { removeEventListener("os:guest", on); removeEventListener("storage", onStorage); };
  }, []);
  return guest;
}
