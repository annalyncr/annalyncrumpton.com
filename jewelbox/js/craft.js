// =====================================================================
// craft.js: small shared helpers for the handmade look.
// Right now: ransom-note letters. The Cover text tool will reuse this.
// =====================================================================

window.JB = window.JB || {};

// A "seeded" random number generator: give it the same seed text and it
// produces the same sequence of numbers every time. That way "jewelbox"
// always gets the same cut-out letters instead of reshuffling on every load.
JB.seededRandom = function (seedText) {
  let h = 2166136261;
  for (const ch of String(seedText)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return function () {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // a number from 0 up to (not including) 1
  };
};

// ✂️ The "magazine clippings" each ransom letter is picked from.
// Add, remove, or recolor entries here to change the ransom-note look.
JB.RANSOM_STYLES = [
  { font: '"Abril Fatface", serif',              bg: "#f3ead7", fg: "#1d1b1a" },
  { font: '"Archivo Black", sans-serif',         bg: "#d8473b", fg: "#fff8ec" },
  { font: '"Playfair Display", serif', italic: true, bg: "#e8a6b6", fg: "#3a1d22" },
  { font: '"Rubik Mono One", sans-serif',        bg: "#2c4f7c", fg: "#f7f1e3" },
  { font: '"Special Elite", monospace',          bg: "#ffffff", fg: "#222222" },
  { font: '"Abril Fatface", serif',              bg: "#f2c94c", fg: "#2b2420" },
  { font: '"Archivo Black", sans-serif',         bg: "#141414", fg: "#f6e7a8" },
  { font: '"Courier Prime", monospace',          bg: "#cfe3d4", fg: "#1e3b2c" },
  { font: '"Permanent Marker", cursive',         bg: "#fffdf6", fg: "#c0392b" },
  { font: '"Playfair Display", serif', italic: true, bg: "#f6f0e1", fg: "#2c4f7c" }
];

// Builds ransom-note letters for `text` and returns them, ready to append.
// Each letter is a <span> whose look comes from CSS custom properties
// (--f font, --bg, --fg, --r rotation, --s size) used in styles.css.
JB.makeRansom = function (text, seed) {
  const rand = JB.seededRandom(seed ?? text);
  const pieces = document.createDocumentFragment();

  for (const ch of text) {
    if (ch === " ") {
      const gap = document.createElement("span");
      gap.className = "ransom-space";
      pieces.append(gap);
      continue;
    }
    const style = JB.RANSOM_STYLES[Math.floor(rand() * JB.RANSOM_STYLES.length)];
    const letter = document.createElement("span");
    letter.className = "ransom-letter";
    letter.textContent = rand() < 0.35 ? ch.toUpperCase() : ch;
    letter.style.setProperty("--f", style.font);
    letter.style.setProperty("--bg", style.bg);
    letter.style.setProperty("--fg", style.fg);
    letter.style.setProperty("--r", (rand() * 14 - 7).toFixed(1) + "deg");
    letter.style.setProperty("--s", (0.85 + rand() * 0.3).toFixed(2));
    if (style.italic) letter.style.fontStyle = "italic";
    pieces.append(letter);
  }
  return pieces;
};
