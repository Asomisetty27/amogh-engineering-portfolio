// Static scenery: the Arduino UNO R3 board and the full breadboard.
import { W, H, P, COL0X, COLS, colX, ROWY, RAILY, BOARD, BB_LEFT, BB_RIGHT, BB_TOP, BB_BOT, text } from './lib.mjs';

const hole = (x, y, r = 2.3, fill = '#2b2b2f') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const sq = (x, y, s = 4.2, fill = '#3a3a3f') => `<rect x="${x - s/2}" y="${y - s/2}" width="${s}" height="${s}" rx="1" fill="${fill}"/>`;

export function drawBreadboard() {
  let g = `<g>`;
  // body
  g += `<rect x="${BB_LEFT}" y="${BB_TOP}" width="${BB_RIGHT-BB_LEFT}" height="${BB_BOT-BB_TOP}" rx="10" fill="#f4f1ea" stroke="#cfc9ba" stroke-width="2"/>`;
  // center ravine
  const ravY = (ROWY.F + ROWY.E) / 2;
  g += `<rect x="${BB_LEFT+6}" y="${ravY-7}" width="${BB_RIGHT-BB_LEFT-12}" height="14" fill="#e7e2d6"/>`;

  // power rail lines (red +, blue -)
  const railLine = (y, color) => `<line x1="${BB_LEFT+18}" y1="${y}" x2="${BB_RIGHT-18}" y2="${y}" stroke="${color}" stroke-width="2"/>`;
  g += railLine(RAILY.TM - 12, '#2f6fd0');   // top minus line (blue) above holes
  g += railLine(RAILY.TP + 12, '#d23a3a');   // top plus line (red) below holes
  g += railLine(RAILY.BM - 12, '#2f6fd0');
  g += railLine(RAILY.BP + 12, '#d23a3a');
  // rail +/- symbols
  const sym = (x, y, s, color) => text(x, y, s, { size: 15, fill: color, weight: 700 });
  g += sym(BB_LEFT+8, RAILY.TM+5, '−', '#2f6fd0') + sym(BB_RIGHT-8, RAILY.TM+5, '−', '#2f6fd0');
  g += sym(BB_LEFT+8, RAILY.TP+5, '+', '#d23a3a') + sym(BB_RIGHT-8, RAILY.TP+5, '+', '#d23a3a');
  g += sym(BB_LEFT+8, RAILY.BM+5, '−', '#2f6fd0') + sym(BB_RIGHT-8, RAILY.BM+5, '−', '#2f6fd0');
  g += sym(BB_LEFT+8, RAILY.BP+5, '+', '#d23a3a') + sym(BB_RIGHT-8, RAILY.BP+5, '+', '#d23a3a');

  // rail holes — groups of 5 with a gap, aligned under columns 2..59
  for (const railY of [RAILY.TM, RAILY.TP, RAILY.BM, RAILY.BP]) {
    for (let c = 2; c <= COLS - 1; c++) {
      if (c % 6 === 1) continue; // create visual grouping gaps
      g += sq(colX(c), railY);
    }
  }

  // column numbers (1,5,10,...,60)
  for (let c = 1; c <= COLS; c++) {
    if (c === 1 || c % 5 === 0) {
      g += text(colX(c), 550, String(c), { size: 10, fill: '#9a9384' });
      g += text(colX(c), 758, String(c), { size: 10, fill: '#9a9384' });
    }
  }
  // row letters
  const rows = ['J','I','H','G','F','E','D','C','B','A'];
  for (const r of rows) {
    g += text(BB_LEFT+22, ROWY[r]+4, r, { size: 10, fill: '#9a9384' });
    g += text(BB_RIGHT-22, ROWY[r]+4, r, { size: 10, fill: '#9a9384' });
  }
  // main grid holes
  for (let c = 1; c <= COLS; c++) for (const r of rows) g += sq(colX(c), ROWY[r]);

  g += `</g>`;
  return g;
}

