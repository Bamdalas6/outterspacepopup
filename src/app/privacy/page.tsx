import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy — Outterspace Pop-Up" };

export default function Privacy() {
  return (
    <main className="page sand">
      <p className="label"><a href="/">Outterspace</a></p>
      <h1>Privacy</h1>
      <p>How Outterspace handles the details you give us when you join the guest list for the Cowboy Series pop-up. Replace the bracketed details before launch.</p>
      <h2>What we collect</h2>
      <p>Your name, email address, phone or WhatsApp number, how you are coming (for example new buyer or content creator), city and, if you give them, your Instagram handle, how many people are coming with you and your favourite look. The site sets no cookies and runs no analytics.</p>
      <h2>How we use it</h2>
      <p>To plan the pop-up and to send you its date, venue and updates by email and WhatsApp. We do not sell your details or share them with anyone except the services that host and store the guest list (Cloudflare) and deliver our messages.</p>
      <h2>How long we keep it</h2>
      <p>Registrations are kept for [three months] after the pop-up and then deleted.</p>
      <h2>Your rights</h2>
      <p>You can ask to see, correct or delete what we hold about you. Write to [contact email] and we will reply within [30 days].</p>
    </main>
  );
}
