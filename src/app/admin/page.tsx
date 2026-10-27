"use client";

// The private guest list. Admins sign in with their email and password (stored hashed in the site's own Cloudflare D1
// database, see CLOUDFLARE_SETUP.md); the server only hands the list to a signed-in admin. Shows every registration with
// totals and a breakdown by "Coming as", downloads the lot as an Excel file, and lets admins add or remove other admins.
// The very first admin is created here with the one-time ADMIN_SETUP_CODE.

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { COMING_AS, type GuestRow } from "@/lib/rsvp";

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

type Session = { email: string | null; needsSetup?: boolean; setupAllowed?: boolean; error?: string };
type Admin = { email: string; created_at: string; added_by: string | null };

/** Calls the admin API. Throws the server's message on failure; a 401 also reports that the session ended. */
async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(`/api/admin/${path}`, {
    credentials: "same-origin",
    ...rest,
    ...(json !== undefined ? { body: JSON.stringify(json), headers: { "Content-Type": "application/json" } } : {}),
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw Object.assign(new Error(body.error || `Request failed (${res.status})`), { status: res.status, body });
  return body;
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

function SignIn({ onDone }: { onDone: (email: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError("");
    try {
      const r = await api<{ email: string }>("login", { method: "POST", json: { email: String(f.get("email")).trim(), password: String(f.get("password")) } });
      onDone(r.email);
    } catch (err) { setError((err as Error).message); }
    setBusy(false);
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

function FirstAdmin({ allowed, onDone }: { allowed: boolean; onDone: (email: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("password") !== f.get("password2")) { setError("The two passwords are different."); return; }
    setBusy(true); setError("");
    try {
      const r = await api<{ email: string }>("setup", { method: "POST", json: { code: String(f.get("code")).trim(), email: String(f.get("email")).trim(), password: String(f.get("password")) } });
      onDone(r.email);
    } catch (err) { setError((err as Error).message); }
    setBusy(false);
  };
  if (!allowed) {
    return <div className="admin-card"><h1 className="reg-title">Set up the first admin</h1><p className="reg-note">No admin exists yet. Add an <code>ADMIN_SETUP_CODE</code> secret to the Cloudflare project (see <b>CLOUDFLARE_SETUP.md</b>), then reload this page.</p></div>;
  }
  return (
    <form className="admin-card admin-signin reg" onSubmit={submit}>
      <h1 className="reg-title">Set up the first admin</h1>
      <p className="reg-note">No admin exists yet. Enter the setup code you saved in Cloudflare, then choose the email and password you will sign in with. You can add more admins afterwards.</p>
      <label className="reg-field"><span>Setup code</span><input name="code" type="password" autoComplete="off" required /></label>
      <label className="reg-field"><span>Your email</span><input name="email" type="email" autoComplete="username" required /></label>
      <label className="reg-field"><span>Password <i>at least 10 characters</i></span><input name="password" type="password" autoComplete="new-password" minLength={10} required /></label>
      <label className="reg-field"><span>Password again</span><input name="password2" type="password" autoComplete="new-password" minLength={10} required /></label>
      {error && <p className="reg-err" role="alert">{error}</p>}
      <button className="btn reg-submit" type="submit" disabled={busy}>{busy ? "Creating…" : "Create admin and sign in"}</button>
    </form>
  );
}

function Admins({ me, onSessionEnded }: { me: string; onSessionEnded: () => void }) {
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const fail = useCallback((e: unknown) => { if ((e as { status?: number }).status === 401) onSessionEnded(); else setError((e as Error).message); }, [onSessionEnded]);
  const load = useCallback(() => { api<{ admins: Admin[] }>("admins").then((r) => setAdmins(r.admins)).catch(fail); }, [fail]);
  useEffect(load, [load]);

  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget, f = new FormData(form), email = String(f.get("email")).trim();
    setBusy(true); setError(""); setNote("");
    try {
      await api("admins", { method: "POST", json: { email, password: String(f.get("password")) } });
      form.reset(); setNote(`${email} can now sign in at /admin. Send them their starting password privately and ask them to change it.`); load();
    } catch (err) { fail(err); }
    setBusy(false);
  };
  const remove = async (email: string) => {
    if (!confirm(`Remove ${email} as an admin? They will be signed out straight away.`)) return;
    setError(""); setNote("");
    try { await api(`admins?email=${encodeURIComponent(email)}`, { method: "DELETE" }); load(); } catch (err) { fail(err); }
  };
  const changePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget, f = new FormData(form);
    if (f.get("next") !== f.get("next2")) { setError("The two new passwords are different."); return; }
    setError(""); setNote("");
    try { await api("password", { method: "POST", json: { current: String(f.get("current")), next: String(f.get("next")) } }); form.reset(); setNote("Your password is changed."); }
    catch (err) { fail(err); }
  };

  return (
    <section className="admin-admins">
      <div className="admin-head"><div><p className="micro">Access</p><h2 className="big admin-sub">Admins</h2></div></div>
      {error && <p className="reg-err" role="alert">{error}</p>}
      {note && <p className="reg-note admin-note" role="status">{note}</p>}
      <div className="admin-grid">
        <div className="admin-card">
          <ul className="admin-list">
            {(admins ?? []).map((a) => (
              <li key={a.email}>
                <span><b>{a.email}</b>{a.email.toLowerCase() === me.toLowerCase() ? " (you)" : ""}<small>Added {when(a.created_at)}{a.added_by && a.added_by !== "setup" ? ` by ${a.added_by}` : ""}</small></span>
                {a.email.toLowerCase() !== me.toLowerCase() && (admins?.length ?? 0) > 1 && <button type="button" className="admin-remove" onClick={() => remove(a.email)}>Remove</button>}
              </li>
            ))}
          </ul>
        </div>
        <form className="admin-card reg" onSubmit={add}>
          <p className="micro">Add an admin</p>
          <label className="reg-field"><span>Their email</span><input name="email" type="email" autoComplete="off" required /></label>
          <label className="reg-field"><span>Starting password <i>at least 10 characters</i></span><input name="password" type="text" autoComplete="off" minLength={10} required /></label>
          <button className="pill" type="submit" disabled={busy}>{busy ? "Adding…" : "Add admin"}</button>
        </form>
        <form className="admin-card reg" onSubmit={changePassword}>
          <p className="micro">Change my password</p>
          <label className="reg-field"><span>Current password</span><input name="current" type="password" autoComplete="current-password" required /></label>
          <label className="reg-field"><span>New password</span><input name="next" type="password" autoComplete="new-password" minLength={10} required /></label>
          <label className="reg-field"><span>New password again</span><input name="next2" type="password" autoComplete="new-password" minLength={10} required /></label>
          <button className="pill" type="submit">Change password</button>
        </form>
      </div>
    </section>
  );
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [rows, setRows] = useState<GuestRow[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const checkSession = useCallback(async () => {
    try { setSession(await api<Session>("session")); }
    catch (e) {
      const body = (e as { body?: Session; status?: number }).body;
      if ((e as { status?: number }).status === 401 && body) setSession({ ...body, email: null });
      else setSession({ email: null, error: (e as Error).message });
    }
  }, []);
  useEffect(() => { checkSession(); }, [checkSession]);

  const sessionEnded = useCallback(() => { setRows(null); setSession({ email: null }); }, []);
  const load = useCallback(async () => {
    setBusy(true); setError("");
    try { setRows((await api<{ guests: GuestRow[] }>("guests")).guests); }
    catch (e) { if ((e as { status?: number }).status === 401) sessionEnded(); else setError((e as Error).message); }
    setBusy(false);
  }, [sessionEnded]);
  const me = session?.email ?? null;
  useEffect(() => { if (me) load(); else setRows(null); }, [me, load]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => (filter === "All" || r.coming_as === filter) && (!s || [r.name, r.email, r.phone, r.instagram, r.city].some((x) => (x ?? "").toLowerCase().includes(s))));
  }, [rows, filter, q]);
  const counts = useMemo(() => Object.fromEntries(COMING_AS.map((c) => [c, (rows ?? []).filter((r) => r.coming_as === c).length])), [rows]);
  const people = (rows ?? []).reduce((n, r) => n + r.guests, 0);

  const remove = async (r: GuestRow) => {
    if (!confirm(`Remove ${r.name} (${r.email}) from the guest list? This cannot be undone.`)) return;
    try { await api(`guests?id=${encodeURIComponent(r.id)}`, { method: "DELETE" }); setRows((list) => (list ?? []).filter((x) => x.id !== r.id)); }
    catch (e) { if ((e as { status?: number }).status === 401) sessionEnded(); else setError((e as Error).message); }
  };
  const signOut = async () => { await api("logout", { method: "POST" }).catch(() => {}); sessionEnded(); };

  return (
    <main className="admin">
      <header className="admin-top">
        <a href="/" className="nav-logo"><img src="/editorial/logo.png" alt="OUTTERSPACE" width={243} height={39} /></a>
        {me && <button type="button" className="pill pill-small" onClick={signOut}>Sign out</button>}
      </header>

      {session === undefined ? (
        <p className="micro admin-wait">Loading…</p>
      ) : session.error ? (
        <div className="admin-card"><h1 className="reg-title">Not connected yet</h1><p className="reg-note">{session.error} See <b>CLOUDFLARE_SETUP.md</b>.</p></div>
      ) : !me && session.needsSetup ? (
        <FirstAdmin allowed={Boolean(session.setupAllowed)} onDone={(email) => setSession({ email })} />
      ) : !me ? (
        <SignIn onDone={(email) => setSession({ email })} />
      ) : (
        <section className="admin-body">
          <div className="admin-head">
            <div>
              <p className="micro">Cowboy Series pop-up · signed in as {me}</p>
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
              <thead><tr><th>Registered</th><th>Name</th><th>Phone / WhatsApp</th><th>Instagram</th><th>Email</th><th>Coming as</th><th>City</th><th>People</th><th>Favourite look</th><th>Receipt</th><th /></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td>{when(r.created_at)}</td><td><b>{r.name}</b></td>
                    <td><a href={`https://wa.me/${r.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener">{r.phone}</a></td>
                    <td>{r.instagram ? <a href={`https://instagram.com/${r.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener">{r.instagram}</a> : "–"}</td>
                    <td><a href={`mailto:${r.email}`}>{r.email}</a></td>
                    <td><span className="admin-tag">{r.coming_as}</span></td><td>{r.city ?? "–"}</td>
                    <td>{r.guests}</td><td>{r.favourite_look ?? "–"}</td>
                    <td>{r.email_status === "sent" ? "Sent" : r.email_status === "failed" ? "Failed" : r.email_status === "off" ? "Email off" : "–"}</td>
                    <td><button type="button" className="admin-remove" onClick={() => remove(r)} aria-label={`Remove ${r.name}`}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows && shown.length === 0 && <p className="admin-empty">{rows.length ? "No registrations match." : "No registrations yet."}</p>}
          </div>

          <Admins me={me} onSessionEnded={sessionEnded} />
        </section>
      )}
    </main>
  );
}
