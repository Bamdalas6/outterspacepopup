// Copies registrations exported from the old Supabase guest_list table into the Cloudflare D1 database.
//
//   1. In Supabase, restore the paused project, open Table Editor → guest_list → Export → "Export table as CSV".
//   2. npm run import:supabase -- path/to/guest_list_rows.csv            (into the live D1 database)
//      npm run import:supabase -- path/to/guest_list_rows.csv --local    (into the local copy used by cf:dev)
//
// Rows whose id or email is already in D1 are skipped, so running it twice is safe. Nothing in Supabase is changed.

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [file, ...flags] = process.argv.slice(2);
if (!file) {
  console.error("Usage: npm run import:supabase -- path/to/guest_list_rows.csv [--local]");
  process.exit(1);
}
const target = flags.includes("--local") ? "--local" : "--remote";

/** RFC 4180 CSV: quoted fields, doubled quotes, commas and newlines inside quotes. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v !== "")) rows.push(row);
  return rows;
}

const [header, ...data] = parseCsv(readFileSync(file, "utf8").replace(/^﻿/, ""));
const col = (name) => header.indexOf(name);
for (const need of ["name", "email", "phone", "coming_as"]) {
  if (col(need) < 0) { console.error(`The CSV has no "${need}" column. Export the guest_list table from Supabase.`); process.exit(1); }
}

const q = (v) => (v === null || v === undefined || v === "" ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const get = (r, name) => (col(name) >= 0 ? (r[col(name)] ?? "").trim() : "");
const statements = data.map((r) => {
  const created = get(r, "created_at") ? new Date(get(r, "created_at")).toISOString() : new Date().toISOString();
  const guests = Math.min(4, Math.max(1, Number(get(r, "guests")) || 1));
  return `INSERT OR IGNORE INTO guest_list (id, created_at, name, email, phone, coming_as, instagram, city, guests, favourite_look, consent, email_status)
VALUES (${q(get(r, "id") || crypto.randomUUID())}, ${q(created)}, ${q(get(r, "name"))}, ${q(get(r, "email").toLowerCase())}, ${q(get(r, "phone"))}, ${q(get(r, "coming_as"))}, ${q(get(r, "instagram"))}, ${q(get(r, "city"))}, ${guests}, ${q(get(r, "favourite_look"))}, 1, 'imported');`;
});

const dir = mkdtempSync(join(tmpdir(), "outterspace-import-"));
const sqlFile = join(dir, "import.sql");
writeFileSync(sqlFile, statements.join("\n") + "\n");
console.log(`Importing ${statements.length} registration(s) into D1 (${target.slice(2)})…`);
// Run the project's own Wrangler with Node directly (no shell), so paths with spaces are passed safely.
const wrangler = fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url));
execFileSync(process.execPath, [wrangler, "d1", "execute", "DB", target, "--file", sqlFile], { stdio: "inherit" });
console.log("Done. Open /admin to check them.");
