// The Outterspace Cowboy Series SS26. The site shows the collection to bring people onto the pop-up guest list, so it
// carries names, a short headline word for the hero and an accent colour per piece; no prices.
// Cutouts are in /public/garments, campaign photos in /public/editorial, all from outterspaceluxury.com.

export type Kind = "top" | "pant" | "cap";

export type Piece = {
  id: string;
  name: string;
  /** The word set huge in the hero while this piece is in the middle. */
  word: string;
  meta: string;
  kind: Kind;
  accent: string;
  back?: boolean;
};

export const SHOP = "https://www.outterspaceluxury.com";
export const frontSrc = (id: string) => `/garments/${id}-front.webp`;
export const backSrc = (id: string) => `/garments/${id}-back.webp`;

export const pieces: Piece[] = [
  { id: "rangers", name: "Rangers – Black", word: "RANGERS", meta: "Rope script and rearing horses", kind: "top", accent: "#ff4b1f" },
  { id: "equis-rodeo", name: "Equis Rodeo Shirt", word: "EQUIS", meta: "A cowboy on the front, boots on the back", kind: "top", accent: "#ff7eb0", back: true },
  { id: "frontier", name: "Frontier", word: "FRONTIER", meta: "Rodeo rider graphic tee", kind: "top", accent: "#2747b8" },
  { id: "starwave-hat", name: "Starwave Cap", word: "STARWAVE", meta: "Pearl-trimmed waves", kind: "cap", accent: "#5cbcff", back: true },
  { id: "black-embellish-cowboy-shirt", name: "Black Embellish Cowboy Shirt", word: "EMBELLISH", meta: "Studded collar, horseshoe back", kind: "top", accent: "#8c96a3", back: true },
  { id: "coballo", name: "Caballo Denim Jort", word: "CABALLO", meta: "Embellished denim, horse embroidery", kind: "pant", accent: "#7fb3e3", back: true },
  { id: "lago-di-como", name: "Lago di Como", word: "LAGO", meta: "Mock-neck tee, splash graphic", kind: "top", accent: "#22a7d8" },
  { id: "western-romance", name: "Western Romance Shirt", word: "ROMANCE", meta: "Embroidered roses, studded yoke", kind: "top", accent: "#f0b81f", back: true },
  { id: "altoro-black-pants", name: "Altoro Black Pants", word: "ALTORO", meta: "Cowboy and horses up the leg", kind: "pant", accent: "#e2412a", back: true },
  { id: "cowboy-patch", name: "Cowboy Patch", word: "PATCH", meta: "Embroidered patches", kind: "top", accent: "#ff4b1f" },
  { id: "outfield-mirage", name: "Outfield Mirage", word: "MIRAGE", meta: "Varsity-trim tee", kind: "top", accent: "#2f5bd8" },
  { id: "admiral", name: "Admiral", word: "ADMIRAL", meta: "Studded cap, silver flowers", kind: "cap", accent: "#4cbf2a", back: true },
  { id: "pearl-reglan", name: "Pearl Reglan", word: "PEARL", meta: "Raglan tee, OUTTERSPACE Paris", kind: "top", accent: "#4cbf2a" },
  { id: "the-entourage", name: "The Entourage Pants", word: "ENTOURAGE", meta: "Embroidered riders", kind: "pant", accent: "#c4935f", back: true },
  { id: "rangers-white", name: "Rangers – White", word: "RANGERS", meta: "Rope script and rearing horses", kind: "top", accent: "#d99a1e" },
  { id: "nocta-flare-pant", name: "Noctra Flare Pant", word: "NOCTRA", meta: "OUTTERSPACE down the leg", kind: "pant", accent: "#6b4bff" },
  { id: "outterspace-symbol-shirt", name: "Outterspace Symbol Shirt", word: "SYMBOL", meta: "London, England script", kind: "top", accent: "#ff4b1f" },
];

export const byId = Object.fromEntries(pieces.map((p) => [p.id, p])) as Record<string, Piece>;

/** The lookbook. The first looks are open to everyone; the rest open when you join the guest list. */
export const looks = [
  { src: "/editorial/hero-3.webp", id: "cowboy-patch", alt: "Model tipping a studded cap in the Cowboy Patch tee" },
  { src: "/editorial/look-embellish.webp", id: "black-embellish-cowboy-shirt", alt: "Black Embellish Cowboy Shirt worn with the Caballo jort" },
  { src: "/editorial/look-admiral-profile.webp", id: "admiral", alt: "Profile of a model in the Admiral cap" },
  { src: "/editorial/look-equis-back.webp", id: "equis-rodeo", alt: "The back of the Equis Rodeo Shirt" },
  { src: "/editorial/hero-2.webp", id: "rangers", alt: "Model leaning forward in the Rangers – Black tee" },
  { src: "/editorial/look-caballo.webp", id: "coballo", alt: "Close on the Caballo Denim Jort" },
  { src: "/editorial/look-frontier.webp", id: "frontier", alt: "Model in the navy Frontier tee" },
  { src: "/editorial/look-starwave.webp", id: "starwave-hat", alt: "Profile of a model in the Starwave Cap" },
  { src: "/editorial/look-altoro.webp", id: "altoro-black-pants", alt: "Close on the embroidered Altoro Black Pants" },
].map((l, i) => ({ ...l, n: String(i + 1).padStart(2, "0"), piece: byId[l.id]! }));

export const OPEN_LOOKS = 3;
