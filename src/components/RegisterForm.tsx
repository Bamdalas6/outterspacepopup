"use client";

// The guest list form: the reason this site exists. Short, every field labelled, errors said in words next to the
// field, and once sent it turns into a confirmation that points to the lookbook it has just opened.

import { useRef, useState, type FormEvent } from "react";
import { pieces } from "@/data/collection";
import { COMING_AS, EMAIL, PHONE, saveRsvp, setGuest, type Rsvp } from "@/lib/rsvp";

type Errors = Partial<Record<"name" | "email" | "phone" | "comingAs" | "consent" | "form", string>>;

export default function RegisterForm() {
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<(Rsvp & { already: boolean }) | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const f = form.current!;
    const v = (n: string) => ((f.elements.namedItem(n) as HTMLInputElement | null)?.value ?? "").trim();
    const name = v("name"), email = v("email"), phone = v("phone");
    const consent = (f.elements.namedItem("consent") as HTMLInputElement).checked;
    const comingAs = (f.querySelector<HTMLInputElement>('input[name="comingAs"]:checked')?.value ?? "");
    const errs: Errors = {};
    if (name.length < 2) errs.name = "Add your full name.";
    if (!EMAIL.test(email)) errs.email = "Check your email address.";
    if (!PHONE.test(phone)) errs.phone = "Add a number we can reach you on.";
    if (!comingAs) errs.comingAs = "Choose how you are coming.";
    if (!consent) errs.consent = "Tick this so we can send you the date and venue.";
    setErrors(errs);
    const first = (["name", "email", "phone", "comingAs", "consent"] as const).find((k) => errs[k]);
    if (first) {
      const el = first === "comingAs" ? f.querySelector<HTMLInputElement>('input[name="comingAs"]') : (f.elements.namedItem(first) as HTMLElement | null);
      el?.focus();
      return;
    }

    const ig = v("instagram");
    const entry: Rsvp = {
      name, email: email.toLowerCase(), phone, comingAs,
      instagram: ig ? `@${ig.replace(/^@/, "")}` : "",
      city: v("city"), guests: Number(v("guests")) || 1, look: v("look"), consent,
    };
    // A bot that filled the hidden field gets the thank-you, and nothing is saved.
    if (v("_gotcha")) { setDone({ ...entry, already: false }); return; }

    setBusy(true);
    let result;
    try {
      result = await saveRsvp(entry);
    } catch {
      setBusy(false);
      setErrors({ form: "We could not reach the guest list just now. Check your connection and try again in a moment." });
      return;
    }
    setBusy(false);
    setGuest(name.split(/\s+/)[0]!);
    setDone({ ...entry, already: result === "already" });
  };

  if (done) {
    return (
      <div className="reg-done" role="status">
        <p className="eyebrow"><span className="live" aria-hidden="true" /> {done.already ? "You were already on the guest list" : "You are on the guest list"}</p>
        <h2 className="reg-title">See you there, {done.name.split(/\s+/)[0]}.</h2>
        {done.already
          ? <p className="reg-note"><b>{done.email}</b> is already registered, so there is nothing more to do. We will send the date and venue there and on WhatsApp.</p>
          : <p className="reg-note">We will send the date and venue to <b>{done.email}</b> and on WhatsApp to <b>{done.phone}</b>.{done.guests > 1 ? ` Your spot is for ${done.guests} people.` : ""}</p>}
        <a className="btn btn-red" href="#lookbook">Open the full lookbook</a>
        <button type="button" className="reg-again" onClick={() => setDone(null)}>Register another guest</button>
      </div>
    );
  }

  const err = (k: keyof Errors) => errors[k] && <span className="reg-err" id={`err-${k}`}>{errors[k]}</span>;
  return (
    <form ref={form} className="reg" noValidate onSubmit={submit} onInput={(e) => { const n = (e.target as HTMLInputElement).name; if (errors[n as keyof Errors] || errors.form) setErrors((x) => ({ ...x, [n]: undefined, form: undefined })); }}>
      <label className="reg-trap" aria-hidden="true">Leave this empty<input name="_gotcha" type="text" tabIndex={-1} autoComplete="off" /></label>
      <div className="reg-row">
        <label className="reg-field reg-wide"><span>Full name</span><input name="name" type="text" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "err-name" : undefined} />{err("name")}</label>
      </div>
      <div className="reg-row">
        <label className="reg-field"><span>Email</span><input name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "err-email" : undefined} />{err("email")}</label>
        <label className="reg-field"><span>Phone / WhatsApp</span><input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+234" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "err-phone" : undefined} />{err("phone")}</label>
      </div>
      <fieldset className="reg-field reg-chips" aria-invalid={!!errors.comingAs} aria-describedby={errors.comingAs ? "err-comingAs" : undefined}>
        <legend>Coming as</legend>
        <div className="chips">
          {COMING_AS.map((c) => (
            <label key={c} className="chip"><input type="radio" name="comingAs" value={c} /><span>{c}</span></label>
          ))}
        </div>
        {err("comingAs")}
      </fieldset>
      <div className="reg-row">
        <label className="reg-field"><span>Instagram <i>optional</i></span><input name="instagram" type="text" placeholder="@" autoCapitalize="off" /></label>
        <label className="reg-field"><span>City</span><input name="city" type="text" autoComplete="address-level2" /></label>
      </div>
      <div className="reg-row">
        <label className="reg-field"><span>Coming with</span><select name="guests" defaultValue="1"><option value="1">Just me</option><option value="2">+1 guest</option><option value="3">+2 guests</option><option value="4">+3 guests</option></select></label>
        <label className="reg-field"><span>Favourite look <i>optional</i></span><select name="look" defaultValue=""><option value="">Choose one</option>{pieces.map((p) => <option key={p.id}>{p.name}</option>)}</select></label>
      </div>
      <label className="reg-check"><input name="consent" type="checkbox" aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "err-consent" : undefined} /><span>Send me the date, venue and pop-up updates by email and WhatsApp. <a href="/privacy/">Privacy</a></span></label>
      {err("consent")}
      {errors.form && <p className="reg-err" role="alert">{errors.form}</p>}
      <button className="btn btn-red reg-submit" type="submit" disabled={busy}>{busy ? "Saving…" : "Join the guest list"}<span aria-hidden="true">→</span></button>
      <p className="reg-small">Joining opens the full Cowboy Series lookbook on this page.</p>
    </form>
  );
}
