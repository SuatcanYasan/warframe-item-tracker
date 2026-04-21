function lighten(hex, amt = 48) {
  const clean = (hex || "#CA8A04").replace("#", "");
  const num = parseInt(clean.padEnd(6, "0").slice(0, 6), 16);
  const r = Math.min(255, (num >> 16) + amt);
  const g = Math.min(255, ((num >> 8) & 0xff) + amt);
  const b = Math.min(255, (num & 0xff) + amt);
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

function cursor(svg, hotspot) {
  const encoded = encodeURIComponent(svg).replace(/'/g, "%27").replace(/"/g, "%22");
  return `url("data:image/svg+xml,${encoded}") ${hotspot}`;
}

export function generateCursorVars(primaryColor) {
  const p = primaryColor || "#CA8A04";
  const pLight = lighten(p, 56);
  const red = "#EF4444";

  return {
    "--cur-default": cursor(
      `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><path d='M4 3 L4 22 L10 17 L14 26 L18 24 L14 15 L22 15 Z' fill='${p}' stroke='%23000' stroke-width='1.5' stroke-linejoin='round' stroke-linecap='round'/><path d='M4 3 L4 22 L10 17 L14 26 L18 24 L14 15 L22 15 Z' fill='${pLight}' opacity='0.35'/></svg>`,
      "3 3",
    ),
    "--cur-pointer": cursor(
      `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'><circle cx='13' cy='13' r='10' fill='none' stroke='${p}' stroke-width='2'/><circle cx='13' cy='13' r='2.5' fill='${p}'/><line x1='13' y1='1' x2='13' y2='5' stroke='${p}' stroke-width='2' stroke-linecap='round'/><line x1='13' y1='21' x2='13' y2='25' stroke='${p}' stroke-width='2' stroke-linecap='round'/><line x1='1' y1='13' x2='5' y2='13' stroke='${p}' stroke-width='2' stroke-linecap='round'/><line x1='21' y1='13' x2='25' y2='13' stroke='${p}' stroke-width='2' stroke-linecap='round'/></svg>`,
      "13 13",
    ),
    "--cur-text": cursor(
      `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='24' viewBox='0 0 16 24'><line x1='8' y1='3' x2='8' y2='21' stroke='${p}' stroke-width='2' stroke-linecap='round'/><line x1='4' y1='3' x2='12' y2='3' stroke='${p}' stroke-width='2' stroke-linecap='round'/><line x1='4' y1='21' x2='12' y2='21' stroke='${p}' stroke-width='2' stroke-linecap='round'/></svg>`,
      "8 12",
    ),
    "--cur-move": cursor(
      `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><g stroke='${p}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='none'><path d='M14 3 L14 25 M3 14 L25 14'/><polyline points='10,7 14,3 18,7'/><polyline points='10,21 14,25 18,21'/><polyline points='7,10 3,14 7,18'/><polyline points='21,10 25,14 21,18'/></g></svg>`,
      "14 14",
    ),
    "--cur-grab": cursor(
      `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><g stroke='${p}' stroke-width='2.5' stroke-linecap='round'><line x1='10' y1='9' x2='10' y2='19'/><line x1='14' y1='9' x2='14' y2='19'/><line x1='18' y1='9' x2='18' y2='19'/></g></svg>`,
      "14 14",
    ),
    "--cur-grabbing": cursor(
      `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><circle cx='14' cy='14' r='9' fill='none' stroke='${p}' stroke-width='1.5' opacity='0.5'/><g stroke='${pLight}' stroke-width='3' stroke-linecap='round'><line x1='10' y1='11' x2='10' y2='17'/><line x1='14' y1='11' x2='14' y2='17'/><line x1='18' y1='11' x2='18' y2='17'/></g></svg>`,
      "14 14",
    ),
    "--cur-crosshair": cursor(
      `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><line x1='12' y1='0' x2='12' y2='24' stroke='${p}' stroke-width='2'/><line x1='0' y1='12' x2='24' y2='12' stroke='${p}' stroke-width='2'/><circle cx='12' cy='12' r='1.5' fill='${p}'/></svg>`,
      "12 12",
    ),
    "--cur-help": cursor(
      `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'><circle cx='13' cy='13' r='10' fill='none' stroke='${p}' stroke-width='2'/><path d='M9.5 10 Q13 6 16.5 10 Q16.5 13 13 14 L13 16' fill='none' stroke='${p}' stroke-width='2' stroke-linecap='round'/><circle cx='13' cy='19' r='1.2' fill='${p}'/></svg>`,
      "13 13",
    ),
    "--cur-wait": cursor(
      `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'><circle cx='13' cy='13' r='10' fill='none' stroke='${p}' stroke-width='2.2' stroke-dasharray='4 3'/><circle cx='13' cy='13' r='2.5' fill='${p}'/></svg>`,
      "13 13",
    ),
    "--cur-not-allowed": cursor(
      `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'><circle cx='13' cy='13' r='10' fill='none' stroke='${red}' stroke-width='2.5'/><line x1='7' y1='7' x2='19' y2='19' stroke='${red}' stroke-width='2.5' stroke-linecap='round'/><line x1='19' y1='7' x2='7' y2='19' stroke='${red}' stroke-width='2.5' stroke-linecap='round'/></svg>`,
      "13 13",
    ),
    "--cur-zoom-in": cursor(
      `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><circle cx='10' cy='10' r='7' fill='none' stroke='${p}' stroke-width='2'/><line x1='10' y1='7' x2='10' y2='13' stroke='${p}' stroke-width='2' stroke-linecap='round'/><line x1='7' y1='10' x2='13' y2='10' stroke='${p}' stroke-width='2' stroke-linecap='round'/><line x1='15' y1='15' x2='25' y2='25' stroke='${p}' stroke-width='2.5' stroke-linecap='round'/></svg>`,
      "10 10",
    ),
    "--cur-zoom-out": cursor(
      `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><circle cx='10' cy='10' r='7' fill='none' stroke='${p}' stroke-width='2'/><line x1='7' y1='10' x2='13' y2='10' stroke='${p}' stroke-width='2' stroke-linecap='round'/><line x1='15' y1='15' x2='25' y2='25' stroke='${p}' stroke-width='2.5' stroke-linecap='round'/></svg>`,
      "10 10",
    ),
    "--cur-col-resize": cursor(
      `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='20' viewBox='0 0 26 20'><g stroke='${p}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='none'><line x1='4' y1='10' x2='22' y2='10'/><polyline points='8,6 4,10 8,14'/><polyline points='18,6 22,10 18,14'/></g></svg>`,
      "13 10",
    ),
    "--cur-row-resize": cursor(
      `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='26' viewBox='0 0 20 26'><g stroke='${p}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='none'><line x1='10' y1='4' x2='10' y2='22'/><polyline points='6,8 10,4 14,8'/><polyline points='6,18 10,22 14,18'/></g></svg>`,
      "10 13",
    ),
  };
}

export function applyCursorVars(primaryColor) {
  if (typeof document === "undefined") return;
  const vars = generateCursorVars(primaryColor);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
  // Browsers cache rendered cursor bitmaps aggressively — when only the CSS
  // variable changes, the visible cursor sometimes keeps the old image until
  // the pointer moves. Force the browser to repick by toggling body cursor
  // briefly; next pointer event picks up the new SVG.
  if (document.body) {
    const prev = document.body.style.cursor;
    document.body.style.cursor = "auto";
    // Double rAF so the toggle is real
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.style.cursor = prev;
      });
    });
  }
}
