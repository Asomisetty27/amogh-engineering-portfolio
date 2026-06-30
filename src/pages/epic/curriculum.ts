// EPIC 2026 — Arduino lab curriculum
// ids equal /public/diagrams/{id}.jpg filenames.

export interface Activity {
  id: string;
  day: number;       // 1–4 = regular days, 5 = additional exercises
  lesson: string;
  title: string;
  optional?: boolean;
  lib?: string;
  goal: string;
  materials: string[];
  wiring: [string, string][];
  code: string;
  test: string[];
  trouble: string[];
  extension?: string;
}

// Recipients for the end-of-lab thank-you email step (StudentHelper "Wrap up"):
// Professor Kundu + Maria (EPIC organizer). Comma-separated for mailto / Gmail.
export const THANKYOU_EMAIL = "sokundu@calpoly.edu,msmanzan@calpoly.edu";

export const CURRICULUM: Activity[] = [
  // ── Day 1 ────────────────────────────────────────────────
  {id:"intro", day:1, lesson:"Intro", title:"Arduino & the IDE", goal:"Meet the board and learn to upload a program.", materials:["Arduino UNO","USB cable"], wiring:[], code:"// Tools > Board > Arduino UNO\n// Tools > Port > (pick the port)\n// Paste code, click Verify (check), then Upload (arrow).", test:["The IDE shows \"Done uploading.\""], trouble:["Upload error → check Board and Port under Tools."]},
  {id:"blink", day:1, lesson:"Lesson 2", title:"LED Blink", goal:"Blink the Arduino's built-in light to prove your setup works.", materials:["Arduino UNO","USB cable"], wiring:[["Nothing to wire","built-in LED is on pin 13"]], code:"const int ledPin = 13;\nvoid setup() { pinMode(ledPin, OUTPUT); }\nvoid loop() {\n  digitalWrite(ledPin, HIGH);\n  delay(1000);\n  digitalWrite(ledPin, LOW);\n  delay(1000);\n}", test:["The \"L\" LED blinks on 1s, off 1s.","Change 1000 to 200 to blink faster."], trouble:["No blink → re-check Board and Port.","Port not found → replug USB, pick the port again."], extension:"Make the LED blink SOS in Morse code (... --- ...). Short = 200ms on, long = 600ms on, gaps of 200ms, then a longer pause before repeating."},
  {id:"led_resistor", day:1, lesson:"Lesson 3", title:"Brightness with Resistors", goal:"See how a resistor controls brightness. No code needed.", materials:["Arduino UNO","breadboard","LED","220Ω, 1kΩ, 10kΩ resistors","jumper wires"], wiring:[["Arduino 5V","\"+\" rail"],["Arduino GND","\"−\" rail"],["\"+\" rail","LED long leg"],["LED short leg","resistor"],["resistor","\"−\" rail"]], code:"// No code. Swap the resistor and compare brightness.", test:["220Ω = bright, 1kΩ = dimmer, 10kΩ = dimmest."], trouble:["Dark with every resistor → LED is backwards, flip it.","Unplug USB before swapping resistors."]},
  {id:"pot", day:1, lesson:"Lesson 3", title:"Brightness with a Potentiometer", goal:"Use a knob to fade an LED smoothly.", materials:["Arduino UNO","breadboard","LED","220Ω resistor","10kΩ potentiometer","jumper wires"], wiring:[["Pot left leg","5V"],["Pot right leg","GND"],["Pot middle leg","A0"],["Pin ~9","220Ω → LED long leg"],["LED short leg","GND"]], code:"const int potPin = A0;\nconst int ledPin = 9;   // must be a ~ (PWM) pin\nvoid setup() { pinMode(ledPin, OUTPUT); }\nvoid loop() {\n  int v = analogRead(potPin);          // 0..1023\n  analogWrite(ledPin, map(v,0,1023,0,255));\n  delay(10);\n}", test:["Turn the knob: the LED fades up and down."], trouble:["Only on/off → use pin ~9, not a plain pin.","No change → middle leg to A0."], extension:"Map the knob so the LED stays fully off for the bottom third of the range (0–340), then fades from there. Hint: if v < 341, write 0."},
  {id:"rgb", day:1, lesson:"Lesson 4", title:"RGB LED", optional:true, goal:"Mix red, green, blue to fade through colors.", materials:["Arduino UNO","breadboard","RGB LED","three 220Ω resistors","jumper wires"], wiring:[["Longest leg","GND"],["Red leg → 220Ω","pin 6"],["Green leg → 220Ω","pin 5"],["Blue leg → 220Ω","pin 3"]], code:"#define BLUE 3\n#define GREEN 5\n#define RED 6\nvoid setup(){pinMode(RED,OUTPUT);pinMode(GREEN,OUTPUT);pinMode(BLUE,OUTPUT);}\nvoid loop(){\n  for(int i=0;i<255;i++){analogWrite(RED,255-i);analogWrite(GREEN,i);delay(10);}\n  for(int i=0;i<255;i++){analogWrite(GREEN,255-i);analogWrite(BLUE,i);delay(10);}\n  for(int i=0;i<255;i++){analogWrite(BLUE,255-i);analogWrite(RED,i);delay(10);}\n}", test:["Colors cycle red→green→blue→red."], trouble:["One color only → each leg needs its own resistor & pin.","Dark → longest leg to GND."], extension:"Make the LED breathe one single color — fade its brightness smoothly up and then back down in a loop, instead of cycling through colors."},

  // ── Day 2 ────────────────────────────────────────────────
  {id:"digital", day:2, lesson:"Lesson 5", title:"Push Buttons", goal:"One button turns an LED on, the other off.", materials:["Arduino UNO","breadboard","LED","220Ω resistor","two push buttons","jumper wires"], wiring:[["Pin 5 → 220Ω","LED long leg; short → GND"],["Button A","pin 9; other side GND"],["Button B","pin 8; other side GND"]], code:"int ledPin=5, buttonApin=9, buttonBpin=8;\nvoid setup(){\n  pinMode(ledPin,OUTPUT);\n  pinMode(buttonApin,INPUT_PULLUP);\n  pinMode(buttonBpin,INPUT_PULLUP);\n}\nvoid loop(){\n  if(digitalRead(buttonApin)==LOW) digitalWrite(ledPin,HIGH);\n  if(digitalRead(buttonBpin)==LOW) digitalWrite(ledPin,LOW);\n}", test:["Button A: LED on. Button B: LED off."], trouble:["No light → LED long leg toward pin 5.","Buttons dead → other side must go to GND."], extension:"Make ONE button toggle the LED — press once for on, press again for off — instead of needing two buttons. Hint: track the LED state in a variable and flip it on each press (watch for bounce with a short delay)."},
  {id:"water", day:2, lesson:"Lesson 18", title:"Water Level Detection", goal:"Read a water sensor; the value rises as it gets wet.", materials:["Arduino UNO","water level sensor","jumper wires","cup of water"], wiring:[["Sensor S","A0"],["Sensor +","5V"],["Sensor −","GND"]], code:"int adc_id=0, last=0; char buf[128];\nvoid setup(){ Serial.begin(9600); }\nvoid loop(){\n  int v=analogRead(adc_id);\n  if(abs(v-last)>10){ sprintf(buf,\"level %d\\n\",v); Serial.print(buf); last=v; }\n}", test:["Serial Monitor at 9600; dip in water, the number rises."], trouble:["No numbers → set baud to 9600.","Wet only the striped lines."]},
  {
    id:"active_buzzer", day:2, lesson:"Lessons 6 & 7", title:"Active & Passive Buzzers",
    goal:"Beep with an active buzzer; play a song with a passive one.",
    materials:["Arduino UNO","active buzzer (sealed)","passive buzzer (open green)","jumper wires"],
    wiring:[["Active +","pin 12"],["Active −","GND"],["Passive +","pin 8"],["Passive −","GND"]],
    code:
`// Part A — Active buzzer (sealed, pin 12). Upload this first.
// Wire: + (long leg) → pin 12, − → GND.

int buzzer = 12;

void setup() { pinMode(buzzer, OUTPUT); }

void loop() {
  int d = 500;
  for (int i = 0; i < 20; i++) {
    if (i < 5)       d = 500;   // slow
    else if (i < 10) d = 300;   // faster
    else             d = 100;   // fast
    digitalWrite(buzzer, HIGH); delay(d);
    digitalWrite(buzzer, LOW);  delay(d);
  }
  digitalWrite(buzzer, HIGH);
  delay(5000);   // one long tone
}

// ─── Upload Part A above first, then replace with Part B below. ───────────

// Part B — Passive buzzer (open green, pin 8): plays Happy Birthday.
// All songs from https://github.com/robsoncouto/arduino-songs use pin 11 by default.
// Change  int buzzer = 11;  to  int buzzer = 8;  before uploading.

#define NOTE_C4 262
#define NOTE_D4 294
#define NOTE_E4 330
#define NOTE_F4 349
#define NOTE_G4 392
#define NOTE_A4 440
#define NOTE_AS4 466
#define NOTE_C5 523
#define REST 0

int tempo = 140;
int buzzer = 8;   // our passive buzzer is on pin 8

int melody[] = {
  NOTE_C4,4, NOTE_C4,8,
  NOTE_D4,-4, NOTE_C4,-4, NOTE_F4,-4,
  NOTE_E4,-2, NOTE_C4,4, NOTE_C4,8,
  NOTE_D4,-4, NOTE_C4,-4, NOTE_G4,-4,
  NOTE_F4,-2, NOTE_C4,4, NOTE_C4,8,
  NOTE_C5,-4, NOTE_A4,-4, NOTE_F4,-4,
  NOTE_E4,-4, NOTE_D4,-4, NOTE_AS4,4, NOTE_AS4,8,
  NOTE_A4,-4, NOTE_F4,-4, NOTE_G4,-4,
  NOTE_F4,-2,
};

int notes = sizeof(melody) / sizeof(melody[0]) / 2;
int wholenote = (60000 * 4) / tempo;

void setup() {
  for (int i = 0; i < notes * 2; i += 2) {
    int divider = melody[i + 1];
    int noteDuration;
    if (divider > 0) noteDuration = wholenote / divider;
    else { noteDuration = wholenote / abs(divider); noteDuration *= 1.5; }
    tone(buzzer, melody[i], noteDuration * 0.9);
    delay(noteDuration);
    noTone(buzzer);
  }
}

void loop() {}   // plays once on startup`,
    test:[
      "Part A: upload the top code → buzzer beeps, speeding up, then holds one 5-second tone, repeats.",
      "Part B: upload the bottom code → passive (open green) buzzer plays Happy Birthday.",
      "Try another song: go to github.com/robsoncouto/arduino-songs, open any folder, copy the .ino file, change pin 11 to pin 8.",
    ],
    trouble:[
      "Active silent → upload Part A code first; sealed buzzer long leg to pin 12.",
      "Passive silent → open green buzzer must be on pin 8.",
      "Song sounds wrong → make sure you changed buzzer = 11 to buzzer = 8.",
    ],
  },

  // ── Day 3 ────────────────────────────────────────────────
  {id:"dht11", day:3, lesson:"Lesson 12", title:"Temperature & Humidity (DHT11)", lib:"DHT_nonblocking.zip", goal:"Read room temperature and humidity from a DHT11.", materials:["Arduino UNO","DHT11 sensor","jumper wires"], wiring:[["Sensor data (S)","pin 2"],["Sensor +","5V"],["Sensor −","GND"]], code:"#include <dht_nonblocking.h>\n#define DHT_SENSOR_TYPE DHT_TYPE_11\nstatic const int PIN=2;\nDHT_nonblocking dht(PIN, DHT_SENSOR_TYPE);\nvoid setup(){ Serial.begin(9600); }\nvoid loop(){\n  float t,h;\n  if(dht.measure(&t,&h)){\n    Serial.print(\"T=\"); Serial.print(t,1);\n    Serial.print(\"C  H=\"); Serial.print(h,1); Serial.println(\"%\");\n  }\n}", test:["Serial Monitor at 9600 shows T and H.","Breathe near it; humidity rises."], trouble:["\"No such file\" → install DHT_nonblocking.zip (download button above).","No readings → data pin to 2; wait a few seconds."]},
  {id:"ultrasonic", day:3, lesson:"Lesson 10", title:"Ultrasonic Distance", lib:"HC-SR04.zip", goal:"Measure distance with sound pulses, like a parking sensor.", materials:["Arduino UNO","HC-SR04 sensor","jumper wires"], wiring:[["Sensor VCC","5V"],["Sensor Trig","pin 12"],["Sensor Echo","pin 11"],["Sensor GND","GND"]], code:"#include \"SR04.h\"\n#define TRIG 12\n#define ECHO 11\nSR04 sr04 = SR04(ECHO, TRIG);\nvoid setup(){ Serial.begin(9600); }\nvoid loop(){\n  Serial.print(sr04.Distance());\n  Serial.println(\"cm\");\n  delay(1000);\n}", test:["Serial Monitor at 9600 prints cm.","Move your hand; the number changes."], trouble:["\"No such file\" → install HC-SR04.zip (download button above).","Always 0 → re-check Trig 12 / Echo 11."], extension:"Light the on-board LED (pin 13) only when something is closer than 10 cm — a simple proximity alarm. Hint: pinMode(13, OUTPUT) and digitalWrite based on sr04.Distance() < 10."},

  // ── Day 4 ────────────────────────────────────────────────
  {id:"final", day:4, lesson:"Final Project", title:"Light-Controlled Motor (LED + LDR)", goal:"Motor spins when light hits the LDR, stops when you block it.", materials:["Arduino UNO","breadboard","DC motor","L293D driver","LDR","LED","220Ω + 10kΩ resistors","jumper wires"], wiring:[["L293D 1","D5"],["L293D 2","D6"],["L293D 7","D7"],["L293D 3 / 6","motor wires"],["L293D 8 & 16","5V"],["L293D 4,5,12,13","GND"],["LDR","5V + A0, 10kΩ A0→GND"],["LED","D3 → 220Ω → LED → GND"]], code:"int ldr=A0, en=5, in1=6, in2=7, led=3;\nint threshold=765;\nvoid setup(){\n  pinMode(en,OUTPUT);pinMode(in1,OUTPUT);pinMode(in2,OUTPUT);pinMode(led,OUTPUT);\n  digitalWrite(led,HIGH); digitalWrite(in1,HIGH); digitalWrite(in2,LOW);\n}\nvoid loop(){\n  int v=analogRead(ldr);\n  analogWrite(en, v>threshold ? 255 : 0);\n  delay(20);\n}", test:["Light on LDR → spins. Block it → stops."], trouble:["No spin → check L293D pin 8 & 16 to 5V.","Wrong way → swap motor wires.","Never stops → re-calibrate threshold.","Board resets → ask about a separate motor battery."], extension:"Add a second, lower threshold so the motor runs at HALF speed in dim light and full speed in bright light. Hint: analogWrite(en, 128) between the two thresholds, 255 above the top one."},
  {id:"sound", day:4, lesson:"Lesson 20", title:"Sound Sensor", optional:true, goal:"Detect a clap and read how loud it is.", materials:["Arduino UNO","sound sensor module","jumper wires"], wiring:[["Sensor +","5V"],["Sensor G","GND"],["Sensor A0","A0"],["Sensor D0","pin 3"]], code:"int a=A0, d=3, led=13;\nvoid setup(){ Serial.begin(9600); pinMode(d,INPUT); pinMode(led,OUTPUT); }\nvoid loop(){\n  Serial.println(analogRead(a));\n  digitalWrite(led, digitalRead(d)==HIGH ? HIGH : LOW);\n  delay(50);\n}", test:["Serial Monitor jumps on a clap.","Turn the blue dial to set sensitivity."], trouble:["LED never reacts → turn the blue dial.","No numbers → baud 9600."]},

  // ── Additional Exercises (fast finishers) ────────────────
  {
    id:"joystick", day:5, lesson:"Lesson 13", title:"Analog Joystick Module",
    goal:"Read X/Y position and the click button from a joystick.",
    materials:["Arduino UNO","analog joystick module","jumper wires"],
    wiring:[["VRx","A0"],["VRy","A1"],["SW","pin 2"],["VCC","5V"],["GND","GND"]],
    code:
`void setup() {
  Serial.begin(9600);
  pinMode(2, INPUT_PULLUP);
}

void loop() {
  Serial.print("X="); Serial.print(analogRead(A0));
  Serial.print("  Y="); Serial.print(analogRead(A1));
  Serial.print("  BTN="); Serial.println(digitalRead(2)==LOW ? "pressed" : "open");
  delay(200);
}`,
    test:[
      "Serial Monitor at 9600. Push the stick left/right/up/down: X and Y change.",
      "Click the stick down: BTN shows pressed.",
      "Center resting position is ~512 for both X and Y.",
    ],
    trouble:["No output → baud 9600.","X and Y always 0 → VCC to 5V, GND to GND."],
  },
  {
    id:"ir_receiver", day:5, lesson:"Lesson 14", title:"IR Receiver Module",
    goal:"Decode button presses from a TV remote using infrared.",
    lib:"IRremote.zip",
    materials:["Arduino UNO","IR receiver module","TV/device remote","jumper wires"],
    wiring:[["Receiver signal (S)","pin 11"],["Receiver +","5V"],["Receiver −","GND"]],
    code:
`#include <IRremote.h>
const int RECV_PIN = 11;
IRrecv irrecv(RECV_PIN);
decode_results results;

void setup() {
  Serial.begin(9600);
  irrecv.enableIRIn();
}

void loop() {
  if (irrecv.decode(&results)) {
    Serial.println(results.value, HEX);
    irrecv.resume();
  }
}`,
    test:[
      "Open Serial Monitor at 9600.",
      "Point any TV remote at the receiver and press a button.",
      "A hex code appears for each button. The same button always gives the same code.",
    ],
    trouble:[
      "\"No such file\" → install IRremote.zip (download button above).",
      "Nothing prints → receiver signal pin must be 11; point remote directly at receiver.",
      "FFFFFFFF repeating → you are holding the button down; press and release quickly.",
    ],
  },
  {
    id:"keypad", day:5, lesson:"Lesson 11", title:"Membrane Switch Module (Keypad)",
    goal:"Read which key is pressed on a 4×4 membrane keypad.",
    lib:"Keypad.zip",
    materials:["Arduino UNO","4×4 membrane keypad","jumper wires"],
    wiring:[
      ["Row pins (4)","pins 9, 8, 7, 6 (top to bottom)"],
      ["Col pins (4)","pins 5, 4, 3, 2 (left to right)"],
    ],
    code:
`#include <Keypad.h>
const byte ROWS=4, COLS=4;
char keys[ROWS][COLS]={
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};
byte rowPins[ROWS]={9,8,7,6};
byte colPins[COLS]={5,4,3,2};
Keypad keypad=Keypad(makeKeymap(keys),rowPins,colPins,ROWS,COLS);

void setup(){ Serial.begin(9600); }

void loop(){
  char k=keypad.getKey();
  if(k) Serial.println(k);
}`,
    test:[
      "Serial Monitor at 9600.",
      "Press any key: its label appears in the monitor.",
    ],
    trouble:[
      "\"No such file\" → install Keypad.zip (download button above).",
      "Wrong key printed → check row/col pin order matches the wiring above.",
      "Nothing prints → baud 9600; make sure keypad ribbon is fully seated.",
    ],
  },
  {
    id:"dot_matrix", day:5, lesson:"Lesson 15", title:"LED Dot Matrix Module",
    goal:"Display a pattern on an 8×8 LED dot matrix using the MAX7219 driver.",
    lib:"LedControl.zip",
    materials:["Arduino UNO","8×8 LED dot matrix module (MAX7219)","jumper wires"],
    wiring:[
      ["DIN","pin 12"],
      ["CLK","pin 11"],
      ["CS (LOAD)","pin 10"],
      ["VCC","5V"],
      ["GND","GND"],
    ],
    code:
`#include <LedControl.h>
// LedControl(DIN, CLK, CS, numDevices)
LedControl lc = LedControl(12, 11, 10, 1);

void setup() {
  lc.shutdown(0, false);   // wake up the display
  lc.setIntensity(0, 8);   // brightness 0–15
  lc.clearDisplay(0);

  // Smiley face (each byte = one row, bit 7 = left column)
  lc.setRow(0, 0, 0b00111100);
  lc.setRow(0, 1, 0b01000010);
  lc.setRow(0, 2, 0b10100101);
  lc.setRow(0, 3, 0b10000001);
  lc.setRow(0, 4, 0b10100101);
  lc.setRow(0, 5, 0b10011001);
  lc.setRow(0, 6, 0b01000010);
  lc.setRow(0, 7, 0b00111100);
}

void loop() {}`,
    test:[
      "A smiley face appears on the dot matrix.",
      "Try changing the 0b... bit patterns to draw your own shape.",
    ],
    trouble:[
      "\"No such file\" → install LedControl.zip (download button above).",
      "Nothing lit → VCC to 5V; DIN/CLK/CS to pins 12/11/10.",
      "Partial display → only one byte wrong; check each row pattern.",
    ],
  },
  {
    id:"lcd", day:5, lesson:"Lesson 22", title:"LCD Display",
    goal:"Show text on a 16×2 LCD screen.",
    lib:"LiquidCrystal.zip",
    materials:["Arduino UNO","16×2 LCD","10kΩ potentiometer","jumper wires"],
    wiring:[
      ["LCD VSS","GND"],
      ["LCD VDD","5V"],
      ["LCD V0 (contrast)","pot middle leg; pot ends to 5V & GND"],
      ["LCD RS","pin 12"],
      ["LCD RW","GND"],
      ["LCD EN","pin 11"],
      ["LCD D4","pin 5"],
      ["LCD D5","pin 4"],
      ["LCD D6","pin 3"],
      ["LCD D7","pin 2"],
      ["LCD A (backlight +)","5V"],
      ["LCD K (backlight −)","GND"],
    ],
    code:
`#include <LiquidCrystal.h>
// RS, EN, D4, D5, D6, D7
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

void setup() {
  lcd.begin(16, 2);
  lcd.print("Hello, EPIC!");
  lcd.setCursor(0, 1);   // move to row 2
  lcd.print("Cal Poly 2026");
}

void loop() {}`,
    test:[
      "\"Hello, EPIC!\" appears on line 1, \"Cal Poly 2026\" on line 2.",
      "If text is invisible, adjust the contrast pot until it appears.",
    ],
    trouble:[
      "Blank screen with backlight on → turn the contrast pot slowly.",
      "No backlight → LCD A to 5V, K to GND.",
      "Garbled text → check D4–D7 match pins 5,4,3,2 exactly.",
    ],
  },
];

export const DAY_TITLES: Record<number, string> = {
  1: "Day 1 — Getting Started & First Circuits",
  2: "Day 2 — Inputs & Sound",
  3: "Day 3 — Sensing the Environment",
  4: "Day 4 — Final Project & Sound",
  5: "Additional Exercises",
};

export type HelpType = "not_working" | "wiring" | "question" | "done";

export const WIRE: Record<HelpType, { color: string; label: string }> = {
  not_working: { color: "#E5484D", label: "It's not working" },
  wiring:      { color: "#2D7FF9", label: "Check our wiring" },
  question:    { color: "#F2B01E", label: "We have a question" },
  done:        { color: "#30A46C", label: "Done — check us off" },
};

// Cohort is now runtime — see cohort.ts (localStorage + ?cohort= URL param).
export const GROUP_COUNT = 8;
