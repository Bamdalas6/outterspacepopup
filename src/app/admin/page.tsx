"use client";

// The private guest list. Sign in with the email and password of a Supabase user whose email is in the `admins` table
// (see SUPABASE_SETUP.md). The database itself enforces this: without an admin sign-in the list cannot be read at all.
// Shows every registration with totals and a breakdown by "Coming as", and downloads the lot as an Excel file.

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseReady } from "@/lib/supabase";
import { COMING_AS, type GuestRow } from "@/lib/rsvp";

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

async function fetchAll(): Promise<GuestRow[]> {
  const rows: GuestRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase().from("guest_list").select("*").order("created_at", { ascending: false }).range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as GuestRow[]));
    if (!data || data.length < 1000) return rows;
  }
}

async function downloadExcel(rows: GuestRow[]) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const bold = (value: string) => ({ value, fontWeight: "bold" as const });
  const guests = [
    [bold("Registered"), bold("Name"), bold("Phone / WhatsApp"), bold("Instagram"), bold("Email"), bold("Coming as"), bold("City"), bold("People"), bold("Favourite look")],
    ...rows.map((r) => [
      { value: new Date(r.created_at), type: Date, format: "dd/mm/yyyy hh:mm" },
      { value: r.name }, { value: r.phone }, { value: r.instagram ?? "" }, { value: r.email }, { value: r.coming_as },
      { value: r.city ?? "" },
      { value: r.guests, type: Number }, { value: r.favourite_look ?? "" },
    ]),
  ];
  const count = (key: (r: GuestRow) => string) => {
    const m = new Map<string, { regs: number; people: number }>();
    for (const r of rows) { const k = key(r) || "Not given"; const v = m.get(k) ?? { regs: 0, people: 0 }; v.regs++; v.people += r.guests; m.set(k, v); }
    return [...m.entries()].sort((a, b) => b[1].regs - a[1].regs);
  };
  const people = rows.reduce((n, r) => n + r.guests, 0);
  const summary = [
    [bold("Outterspace Cowboy Series pop-up — guest list"), { value: "" }, { value: "" }],
    [{ value: "Exported" }, { value: new Date(), type: Date, format: "dd/mm/yyyy hh:mm" }, { value: "" }],
    [{ value: "Registrations" }, { value: rows.length, type: Number }, { value: "" }],
    [{ value: "People coming (incl. guests)" }, { value: people, type: Number }, { value: "" }],
    [{ value: "" }, { value: "" }, { value: "" }],
    [bold("Coming as"), bold("Registrations"), bold("People")],
    ...count((r) => r.coming_as).map(([k, v]) => [{ value: k }, { value: v.regs, type: Number }, { value: v.people, type: Number }]),
    [{ value: "" }, { value: "" }, { value: "" }],
    [bold("City"), bold("Registrations"), bold("People")],
    ...count((r) => (r.city ?? "").trim()).map(([k, v]) => [{ value: k }, { value: v.regs, type: Number }, { value: v.people, type: Number }]),
    [{ value: "" }, { value: "" }, { value: "" }],
    [bold("Favourite look"), bold("Registrations"), bold("People")],
    ...count((r) => r.favourite_look ?? "").map(([k, v]) => [{ value: k }, { value: v.regs, type: Number }, { value: v.people, type: Number }]),
  ];
  await writeXlsxFile([
    { data: guests, sheet: "Guest list", columns: [{ width: 18 }, { width: 24 }, { width: 20 }, { width: 20 }, { width: 30 }, { width: 20 }, { width: 16 }, { width: 8 }, { width: 28 }], stickyRowsCount: 1 },
    { data: summary, sheet: "Summary", columns: [{ width: 34 }, { width: 16 }, { width: 12 }] },
  ] as never).toFile(`outterspace-guest-list-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function SignIn({ onError, error }: { onError: (e: string) => void; error: string }) {
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase().auth.signInWithPassword({ email: String(f.get("email")).trim(), password: String(f.get("password")) });
    setBusy(false);
    if (error) onError(error.message === "Invalid login credentials" ? "That email and password do not match an admin account." : error.message);
  };
  return (
    <form className="admin-card admin-signin reg" onSubmit={submit}>
      <h1 className="reg-title">Guest list</h1>
      <p className="reg-note">Sign in with your admin account to see registrations and download them as Excel.</p>
      <label className="reg-field"><span>Email</span><input name="email" type="email" autoComplete="username" required /></label>
      <label className="reg-field"><span>Password</span><input name="password" type="password" autoComplete="current-password" required /></label>
      {error && <p className="reg-err" role="alert">{error}</p>}
      <button className="btn reg-submit" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

export default function Admin() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<GuestRow[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabaseReady) { setSession(null); return; }
    const sb = supabase();
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      // The database only ever returns your own admins row, so any row back means you are an admin.
      const { data, error } = await supabase().from("admins").select("email").limit(1).maybeSingle();
      if (error) throw new Error(error.message);
      setIsAdmin(!!data);
      if (data) setRows(await fetchAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the guest list.");
    }
    setBusy(false);
  }, []);

  // Load once per signed-in user; token refreshes hand over a new session object for the same person.
  const userId = session?.user.id ?? null;
  useEffect(() => { if (userId) load(); else { setRows(null); setIsAdmin(null); } }, [userId, load]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => (filter === "All" || r.coming_as === filter) && (!s || [r.name, r.email, r.phone, r.instagram, r.city].some((x) => (x ?? "").toLowerCase().includes(s))));
  }, [rows, filter, q]);
  const counts = useMemo(() => Object.fromEntries(COMING_AS.map((c) => [c, (rows ?? []).filter((r) => r.coming_as === c).length])), [rows]);
  const people = (rows ?? []).reduce((n, r) => n + r.guests, 0);

  const remove = async (r: GuestRow) => {
    if (!confirm(`Remove ${r.name} (${r.email}) from the guest list? This cannot be undone.`)) return;
    const { error } = await supabase().from("guest_list").delete().eq("id", r.id);
    if (error) { setError(error.message); return; }
    setRows((list) => (list ?? []).filter((x) => x.id !== r.id));
  };

  return (
    <main className="admin">
      <header className="admin-top">
        <a href="/" className="nav-logo"><img src="/editorial/logo.png" alt="OUTTERSPACE" width={243} height={39} /></a>
        {session && <button type="button" className="pill pill-small" onClick={() => supabase().auth.signOut()}>Sign out</button>}
      </header>

      {!supabaseReady ? (
        <div className="admin-card"><h1 className="reg-title">Not connected yet</h1><p className="reg-note">Add your Supabase URL and public key to <code>.env.local</code> (see <b>SUPABASE_SETUP.md</b>), then restart the site.</p></div>
      ) : session === undefined ? (
        <p className="micro admin-wait">Loading…</p>
      ) : !session ? (
        <SignIn onError={setError} error={error} />
      ) : isAdmin === false ? (
        <div className="admin-card"><h1 className="reg-title">Not an admin</h1><p className="reg-note"><b>{session.user.email}</b> is signed in but is not in the <code>admins</code> table. Add it there in Supabase (see SUPABASE_SETUP.md), then reload.</p></div>
      ) : (
        <section className="admin-body">
          <div className="admin-head">
            <div>
              <p className="micro">Cowboy Series pop-up</p>
              <h1 className="big">Guest list</h1>
            </div>
            <div className="admin-actions">
              <button type="button" className="pill" onClick={() => rows && downloadExcel(rows)} disabled={!rows?.length}>Download Excel</button>
              <button type="button" className="circle" onClick={load} aria-label="Refresh" disabled={busy}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg></button>
            </div>
          </div>

          <div className="admin-stats">
            <div className="admin-stat"><span className="micro">Registrations</span><b>{rows?.length ?? "–"}</b></div>
            <div className="admin-stat"><span className="micro">People coming</span><b>{rows ? people : "–"}</b></div>
            <div className="admin-stat admin-stat-wide"><span className="micro">Coming as</span>
              <div className="chips">
                {["All", ...COMING_AS].map((c) => (
                  <label key={c} className="chip"><input type="radio" name="filter" checked={filter === c} onChange={() => setFilter(c)} /><span>{c} {c === "All" ? rows?.length ?? 0 : counts[c]}</span></label>
                ))}
              </div>
            </div>
          </div>

          <label className="reg-field admin-search"><span>Search</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, phone, Instagram or city" /></label>
          {error && <p className="reg-err" role="alert">{error}</p>}

          <div className="admin-table">
            <table>
              <thead><tr><th>Registered</th><th>Name</th><th>Phone / WhatsApp</th><th>Instagram</th><th>Email</th><th>Coming as</th><th>City</th><th>People</th><th>Favourite look</th><th /></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td>{when(r.created_at)}</td><td><b>{r.name}</b></td>
                    <td><a href={`https://wa.me/${r.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener">{r.phone}</a></td>
                    <td>{r.instagram ? <a href={`https://instagram.com/${r.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener">{r.instagram}</a> : "–"}</td>
                    <td><a href={`mailto:${r.email}`}>{r.email}</a></td>
                    <td><span className="admin-tag">{r.coming_as}</span></td><td>{r.city ?? "–"}</td>
                    <td>{r.guests}</td><td>{r.favourite_look ?? "–"}</td>
                    <td><button type="button" className="admin-remove" onClick={() => remove(r)} aria-label={`Remove ${r.name}`}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows && shown.length === 0 && <p className="admin-empty">{rows.length ? "No registrations match." : "No registrations yet."}</p>}
          </div>
        </section>
      )}
    </main>
  );
}