export function drawBoard() {
  const b = BOARD;
  let g = `<g>`;
  // PCB
  g += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${b.r}" fill="#0d6b8a" stroke="#0a4f66" stroke-width="2"/>`;
  g += `<rect x="${b.x+6}" y="${b.y+6}" width="${b.w-12}" height="${b.h-12}" rx="${b.r-3}" fill="none" stroke="#2a8aa8" stroke-width="1" opacity="0.5"/>`;
  // USB (silver) top-left
  g += `<rect x="${b.x-14}" y="${b.y+40}" width="60" height="52" rx="4" fill="#b9bcc2" stroke="#8a8d93" stroke-width="1.5"/>`;
  // barrel jack (black) bottom-left
  g += `<rect x="${b.x-10}" y="${b.y+150}" width="52" height="40" rx="8" fill="#1b1d22" stroke="#000" stroke-width="1"/>`;
  // main IC
  g += `<rect x="${b.x+150}" y="${b.y+150}" width="150" height="46" rx="3" fill="#15171b"/>`;
  g += `<circle cx="${b.x+160}" cy="${b.y+173}" r="4" fill="#2a2c30"/>`;
  // reset + small ICs
  g += `<circle cx="${b.x+250}" cy="${b.y+40}" r="7" fill="#c0392b"/>`;
  g += `<rect x="${b.x+70}" y="${b.y+150}" width="34" height="34" rx="2" fill="#15171b"/>`;
  // logo text
  g += text(b.x+300, b.y+118, 'ELEGOO', { size: 30, fill: '#fff', weight: 800, family: 'Arial Black, Arial, sans-serif' });
  g += text(b.x+300, b.y+142, 'UNO R3', { size: 15, fill: '#dfe7ea', weight: 700 });
  // mounting holes
  for (const [mx,my] of [[b.x+18,b.y+80],[b.x+b.w-24,b.y+40],[b.x+b.w-24,b.y+h0(b)],[b.x+250,b.y+b.h-18]]) g += `<circle cx="${mx}" cy="${my}" r="6" fill="#eef2f3" stroke="#9aa" stroke-width="1"/>`;

  // header strips
  g += `<rect x="${b.x+70}" y="${b.y+30}" width="${b.w-150}" height="24" rx="3" fill="#111318"/>`;
  g += `<rect x="${b.x+30}" y="${b.y+b.h-42}" width="${b.w-80}" height="24" rx="3" fill="#111318"/>`;

  // header pins with vertical labels placed clear of the black strip
  const drawPins = (names, xs, y, labelY, fill) => {
    names.forEach((n, i) => {
      const x = xs[i];
      g += `<circle cx="${x}" cy="${y}" r="4.6" fill="#e6e8ea" stroke="#2a2a2a" stroke-width="1"/>`;
      g += `<circle cx="${x}" cy="${y}" r="1.8" fill="#111"/>`;
      g += text(x + 3, labelY, n, { size: 9.5, fill, rot: -90, anchor: labelY < y ? 'start' : 'end' });
    });
  };
  // rebuild the same x positions used in lib.mjs pin()
  const topNames = ['AREF','GND','13','12','~11','~10','~9','8','7','~6','~5','4','~3','2','TX1','RX0'];
  const topXs = []; { let x=356,p=15.6; ['AREF','GND1','13','12','~11','~10','~9','8','GAP','7','~6','~5','4','~3','2','TX1','RX0'].forEach(n=>{ if(n==='GAP'){x+=12;return;} topXs.push(Math.round(x)); x+=p; }); }
  drawPins(topNames, topXs, 58, 46, "#f2f6f8");
  const botNames = ['IOREF','RESET','3.3V','5V','GND','GND','Vin','A0','A1','A2','A3','A4','A5'];
  const botXs = []; { let x=300,p=15.6; ['IOREF','RESET','3.3V','5V','GND2','GND3','Vin','GAP','A0','A1','A2','A3','A4','A5'].forEach(n=>{ if(n==='GAP'){x+=24;return;} botXs.push(Math.round(x)); x+=p; }); }
  drawPins(botNames, botXs, 306, 352, "#3a3a3f");

  g += `</g>`;
  return g;
}
function h0(b){ return b.y+40; }

export function frame(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
    + `<rect width="${W}" height="${H}" fill="#ffffff"/>`
    + `<rect x="4" y="4" width="${W-8}" height="${H-8}" rx="14" fill="#fbfbfc" stroke="#e5e5e8" stroke-width="2"/>`
    + inner + `</svg>`;
}
