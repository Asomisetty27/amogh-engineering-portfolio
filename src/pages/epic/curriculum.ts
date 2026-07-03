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
  challenge?: { prompt: string; code: string };
  calibration?: { note: string; code: string };
}

// Recipients for the end-of-lab thank-you email step (StudentHelper "Wrap up"):
// Professor Kundu + Maria (EPIC organizer). Comma-separated for mailto / Gmail.
export const THANKYOU_EMAIL = "sokundu@calpoly.edu,msmanzan@calpoly.edu";

// Universal "try this before calling a professor" checklist — shown on every
// activity's troubleshooter. These catch the great majority of beginner issues.
export const FIRST_AID: string[] = [
  "Is the USB cable pushed all the way into BOTH the Arduino and the computer? The little ON light on the board should be lit.",
  "Did the code actually upload? You must see \"Done uploading.\" at the bottom. If there is an orange error, set Tools → Board to \"Arduino UNO\", pick your Port under Tools → Port, then click Upload again.",
  "Unplug the USB and gently push EVERY wire and part all the way into the breadboard. A leg that looks seated but is a little loose is the #1 reason a circuit does nothing. Then plug back in.",
  "Trace each wire with your finger against the diagram above. Is every end in the EXACT hole shown? Being even one row off connects it to the wrong place.",
  "Power check: ONE red wire from 5V to the red (+) rail, ONE black wire from GND to the blue (−) rail, and each part taps those rails — not a second wire back to the Arduino pin.",
  "LED staying dark? LEDs only work one way — long leg is + and short leg is − (to GND). Try turning it around.",
  "Serial Monitor blank or garbled? Set the baud dropdown (bottom-right of the Serial Monitor) to 9600.",
  "Press the RESET button on the Arduino, or unplug and replug the USB, to run your program again from the very start.",
  "Swap ONE part at a time — a single dead LED or a bent jumper wire does happen. Try a different one and see if it changes.",
];

