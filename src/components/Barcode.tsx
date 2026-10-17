// A barcode drawn from a string, so every code on the page is the same each time and looks like a real label.

export default function Barcode({ code, className = "" }: { code: string; className?: string }) {
  let seed = [...code].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  while (x < 96) {
    const w = [1, 1, 1.5, 2, 3][Math.floor(rnd() * 5)]!;
    bars.push({ x, w });
    x += w + [1, 1.5, 2][Math.floor(rnd() * 3)]!;
  }
  return (
    <svg className={className} viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0" y="0" width="100" height="34" fill="#fff" />
      {bars.map((b, i) => <rect key={i} x={b.x + 2} y={2} width={b.w} height={i % 9 === 0 ? 30 : 26} fill="#0d0d0d" />)}
    </svg>
  );
}
