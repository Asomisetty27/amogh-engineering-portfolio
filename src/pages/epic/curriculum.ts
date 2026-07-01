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
    id:"active_buzzer", day:2, lesson:"Lesson 6", title:"Active Buzzer",
    goal:"Make the sealed buzzer beep in a pattern that speeds up.",
    materials:["Arduino UNO","active buzzer (the sealed one)","jumper wires"],
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
    materials:["Arduino UNO","passive buzzer (the open green one)","jumper wires"],
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
  // ── Lesson 19 ──────────────────────────────────────────────
  {
    id:"rtc", day:5, lesson:"Lesson 19", title:"Real Time Clock (DS1302)",
    lib:"DS1302.zip",
    goal:"Keep real date and time running, even after the Arduino loses power.",
    materials:["Arduino UNO","DS1302 RTC module","jumper wires"],
    wiring:[
      ["RTC RST","pin 4"],
      ["RTC CLK","pin 5"],
      ["RTC DAT","pin 6"],
      ["RTC VCC","5V"],
      ["RTC GND","GND"],
    ],
    code:
`#include <Ds1302.h>

// The DS1302 uses three control pins.
// This library's constructor order is (RST, CLK, DAT):
Ds1302 rtc(4, 5, 6);

// Names for the day-of-week number (1-7) the chip reports
const char* dayNames[] = {
  "Monday", "Tuesday", "Wednesday", "Thursday",
  "Friday", "Saturday", "Sunday"
};

void setup() {
  Serial.begin(9600);
  rtc.init();

  // Only set the time if the clock is not already running.
  // A module with a good coin battery keeps time on its own.
  if (rtc.isHalted()) {
    Ds1302::DateTime start = {
      .year = 26,               // 2026 -> just the last two digits
      .month = Ds1302::MONTH_JUL,
      .day = 1,
      .hour = 9,
      .minute = 0,
      .second = 0,
      .dow = Ds1302::DOW_WED
    };
    rtc.setDateTime(&start);
  }
}

void loop() {
  Ds1302::DateTime now;
  rtc.getDateTime(&now);       // fill 'now' with the current time

  // Print as  HH:MM:SS  DayName  (with leading zeros)
  if (now.hour < 10)   Serial.print('0');
  Serial.print(now.hour);   Serial.print(':');
  if (now.minute < 10) Serial.print('0');
  Serial.print(now.minute); Serial.print(':');
  if (now.second < 10) Serial.print('0');
  Serial.print(now.second);
  Serial.print("  ");
  Serial.println(dayNames[now.dow - 1]);

  delay(1000);
}`,
    test:[
      "Serial Monitor at 9600 → the time advances one second at a time.",
      "Unplug USB, wait 10 seconds, plug back in → the clock kept counting (the coin battery kept it alive).",
    ],
    trouble:[
      "\"'Ds1302' does not name a type\" → install DS1302.zip (download button above).",
      "Time is stuck or wrong on the first run → seat the module's coin battery; it sets the time once on first power-up.",
      "Day name looks wrong → dow is 1-7, and dayNames[now.dow - 1] shifts it to start at 0.",
    ],
    challenge:{
      prompt:"Inside loop() you already have now.hour, now.minute, now.second (numbers). Fill in the blanks to print a greeting that depends on the time of day:",
      code:
`if (now.hour >= ___ && now.hour < 12) {
  Serial.println("Good morning!");
} else if (now.hour >= 12 && now.hour < ___) {
  Serial.println("Good afternoon!");
} else {
  Serial.println("___");
}

// Bonus: unplug the USB, wait, then plug it back in.
// Which part of the module keeps the time running with no USB power?`,
    },
  },

  // ── Lesson 20 ──────────────────────────────────────────────
  {
    id:"sound_sensor", day:5, lesson:"Lesson 20", title:"Sound Sensor — Volume Bar",
    goal:"Read sound level two ways (analog and digital) and visualize volume.",
    materials:["Arduino UNO","sound sensor module","jumper wires"],
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
    materials:["Arduino UNO","breadboard","thermistor (little black bead)","10kΩ resistor","jumper wires"],
    wiring:[
      ["Thermistor leg 1","5V"],
      ["Thermistor leg 2","A0 row"],
      ["10kΩ resistor","that same A0 row → GND"],
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
    materials:["Arduino UNO","L293D motor driver","DC motor","10kΩ potentiometer","breadboard","jumper wires"],
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
    id:"servo", day:5, lesson:"Lesson 24", title:"Servo Motor (SG90)",
    goal:"Sweep a servo arm back and forth, then steer it with a potentiometer.",
    materials:["Arduino UNO","SG90 servo motor","jumper wires","(optional) 10kΩ potentiometer"],
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
    id:"stepper", day:5, lesson:"Lesson 26", title:"Stepper Motor (28BYJ-48)",
    goal:"Turn a stepper motor an exact amount using the ULN2003 driver board.",
    materials:["Arduino UNO","28BYJ-48 stepper motor","ULN2003 driver board","jumper wires"],
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
    id:"shift_register", day:5, lesson:"Lesson 16", title:"Shift Register (74HC595) — 8 LEDs, 3 pins",
    goal:"Control 8 LEDs with only 3 Arduino pins, and watch them count in binary.",
    materials:["Arduino UNO","breadboard","74HC595 shift register IC","8 LEDs","8× 220Ω resistors","jumper wires"],
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
