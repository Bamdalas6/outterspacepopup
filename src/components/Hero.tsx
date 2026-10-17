"use client";

// The stage: "COWBOY" set huge, the piece's own word under it, and the piece itself floating in the middle across both
// lines. Every few seconds the next piece swings in: the word rolls over letter by letter, the accent colour, the glow
// and the little tile all change with it. Drag the piece (or swipe on a phone), use the arrows, or pick from the strip
// to change it yourself; it leans toward the pointer.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type PanInfo } from "motion/react";
import { pieces, frontSrc } from "@/data/collection";
import { useStage, stepStage, setStage, N } from "@/lib/stage";
import Barcode from "./Barcode";

const DWELL = 4200;

function Word({ text, accent }: { text: string; accent?: string }) {
  return (
    <span className="word" aria-label={text} style={accent ? { color: accent } : undefined}>
      {[...text].map((c, i) => (
        <span key={i} className="word-clip" aria-hidden="true">
          <motion.span
            className="word-ch"
            initial={{ y: "105%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-105%" }}
            transition={{ duration: 0.55, ease: [0.2, 0.8, 0.1, 1], delay: i * 0.035 }}
          >{c}</motion.span>
        </span>
      ))}
    </span>
  );
}

/** The largest font size (up to `maxVw`) at which `text` fits across `el`, measured in the real display font. */
function useFit(text: string, el: React.RefObject<HTMLElement | null>, maxVw: number) {
  const [size, setSize] = useState<string>(`${maxVw}vw`);
  useLayoutEffect(() => {
    const box = el.current;
    if (!box) return;
    const fit = () => {
      const probe = document.createElement("span");
      const cs = getComputedStyle(box);
      probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-family:${cs.fontFamily};font-weight:800;letter-spacing:-0.045em;font-size:100px`;
      probe.textContent = text;
      document.body.append(probe);
      const per100 = probe.getBoundingClientRect().width;
      probe.remove();
      const px = Math.min((innerWidth * maxVw) / 100, (box.clientWidth * 0.94 * 100) / per100);
      setSize(`${px.toFixed(1)}px`);
    };
    fit();
    document.fonts?.ready.then(fit);
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, [text, el, maxVw]);
  return size;
}

export default function Hero() {
  const i = useStage();
  const p = pieces[i]!;
  const next = pieces[(i + 1) % N]!;
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const dir = useRef(1);
  const last = useRef(i);
  if (last.current !== i) { dir.current = i > last.current || (last.current === N - 1 && i === 0) ? 1 : -1; last.current = i; }

  // Lean toward the pointer.
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [10, -10]), { stiffness: 120, damping: 14 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-14, 14]), { stiffness: 120, damping: 14 });
  const sx = useSpring(useTransform(mx, [-1, 1], [-18, 18]), { stiffness: 80, damping: 16 });

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const move = (e: PointerEvent) => { mx.set((e.clientX / innerWidth) * 2 - 1); my.set((e.clientY / innerHeight) * 2 - 1); };
    addEventListener("pointermove", move, { passive: true });
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, select, textarea")) return;
      if (e.key === "ArrowRight") stepStage(1);
      if (e.key === "ArrowLeft") stepStage(-1);
    };
    addEventListener("keydown", key);
    return () => { removeEventListener("pointermove", move); removeEventListener("keydown", key); };
  }, [mx, my]);

  useEffect(() => {
    if (paused || reduced) return;
    const t = setTimeout(() => stepStage(1), DWELL);
    return () => clearTimeout(t);
  }, [i, paused, reduced]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) stepStage(1);
    else if (info.offset.x > 60 || info.velocity.x > 400) stepStage(-1);
  };

  const row2 = useRef<HTMLDivElement>(null);
  const size = useFit(p.word, row2, 15.5);

  return (
    <section id="top" className="hero" style={{ ["--accent" as string]: p.accent }} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} aria-roledescription="carousel" aria-label="The Cowboy Series">
      <div className="hero-row hero-row-1">
        <div className="hero-code">
          <Barcode code="OUTTERSPACE-SS26" className="hero-bars" />
          <span className="micro">OS-SS26-{String(i + 1).padStart(3, "0")}</span>
          <span className="micro">Delivering<br />Cowboy Series 2026</span>
        </div>
        <h1 className="hero-cowboy" aria-label={`Cowboy Series: ${p.name}`}>COWBOY</h1>
        <button type="button" className="hero-tile" onClick={() => stepStage(1)} aria-label={`Next: ${next.name}`}>
          <AnimatePresence mode="sync" initial={false}>
            <motion.img key={next.id} src={frontSrc(next.id)} alt="" initial={{ scale: 0.4, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 1.4, opacity: 0 }} transition={{ type: "spring", stiffness: 220, damping: 18 }} />
          </AnimatePresence>
        </button>
      </div>

      <div className="hero-row hero-row-2" ref={row2} style={{ fontSize: size }}>
        <AnimatePresence mode="sync" initial={false}>
          <Word key={p.id} text={p.word} />
        </AnimatePresence>
      </div>

      {/* The piece, on stage */}
      <div className="stage" aria-live="polite">
        <motion.div className="stage-glow" animate={{ backgroundColor: p.accent }} transition={{ duration: 0.8 }} />
        <motion.div className="stage-tilt" style={{ rotateX: rx, rotateY: ry, x: sx }}>
          <AnimatePresence mode="sync" initial={false} custom={dir.current}>
            <motion.img
              key={p.id}
              src={frontSrc(p.id)}
              alt={p.name}
              className={`stage-img stage-${p.kind}`}
              custom={dir.current}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 220, rotate: d * 24, scale: 0.7, filter: "blur(8px)" }),
                show: { opacity: 1, x: 0, rotate: 0, scale: 1, filter: "blur(0px)" },
                leave: (d: number) => ({ opacity: 0, x: d * -260, rotate: d * -18, scale: 0.8, filter: "blur(6px)" }),
              }}
              initial="enter"
              animate="show"
              exit="leave"
              transition={{ type: "spring", stiffness: 140, damping: 17, mass: 0.9 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDragEnd={onDragEnd}
              whileTap={{ scale: 0.97, cursor: "grabbing" }}
              draggable={false}
            />
          </AnimatePresence>
        </motion.div>
        <div className="stage-shadow" />
      </div>

      <div className="hero-row hero-row-3">
        <div className="hero-left">
          <p className="micro hero-pitch">Join the guest list for the first<br />Outterspace pop-up. November 2026.</p>
          <div className="hero-ctas">
            <a href="#guest-list" className="pill">Join the guest list</a>
            <a href="#guest-list" className="circle" aria-label="Go to the guest list form"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg></a>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-arrows">
            <button type="button" className="circle" onClick={() => stepStage(-1)} aria-label="Previous piece"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg></button>
            <button type="button" className="circle circle-ring" onClick={() => stepStage(1)} aria-label="Next piece">
              <svg className="ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22.5" key={`${i}-${paused}`} className={paused || reduced ? "" : "is-running"} style={{ animationDuration: `${DWELL}ms` }} /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
          <span className="micro">Cowboy Series SS26</span>
        </div>
      </div>

      <div className="hero-mid">
        <span className="micro hero-count">{String(i + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={p.id} className="hero-name" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
            <b>{p.name}</b><span>{p.meta}</span>
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="hero-strip" role="tablist" aria-label="Choose a piece">
        {pieces.map((q, k) => (
          <button key={q.id} type="button" role="tab" aria-selected={k === i} aria-label={q.name} className={k === i ? "is-on" : ""} onClick={() => setStage(k)} style={{ ["--a" as string]: q.accent }}>
            <img src={frontSrc(q.id)} alt="" loading={k < 6 ? "eager" : "lazy"} />
          </button>
        ))}
      </div>
    </section>
  );
}
