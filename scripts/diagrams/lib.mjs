// Accurate Fritzing-style breadboard diagram engine for EPIC 2026.
// Everything is coordinate-exact: holes, Arduino header pins, component legs,
// and wires all resolve to a shared grid so "which hole" is never ambiguous.

export const W = 1266, H = 861;

// ── Breadboard grid ────────────────────────────────────────────────────────
export const P = 17;            // hole pitch (0.1")
export const COL0X = 96;        // x of column 1
export const COLS = 60;
export const colX = (c) => COL0X + (c - 1) * P;

// row letters top group J..F (near top rail), bottom group E..A (near bottom rail)
export const ROWY = {
  J: 566, I: 583, H: 600, G: 617, F: 634,   // top group (J closest to top rail)
  E: 672, D: 689, C: 706, B: 723, A: 740,   // bottom group
};
// power rails
export const RAILY = { TM: 505, TP: 523, BM: 775, BP: 793 };
export const BB_LEFT = 44, BB_RIGHT = 1176;
export const BB_TOP = 474, BB_BOT = 815;
const COLNUM_TOP_Y = 550, COLNUM_BOT_Y = 758;

// node id for a main-grid hole (top group cols share a net; bottom group share)
export const holeNode = (col, row) => (['J','I','H','G','F'].includes(row) ? 'T' : 'B') + col;
// resolve a hole reference like "J30" or a rail ref to {x,y,node}
export function hole(ref) {
  const m = /^([A-J])(\d+)$/.exec(ref);
  if (m) { const row = m[1], col = +m[2]; return { x: colX(col), y: ROWY[row], node: holeNode(col, row) }; }
  const r = /^(TP|TM|BP|BM):(\d+)$/.exec(ref);
  if (r) { const rail = r[1], col = +r[2]; return { x: colX(col), y: RAILY[rail], node: rail }; }
  throw new Error('bad hole ref ' + ref);
}

// ── Arduino UNO header pins ────────────────────────────────────────────────
// board box
export const BOARD = { x: 150, y: 20, w: 604, h: 322, r: 12 };
const TOP_HDR_Y = 58;          // digital header hole row
const BOT_HDR_Y = 306;         // power+analog header hole row
const _pins = {};
(function buildPins() {
  // top header, left→right, with a gap after "8"
  const top = ['AREF','GND1','13','12','~11','~10','~9','8', 'GAP', '7','~6','~5','4','~3','2','TX1','RX0'];
  let x = 356, p = 15.6;
  top.forEach((n) => { if (n === 'GAP') { x += 12; return; } _pins[n] = { x: Math.round(x), y: TOP_HDR_Y }; x += p; });
  // bottom header, left→right: power group, gap, analog group
  const bot = ['IOREF','RESET','3.3V','5V','GND2','GND3','Vin', 'GAP', 'A0','A1','A2','A3','A4','A5'];
  x = 300; p = 15.6;
  bot.forEach((n) => { if (n === 'GAP') { x += 24; return; } _pins[n] = { x: Math.round(x), y: BOT_HDR_Y }; x += p; });
})();
export function pin(name) {
  // analog pins use AN0..AN5 to avoid colliding with breadboard hole refs (A0..A5 = row A)
  const alias = { GND: 'GND2', AN0: 'A0', AN1: 'A1', AN2: 'A2', AN3: 'A3', AN4: 'A4', AN5: 'A5' };
  const key = alias[name] || name;
  if (!_pins[key]) throw new Error('unknown pin ' + name);
  return _pins[key];
}