export const CURRICULUM: Activity[] = [
  // ── Day 1 ────────────────────────────────────────────────
  {id:"intro", day:1, lesson:"Intro", title:"Arduino & the IDE", goal:"Meet the board and learn to upload a program.", materials:["Arduino UNO","USB cable"], wiring:[], code:"// Tools > Board > Arduino UNO\n// Tools > Port > (pick the port)\n// Paste code, click Verify (check), then Upload (arrow).", test:["The IDE shows \"Done uploading.\""], trouble:["Upload error → check Board and Port under Tools."]},
  {id:"blink", day:1, lesson:"Lesson 2", title:"LED Blink", goal:"Blink the Arduino's built-in light to prove your setup works.", materials:["Arduino UNO","USB cable"], wiring:[["Nothing to wire","built-in LED is on pin 13"]], code:"const int ledPin = 13;\nvoid setup() { pinMode(ledPin, OUTPUT); }\nvoid loop() {\n  digitalWrite(ledPin, HIGH);\n  delay(1000);\n  digitalWrite(ledPin, LOW);\n  delay(1000);\n}", test:["The \"L\" LED blinks on 1s, off 1s.","Change 1000 to 200 to blink faster."], trouble:["No blink → re-check Board and Port.","Port not found → replug USB, pick the port again."], extension:"Make the LED blink SOS in Morse code (... --- ...). Short = 200ms on, long = 600ms on, gaps of 200ms, then a longer pause before repeating."},
  {id:"led_resistor", day:1, lesson:"Lesson 3", title:"Brightness with Resistors", goal:"See how a resistor controls brightness. No code needed.", materials:["Arduino UNO","breadboard","an LED (any color)","220Ω (red-red-brown), 1kΩ (brown-black-red), 10kΩ (brown-black-orange) resistors","jumper wires"], wiring:[["Arduino 5V","\"+\" rail"],["Arduino GND","\"−\" rail"],["\"+\" rail","LED long leg"],["LED short leg","resistor"],["resistor","\"−\" rail"]], code:"// No code. Swap the resistor and compare brightness.", test:["220Ω = bright, 1kΩ = dimmer, 10kΩ = dimmest."], trouble:["Dark with every resistor → LED is backwards, flip it.","Unplug USB before swapping resistors."]},
  {id:"pot", day:1, lesson:"Lesson 3", title:"Brightness with a Potentiometer", goal:"Use a knob to fade an LED smoothly.", materials:["Arduino UNO","breadboard","an LED (any color)","220Ω resistor (red-red-brown)","10K potentiometer (the blue knob marked 10K)","jumper wires"], wiring:[["Pot left leg","5V"],["Pot right leg","GND"],["Pot middle leg","A0"],["Pin ~9","220Ω → LED long leg"],["LED short leg","GND"]], code:"const int potPin = A0;\nconst int ledPin = 9;   // must be a ~ (PWM) pin\nvoid setup() { pinMode(ledPin, OUTPUT); }\nvoid loop() {\n  int v = analogRead(potPin);          // 0..1023\n  analogWrite(ledPin, map(v,0,1023,0,255));\n  delay(10);\n}", test:["Turn the knob: the LED fades up and down."], trouble:["Only on/off → use pin ~9, not a plain pin.","No change → middle leg to A0."], extension:"Map the knob so the LED stays fully off for the bottom third of the range (0–340), then fades from there. Hint: if v < 341, write 0."},
  {id:"rgb", day:1, lesson:"Lesson 4", title:"RGB LED (the clear LED with 4 legs)", optional:true, goal:"Mix red, green, blue to fade through colors.", materials:["Arduino UNO","breadboard","RGB LED (the clear LED with 4 legs)","three 220Ω resistors (red-red-brown)","jumper wires"], wiring:[["Longest leg","GND"],["Red leg → 220Ω","pin 6"],["Green leg → 220Ω","pin 5"],["Blue leg → 220Ω","pin 3"]], code:"#define BLUE 3\n#define GREEN 5\n#define RED 6\nvoid setup(){pinMode(RED,OUTPUT);pinMode(GREEN,OUTPUT);pinMode(BLUE,OUTPUT);}\nvoid loop(){\n  for(int i=0;i<255;i++){analogWrite(RED,255-i);analogWrite(GREEN,i);delay(10);}\n  for(int i=0;i<255;i++){analogWrite(GREEN,255-i);analogWrite(BLUE,i);delay(10);}\n  for(int i=0;i<255;i++){analogWrite(BLUE,255-i);analogWrite(RED,i);delay(10);}\n}", test:["Colors cycle red→green→blue→red."], trouble:["One color only → each leg needs its own resistor & pin.","Dark → longest leg to GND."], extension:"Make the LED breathe one single color — fade its brightness smoothly up and then back down in a loop, instead of cycling through colors."},

  // ── Day 2 ────────────────────────────────────────────────
  {id:"digital", day:2, lesson:"Lesson 5", title:"Push Buttons", goal:"One button turns an LED on, the other off.", materials:["Arduino UNO","breadboard","an LED (any color)","220Ω resistor (red-red-brown)","2 push buttons (the little square 4-leg buttons)","jumper wires"], wiring:[["Pin 5 → 220Ω","LED long leg; short → GND"],["Button A","pin 9; other side GND"],["Button B","pin 8; other side GND"]], code:"int ledPin=5, buttonApin=9, buttonBpin=8;\nvoid setup(){\n  pinMode(ledPin,OUTPUT);\n  pinMode(buttonApin,INPUT_PULLUP);\n  pinMode(buttonBpin,INPUT_PULLUP);\n}\nvoid loop(){\n  if(digitalRead(buttonApin)==LOW) digitalWrite(ledPin,HIGH);\n  if(digitalRead(buttonBpin)==LOW) digitalWrite(ledPin,LOW);\n}", test:["Button A: LED on. Button B: LED off."], trouble:["No light → LED long leg toward pin 5.","Buttons dead → other side must go to GND."], extension:"Make ONE button toggle the LED — press once for on, press again for off — instead of needing two buttons. Hint: track the LED state in a variable and flip it on each press (watch for bounce with a short delay)."},
  {id:"water", day:2, lesson:"Lesson 18", title:"Water Level Detection", goal:"Read a water sensor; the value rises as it gets wet.", materials:["Arduino UNO","Water Level Detection Sensor Module (red board with comb-like lines)","jumper wires","cup of water"], wiring:[["Sensor S","A0"],["Sensor +","5V"],["Sensor −","GND"]], code:"int adc_id=0, last=0; char buf[128];\nvoid setup(){ Serial.begin(9600); }\nvoid loop(){\n  int v=analogRead(adc_id);\n  if(abs(v-last)>10){ sprintf(buf,\"level %d\\n\",v); Serial.print(buf); last=v; }\n}", test:["Serial Monitor at 9600; dip in water, the number rises."], trouble:["No numbers → set baud to 9600.","Wet only the striped lines."]},
  {
    id:"active_buzzer", day:2, lesson:"Lesson 6", title:"Active Buzzer",
    goal:"Make the sealed buzzer beep in a pattern that speeds up.",
    materials:["Arduino UNO","active buzzer (the SEALED one — has a sticker on top)","jumper wires"],
    wiring:[["Buzzer + (long leg)","Arduino pin 12"],["Buzzer − (short leg)","GND"]],
    code:
`int buzzerPin = 12;

void setup() {
  pinMode(buzzerPin, OUTPUT);
}

void loop() {
  // 20 beeps that get faster and faster, then one long tone
  for (int i = 0; i < 20; i++) {
    int pauseTime;
    if (i < 5)       pauseTime = 500;   // slow
    else if (i < 10) pauseTime = 300;   // medium
    else             pauseTime = 100;   // fast

    digitalWrite(buzzerPin, HIGH);
    delay(pauseTime);
    digitalWrite(buzzerPin, LOW);
    delay(pauseTime);
  }

  digitalWrite(buzzerPin, HIGH);
  delay(5000);   // hold one long tone for 5 seconds, then repeat
}`,
    test:[
      "The buzzer beeps slowly, then speeds up, then holds a 5-second tone, then repeats.",
    ],
    trouble:[
      "No sound → are you using the sealed buzzer (not the open green one)?",
      "Still silent → long leg (+) must go to pin 12.",
    ],
  },
  {
    id:"passive_buzzer", day:2, lesson:"Lesson 7", title:"Passive Buzzer — Happy Birthday",
    goal:"Play Happy Birthday on the open green passive buzzer.",
    materials:["Arduino UNO","passive buzzer (the OPEN one — you can see the green board underneath)","jumper wires"],
    wiring:[["Buzzer + (long leg)","Arduino pin 8"],["Buzzer − (short leg)","GND"]],
    code:
`// Songs from github.com/robsoncouto/arduino-songs use pin 11 by default.
// We changed  int buzzer = 11;  to  int buzzer = 8;  for our kit.

#define NOTE_C4  262
#define NOTE_D4  294
#define NOTE_E4  330
#define NOTE_F4  349
#define NOTE_G4  392
#define NOTE_A4  440
#define NOTE_AS4 466
#define NOTE_C5  523

int tempo = 140;
int buzzer = 8;

int melody[] = {
  NOTE_C4,4,  NOTE_C4,8,
  NOTE_D4,-4, NOTE_C4,-4, NOTE_F4,-4,
  NOTE_E4,-2, NOTE_C4,4,  NOTE_C4,8,
  NOTE_D4,-4, NOTE_C4,-4, NOTE_G4,-4,
  NOTE_F4,-2, NOTE_C4,4,  NOTE_C4,8,
  NOTE_C5,-4, NOTE_A4,-4, NOTE_F4,-4,
  NOTE_E4,-4, NOTE_D4,-4, NOTE_AS4,4, NOTE_AS4,8,
  NOTE_A4,-4, NOTE_F4,-4, NOTE_G4,-4,
  NOTE_F4,-2,
};

int notes     = sizeof(melody) / sizeof(melody[0]) / 2;
int wholenote = (60000 * 4) / tempo;

void setup() {
  for (int i = 0; i < notes * 2; i += 2) {
    int divider = melody[i + 1];
    int noteDuration;
    if (divider > 0) {
      noteDuration = wholenote / divider;
    } else {
      noteDuration = wholenote / abs(divider);
      noteDuration *= 1.5;
    }
    tone(buzzer, melody[i], noteDuration * 0.9);
    delay(noteDuration);
    noTone(buzzer);
  }
}

void loop() {}   // song plays once when you plug in`,
    test:[
      "The open green buzzer plays Happy Birthday once when you plug in.",
      "Want another song? Go to github.com/robsoncouto/arduino-songs, open any .ino file, change pin 11 to pin 8.",
    ],
    trouble:[
      "No sound → are you using the open green passive buzzer (not the sealed one)?",
      "Still silent → long leg (+) must go to pin 8.",
      "Wrong notes → make sure you changed buzzer = 11 to buzzer = 8.",
    ],
  },

  // ── Day 3 ────────────────────────────────────────────────
  {id:"dht11", day:3, lesson:"Lesson 12", title:"Temperature & Humidity (DHT11)", lib:"DHT_nonblocking.zip", goal:"Read room temperature and humidity from a DHT11.", materials:["Arduino UNO","DHT11 module (the light-blue grid box on a small board)","jumper wires"], wiring:[["Sensor data (S)","pin 2"],["Sensor +","5V"],["Sensor −","GND"]], code:"#include <dht_nonblocking.h>\n#define DHT_SENSOR_TYPE DHT_TYPE_11\nstatic const int DHT_SENSOR_PIN = 2;\nDHT_nonblocking dht_sensor(DHT_SENSOR_PIN, DHT_SENSOR_TYPE);\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\n// returns true only when a fresh reading is ready (about every 3 seconds)\nstatic bool measure_environment(float *temperature, float *humidity) {\n  static unsigned long timestamp = millis();\n  if (millis() - timestamp > 3000ul) {\n    if (dht_sensor.measure(temperature, humidity) == true) {\n      timestamp = millis();\n      return true;\n    }\n  }\n  return false;\n}\n\nvoid loop() {\n  float temperature, humidity;\n  if (measure_environment(&temperature, &humidity) == true) {\n    Serial.print(\"T = \");\n    Serial.print(temperature, 1);\n    Serial.print(\" deg. C, H = \");\n    Serial.print(humidity, 1);\n    Serial.println(\"%\");\n  }\n}", test:["Serial Monitor at 9600 shows T and H.","Breathe near it; humidity rises."], trouble:["\"No such file\" → install DHT_nonblocking.zip (download button above).","No readings → data pin to 2; wait a few seconds."]},
  {id:"ultrasonic", day:3, lesson:"Lesson 10", title:"Ultrasonic Distance", lib:"HC-SR04.zip", goal:"Measure distance with sound pulses, like a parking sensor.", materials:["Arduino UNO","Ultrasonic Sensor (HC-SR04 — the two round silver eyes)","jumper wires"], wiring:[["Sensor VCC","5V"],["Sensor Trig","pin 12"],["Sensor Echo","pin 11"],["Sensor GND","GND"]], code:"#include \"SR04.h\"\n#define TRIG 12\n#define ECHO 11\nSR04 sr04 = SR04(ECHO, TRIG);\n\nvoid setup() {\n  Serial.begin(9600);\n  delay(1000);\n}\n\nvoid loop() {\n  Serial.print(sr04.Distance());\n  Serial.println(\"cm\");\n  delay(1000);\n}", test:["Serial Monitor at 9600 prints cm.","Move your hand; the number changes."], trouble:["\"No such file\" → install HC-SR04.zip (download button above).","Always 0 → re-check Trig 12 / Echo 11."], extension:"Light the on-board LED (pin 13) only when something is closer than 10 cm — a simple proximity alarm. Hint: pinMode(13, OUTPUT) and digitalWrite based on sr04.Distance() < 10."},

  // ── Day 4 ────────────────────────────────────────────────
  {id:"final", day:4, lesson:"Final Project", title:"Light-Controlled Motor (LED + LDR)", goal:"Motor spins when light hits the LDR, stops when you block it.", materials:["Arduino UNO","breadboard","DC motor (the 'Fan Blade and 3-6V Motor')","L293D (16-pin chip stamped L293D)","photoresistor (LDR / photocell)","an LED (any color)","220Ω (red-red-brown) + 10kΩ (brown-black-orange) resistors","jumper wires"], wiring:[["L293D notch/dot","faces UP; chip straddles the center gap"],["L293D pin 1","D5"],["L293D pin 2","D6"],["L293D pin 3","motor wire 1"],["L293D pin 4","GND"],["L293D pin 5","GND"],["L293D pin 6","motor wire 2"],["L293D pin 7","D7"],["L293D pin 8","5V"],["L293D pin 12","GND"],["L293D pin 13","GND"],["L293D pin 16","5V"],["LDR one leg","5V"],["LDR other leg","A0 (also 10kΩ from A0 to GND)"],["LED: D3 → 220Ω → LED long leg","short leg → GND; aim the LED at the LDR"]], code:"const int lightLedPin = 3;\nconst int ldrPin = A0;\nconst int motorEnable = 5;\nconst int motorIn1 = 6;\nconst int motorIn2 = 7;\nint threshold = 765;   // <-- set this using the calibration sketch below\n\nvoid setup() {\n  pinMode(lightLedPin, OUTPUT);\n  pinMode(motorEnable, OUTPUT);\n  pinMode(motorIn1, OUTPUT);\n  pinMode(motorIn2, OUTPUT);\n  digitalWrite(lightLedPin, HIGH);\n  Serial.begin(9600);\n  digitalWrite(motorIn1, HIGH);\n  digitalWrite(motorIn2, LOW);\n}\n\nvoid loop() {\n  int lightValue = analogRead(ldrPin);\n  if (lightValue > threshold) {\n    analogWrite(motorEnable, 255);\n  } else {\n    analogWrite(motorEnable, 0);\n  }\n  delay(20);\n}", calibration:{note:"Do this FIRST. Upload this sketch, open the Serial Monitor at 9600, then note two numbers: with the LED shining on the LDR (num1), and with the beam blocked by your hand or a card (num2). Your threshold = (num1 + num2) / 2. Put that number in the main code's threshold line, then upload the main code.",code:"const int lightLedPin = 3;\n\nvoid setup() {\n  pinMode(lightLedPin, OUTPUT);\n  digitalWrite(lightLedPin, HIGH);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  Serial.println(analogRead(A0));\n  delay(100);\n}"}, test:["Calibrate first (use the calibration sketch in the code): note the BRIGHT value (num1) and the BLOCKED value (num2), then set threshold = (num1 + num2) / 2.","LED shines on the LDR → the motor spins.","Block the beam with your hand → the motor stops.","Remove your hand → the motor spins again."], trouble:["LED does not light → reverse the LED (long leg toward the 220Ω / D3 side).","Motor does not spin → verify all L293D connections: pins 8 & 16 to 5V, and pins 4, 5, 12, 13 to GND.","Motor spins the wrong direction → swap the two motor wires.","Motor never changes → recalibrate: run the calibration sketch and set threshold = (num1 + num2) / 2."], extension:"Add a second, lower threshold so the motor runs at HALF speed in dim light and full speed in bright light. Hint: analogWrite(en, 128) between the two thresholds, 255 above the top one."},
  {id:"sound", day:4, lesson:"Lesson 20", title:"Sound Sensor", optional:true, goal:"Detect a clap and read how loud it is.", materials:["Arduino UNO","Sound Sensor Module (small red board with a round microphone)","jumper wires"], wiring:[["Sensor +","5V"],["Sensor G","GND"],["Sensor A0","A0"],["Sensor D0","pin 3"]], code:"int a=A0, d=3, led=13;\nvoid setup(){ Serial.begin(9600); pinMode(d,INPUT); pinMode(led,OUTPUT); }\nvoid loop(){\n  Serial.println(analogRead(a));\n  digitalWrite(led, digitalRead(d)==HIGH ? HIGH : LOW);\n  delay(50);\n}", test:["Serial Monitor jumps on a clap.","Turn the blue dial to set sensitivity."], trouble:["LED never reacts → turn the blue dial.","No numbers → baud 9600."]},

  // ── Additional Exercises (fast finishers) ────────────────
  {
    id:"joystick", day:5, lesson:"Lesson 13", title:"Analog Joystick Module",
    goal:"Read X/Y position and the click button from a joystick.",
    materials:["Arduino UNO","Joystick Module (the black thumb-stick on a board)","jumper wires"],
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
    materials:["Arduino UNO","IR Receiver Module (tiny black dome on a small board)","Remote Control (the kit's black remote, or any TV remote)","jumper wires"],
    wiring:[["Receiver signal (S)","pin 11"],["Receiver +","5V"],["Receiver −","GND"]],
    code:
`#include <IRremote.hpp>   // this kit ships IRremote version 4

const int RECV_PIN = 11;

void setup() {
  Serial.begin(9600);
  // Start listening. ENABLE_LED_FEEDBACK blinks the on-board LED on each signal.
  IrReceiver.begin(RECV_PIN, ENABLE_LED_FEEDBACK);
}

void loop() {
  if (IrReceiver.decode()) {                          // did a code arrive?
    // decodedRawData is the full code for the button that was pressed
    Serial.println(IrReceiver.decodedIRData.decodedRawData, HEX);
    IrReceiver.resume();                              // ready for the next button
  }
}`,
    test:[
      "Open Serial Monitor at 9600.",
      "Point any TV remote at the receiver and press a button.",
      "A hex code appears for each button. The same button always gives the same code.",
    ],
    trouble:[
      "\"IRremote.hpp: No such file\" → install IRremote.zip (download button above).",
      "Nothing prints → receiver signal pin must be 11; point the remote straight at it.",
      "Shows 0 when a button is held → that is the repeat signal; press and release quickly instead.",
    ],
  },
  {
    id:"keypad", day:5, lesson:"Lesson 11", title:"Membrane Switch Module (Keypad)",
    goal:"Read which key is pressed on a 4×4 membrane keypad.",
    lib:"Keypad.zip",
    materials:["Arduino UNO","Membrane Switch Module (the flat 4×4 keypad with a ribbon)","jumper wires"],
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
    materials:["Arduino UNO","MAX7219 Module (the 8×8 red dot-grid board)","jumper wires"],
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
    materials:["Arduino UNO","LCD1602 Module (the blue text screen)","10K potentiometer (the blue knob marked 10K)","jumper wires"],
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
      "FIRST set the contrast: slowly turn the blue pot through its WHOLE range. The text fades in somewhere (often near one end).",
      "When contrast is right, line 1 shows \"Hello, EPIC!\" and line 2 shows \"Cal Poly 2026\".",
      "A blank screen — or a row of solid white/dark boxes — almost always just means the contrast isn't set yet, NOT that anything is broken.",
    ],
    trouble:[
      "Blank screen, OR a row of solid boxes → this is contrast, not a broken display. Turn the blue pot slowly all the way from one side to the other; the text appears somewhere in the lower-to-middle range.",
      "Turning the pot does nothing → V0 must go to the pot's MIDDLE leg, and the pot's TWO OUTER legs must go to 5V and GND. A loose outer leg means the knob has no effect.",
      "Backlight is off → LCD pin A (backlight +) to 5V, pin K (−) to GND.",
      "Random characters or only half the screen → a D4–D7 wire (pins 5, 4, 3, 2) or EN (pin 11) is loose. Unplug USB and push them all the way in.",
      "Still nothing → RW must go to GND, and re-seat every wire. The library is the built-in \"LiquidCrystal\" — installing LiquidCrystal.zip just adds the same one, so a missing library is not the cause.",
    ],
  },
  // ── Lesson 19 ──────────────────────────────────────────────
  {
    id:"rtc", day:5, lesson:"Lesson 19", title:"Real Time Clock (DS1307)",
    goal:"Keep real date and time running with the DS1307 clock chip, even after the Arduino loses power.",
    materials:["Arduino UNO","DS1307 RTC Module (the board with a round coin battery)","jumper wires"],
    wiring:[
      ["RTC SDA","A4"],
      ["RTC SCL","A5"],
      ["RTC VCC","5V"],
      ["RTC GND","GND"],
    ],
    code:
`#include <Wire.h>   // built-in I2C library — no .ZIP needed

// The DS1307 talks over I2C at address 0x68 (SDA→A4, SCL→A5).
const int DS1307 = 0x68;

// The chip stores each number in "BCD" (each decimal digit in 4 bits).
byte bcdToDec(byte b) { return (b >> 4) * 10 + (b & 0x0F); }
byte decToBcd(byte d) { return ((d / 10) << 4) | (d % 10); }

const char* dayNames[] = { "Sun","Mon","Tue","Wed","Thu","Fri","Sat" };

void setup() {
  Wire.begin();
  Serial.begin(9600);

  // SET THE TIME ONCE: uncomment the next line, upload, then RE-COMMENT it and
  // upload again so the time does not reset every restart.
  // Order: second, minute, hour, dayOfWeek(1-7), date, month, year(00-99)
  // setTime(0, 0, 9, 4, 1, 7, 26);   // 09:00:00  Wed  1 July 2026
}

void loop() {
  // ask the chip for its 7 time registers, starting at register 0
  Wire.beginTransmission(DS1307);
  Wire.write(0);
  Wire.endTransmission();
  Wire.requestFrom(DS1307, 7);

  byte second = bcdToDec(Wire.read() & 0x7F);   // top bit is the stop flag
  byte minute = bcdToDec(Wire.read());
  byte hour   = bcdToDec(Wire.read() & 0x3F);   // 24-hour mode
  byte dow    = bcdToDec(Wire.read());
  byte date   = bcdToDec(Wire.read());
  byte month  = bcdToDec(Wire.read());
  byte year   = bcdToDec(Wire.read());

  if (hour < 10)   Serial.print('0');
  Serial.print(hour);   Serial.print(':');
  if (minute < 10) Serial.print('0');
  Serial.print(minute); Serial.print(':');
  if (second < 10) Serial.print('0');
  Serial.print(second);
  Serial.print("  ");
  Serial.print(dayNames[dow - 1]);
  Serial.print("  20"); Serial.print(year);
  Serial.print('-'); Serial.print(month);
  Serial.print('-'); Serial.println(date);

  delay(1000);
}

// Writes the time into the DS1307. Uncomment the call in setup() to use it.
void setTime(byte s, byte m, byte h, byte dow, byte d, byte mo, byte yr) {
  Wire.beginTransmission(DS1307);
  Wire.write(0);
  Wire.write(decToBcd(s));   // writing seconds also starts the clock
  Wire.write(decToBcd(m));
  Wire.write(decToBcd(h));
  Wire.write(decToBcd(dow));
  Wire.write(decToBcd(d));
  Wire.write(decToBcd(mo));
  Wire.write(decToBcd(yr));
  Wire.endTransmission();
}`,
    test:[
      "Serial Monitor at 9600 → the time advances one second at a time.",
      "First run shows a frozen or odd time? Set it: uncomment the setTime(...) line, upload, then re-comment it and upload again.",
      "Unplug USB, wait 10 seconds, plug back in → the clock kept counting (the coin battery keeps it alive).",
    ],
    trouble:[
      "Time stuck at 00:00:00 or wild numbers → the clock is stopped/unset. Run the setTime(...) line once, then re-comment it.",
      "Nothing prints, or the same wrong values every time → SDA must be on A4 and SCL on A5 (those are the Arduino's I2C pins).",
      "Time resets every time you open the Serial Monitor → the setTime(...) line is still uncommented; comment it out and re-upload.",
      "Loses time after unplugging → the coin battery is dead or missing; seat a fresh CR2032.",
    ],
    challenge:{
      prompt:"Inside loop() you already have the numbers hour, minute, second. Add a greeting that changes with the time of day — fill in the blanks:",
      code:
`if (hour >= ___ && hour < 12) {
  Serial.println("Good morning!");
} else if (hour >= 12 && hour < ___) {
  Serial.println("Good afternoon!");
} else {
  Serial.println("___");
}

// Think about it:
// 1. Why does the chip store numbers in BCD instead of plain binary?
// 2. SDA and SCL are shared by MANY I2C chips at once. How does the Arduino
//    know it is talking to THIS clock and not some other chip?  (hint: 0x68)`,
    },
  },

    // ── Lesson 20 ──────────────────────────────────────────────
  {
    id:"sound_sensor", day:5, lesson:"Lesson 20", title:"Sound Sensor — Volume Bar",
    goal:"Read sound level two ways (analog and digital) and visualize volume.",
    materials:["Arduino UNO","Sound Sensor Module (small red board with a round microphone)","jumper wires"],
    wiring:[
      ["Sensor + (VCC)","5V"],
      ["Sensor G (GND)","GND"],
      ["Sensor A0","Arduino A0"],
      ["Sensor D0","Arduino pin 3"],
    ],
    code:
`// The sound sensor has TWO outputs:
//   A0 (analog)  → a number 0–1023 showing volume level
//   D0 (digital) → HIGH or LOW (is it louder than the dial threshold?)

int analogPin = A0;
int digitalPin = 3;

void setup() {
  Serial.begin(9600);
  pinMode(digitalPin, INPUT);
}

void loop() {
  int volume = analogRead(analogPin);   // 0 = silence, 1023 = loudest possible

  // Build a simple bar chart using # characters
  // map() scales 0–1023 to 0–20 (bar length)
  int barLength = map(volume, 0, 1023, 0, 20);

  Serial.print("Volume: [");
  for (int i = 0; i < 20; i++) {
    Serial.print(i < barLength ? "#" : " ");
  }
  Serial.print("] ");
  Serial.print(volume);

  // D0 tells us if the sound crossed the threshold set by the blue dial
  if (digitalRead(digitalPin) == HIGH) {
    Serial.print("  << CLAP!");
  }
  Serial.println();

  delay(80);
}`,
    test:[
      "Serial Monitor at 9600 → a bar of # characters grows when you speak or clap.",
      "Turn the blue dial on the sensor to adjust sensitivity.",
      "Clap loudly → '<< CLAP!' appears at the end of the line.",
    ],
    trouble:[
      "Bar never moves → A0 (analog out) must go to Arduino A0.",
      "CLAP never triggers → turn the blue dial and clap closer to the sensor.",
    ],
    challenge:{
      prompt:"Right now the bar uses 20 slots. Change it to show a percentage (0–100%) instead, and add a label so the output looks like  'Volume: 47%':",
      code:
`// Replace the bar section with this:
int percent = map(volume, 0, ___, 0, ___);   // scale to 0–100

Serial.print("Volume: ");
Serial.print(percent);
Serial.println("___");   // what character makes it look like a percent?

// Now try: at what percent does a normal speaking voice land?
// At what percent does a clap land?`,
    },
  },

  // ── Lesson 23 ──────────────────────────────────────────────
  {
    id:"thermometer", day:5, lesson:"Lesson 23", title:"Thermometer (Thermistor)",
    goal:"Turn a thermistor's changing resistance into a real temperature in C and F.",
    materials:["Arduino UNO","breadboard","thermistor (tiny black bead with 2 legs — kit label: Thermistor)","10kΩ resistor (brown-black-orange)","jumper wires"],
    wiring:[
      ["Thermistor leg 1","5V"],
      ["Thermistor leg 2","A0 row"],
      ["10kΩ resistor (brown-black-orange)","that same A0 row → GND"],
    ],
    code:
`#include <math.h>   // gives us log()

int thermistorPin = A0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(thermistorPin);        // 0-1023

  // Step 1: the thermistor + 10k resistor form a voltage divider.
  //         Work out the thermistor's resistance from the reading.
  float resistance = 10000.0 * (1023.0 / raw - 1.0);

  // Step 2: the Beta equation turns resistance into temperature.
  //   R0 = 10000 ohms at 25 C (298.15 K),  Beta = 3950
  float steinhart;
  steinhart = resistance / 10000.0;           // R / R0
  steinhart = log(steinhart);                 // ln(R / R0)
  steinhart = steinhart / 3950.0;             // (1 / Beta) * ln(R / R0)
  steinhart = steinhart + (1.0 / 298.15);     // + 1 / T0
  steinhart = 1.0 / steinhart;                // flip to get Kelvin

  float tempC = steinhart - 273.15;           // Kelvin -> Celsius
  float tempF = tempC * 9.0 / 5.0 + 32.0;

  Serial.print("Raw: ");
  Serial.print(raw);
  Serial.print("   ");
  Serial.print(tempC, 1);
  Serial.print(" C  /  ");
  Serial.print(tempF, 1);
  Serial.println(" F");

  delay(1000);
}`,
    test:[
      "Serial Monitor at 9600 → temperature prints every second.",
      "Pinch the thermistor between your fingers → the temperature slowly rises.",
      "Room temperature should read roughly 20–25 C (68–77 F).",
    ],
    trouble:[
      "Reading is way off or 'nan' → thermistor and 10k must share the A0 row (10k: A0→GND, thermistor: 5V→A0).",
      "Temperature moves the wrong way → the thermistor and resistor positions are swapped.",
      "Worried about polarity → a thermistor has no + or −; either leg can face 5V.",
    ],
    challenge:{
      prompt:"The temperature is built up one line at a time. Answer these, then check with the Serial Monitor:",
      code:
`// 1. When the room gets HOTTER, an NTC thermistor's resistance goes
//    ___ (up / down), so the raw analogRead value goes ___ (up / down).

// 2. At the middle reading (raw = 512), roughly what resistance does
//    Step 1 give?   resistance = 10000 * (1023/512 - 1) = about ___ ohms
//    (Notice: near the middle, the thermistor is about equal to the 10k.)

// 3. Add a "too warm" alert to the loop():
if (tempC > ___) {
  Serial.println("It is getting warm in here!");
}

// Bonus: why does this use log()?  Hint: equal steps in temperature do
// NOT cause equal steps in resistance — a thermistor is not linear.`,
    },
  },

  // ── Lesson 29 ──────────────────────────────────────────────
  {
    id:"dc_motor", day:5, lesson:"Lesson 29", title:"DC Motor — Speed & Direction",
    goal:"Control motor speed with a knob and understand how the L293D driver works.",
    materials:["Arduino UNO","L293D (16-pin chip stamped L293D)","DC motor (the 'Fan Blade and 3-6V Motor')","10K potentiometer (the blue knob marked 10K)","breadboard","jumper wires"],
    wiring:[
      ["L293D pin 1 (Enable A)","Arduino D5 (PWM ~)"],
      ["L293D pin 2 (IN1)","Arduino D6"],
      ["L293D pin 7 (IN2)","Arduino D7"],
      ["L293D pins 3 & 6 (OUT)","motor wires"],
      ["L293D pins 8 & 16","5V"],
      ["L293D pins 4,5,12,13","GND"],
      ["Pot middle leg","A0"],
      ["Pot outer legs","5V and GND"],
    ],
    code:
`// The L293D is a "motor driver chip" that lets a small Arduino signal
// control the large current a motor needs.
//
// Enable pin (5): controls SPEED via PWM
//   analogWrite(5, 0)   → stopped
//   analogWrite(5, 128) → half speed
//   analogWrite(5, 255) → full speed
//
// IN1 & IN2 (6 & 7): control DIRECTION
//   IN1=HIGH, IN2=LOW  → forward
//   IN1=LOW,  IN2=HIGH → reverse

int enablePin = 5;   // speed  (must be a ~ PWM pin)
int in1 = 6;         // direction A
int in2 = 7;         // direction B
int potPin = A0;     // knob

void setup() {
  Serial.begin(9600);
  pinMode(enablePin, OUTPUT);
  pinMode(in1, OUTPUT);
  pinMode(in2, OUTPUT);

  digitalWrite(in1, HIGH);   // spin forward
  digitalWrite(in2, LOW);
}

void loop() {
  int knob  = analogRead(potPin);           // 0–1023
  int speed = map(knob, 0, 1023, 0, 255);  // scale to PWM range

  analogWrite(enablePin, speed);

  Serial.print("Knob: "); Serial.print(knob);
  Serial.print("   Speed (0-255): "); Serial.println(speed);
  delay(100);
}`,
    test:[
      "Turn the knob slowly from 0 to max → motor speeds up smoothly.",
      "Knob at zero → motor stops completely.",
      "Serial Monitor shows knob value and speed side by side.",
      "Try swapping the IN1/IN2 wires → motor spins the other way.",
    ],
    trouble:[
      "Motor doesn’t spin at all → check L293D pins 8 and 16 are both on 5V.",
      "Motor starts then board resets → ask your instructor for a separate motor power supply.",
      "Motor only runs at full speed → make sure enablePin is on a ~ (PWM) pin.",
    ],
    challenge:{
      prompt:"Add a push button on pin 9 to flip the motor direction when pressed. Fill in the blanks:",
      code:
`// Add to setup():
pinMode(9, INPUT_PULLUP);

// Add inside loop(), before the analogWrite:
if (digitalRead(9) == ___) {    // INPUT_PULLUP: LOW when pressed, or HIGH?
  digitalWrite(in1, ___);       // to reverse, swap these two values
  digitalWrite(in2, ___);
  delay(300);                    // short pause so one press = one direction flip
}

// Questions to think about:
// 1. Why does analogWrite(enablePin, 50) still not move the motor sometimes?
//    (Think about static friction vs kinetic friction)
// 2. What would happen if you set IN1=HIGH and IN2=HIGH at the same time?
//    (Check the L293D datasheet if you're curious)`,
    },
  },

  // ── Lesson 24 ──────────────────────────────────────────────
  {
    id:"servo", day:5, lesson:"Lesson 9", title:"Servo Motor (SG90)",
    goal:"Sweep a servo arm back and forth, then steer it with a potentiometer.",
    materials:["Arduino UNO","Servo Motor SG90 (small blue servo with a white arm)","jumper wires","(optional) 10K potentiometer — the blue knob marked 10K"],
    wiring:[
      ["Servo signal (orange)","pin 9"],
      ["Servo VCC (red)","5V"],
      ["Servo GND (brown)","GND"],
    ],
    code:
`#include <Servo.h>   // built into the Arduino IDE — no .ZIP needed

Servo myServo;

void setup() {
  myServo.attach(9);   // servo signal wire on pin 9
}

void loop() {
  // sweep from 0 to 180 degrees
  for (int angle = 0; angle <= 180; angle++) {
    myServo.write(angle);
    delay(15);
  }
  // sweep back from 180 to 0
  for (int angle = 180; angle >= 0; angle--) {
    myServo.write(angle);
    delay(15);
  }
}`,
    test:[
      "The servo arm sweeps smoothly from one side to the other and back, forever.",
      "Change delay(15) to delay(5) — the sweep gets faster.",
    ],
    trouble:[
      "Servo jitters or the board resets → a servo pulls a lot of current; unplug other parts, or ask for a separate 5V supply.",
      "No movement → signal (orange) on pin 9, red to 5V, brown to GND.",
    ],
    challenge:{
      prompt:"Add a potentiometer (middle leg → A0, outer legs → 5V and GND) and steer the servo by hand. Fill in the blanks:",
      code:
`// Replace loop() with this:
void loop() {
  int knob = analogRead(A0);              // 0 to ___
  int angle = map(knob, 0, ___, 0, 180);  // scale the knob to a servo angle
  myServo.write(angle);
  delay(15);
}

// Think about it: a servo listens to pulse WIDTH, not voltage.
// write(0) sends a ~1 ms pulse, write(180) a ~2 ms pulse. Why pulses?`,
    },
  },

  // ── Lesson 26 ──────────────────────────────────────────────
  {
    id:"stepper", day:5, lesson:"Lesson 31", title:"Stepper Motor (28BYJ-48)",
    goal:"Turn a stepper motor an exact amount using the ULN2003 driver board.",
    materials:["Arduino UNO","Stepper Motor (the silver can, 28BYJ-48)","ULN2003 Stepper Motor Driver Module (green board with 4 LEDs)","jumper wires"],
    wiring:[
      ["ULN2003 IN1","pin 8"],
      ["ULN2003 IN2","pin 9"],
      ["ULN2003 IN3","pin 10"],
      ["ULN2003 IN4","pin 11"],
      ["ULN2003 + (VCC)","5V"],
      ["ULN2003 − (GND)","GND"],
      ["Motor plug","into the ULN2003 white socket"],
    ],
    code:
`#include <Stepper.h>   // built into the Arduino IDE — no .ZIP needed

// The 28BYJ-48 takes about 2048 steps for one full turn.
const int stepsPerRev = 2048;

// NOTE the pin order: IN1, IN3, IN2, IN4  (8, 10, 9, 11).
// That order gives the motor the correct step sequence.
Stepper myStepper(stepsPerRev, 8, 10, 9, 11);

void setup() {
  myStepper.setSpeed(10);   // 10 RPM
  Serial.begin(9600);
}

void loop() {
  Serial.println("One full turn clockwise");
  myStepper.step(stepsPerRev);
  delay(1000);

  Serial.println("One full turn back");
  myStepper.step(-stepsPerRev);
  delay(1000);
}`,
    test:[
      "The motor turns one full revolution one way, pauses, then turns back.",
      "The four LEDs on the ULN2003 board chase in a circle as it steps.",
    ],
    trouble:[
      "Motor buzzes but doesn't turn → the pin order must be 8, 10, 9, 11 (IN1, IN3, IN2, IN4).",
      "Nothing happens → the motor plug must be fully seated in the white socket; + and − to 5V/GND.",
    ],
    challenge:{
      prompt:"A full turn is 2048 steps. Work out the steps for part-turns and fill in the blanks:",
      code:
`// Quarter turn (90 degrees):
myStepper.step(2048 / ___);   // how many steps?

// Half turn (180 degrees):
myStepper.step(2048 / ___);

// A negative number turns the other way. Turn exactly 45 degrees:
myStepper.step(___);

// Think about it: why is a stepper better than a plain DC motor when you
// need to stop at an EXACT position (like the hand of a clock)?`,
    },
  },

  // ── Lesson 16 ──────────────────────────────────────────────
  {
    id:"shift_register", day:5, lesson:"Lesson 24", title:"Shift Register (74HC595) — 8 LEDs, 3 pins",
    goal:"Control 8 LEDs with only 3 Arduino pins, and watch them count in binary.",
    materials:["Arduino UNO","breadboard","74HC595 IC (16-pin chip stamped 74HC595)","8 LEDs (any colors)","8× 220Ω resistors (red-red-brown)","jumper wires"],
    wiring:[
      ["74HC595 pin 14 (DS, data)","pin 4"],
      ["74HC595 pin 11 (SHCP, clock)","pin 6"],
      ["74HC595 pin 12 (STCP, latch)","pin 5"],
      ["74HC595 pin 16 (VCC) & pin 10 (MR)","5V"],
      ["74HC595 pin 8 (GND) & pin 13 (OE)","GND"],
      ["Outputs Q0–Q7","each → 220Ω → an LED → GND"],
    ],
    code:
`// A shift register turns 3 pins into 8 outputs.
// You send 8 bits one at a time (shift), then "latch" them to the LEDs.

int dataPin  = 4;   // DS   (chip pin 14)
int clockPin = 6;   // SHCP (chip pin 11)
int latchPin = 5;   // STCP (chip pin 12)

void setup() {
  pinMode(dataPin, OUTPUT);
  pinMode(clockPin, OUTPUT);
  pinMode(latchPin, OUTPUT);
}

void loop() {
  // count 0 to 255 — the LEDs show each number in binary
  for (int number = 0; number < 256; number++) {
    digitalWrite(latchPin, LOW);                    // hold the outputs
    shiftOut(dataPin, clockPin, MSBFIRST, number);  // push all 8 bits
    digitalWrite(latchPin, HIGH);                   // show them at once
    delay(200);
  }
}`,
    test:[
      "The 8 LEDs count up in binary: 1, 10, 11, 100, … like a binary odometer.",
      "The rightmost LED toggles every step; the next toggles half as often, and so on.",
    ],
    trouble:[
      "Random or no pattern → re-check pins 16 & 10 to 5V and pins 8 & 13 to GND.",
      "LEDs dim or dark → each LED needs its own 220Ω resistor, long leg toward the chip output.",
    ],
    challenge:{
      prompt:"Instead of counting, show your own patterns. A byte is 8 bits — one per LED (1 = on). Fill in the blanks:",
      code:
`// Every OTHER LED on (binary 10101010):
shiftOut(dataPin, clockPin, MSBFIRST, 0b________);  // 8 digits

// Only the two end LEDs (binary 10000001):
shiftOut(dataPin, clockPin, MSBFIRST, 0b________);

// Questions:
// 1. What number (0-255) lights ALL eight LEDs?  ___
// 2. MSBFIRST sends the biggest bit first. What changes with LSBFIRST?
// 3. How can 3 wires control 8 LEDs? What is the clock pin actually doing?`,
    },
  },

  // ── Lesson 8: 1-digit 7-segment ───────────────────────────
  {
    id:"seven_seg", day:5, lesson:"Lesson 27", title:"7-Segment Display (1 digit)",
    goal:"Light the seven bars of a digit to show the numbers 0-9.",
    materials:["Arduino UNO","breadboard","1 Digit 7-Segment Display (a single red digit block)","220Ω resistor (red-red-brown)","jumper wires"],
    wiring:[
      ["Segment a","pin 2"],
      ["Segment b","pin 3"],
      ["Segment c","pin 4"],
      ["Segment d","pin 5"],
      ["Segment e","pin 6"],
      ["Segment f","pin 7"],
      ["Segment g","pin 8"],
      ["Common (either COM pin) → 220Ω →","GND"],
    ],
    code:
`// A 7-segment digit is just 7 little bars named a-g. Turn on the right
// bars and you draw any number. This display is "common cathode":
// a segment lights when its pin is HIGH and the common pin is at GND.

int seg[7] = {2, 3, 4, 5, 6, 7, 8};   // pins for a, b, c, d, e, f, g

// 1 = that bar ON, for each digit 0-9  (order: a b c d e f g)
byte pattern[10][7] = {
  {1,1,1,1,1,1,0}, // 0
  {0,1,1,0,0,0,0}, // 1
  {1,1,0,1,1,0,1}, // 2
  {1,1,1,1,0,0,1}, // 3
  {0,1,1,0,0,1,1}, // 4
  {1,0,1,1,0,1,1}, // 5
  {1,0,1,1,1,1,1}, // 6
  {1,1,1,0,0,0,0}, // 7
  {1,1,1,1,1,1,1}, // 8
  {1,1,1,1,0,1,1}, // 9
};

void setup() {
  for (int i = 0; i < 7; i++) pinMode(seg[i], OUTPUT);
}

void show(int n) {
  for (int i = 0; i < 7; i++) digitalWrite(seg[i], pattern[n][i]);
}

void loop() {
  for (int n = 0; n <= 9; n++) {   // count 0..9
    show(n);
    delay(1000);
  }
}`,
    test:[
      "The display counts 0, 1, 2 … up to 9, one per second, then repeats.",
      "Look closely: each number is just a different set of the seven bars lit.",
    ],
    trouble:[
      "Some bars never light → that segment's wire is loose, or a-g are not on pins 2-8 in order.",
      "Whole display dark → the common pin must go through the 220Ω resistor to GND (this is a common-cathode display).",
      "It shows a mirror/garbled number → your segment order is off; re-check which pin is a, b, c …",
    ],
    challenge:{
      prompt:"Add your own symbol. Fill in a pattern (1 = bar on) for the letter that looks like the number — e.g. draw a capital 'C':",
      code:
`void showC() {
  // a=1, b=0, c=0, d=1, e=1, f=1, g=0  draws a C
  byte c[7] = { ___, ___, ___, ___, ___, ___, ___ };
  for (int i = 0; i < 7; i++) digitalWrite(seg[i], c[i]);
}

// Which bars make an 'H'? An 'E'? Sketch the 7 bars on paper first.`,
    },
  },

  // ── Lesson 9: 4-digit 7-segment (advanced) ────────────────
  {
    id:"seven_seg4", day:5, lesson:"Lesson 28", title:"4-Digit 7-Segment Display (advanced)",
    lib:"SevSeg.zip",
    goal:"Show a whole 4-digit number. This one has the most wiring in the kit — go slow and check twice.",
    materials:["Arduino UNO","breadboard","4 Digit 7-Segment Display (four red digits in one block)","4× 220Ω resistors (red-red-brown)","jumper wires"],
    wiring:[
      ["Segment a","pin 6"],
      ["Segment b","pin 7"],
      ["Segment c","pin 8"],
      ["Segment d","pin 9"],
      ["Segment e","pin 10"],
      ["Segment f","pin 11"],
      ["Segment g","pin 12"],
      ["Segment dp","pin 13"],
      ["Digit 1 (leftmost) → 220Ω →","pin 2"],
      ["Digit 2 → 220Ω →","pin 3"],
      ["Digit 3 → 220Ω →","pin 4"],
      ["Digit 4 (rightmost) → 220Ω →","pin 5"],
    ],
    code:
`#include "SevSeg.h"   // install SevSeg.zip first
SevSeg sevseg;

void setup() {
  byte numDigits = 4;
  byte digitPins[]   = {2, 3, 4, 5};                 // the 4 digit-select pins
  byte segmentPins[] = {6, 7, 8, 9, 10, 11, 12, 13}; // a,b,c,d,e,f,g,dp
  // COMMON_CATHODE display; the 220Ω resistors are on the digit pins (false).
  sevseg.begin(COMMON_CATHODE, numDigits, digitPins, segmentPins, false);
  sevseg.setBrightness(90);
}

void loop() {
  sevseg.setNumber(2026, -1);   // show 2026 (-1 = no decimal point)
  sevseg.refreshDisplay();      // MUST run every loop to keep all 4 digits lit
}`,
    test:[
      "All four digits show 2026, steady and bright.",
      "The trick: only ONE digit is truly lit at any instant — refreshDisplay() flashes them so fast your eye blends all four. That is called multiplexing.",
    ],
    trouble:[
      "\"SevSeg.h: No such file\" → install SevSeg.zip (download button above).",
      "Digits flicker or only one lights → refreshDisplay() must run every loop, with NO long delay() in loop().",
      "Wrong or missing segments → a bare 4-digit display's pin order is not obvious; ask an instructor to help match segments a-g and digits 1-4 to the pins above.",
      "Dim or uneven → raise setBrightness, and make sure a 220Ω resistor is on each of the 4 digit pins.",
    ],
    challenge:{
      prompt:"Turn it into a rough stopwatch that counts seconds since power-on. Fill in the blanks:",
      code:
`void loop() {
  int seconds = millis() / ______;   // milliseconds per second?
  sevseg.setNumber(seconds, -1);
  sevseg.refreshDisplay();
}

// Why can't we use delay(1000) to count seconds here?
// (hint: what happens to refreshDisplay() while the code is delaying?)`,
    },
  },

  // ── Lesson 21: PIR motion sensor ──────────────────────────
  {
    id:"pir", day:5, lesson:"Lesson 17", title:"PIR Motion Sensor (HC-SR501)",
    goal:"Detect movement with a passive-infrared sensor and light the on-board LED.",
    materials:["Arduino UNO","HC-SR501 PIR Motion Sensor (the white half-dome lens)","jumper wires"],
    wiring:[
      ["PIR OUT (middle pin)","pin 2"],
      ["PIR VCC","5V"],
      ["PIR GND","GND"],
    ],
    code:
`// The HC-SR501 outputs HIGH when it sees warm movement (like a person),
// and LOW when everything is still.

int pirPin = 2;
int led = 13;   // the Arduino's built-in LED

void setup() {
  pinMode(pirPin, INPUT);
  pinMode(led, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (digitalRead(pirPin) == HIGH) {
    digitalWrite(led, HIGH);
    Serial.println("Motion detected!");
  } else {
    digitalWrite(led, LOW);
  }
  delay(200);
}`,
    test:[
      "Wave a hand in front of the white dome → the on-board LED lights and \"Motion detected!\" prints.",
      "Hold completely still → after a moment the LED turns back off.",
      "The two orange knobs set sensitivity and how long it stays on. Turn them slowly to explore.",
    ],
    trouble:[
      "LED stuck on right after upload → a PIR needs about 30-60 seconds to settle when first powered; wait, then keep still.",
      "Never triggers → OUT is the MIDDLE pin; VCC and GND are the outer two (check the tiny labels under the sensor).",
      "Triggers at everything or only briefly → adjust the two orange trim knobs on the back.",
    ],
    challenge:{
      prompt:"Count each NEW motion event (not every loop) and print the total. Fill in the blanks:",
      code:
`int count = 0;
int lastState = LOW;

void loop() {
  int state = digitalRead(pirPin);
  if (state == HIGH && lastState == ____) {   // only the moment it turns on
    count = count + ___;
    Serial.print("Motion events: ");
    Serial.println(count);
  }
  lastState = _____;                           // remember for next loop
  delay(50);
}

// Why count only when it JUST changed, instead of every HIGH reading?`,
    },
  },

  // ── Lesson 30: relay ──────────────────────────────────────
  {
    id:"relay", day:5, lesson:"Lesson 30", title:"5V Relay — Switch Big Things",
    goal:"Use a tiny Arduino signal to flip a relay (a remote-controlled switch) on and off — you will hear it click.",
    materials:["Arduino UNO","5V Relay (the blue box with a clicking switch)","jumper wires"],
    wiring:[
      ["Relay IN (signal)","pin 7"],
      ["Relay VCC","5V"],
      ["Relay GND","GND"],
    ],
    code:
`// A relay is an electrically-controlled switch. The Arduino cannot power a
// lamp or motor directly, but it CAN tell a relay to switch one on.

int relayPin = 7;

void setup() {
  pinMode(relayPin, OUTPUT);
}

void loop() {
  digitalWrite(relayPin, HIGH);   // relay ON  — you hear a click
  delay(1000);
  digitalWrite(relayPin, LOW);    // relay OFF — click again
  delay(1000);
}`,
    test:[
      "The relay clicks once per second and its little LED blinks with it.",
      "That click is a metal contact opening and closing — the same contact that would switch a real lamp.",
    ],
    trouble:[
      "No click → VCC to 5V, GND to GND, IN to pin 7.",
      "Clicks the opposite of what you expect → some relay boards are \"active LOW\"; swap HIGH and LOW in the code.",
      "Do NOT wire wall/mains power. This exercise is only the low-voltage clicking. Ask an instructor before switching anything real.",
    ],
    challenge:{
      prompt:"Make the relay beat like a heart: two quick clicks, then a long pause. Fill in the blanks:",
      code:
`void loop() {
  for (int i = 0; i < ___; i++) {   // how many quick clicks per beat?
    digitalWrite(relayPin, HIGH);
    delay(120);
    digitalWrite(relayPin, LOW);
    delay(120);
  }
  delay(_____);                      // long pause (ms) before the next beat
}

// A 5V relay lets the Arduino control a 120V lamp. Why keep the Arduino
// side and the switched side completely separate?`,
    },
  },

  // ── Lesson 31: tilt ball switch ───────────────────────────
  {
    id:"tilt", day:5, lesson:"Lesson 8", title:"Tilt Ball Switch",
    goal:"Detect when the board is tipped over, using a tiny rolling ball inside a switch.",
    materials:["Arduino UNO","Tilt Ball Switch (small metal can with 2 legs)","jumper wires"],
    wiring:[
      ["Tilt switch leg 1","pin 2"],
      ["Tilt switch leg 2","GND"],
    ],
    code:
`// Inside the tilt switch is a metal ball. Level, it bridges the two legs
// (closed); tipped, the ball rolls away (open).
// INPUT_PULLUP makes an OPEN pin read HIGH.

int tiltPin = 2;
int led = 13;

void setup() {
  pinMode(tiltPin, INPUT_PULLUP);
  pinMode(led, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (digitalRead(tiltPin) == HIGH) {
    Serial.println("Tilted!");
    digitalWrite(led, HIGH);
  } else {
    Serial.println("Level");
    digitalWrite(led, LOW);
  }
  delay(150);
}`,
    test:[
      "Hold it upright/level → \"Level\". Tip it over → \"Tilted!\" and the LED lights.",
      "It is really just an on/off switch that gravity controls.",
    ],
    trouble:[
      "Always the same reading → the switch has no + or −; just check one leg is on pin 2 and the other on GND.",
      "Flips back and forth quickly → the ball bounces; the challenge below shows how to handle that.",
    ],
    challenge:{
      prompt:"Count tips, but ignore the bounces. Fill in the blanks:",
      code:
`int tips = 0;
int last = LOW;

void loop() {
  int now = digitalRead(tiltPin);
  if (now == HIGH && last == ____) {
    tips++;
    Serial.println(tips);
    delay(___);          // ignore bounces for a moment
  }
  last = now;
}

// Waiting a moment after a change is called "debouncing." Why is it needed?`,
    },
  },

  // ── Lesson 32: rotary encoder ─────────────────────────────
  {
    id:"encoder", day:5, lesson:"Lesson 33", title:"Rotary Encoder",
    goal:"Read which way you turn a knob, and how far — the kind of endless knob used for volume dials.",
    materials:["Arduino UNO","Rotary Encoder Module (a knob you turn AND can press)","jumper wires"],
    wiring:[
      ["Encoder CLK","pin 2"],
      ["Encoder DT","pin 3"],
      ["Encoder SW (push)","pin 4"],
      ["Encoder +","5V"],
      ["Encoder GND","GND"],
    ],
    code:
`// An encoder has two signals, CLK and DT. At the instant CLK changes, DT
// tells us the DIRECTION the knob turned.

int clkPin = 2, dtPin = 3, swPin = 4;
int counter = 0;
int lastClk;

void setup() {
  pinMode(clkPin, INPUT);
  pinMode(dtPin, INPUT);
  pinMode(swPin, INPUT_PULLUP);
  Serial.begin(9600);
  lastClk = digitalRead(clkPin);
}

void loop() {
  int clk = digitalRead(clkPin);
  if (clk != lastClk) {                       // knob moved one notch
    if (digitalRead(dtPin) != clk) counter++;  // clockwise
    else counter--;                            // counter-clockwise
    Serial.println(counter);
  }
  lastClk = clk;

  if (digitalRead(swPin) == LOW) {            // press the knob = reset
    counter = 0;
    Serial.println("reset");
    delay(200);
  }
}`,
    test:[
      "Turn the knob one way → the number counts up; the other way → it counts down.",
      "Press the knob straight down → it resets to 0.",
    ],
    trouble:[
      "Number jumps by 2 or skips → normal for cheap encoders; turn slowly. CLK on pin 2, DT on pin 3.",
      "Counts the wrong direction → swap the CLK and DT wires (or swap counter++ and counter--).",
      "Button does nothing → SW to pin 4; it uses INPUT_PULLUP so a press reads LOW.",
    ],
    challenge:{
      prompt:"Keep the counter between 0 and 20, like a volume knob that stops at the ends. Fill in the blanks:",
      code:
`if (digitalRead(dtPin) != clk) counter++;
else counter--;

if (counter > ___) counter = 20;   // don't go above the top
if (counter < ___) counter = 0;    // don't go below the bottom

// The knob spins forever, but the value stops at 0 and 20. This "clamping"
// is everywhere in software. Where have you seen a value that can't go past a limit?`,
    },
  },

  // ── Lesson 33: MPU6050 accelerometer / gyro ───────────────
  {
    id:"mpu6050", day:5, lesson:"Lesson 16", title:"Accelerometer / Gyro (GY-521)",
    goal:"Read tilt and motion as real numbers from the GY-521 (MPU6050) over I2C.",
    materials:["Arduino UNO","GY-521 Module (small blue board, aka MPU6050)","jumper wires"],
    wiring:[
      ["GY-521 SDA","A4"],
      ["GY-521 SCL","A5"],
      ["GY-521 VCC","5V"],
      ["GY-521 GND","GND"],
    ],
    code:
`#include <Wire.h>   // built-in I2C library — no .ZIP needed

const int MPU = 0x68;   // the chip's I2C address

void setup() {
  Wire.begin();
  Wire.beginTransmission(MPU);
  Wire.write(0x6B);   // power-management register
  Wire.write(0);      // 0 = wake the chip up
  Wire.endTransmission();
  Serial.begin(9600);
}

void loop() {
  // ask for the 6 acceleration bytes, starting at register 0x3B
  Wire.beginTransmission(MPU);
  Wire.write(0x3B);
  Wire.endTransmission();
  Wire.requestFrom(MPU, 6);

  // read the bytes IN ORDER, then join each high+low pair into one number
  byte xHigh = Wire.read();
  byte xLow  = Wire.read();
  byte yHigh = Wire.read();
  byte yLow  = Wire.read();
  byte zHigh = Wire.read();
  byte zLow  = Wire.read();

  int x = (xHigh << 8) | xLow;
  int y = (yHigh << 8) | yLow;
  int z = (zHigh << 8) | zLow;

  Serial.print("X="); Serial.print(x);
  Serial.print("  Y="); Serial.print(y);
  Serial.print("  Z="); Serial.println(z);
  delay(200);
}`,
    test:[
      "Serial Monitor at 9600 → three numbers X, Y, Z.",
      "Tilt the board different ways → the numbers change. Lying flat, Z is a big value — that is gravity pulling straight down.",
      "Tap or shake it → the numbers jump.",
    ],
    trouble:[
      "All zeros or no output → SDA to A4, SCL to A5 (the I2C pins); VCC to 5V, GND to GND.",
      "Numbers frozen → keep the two wake-up lines in setup() (writing 0 to register 0x6B).",
      "Values swing between +32767 and -32768 → that axis is at its limit; that is normal.",
    ],
    challenge:{
      prompt:"Print SHAKE! only when the board is moved hard. The values are about 16384 per 1 g. Fill in the blanks:",
      code:
`// abs() gives the size of a number, ignoring its sign.
if (abs(x) > _____ || abs(y) > _____ || abs(z) > _____) {
  Serial.println("SHAKE!");
}

// 1. What threshold means roughly 2 g of force?
// 2. Sitting still, one axis reads about 16384 and the others near 0.
//    Which axis is it, and why?`,
    },
  },

  // ── Lesson 34: RC522 RFID reader ──────────────────────────
  {
    id:"rfid", day:5, lesson:"Lesson 21", title:"RFID Card Reader (RC522)",
    lib:"MFRC522.zip",
    goal:"Read the unique ID number stored inside an RFID card or keychain tag.",
    materials:["Arduino UNO","RC522 RFID Module (flat board with a copper coil)","the white RFID card + blue keytag (came with the RC522)","jumper wires"],
    wiring:[
      ["RC522 3.3V","3.3V  (NOT 5V!)"],
      ["RC522 GND","GND"],
      ["RC522 RST","pin 9"],
      ["RC522 SDA (SS)","pin 10"],
      ["RC522 MOSI","pin 11"],
      ["RC522 MISO","pin 12"],
      ["RC522 SCK","pin 13"],
    ],
    code:
`#include <SPI.h>
#include <MFRC522.h>   // install MFRC522.zip first

MFRC522 rfid(10, 9);   // SS (SDA) on pin 10, RST on pin 9

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("Tap an RFID card or tag on the reader...");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) return;   // no card yet
  if (!rfid.PICC_ReadCardSerial())  return;    // couldn't read it

  Serial.print("Card UID:");
  for (byte i = 0; i < rfid.uid.size; i++) {
    Serial.print(rfid.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(rfid.uid.uidByte[i], HEX);
  }
  Serial.println();

  rfid.PICC_HaltA();   // wait for the next tap
}`,
    test:[
      "Open Serial Monitor at 9600 — it prints \"Tap an RFID card...\".",
      "Tap the white card → its UID (a row of hex numbers) prints.",
      "Tap the blue keytag → a DIFFERENT UID prints. Every tag has its own permanent ID.",
    ],
    trouble:[
      "\"MFRC522.h: No such file\" → install MFRC522.zip (download button above).",
      "Nothing ever prints → the RC522 runs on 3.3V, NOT 5V. Wiring it to 5V can damage it and it will not read.",
      "Reads only sometimes → hold the card flat and close (about 1-3 cm) over the reader for a moment.",
      "Still nothing → SPI is picky: SDA→10, SCK→13, MOSI→11, MISO→12, RST→9 exactly.",
    ],
    challenge:{
      prompt:"Make an access badge that greets ONE specific card. Run it once to see your card's first UID byte, then fill in the blank:",
      code:
`// Add this right after the UID printout:
if (rfid.uid.uidByte[0] == 0x____) {   // put YOUR card's first byte here
  Serial.println("Access granted — welcome!");
} else {
  Serial.println("Unknown card — access denied.");
}

// Real key-card systems keep a whole list of allowed IDs and check every
// byte. Why is matching just ONE byte not safe in real life?`,
    },
  }
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
