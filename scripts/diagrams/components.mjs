// Sensor/actuator module glyphs. Each returns { svg, at } where at(name)
// gives the {x,y} of a labeled pin so wires attach to exact points.
import { text } from './lib.mjs';

const esc = (s) => String(s);

// A rectangular PCB module with a row of labeled header pins on one edge.
// pins: [{name, label, color?}]  side: 'top' | 'bottom' | 'left' | 'right'
export function module({ x, y, w, h, fill = '#14663f', stroke, label, sub, pins = [], side = 'top', pinInset = 16 }) {
  stroke = stroke || shade(fill, -40);
  const at = {};
  let g = `<g>`;
  g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  g += `<rect x="${x+4}" y="${y+4}" width="${w-8}" height="${h-8}" rx="5" fill="none" stroke="${shade(fill,25)}" stroke-width="1" opacity="0.5"/>`;

  const n = pins.length;
  const along = (side === 'top' || side === 'bottom') ? w : h;
  const span = along - pinInset * 2;
  const step = n > 1 ? span / (n - 1) : 0;
  const black = `<rect x="${side==='top'?x+8:side==='bottom'?x+8:side==='left'?x:x+w-14}" y="${side==='left'?y+8:side==='right'?y+8:side==='top'?y:y+h-14}" width="${(side==='top'||side==='bottom')?w-16:14}" height="${(side==='left'||side==='right')?h-16:14}" rx="3" fill="#111318"/>`;
  g += black;

  pins.forEach((p, i) => {
    let px, py;
    if (side === 'top')    { px = x + pinInset + step * i; py = y + 7; }
    if (side === 'bottom') { px = x + pinInset + step * i; py = y + h - 7; }
    if (side === 'left')   { px = x + 7; py = y + pinInset + step * i; }
    if (side === 'right')  { px = x + w - 7; py = y + pinInset + step * i; }
    at[p.name] = { x: Math.round(px), y: Math.round(py) };
    g += `<circle cx="${px}" cy="${py}" r="4.4" fill="#d9dbde" stroke="#222" stroke-width="1"/>`;
    g += `<circle cx="${px}" cy="${py}" r="1.8" fill="#111"/>`;
    // label just inside the module
    const lx = (side === 'left') ? px + 14 : (side === 'right') ? px - 14 : px;
    const ly = (side === 'top') ? py + 20 : (side === 'bottom') ? py - 14 : py + 3;
    const anchor = (side === 'left') ? 'start' : (side === 'right') ? 'end' : 'middle';
    if (p.label) g += text(lx, ly, p.label, { size: 11, fill: '#eef', anchor, weight: 700 });
  });

  const lcx = side === 'left' ? x + w/2 + 14 : x + w/2;
  if (label) g += text(lcx, y + 24, label, { size: 15, fill: '#eaf3ee', weight: 800 });
  if (sub)   g += text(lcx, y + 40, sub, { size: 10, fill: '#cde', weight: 400 });
  g += `</g>`;
  return { svg: g, at: (name) => at[name] };
}

// round two-leg part (buzzer) with legs pointing UP toward the board.
export function disc({ x, y, r = 34, fill = '#1b1d22', label, legspan = 24 }) {
  const at = { '+': { x: x - legspan/2, y: y - r - 30 }, '-': { x: x + legspan/2, y: y - r - 30 } };
  let g = `<g>`;
  g += `<line x1="${at['+'].x}" y1="${at['+'].y}" x2="${x-legspan/2}" y2="${y-r+4}" stroke="#c33" stroke-width="2.6"/>`;
  g += `<line x1="${at['-'].x}" y1="${at['-'].y}" x2="${x+legspan/2}" y2="${y-r+4}" stroke="#333" stroke-width="2.6"/>`;
  g += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#000" stroke-width="1.5"/>`;
  g += `<circle cx="${x}" cy="${y}" r="${r*0.5}" fill="${shade(fill,20)}"/>`;
  g += `<circle cx="${x}" cy="${y}" r="3" fill="#0a0a0a"/>`;
  g += text(x - legspan/2, y - r - 36, '+', { size: 13, fill: '#c33', weight: 800 });
  g += text(x + legspan/2, y - r - 36, '−', { size: 13, fill: '#555', weight: 800 });
  if (label) g += text(x, y + r + 20, label, { size: 12, fill: '#333', weight: 700 });
  g += `</g>`;
  return { svg: g, at: (n) => at[n] };
}