// ── SVG primitive builders ─────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export function text(x, y, s, { size=13, fill='#111', anchor='middle', weight=400, rot=0, family='Arial, Helvetica, sans-serif' } = {}) {
  const t = rot ? ` transform="rotate(${rot} ${x} ${y})"` : '';
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${t}>${esc(s)}</text>`;
}

// wire: smooth cable with vertical tangents (Fritzing-style) + solder pads
export function wire(aRef, bRef, color, { width = 6, curve = 0.5 } = {}) {
  const a = typeof aRef === 'string' ? resolve(aRef) : aRef;
  const b = typeof bRef === 'string' ? resolve(bRef) : bRef;
  const dx = b.x - a.x, dy = b.y - a.y;
  let d;
  if (Math.abs(dx) >= Math.abs(dy)) {          // horizontal-dominant → horizontal tangents
    const cx = a.x + dx * curve;
    d = `M ${a.x} ${a.y} C ${cx} ${a.y}, ${cx} ${b.y}, ${b.x} ${b.y}`;
  } else {                                       // vertical-dominant → vertical tangents
    const cy = a.y + dy * curve;
    d = `M ${a.x} ${a.y} C ${a.x} ${cy}, ${b.x} ${cy}, ${b.x} ${b.y}`;
  }
  const pad = (p) => `<circle cx="${p.x}" cy="${p.y}" r="3.4" fill="${shade(color,-40)}"/>`;
  return `<g><path d="${d}" fill="none" stroke="${shade(color,-55)}" stroke-width="${width+2}" stroke-linecap="round"/>`
       + `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`
       + pad(a) + pad(b) + `</g>`;
}
// resolve pin name OR hole ref into {x,y}
export function resolve(ref) {
  if (typeof ref !== 'string') return ref;   // already an {x,y} point
  if (/^[A-J]\d+$/.test(ref) || /^(TP|TM|BP|BM):/.test(ref)) return hole(ref);
  return pin(ref);
}

function shade(hex, amt) {
  const c = hex.replace('#',''); const n = parseInt(c.length===3 ? c.split('').map(x=>x+x).join('') : c, 16);
  let r=(n>>16)+amt, g=((n>>8)&255)+amt, b=(n&255)+amt;
  r=Math.max(0,Math.min(255,r)); g=Math.max(0,Math.min(255,g)); b=Math.max(0,Math.min(255,b));
  return `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`;
}
export const COLORS = { red:'#d21f24', black:'#222428', green:'#159a3f', blue:'#1c63d6', yellow:'#e3b006', orange:'#e2731b', purple:'#8b3fd6', teal:'#0f9a8f', white:'#e8e8ea', gnd:'#222428', pwr:'#d21f24' };

// Small "red = 5V, black = GND, colors = signals" key for busy schematics.
export function legend(x, y) {
  const items = [['#d21f24','5V'], ['#222428','GND'], ['#8b3fd6','motor'], ['#159a3f','signal']];
  let g = `<g>`;
  g += `<rect x="${x-8}" y="${y-14}" width="188" height="26" rx="6" fill="#ffffff" stroke="#e0e0e4"/>`;
  let cx = x + 4;
  for (const [col, lbl] of items) {
    g += `<line x1="${cx}" y1="${y-1}" x2="${cx+16}" y2="${y-1}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`;
    g += text(cx + 20, y + 3, lbl, { size: 10, fill: '#333', anchor: 'start', weight: 600 });
    cx += 24 + lbl.length * 6.5 + 8;
  }
  g += `</g>`;
  return g;
}

// component: LED (anode = long leg, cathode = short leg / flat side)
export function led(anodeRef, cathodeRef, color = '#e33') {
  const a = resolve(anodeRef), c = resolve(cathodeRef);
  const cx = (a.x + c.x) / 2;
  const domeY = Math.min(a.y, c.y) - 44;
  return `<g>`
    + `<line x1="${a.x}" y1="${a.y}" x2="${a.x}" y2="${domeY+14}" stroke="#9aa" stroke-width="2.4"/>`
    + `<line x1="${c.x}" y1="${c.y}" x2="${c.x}" y2="${domeY+14}" stroke="#9aa" stroke-width="2.4"/>`
    + `<ellipse cx="${cx}" cy="${domeY}" rx="12" ry="16" fill="${color}" stroke="${shade(color,-50)}" stroke-width="1.5"/>`
    + `<ellipse cx="${cx-4}" cy="${domeY-4}" rx="3.5" ry="6" fill="#fff" opacity="0.55"/>`
    + `</g>`;
}

// component: resistor with 4 color bands, between two refs (any orientation)
export function resistor(aRef, bRef, bands = ['#d21f24','#d21f24','#6b3f14','#c9a227']) {
  const a = resolve(aRef), b = resolve(bRef);
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const len = Math.hypot(b.x-a.x, b.y-a.y);
  const bodyLen = 34, bw = 11;
  const cx = (a.x+b.x)/2, cy=(a.y+b.y)/2, deg = ang*180/Math.PI;
  let g = `<g transform="rotate(${deg} ${cx} ${cy})">`;
  g += `<line x1="${cx-len/2}" y1="${cy}" x2="${cx+len/2}" y2="${cy}" stroke="#9aa" stroke-width="2.4"/>`;
  g += `<rect x="${cx-bodyLen/2}" y="${cy-bw/2}" width="${bodyLen}" height="${bw}" rx="4" fill="#d8b98c" stroke="#a5824f" stroke-width="1"/>`;
  bands.forEach((col,i)=>{ const bx = cx-bodyLen/2+7+i*6.5; g += `<rect x="${bx}" y="${cy-bw/2}" width="3" height="${bw}" fill="${col}"/>`; });
  g += `</g>`;
  return g;
}
