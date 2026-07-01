// Per-exercise scenes. Each returns { bb, fg }: bb=false hides the breadboard
// (module wiring), fg is the foreground SVG. All endpoints resolve to exact
// Arduino pins / breadboard holes.
import { wire, led, resistor, text, COLORS, colX, ROWY, RAILY } from './lib.mjs';
import { module, disc, dip16, motorGlyph, lcd16 } from './components.mjs';

const C = COLORS;
const cx = (list) => list.map((c) => wire(c[0], c[1], c[2], c[3])).join('');

// standard module placement (to the right of the board) sized by pin count
function place(nPins, { w = 210, pitch = 34, top = 400 } = {}) {
  const h = (nPins - 1) * pitch + 44;
  return { x: 858, y: top, w, h };
}

export const SCENES = {
  // ── Lesson 3: LED brightness with resistors (reference) ───────────────
  led_resistor() {
    let g = '';
    g += wire('5V', 'TP:8', C.red);
    g += wire('GND', 'TM:11', C.black);
    g += wire('TP:30', 'J30', C.red, { width: 5 });
    g += led('J30', 'J32');
    g += resistor('H32', 'H34', ['#d21f24','#d21f24','#6b3f14','#c9a227']);
    g += wire('J34', 'TM:34', C.blue, { width: 5 });
    g += text(colX(33), ROWY.F + 40, '220Ω', { size: 15, weight: 700 });
    g += spare(880, 300, ['#8a5a2b','#000','#d21f24','#c9a227'], '1K');
    g += spare(880, 360, ['#8a5a2b','#000','#e2731b','#c9a227'], '10K');
    return { bb: true, fg: g };
  },

  // ── Lesson 3: potentiometer fades an LED ──────────────────────────────
  pot() {
    let g = '';
    // potentiometer body sitting across bottom-group cols 8/10/12
    g += potBody(colX(10), ROWY.C - 30, [colX(8), colX(10), colX(12)], ROWY.B);
    g += wire('5V', 'B8', C.red);
    g += wire('AN0', 'B10', C.green);
    g += wire('GND', 'B12', C.black);
    // pin 9 → 220Ω → LED anode ; cathode → GND
    g += wire('~9', 'J38', C.blue);
    g += resistor('J38', 'J40', ['#d21f24','#d21f24','#6b3f14','#c9a227']);
    g += led('J40', 'J42');
    g += wire('J42', 'TM:44', C.black);
    g += wire('GND', 'TM:40', C.black, { curve: 0.6 });
    g += text(colX(39), ROWY.F + 40, '220Ω', { size: 14, weight: 700 });
    return { bb: true, fg: g };
  },

  // ── Lesson 4: RGB LED ─────────────────────────────────────────────────
  rgb() {
    let g = '';
    // common cathode (longest) → GND rail; three colour legs each via 220Ω
    g += rgbLed(colX(20), [colX(18), colX(20), colX(22), colX(24)]); // R,cathode,G,B legs into cols
    // legs: R col18, cathode col20, G col22, B col24
    g += resistor('F18', 'A18', ['#d21f24','#d21f24','#6b3f14','#c9a227']); // R leg down across
    g += resistor('F22', 'A22', ['#d21f24','#d21f24','#6b3f14','#c9a227']);
    g += resistor('F24', 'A24', ['#d21f24','#d21f24','#6b3f14','#c9a227']);
    g += wire('~6', 'A18', C.red);      // red → pin 6
    g += wire('~5', 'A22', C.green);    // green → pin 5
    g += wire('~3', 'A24', C.blue);     // blue → pin 3
    g += wire('J20', 'TM:20', C.black); // cathode → − rail
    g += wire('GND', 'TM:16', C.black);
    return { bb: true, fg: g };
  },

  // ── Lesson 5: two push buttons ────────────────────────────────────────
  digital() {
    let g = '';
    // LED on pin 5 through 220Ω
    g += wire('~5', 'J10', C.green);
    g += resistor('J10', 'J12', ['#d21f24','#d21f24','#6b3f14','#c9a227']);
    g += led('J12', 'J14');
    g += wire('J14', 'TM:16', C.black);
    g += wire('GND', 'TM:12', C.black);
    // two buttons straddling the center gap
    g += button(colX(30));  // legs in F30/F32 (top) and A30/A32 (bottom)
    g += button(colX(40));
    g += wire('~9', 'F30', C.blue);   // button A → pin 9
    g += wire('A30', 'BM:30', C.black);
    g += wire('8', 'F40', C.yellow);  // button B → pin 8
    g += wire('A40', 'BM:40', C.black);
    g += wire('GND', 'BM:24', C.black, { curve: 0.6 });
    g += text(colX(31), ROWY.J - 30, 'A', { size: 13, weight: 700 });
    g += text(colX(41), ROWY.J - 30, 'B', { size: 13, weight: 700 });
    return { bb: true, fg: g };
  },

  // ── Lesson 23: thermistor thermometer (voltage divider) ───────────────
  thermometer() {
    let g = '';
    // thermistor (bead) from +5V column to the A0 junction column
    g += thermistor(colX(20), ROWY.H - 26, [colX(20), colX(24)], ROWY.G);
    g += wire('5V', 'J20', C.red);
    // junction col24 → A0, and 10k from col24 → GND rail
    g += wire('J24', 'AN0', C.green);
    g += resistor('F24', 'A24', ['#8a5a2b','#000','#e2731b','#c9a227']); // 10k across gap
    g += wire('A24', 'BM:24', C.black);
    g += wire('GND', 'BM:20', C.black);
    g += text(colX(22), ROWY.J - 26, 'thermistor', { size: 12, weight: 700 });
    g += text(colX(24) + 40, ROWY.C, '10kΩ', { size: 13, weight: 700 });
    return { bb: true, fg: g };
  },

  // ── module scenes ─────────────────────────────────────────────────────
  water() {
    const b = place(3, { top: 430 });
    const m = module({ ...b, fill: '#7d3b2f', label: 'Water level', sub: 'sensor',
      side: 'left', pins: [{ name: 'S', label: 'S' }, { name: '+', label: '+' }, { name: '-', label: '−' }] });
    return mod(m, [['AN0', m.at('S'), C.green], ['5V', m.at('+'), C.red], ['GND', m.at('-'), C.black]]);
  },
  active_buzzer() {
    const d = disc({ x: 980, y: 560, r: 40, fill: '#1b1d22', label: 'active buzzer (sealed)' });
    return { bb: false, fg: d.svg + cx([['12', d.at('+'), C.red], ['GND', d.at('-'), C.black]]) };
  },
  passive_buzzer() {
    const d = disc({ x: 980, y: 560, r: 40, fill: '#0e5a3a', label: 'passive buzzer (open green)' });
    return { bb: false, fg: d.svg + cx([['8', d.at('+'), C.red], ['GND', d.at('-'), C.black]]) };
  },
  dht11() {
    const b = place(3, { top: 430 });
    const m = module({ ...b, fill: '#2f6fb0', label: 'DHT11', side: 'left',
      pins: [{ name: 'S', label: 'S / DATA' }, { name: '+', label: '+' }, { name: '-', label: '−' }] });
    return mod(m, [['2', m.at('S'), C.green], ['5V', m.at('+'), C.red], ['GND', m.at('-'), C.black]]);
  },
  ultrasonic() {
    const b = place(4, { w: 250, top: 410 });
    const m = module({ ...b, fill: '#2f6fb0', label: 'HC-SR04', side: 'left',
      pins: [{ name: 'VCC', label: 'VCC' }, { name: 'Trig', label: 'Trig' }, { name: 'Echo', label: 'Echo' }, { name: 'GND', label: 'GND' }] });
    // two ultrasonic "eyes"
    const eyes = `<circle cx="${b.x + b.w - 60}" cy="${b.y + 42}" r="26" fill="#20364a" stroke="#0d1b28" stroke-width="2"/>`
               + `<circle cx="${b.x + b.w - 60}" cy="${b.y + b.h - 42}" r="26" fill="#20364a" stroke="#0d1b28" stroke-width="2"/>`;
    return mod(m, [['5V', m.at('VCC'), C.red], ['12', m.at('Trig'), C.yellow], ['~11', m.at('Echo'), C.green], ['GND', m.at('GND'), C.black]], eyes);
  },
  sound() { return soundScene(); },
  sound_sensor() { return soundScene(); },
  joystick() {
    const b = place(5, { w: 200, top: 380 });
    const m = module({ ...b, fill: '#2f6fb0', label: 'Joystick', side: 'left',
      pins: [{ name: 'GND', label: 'GND' }, { name: 'VCC', label: '+5V' }, { name: 'VRx', label: 'VRx' }, { name: 'VRy', label: 'VRy' }, { name: 'SW', label: 'SW' }] });
    const knob = `<circle cx="${b.x + b.w - 52}" cy="${b.y + b.h/2}" r="34" fill="#111318" stroke="#000"/><circle cx="${b.x + b.w - 52}" cy="${b.y + b.h/2}" r="14" fill="#333"/>`;
    return mod(m, [['GND', m.at('GND'), C.black], ['5V', m.at('VCC'), C.red], ['AN0', m.at('VRx'), C.green], ['AN1', m.at('VRy'), C.blue], ['2', m.at('SW'), C.yellow]], knob);
  },
  ir_receiver() {
    const b = place(3, { top: 430 });
    const m = module({ ...b, fill: '#20232a', label: 'IR receiver', side: 'left',
      pins: [{ name: 'S', label: 'S' }, { name: '+', label: '+' }, { name: '-', label: '−' }] });
    const dome = `<ellipse cx="${b.x + b.w - 46}" cy="${b.y + b.h/2}" rx="18" ry="22" fill="#0a0a0a" stroke="#000"/>`;
    return mod(m, [['~11', m.at('S'), C.green], ['5V', m.at('+'), C.red], ['GND', m.at('-'), C.black]], dome);
  },
  dot_matrix() {
    const b = place(5, { w: 230, top: 380 });
    const m = module({ ...b, fill: '#0f2233', label: '8×8 Matrix', sub: 'MAX7219', side: 'left',
      pins: [{ name: 'VCC', label: 'VCC' }, { name: 'GND', label: 'GND' }, { name: 'DIN', label: 'DIN' }, { name: 'CS', label: 'CS' }, { name: 'CLK', label: 'CLK' }] });
    let grid = '';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) grid += `<circle cx="${b.x + b.w - 96 + c*11}" cy="${b.y + 20 + r*11}" r="3.6" fill="#c0202a" opacity="0.85"/>`;
    return mod(m, [['5V', m.at('VCC'), C.red], ['GND', m.at('GND'), C.black], ['12', m.at('DIN'), C.green], ['~10', m.at('CS'), C.yellow], ['~11', m.at('CLK'), C.blue]], grid);
  },
  rtc() {
    const b = place(5, { w: 240, top: 380 });
    const m = module({ ...b, fill: '#1f6b52', label: 'DS1302 RTC', side: 'left',
      pins: [{ name: 'VCC', label: 'VCC' }, { name: 'GND', label: 'GND' }, { name: 'CLK', label: 'CLK' }, { name: 'DAT', label: 'DAT' }, { name: 'RST', label: 'RST' }] });
    const batt = `<circle cx="${b.x + b.w - 58}" cy="${b.y + b.h/2}" r="34" fill="#c9ccd1" stroke="#8a8d93" stroke-width="2"/><text x="${b.x + b.w - 58}" y="${b.y + b.h/2 + 4}" font-family="Arial" font-size="11" text-anchor="middle" fill="#555">CR2032</text>`;
    return mod(m, [['5V', m.at('VCC'), C.red], ['GND', m.at('GND'), C.black], ['~5', m.at('CLK'), C.blue], ['~6', m.at('DAT'), C.green], ['4', m.at('RST'), C.yellow]], batt);
  },
  keypad() {
    const b = { x: 820, y: 360, w: 300, h: 300 };
    let g = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="8" fill="#15171b" stroke="#000" stroke-width="2"/>`;
    const keys = ['1','2','3','A','4','5','6','B','7','8','9','C','*','0','#','D'];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const kx = b.x + 34 + c * 62, ky = b.y + 30 + r * 56;
      g += `<rect x="${kx-24}" y="${ky-20}" width="48" height="40" rx="6" fill="#2a2d33" stroke="#444"/>`;
      g += text(kx, ky + 6, keys[r*4+c], { size: 15, fill: '#e8e8ea', weight: 700 });
    }
    // 8-pin ribbon header along the bottom edge
    const at = {}; const names = ['R1','R2','R3','R4','C1','C2','C3','C4'];
    names.forEach((n, i) => { const px = b.x + 40 + i * 32, py = b.y + b.h + 6; at[n] = { x: px, y: py };
      g += `<circle cx="${px}" cy="${py}" r="4.4" fill="#d9dbde" stroke="#222"/><text x="${px}" y="${py+18}" font-family="Arial" font-size="9" text-anchor="middle" fill="#333">${n}</text>`; });
    const conns = [['~9','R1',C.green],['8','R2',C.green],['7','R3',C.green],['~6','R4',C.green],
                   ['~5','C1',C.blue],['4','C2',C.blue],['~3','C3',C.blue],['2','C4',C.blue]];
    g += conns.map(([p, k, col]) => wire(p, at[k], col, { curve: 0.55 })).join('');
    return { bb: false, fg: g };
  },
  // ── Lesson 22: 16×2 LCD + contrast pot ────────────────────────────────
  lcd() {
    const L = lcd16({ x: 470, y: 384 });
    let g = L.svg;
    // contrast pot on breadboard cols 6/8/10
    g += potBody(colX(8), ROWY.C - 30, [colX(6), colX(8), colX(10)], ROWY.B);
    g += wire('5V', 'B6', C.red); g += wire('GND', 'B10', C.black);
    g += wire(L.at('V0'), 'B8', C.orange);
    // power + contrast
    g += wire('5V', L.at('VDD'), C.red); g += wire('GND', L.at('VSS'), C.black);
    g += wire('GND', L.at('RW'), C.black); g += wire('5V', L.at('A'), C.red); g += wire('GND', L.at('K'), C.black);
    // control + data lines
    g += wire('12', L.at('RS'), C.green);
    g += wire('~11', L.at('E'), C.yellow);
    g += wire('~5', L.at('D4'), C.blue);
    g += wire('4', L.at('D5'), C.blue);
    g += wire('~3', L.at('D6'), C.blue);
    g += wire('2', L.at('D7'), C.blue);
    return { bb: true, fg: g };
  },

  // ── Lesson 29: DC motor via L293D + speed knob ────────────────────────
  dc_motor() {
    const chip = dip16(24, 'L293D');
    let g = chip.svg;
    const mtr = motorGlyph(colX(40), ROWY.C + 30);
    g += mtr.svg;
    // motor knob (pot) on cols 6/8/10
    g += potBody(colX(8), ROWY.H - 30, [colX(6), colX(8), colX(10)], ROWY.G);
    g += wire('5V', 'J6', C.red); g += wire('GND', 'J10', C.black); g += wire('AN0', 'J8', C.green);
    // chip control
    g += wire('~5', chip.hole(1), C.blue);   // EN1 (speed)
    g += wire('~6', chip.hole(2), C.yellow); // IN1
    g += wire('7',  chip.hole(7), C.orange); // IN2
    g += wire('5V', chip.hole(8), C.red);    // VCC2
    g += wire('5V', chip.hole(16), C.red);   // VCC1
    g += wire(chip.hole(4), 'BM:26', C.black); g += wire(chip.hole(5), 'BM:28', C.black);
    g += wire('GND', 'BM:20', C.black);
    // outputs to motor
    g += wire(chip.hole(3), mtr.at('a'), C.green);
    g += wire(chip.hole(6), mtr.at('b'), C.green);
    return { bb: true, fg: g };
  },

  // ── Final project: LED + LDR controls a motor via L293D ───────────────
  final() {
    const chip = dip16(22, 'L293D');
    let g = chip.svg;
    const mtr = motorGlyph(colX(40), ROWY.C + 30);
    g += mtr.svg;
    // chip power + control
    g += wire('~5', chip.hole(1), C.blue);
    g += wire('~6', chip.hole(2), C.yellow);
    g += wire('7',  chip.hole(7), C.orange);
    g += wire('5V', chip.hole(8), C.red);
    g += wire('5V', chip.hole(16), C.red);
    g += wire(chip.hole(4), 'BM:24', C.black); g += wire(chip.hole(5), 'BM:26', C.black);
    g += wire('GND', 'BM:20', C.black);
    g += wire(chip.hole(3), mtr.at('a'), C.green);
    g += wire(chip.hole(6), mtr.at('b'), C.green);
    // LDR divider: 5V→LDR→A0, 10k A0→GND
    g += thermistor(colX(50), ROWY.H - 26, [colX(50), colX(52)], ROWY.G);
    g += wire('5V', 'J50', C.red);
    g += wire('J52', 'AN0', C.green);
    g += resistor('F52', 'A52', ['#8a5a2b','#000','#e2731b','#c9a227']);
    g += wire('A52', 'BM:52', C.black);
    g += text(colX(51), ROWY.J - 26, 'LDR', { size: 12, weight: 700 });
    // indicator LED on D3
    g += wire('~3', 'J56', C.blue);
    g += resistor('J56', 'J58', ['#d21f24','#d21f24','#6b3f14','#c9a227']);
    g += led('J58', 'J60');
    g += wire('J60', 'BM:60', C.black);
    return { bb: true, fg: g };
  },
};

// ── helpers ───────────────────────────────────────────────────────────────
function mod(m, conns, extra = '') {
  return { bb: false, fg: m.svg + extra + conns.map((c) => wire(c[0], c[1], c[2], { curve: 0.5 })).join('') };
}

function soundScene() {
  const b = place(4, { w: 230, top: 410 });
  const m = module({ ...b, fill: '#b0272e', label: 'Sound sensor', side: 'left',
    pins: [{ name: '+', label: '+' }, { name: 'G', label: 'G' }, { name: 'A0', label: 'A0' }, { name: 'D0', label: 'D0' }] });
  const mic = `<circle cx="${b.x + b.w - 46}" cy="${b.y + 40}" r="20" fill="#4a4a4a" stroke="#222" stroke-width="2"/><circle cx="${b.x + b.w - 46}" cy="${b.y + 40}" r="9" fill="#2a2a2a"/>`;
  return mod(m, [['5V', m.at('+'), C.red], ['GND', m.at('G'), C.black], ['AN0', m.at('A0'), C.green], ['~3', m.at('D0'), C.yellow]], mic);
}

function spare(x, y, bands, label) {
  const a = { x: x-30, y }, b = { x: x+30, y };
  let g = `<line x1="${a.x}" y1="${y}" x2="${b.x}" y2="${y}" stroke="#9aa" stroke-width="2.4"/>`;
  g += `<rect x="${x-17}" y="${y-6}" width="34" height="12" rx="4" fill="#d8b98c" stroke="#a5824f"/>`;
  bands.forEach((c, i) => g += `<rect x="${x-13+i*6.5}" y="${y-6}" width="3" height="12" fill="${c}"/>`);
  g += `<rect x="${x+52}" y="${y-15}" width="60" height="30" rx="4" fill="#f6e58d" stroke="#d9c76a"/>`;
  g += text(x+82, y+7, label, { size: 18, weight: 800 });
  return g;
}

// potentiometer body (3 legs down into breadboard)
function potBody(px, py, legXs, legY) {
  let g = `<g>`;
  legXs.forEach((lx) => g += `<line x1="${lx}" y1="${legY}" x2="${lx}" y2="${py+36}" stroke="#9aa" stroke-width="2.4"/>`);
  g += `<rect x="${px-42}" y="${py-6}" width="84" height="44" rx="6" fill="#1f6fb0" stroke="#124" stroke-width="1.5"/>`;
  g += `<circle cx="${px}" cy="${py-18}" r="22" fill="#2a2c30" stroke="#000"/><rect x="${px-2}" y="${py-40}" width="4" height="18" fill="#ccc"/>`;
  g += `</g>`;
  return g;
}
function thermistor(px, py, legXs, legY) {
  let g = `<g>`;
  legXs.forEach((lx) => g += `<line x1="${lx}" y1="${legY}" x2="${px}" y2="${py+6}" stroke="#9aa" stroke-width="2.4"/>`);
  g += `<ellipse cx="${px}" cy="${py}" rx="11" ry="15" fill="#1b1b1b" stroke="#000"/>`;
  g += `</g>`;
  return g;
}
function button(colx) {
  const c = Math.round((colx - 96) / 17) + 1;
  const y = (ROWY.F + ROWY.E) / 2;
  let g = `<g>`;
  g += `<rect x="${colx-24}" y="${y-24}" width="48" height="48" rx="4" fill="#2b6cae" stroke="#16324a" stroke-width="1.5"/>`;
  g += `<circle cx="${colx}" cy="${y}" r="12" fill="#c9ccd1" stroke="#555"/>`;
  // legs into F and A of two adjacent columns
  ['F','A'].forEach((r) => { g += `<line x1="${colx-17}" y1="${ROWY[r]}" x2="${colx-17}" y2="${y + (r==='F'?-18:18)}" stroke="#9aa" stroke-width="2.2"/>`;
    g += `<line x1="${colx+17}" y1="${ROWY[r]}" x2="${colx+17}" y2="${y + (r==='F'?-18:18)}" stroke="#9aa" stroke-width="2.2"/>`; });
  g += `</g>`;
  return g;
}
function rgbLed(_px, legXs) {
  const cxb = (legXs[1] + legXs[2]) / 2;
  const cols = ['#d21f24', '#888', '#159a3f', '#1c63d6']; // R, cathode, G, B
  const legBot = ROWY.G, bodyBot = legBot - 22, bodyCy = legBot - 46;
  let g = `<g>`;
  legXs.forEach((lx, i) => g += `<line x1="${lx}" y1="${legBot}" x2="${lx}" y2="${bodyBot}" stroke="${cols[i]}" stroke-width="3"/>`);
  g += `<rect x="${cxb-26}" y="${bodyBot-6}" width="52" height="8" rx="3" fill="#b7c1c5"/>`;
  g += `<ellipse cx="${cxb}" cy="${bodyCy}" rx="24" ry="28" fill="#d6dee2" stroke="#8896a0" stroke-width="1.5" opacity="0.9"/>`;
  g += `<ellipse cx="${cxb-7}" cy="${bodyCy-8}" rx="5" ry="10" fill="#fff" opacity="0.6"/>`;
  return g;
}
