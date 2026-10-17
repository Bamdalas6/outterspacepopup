"use client";

// Everything around the stage: the navigation, the bento cards, the lookbook you drag sideways (three looks open, the
// rest open once you are on the guest list), the collection (click a piece to put it on stage), the guest list form
// and the footer.

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { looks, OPEN_LOOKS, pieces, frontSrc, backSrc, SHOP } from "@/data/collection";
import { useGuest } from "@/lib/useGuest";
import { setStage, useStage } from "@/lib/stage";
import { burst } from "@/lib/confetti";
import RegisterForm from "./RegisterForm";
import Barcode from "./Barcode";

const Arrow = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>;

const rise = { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-10% 0px" }, transition: { duration: 0.8, ease: [0.2, 0.8, 0.1, 1] as const } };

export function Nav() {
  const [open, setOpen] = useState(false);
  const links = [["Lookbook", "#lookbook"], ["Collection", "#collection"], ["The pop-up", "#popup"], ["Guest list", "#guest-list"]] as const;
  return (
    <header className="nav">
      <a href="#top" className="nav-logo" aria-label="Outterspace, back to the top"><img src="/editorial/logo.png" alt="OUTTERSPACE" width={243} height={39} /></a>
      <nav className={`nav-links${open ? " is-open" : ""}`} aria-label="Main">
        {links.map(([t, h]) => <a key={h} href={h} onClick={() => setOpen(false)}>{t}</a>)}
      </nav>
      <button type="button" className="nav-dots" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span /><span /><span /><span />
      </button>
    </header>
  );
}

export function Bento() {
  const i = useStage();
  const p = pieces[i]!;
  return (
    <section id="popup" className="bento-wrap">
      <motion.div className="bento-head" {...rise}>
        <h2 className="big">Cowboy meets<br />outer space</h2>
        <div className="bento-aside">
          <p className="micro">Born in the Year of Horses.<br />I don&apos;t belong here, I belong<br />where horses run free.</p>
          <a href="#lookbook" className="circle" aria-label="See the lookbook"><Arrow /></a>
        </div>
      </motion.div>

      <div className="bento">
        <motion.a href="#lookbook" className="card card-accent" style={{ ["--accent" as string]: p.accent }} {...rise}>
          <span className="circle circle-light card-corner"><Arrow /></span>
          <span className="card-kicker micro">On stage now</span>
          <motion.img key={p.id} src={frontSrc(p.id)} alt={p.name} className="card-accent-img" initial={{ rotate: -14, scale: 0.8, opacity: 0 }} animate={{ rotate: -6, scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 16 }} />
          <span className="card-accent-name">{p.name}</span>
        </motion.a>

        <motion.div className="card card-line card-logo" {...rise} transition={{ ...rise.transition, delay: 0.08 }}>
          <img src="/editorial/logo.png" alt="OUTTERSPACE" />
          <span className="micro">Department of Design</span>
        </motion.div>

        <motion.div className="card card-line card-discover" {...rise} transition={{ ...rise.transition, delay: 0.16 }}>
          <p className="card-big">Discover your <em>favourite</em> of 17 pieces</p>
          <a href="#collection" className="pill pill-small">See the collection</a>
        </motion.div>

        <motion.div className="card card-grey card-faces" {...rise} transition={{ ...rise.transition, delay: 0.1 }}>
          <div className="faces">
            {["/editorial/hero-1.webp", "/editorial/hero-2.webp", "/editorial/look-starwave.webp", "/editorial/hero-3.webp"].map((s) => <img key={s} src={s} alt="" />)}
            <span className="face-plus">+</span>
          </div>
          <p><b>Guest list now open.</b> Be in the room for the first Outterspace pop-up.</p>
        </motion.div>

        <motion.div className="card card-ink card-event" {...rise} transition={{ ...rise.transition, delay: 0.18 }}>
          <div className="card-event-top">
            <span className="micro">The first Outterspace pop-up</span>
            <Barcode code="POPUP-NOV-2026" className="card-bars" />
          </div>
          <p className="card-event-big">November<br />2026</p>
          <dl className="card-event-facts">
            <div><dt>Where</dt><dd>Sent to the guest list</dd></div>
            <div><dt>Entry</dt><dd>Guest list registration</dd></div>
          </dl>
          <a href="#guest-list" className="pill pill-light">Join the guest list <span aria-hidden="true">→</span></a>
        </motion.div>
      </div>
    </section>
  );
}

export function Lookbook() {
  const guest = useGuest();
  const open = !!guest;
  const track = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [limit, setLimit] = useState(0);
  useEffect(() => {
    const measure = () => { if (track.current && rail.current) setLimit(Math.min(0, rail.current.clientWidth - track.current.scrollWidth)); };
    measure();
    addEventListener("resize", measure);
    return () => removeEventListener("resize", measure);
  }, []);
  return (
    <section id="lookbook" className={`lookbook${open ? " is-open" : ""}`}>
      <motion.div className="sec-head" {...rise}>
        <h2 className="big">The<br />lookbook</h2>
        <div className="bento-aside">
          <p className="micro">{open ? `Every look is open, ${guest}.` : "Three looks open. Join the guest list to open all nine."}<br />Drag to look through.</p>
          <a href={open ? "#collection" : "#guest-list"} className="circle" aria-label={open ? "See the collection" : "Join the guest list"}><Arrow /></a>
        </div>
      </motion.div>
      <div className="look-rail" ref={rail}>
        <motion.div className="look-track" ref={track} drag="x" dragConstraints={{ left: limit, right: 0 }} dragElastic={0.08}>
          {looks.map((l, k) => {
            const locked = !open && k >= OPEN_LOOKS;
            return (
              <motion.figure key={l.src} className={`look${locked ? " is-locked" : ""}`} initial={{ opacity: 0, y: 60, rotate: k % 2 ? 3 : -3 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: (k % 4) * 0.08, ease: [0.2, 0.8, 0.1, 1] }}>
                <span className="look-pic">
                  <img src={l.src} alt={locked ? "" : l.alt} draggable={false} loading="lazy" />
                  {locked && <a href="#guest-list" className="look-lock">Guest list only</a>}
                  <span className="look-n">Look {l.n}</span>
                </span>
                <figcaption>{locked ? "Join to open" : l.piece.name}</figcaption>
              </motion.figure>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function PieceCard({ k }: { k: number }) {
  const p = pieces[k]!;
  const [back, setBack] = useState(false);
  const toStage = () => { setStage(k); document.getElementById("top")?.scrollIntoView({ behavior: "smooth" }); };
  return (
    <motion.li className="piece" style={{ ["--accent" as string]: p.accent }} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-5% 0px" }} transition={{ duration: 0.6, delay: (k % 4) * 0.06 }} onMouseEnter={() => p.back && setBack(true)} onMouseLeave={() => setBack(false)}>
      <button type="button" className="piece-btn" onClick={toStage} aria-label={`Put ${p.name} on stage`}>
        <span className="piece-blob" aria-hidden="true" />
        <span className="piece-pic">
          <img src={frontSrc(p.id)} alt="" loading="lazy" className={back ? "" : "is-on"} />
          {p.back && <img src={backSrc(p.id)} alt="" loading="lazy" className={back ? "is-on" : ""} />}
        </span>
        <span className="piece-n micro">{String(k + 1).padStart(2, "0")}</span>
        <span className="circle circle-small piece-go"><Arrow /></span>
      </button>
      <p className="piece-name"><b>{p.name}</b><span>{p.meta}</span></p>
    </motion.li>
  );
}

export function Collection() {
  return (
    <section id="collection" className="collection">
      <motion.div className="sec-head" {...rise}>
        <h2 className="big">Seventeen<br />pieces</h2>
        <div className="bento-aside">
          <p className="micro">The full Cowboy Series SS26.<br />Click a piece to put it on stage.</p>
          <a href="#top" className="circle" aria-label="Back to the stage"><Arrow /></a>
        </div>
      </motion.div>
      <ul className="pieces">{pieces.map((p, k) => <PieceCard key={p.id} k={k} />)}</ul>
    </section>
  );
}

export function GuestList() {
  const guest = useGuest();
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, margin: "-20% 0px" });
  useEffect(() => {
    const on = () => burst(pieces.map((p) => p.accent));
    addEventListener("os:guest", on);
    return () => removeEventListener("os:guest", on);
  }, []);
  return (
    <section id="guest-list" ref={ref} className="guest">
      <div className="guest-left">
        <motion.span className="micro guest-live" initial={{ opacity: 0 }} animate={seen ? { opacity: 1 } : {}}><i aria-hidden="true" /> Guest list now open</motion.span>
        <motion.h2 className="big" initial={{ opacity: 0, y: 40 }} animate={seen ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}>Get on<br />the <em>list</em></motion.h2>
        <p className="guest-note">{guest ? `You are on the guest list, ${guest}. Watch your email and WhatsApp for the date and venue.` : "Register for the first Outterspace pop-up this November. We send the date and venue to everyone on the list, and joining opens the full lookbook."}</p>
        <div className="ticket" aria-hidden="true">
          <div><span className="micro">Admit</span><b>One</b></div>
          <div><span className="micro">Event</span><b>Cowboy Series pop-up</b></div>
          <div><span className="micro">Date</span><b>Nov 2026</b></div>
          <Barcode code={`GUEST-${guest ?? "PENDING"}`} className="ticket-bars" />
        </div>
      </div>
      <motion.div className="guest-card" initial={{ opacity: 0, y: 60 }} animate={seen ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.1 }}>
        <RegisterForm />
      </motion.div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <p className="foot-word" aria-hidden="true">OUTTERSPACE</p>
      <div className="foot-row">
        <span className="micro">Department of Design · Cowboy Series SS26</span>
        <nav aria-label="Footer"><a href={SHOP} target="_blank" rel="noopener">outterspaceluxury.com</a><a href="/privacy/">Privacy</a><a href="#guest-list">Guest list</a></nav>
      </div>
    </footer>
  );
}
