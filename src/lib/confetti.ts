// A short burst of confetti and stars in the collection's colours, for the moment someone joins the guest list.
// Drawn on a throwaway canvas that removes itself; skipped for anyone who asks for reduced motion.

export function burst(colors: string[]) {
  if (typeof window === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas");
  const dpr = Math.min(2, devicePixelRatio || 1);
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  Object.assign(c.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "100" });
  document.body.append(c);
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  type P = { x: number; y: number; vx: number; vy: number; r: number; vr: number; s: number; c: string; star: boolean };
  const parts: P[] = [];
  for (let k = 0; k < 170; k++) {
    const fromLeft = k % 2 === 0;
    parts.push({
      x: fromLeft ? -10 : innerWidth + 10, y: innerHeight * (0.55 + Math.random() * 0.3),
      vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 9), vy: -(10 + Math.random() * 12),
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4, s: 6 + Math.random() * 8,
      c: colors[k % colors.length]!, star: Math.random() < 0.3,
    });
  }
  const star = (s: number) => {
    g.beginPath();
    for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5; const rr = k % 2 ? s * 0.42 : s; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.closePath(); g.fill();
  };
  const start = performance.now();
  const tick = (now: number) => {
    const t = (now - start) / 1000;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.42; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.globalAlpha = Math.max(0, 1 - (t - 1.8) / 1.2);
      if (p.star) star(p.s * 0.8); else g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      g.restore();
    }
    if (t < 3) requestAnimationFrame(tick); else c.remove();
  };
  requestAnimationFrame(tick);
}