// 16-pin DIP (L293D) straddling the center ravine at leftmost column c0.
// hole(k) → a free breadboard hole (string ref) electrically on chip pin k.
import { colX, ROWY } from './lib.mjs';
export function dip16(c0, label = 'L293D') {
  const x0 = colX(c0) - 9, x1 = colX(c0 + 7) + 9;
  const yT = ROWY.F - 8, yB = ROWY.E + 8, midY = (yT + yB) / 2;
  let g = `<g>`;
  g += `<rect x="${x0}" y="${yT}" width="${x1-x0}" height="${yB-yT}" rx="4" fill="#17181c" stroke="#000" stroke-width="1.5"/>`;
  // pin-1 end marker: half-circle notch on the LEFT edge + a dot by pin 1
  g += `<path d="M ${x0} ${midY-8} A 8 8 0 0 1 ${x0} ${midY+8}" fill="#0a0a0a"/>`;
  g += `<circle cx="${colX(c0)}" cy="${yB-7}" r="2.6" fill="#cfd2d6"/>`;
  g += text((x0+x1)/2, midY + 4, label, { size: 12, fill: '#cfd2d6', weight: 700 });
  const hole = (k) => (k <= 8) ? ('D' + (c0 + k - 1)) : ('G' + (c0 + (16 - k)));
  // pin stubs + printed pin numbers (bottom 1-8 left→right, top 9-16 right→left)
  for (let k = 1; k <= 8; k++) {
    const px = colX(c0 + k - 1);
    g += `<line x1="${px}" y1="${yB}" x2="${px}" y2="${ROWY.E}" stroke="#aaa" stroke-width="2"/>`;
    g += text(px, yB - 4, String(k), { size: 7, fill: '#c8ccd0', weight: 700 });
  }
  for (let k = 9; k <= 16; k++) {
    const px = colX(c0 + 16 - k);
    g += `<line x1="${px}" y1="${yT}" x2="${px}" y2="${ROWY.F}" stroke="#aaa" stroke-width="2"/>`;
    g += text(px, yT + 10, String(k), { size: 7, fill: '#c8ccd0', weight: 700 });
  }
  g += `</g>`;
  return { svg: g, hole };
}

export function motorGlyph(x, y, r = 30) {
  const at = { a: { x: x - 12, y: y + r + 20 }, b: { x: x + 12, y: y + r + 20 } };
  let g = `<g>`;
  g += `<line x1="${at.a.x}" y1="${at.a.y}" x2="${x-12}" y2="${y+r-4}" stroke="#9aa" stroke-width="2.4"/>`;
  g += `<line x1="${at.b.x}" y1="${at.b.y}" x2="${x+12}" y2="${y+r-4}" stroke="#9aa" stroke-width="2.4"/>`;
  g += `<circle cx="${x}" cy="${y}" r="${r}" fill="#c9ccd1" stroke="#6a6d73" stroke-width="2"/>`;
  g += text(x, y + 6, 'M', { size: 22, fill: '#333', weight: 800 });
  g += `<rect x="${x+r-4}" y="${y-8}" width="16" height="16" rx="2" fill="#8a8d93"/>`;
  g += `</g>`;
  return { svg: g, at: (n) => at[n] };
}

// 16x2 LCD with a 16-pin header along the top edge.
export function lcd16({ x, y, w = 340, h = 130 }) {
  const names = ['VSS','VDD','V0','RS','RW','E','D0','D1','D2','D3','D4','D5','D6','D7','A','K'];
  const at = {}; let g = `<g>`;
  g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#1c6b3a" stroke="#0d3d20" stroke-width="2"/>`;
  g += `<rect x="${x+22}" y="${y+34}" width="${w-44}" height="${h-52}" rx="4" fill="#8fc63d"/>`;
  g += text(x + w/2, y + h/2 + 8, 'Hello, EPIC!', { size: 15, fill: '#123', weight: 700 });
  const n = names.length, step = (w - 40) / (n - 1);
  names.forEach((nm, i) => { const px = x + 20 + step * i, py = y + 8; at[nm] = { x: Math.round(px), y: py };
    g += `<circle cx="${px}" cy="${py}" r="3.6" fill="#d9dbde" stroke="#222"/>`;
    g += text(px, py - 7, nm, { size: 7, fill: '#cfe', rot: -90, anchor: 'start' }); });
  g += `</g>`;
  return { svg: g, at: (nm) => at[nm] };
}

function shade(hex, amt) {
  const c = hex.replace('#',''); const n = parseInt(c.length===3 ? c.split('').map(x=>x+x).join('') : c, 16);
  let r=(n>>16)+amt, g=((n>>8)&255)+amt, b=(n&255)+amt;
  r=Math.max(0,Math.min(255,r)); g=Math.max(0,Math.min(255,g)); b=Math.max(0,Math.min(255,b));
  return `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`;
}
