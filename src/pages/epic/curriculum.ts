// EPIC 2026 — Arduino lab curriculum
// ids equal /public/diagrams/{id}.jpg filenames.

export interface Activity {
  id: string;
  day: number;
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
  extension?: string;   // optional "done early?" challenge for fast finishers
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
  {id:"active_buzzer", day:2, lesson:"Lessons 6 & 7", title:"Active & Passive Buzzers", goal:"Beep with an active buzzer; play notes with a passive one.", materials:["Arduino UNO","active buzzer (sealed)","passive buzzer (open green)","jumper wires"], wiring:[["Active +","pin 12"],["Active −","GND"],["Passive +","pin 8"],["Passive −","GND"]], code:"// Passive buzzer scale (pin 8)\nint notes[]={523,587,659,698,784,880,988,1047};\nvoid setup(){}\nvoid loop(){\n  for(int i=0;i<8;i++){ tone(8,notes[i],500); delay(1000); }\n  delay(2000);\n}", test:["Active: speeding beeps then a long tone.","Passive: a rising do-re-mi scale."], trouble:["Active silent → sealed buzzer on pin 12.","Passive silent → open green buzzer on pin 8."]},

  // ── Day 3 ────────────────────────────────────────────────
  {id:"dht11", day:3, lesson:"Lesson 12", title:"Temperature & Humidity (DHT11)", lib:"DHT_nonblocking.zip", goal:"Read room temperature and humidity from a DHT11.", materials:["Arduino UNO","DHT11 sensor","jumper wires"], wiring:[["Sensor data (S)","pin 2"],["Sensor +","5V"],["Sensor −","GND"]], code:"#include <dht_nonblocking.h>\n#define DHT_SENSOR_TYPE DHT_TYPE_11\nstatic const int PIN=2;\nDHT_nonblocking dht(PIN, DHT_SENSOR_TYPE);\nvoid setup(){ Serial.begin(9600); }\nvoid loop(){\n  float t,h;\n  if(dht.measure(&t,&h)){\n    Serial.print(\"T=\"); Serial.print(t,1);\n    Serial.print(\"C  H=\"); Serial.print(h,1); Serial.println(\"%\");\n  }\n}", test:["Serial Monitor at 9600 shows T and H.","Breathe near it; humidity rises."], trouble:["\"No such file\" → install DHT_nonblocking.zip.","No readings → data pin to 2; wait a few seconds."]},
  {id:"ultrasonic", day:3, lesson:"Lesson 10", title:"Ultrasonic Distance", lib:"HC-SR04.zip", goal:"Measure distance with sound pulses, like a parking sensor.", materials:["Arduino UNO","HC-SR04 sensor","jumper wires"], wiring:[["Sensor VCC","5V"],["Sensor Trig","pin 12"],["Sensor Echo","pin 11"],["Sensor GND","GND"]], code:"#include \"SR04.h\"\n#define TRIG 12\n#define ECHO 11\nSR04 sr04 = SR04(ECHO, TRIG);\nvoid setup(){ Serial.begin(9600); }\nvoid loop(){\n  Serial.print(sr04.Distance());\n  Serial.println(\"cm\");\n  delay(1000);\n}", test:["Serial Monitor at 9600 prints cm.","Move your hand; the number changes."], trouble:["\"No such file\" → install HC-SR04.zip.","Always 0 → re-check Trig 12 / Echo 11."], extension:"Light the on-board LED (pin 13) only when something is closer than 10 cm — a simple proximity alarm. Hint: pinMode(13, OUTPUT) and digitalWrite based on sr04.Distance() < 10."},

  // ── Day 4 ────────────────────────────────────────────────
  {id:"final", day:4, lesson:"Final Project", title:"Light-Controlled Motor (LED + LDR)", goal:"Motor spins when light hits the LDR, stops when you block it.", materials:["Arduino UNO","breadboard","DC motor","L293D driver","LDR","LED","220Ω + 10kΩ resistors","jumper wires"], wiring:[["L293D 1","D5"],["L293D 2","D6"],["L293D 7","D7"],["L293D 3 / 6","motor wires"],["L293D 8 & 16","5V"],["L293D 4,5,12,13","GND"],["LDR","5V + A0, 10kΩ A0→GND"],["LED","D3 → 220Ω → LED → GND"]], code:"int ldr=A0, en=5, in1=6, in2=7, led=3;\nint threshold=765;   // set from calibration\nvoid setup(){\n  pinMode(en,OUTPUT);pinMode(in1,OUTPUT);pinMode(in2,OUTPUT);pinMode(led,OUTPUT);\n  digitalWrite(led,HIGH); digitalWrite(in1,HIGH); digitalWrite(in2,LOW);\n}\nvoid loop(){\n  int v=analogRead(ldr);\n  analogWrite(en, v>threshold ? 255 : 0);\n  delay(20);\n}", test:["Light on LDR → spins. Block it → stops."], trouble:["No spin → check L293D pin 8 & 16 to 5V.","Wrong way → swap motor wires.","Never stops → re-calibrate threshold.","Board resets → ask about a separate motor battery."], extension:"Add a second, lower threshold so the motor runs at HALF speed in dim light and full speed in bright light. Hint: analogWrite(en, 128) between the two thresholds, 255 above the top one."},
  {id:"sound", day:4, lesson:"Lesson 20", title:"Sound Sensor", optional:true, goal:"Detect a clap and read how loud it is.", materials:["Arduino UNO","sound sensor module","jumper wires"], wiring:[["Sensor +","5V"],["Sensor G","GND"],["Sensor A0","A0"],["Sensor D0","pin 3"]], code:"int a=A0, d=3, led=13;\nvoid setup(){ Serial.begin(9600); pinMode(d,INPUT); pinMode(led,OUTPUT); }\nvoid loop(){\n  Serial.println(analogRead(a));\n  digitalWrite(led, digitalRead(d)==HIGH ? HIGH : LOW);\n  delay(50);\n}", test:["Serial Monitor jumps on a clap.","Turn the blue dial to set sensitivity."], trouble:["LED never reacts → turn the blue dial.","No numbers → baud 9600."]},
];

export const DAY_TITLES: Record<number, string> = {
  1: "Day 1 — Getting Started & First Circuits",
  2: "Day 2 — Inputs & Sound",
  3: "Day 3 — Sensing the Environment",
  4: "Day 4 — Final Project & Sound",
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
