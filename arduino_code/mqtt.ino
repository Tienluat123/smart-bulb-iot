/* 
  Nokia Tune
  Connect a piezo buzzer or speaker to pin 11 or select a new pin.
  More songs available at https://github.com/robsoncouto/arduino-songs                                            
                                              
                                              Robson Couto, 2019
*/
#define NOTE_B0  31
#define NOTE_C1  33
#define NOTE_CS1 35
#define NOTE_D1  37
#define NOTE_DS1 39
#define NOTE_E1  41
#define NOTE_F1  44
#define NOTE_FS1 46
#define NOTE_G1  49
#define NOTE_GS1 52
#define NOTE_A1  55
#define NOTE_AS1 58
#define NOTE_B1  62
#define NOTE_C2  65
#define NOTE_CS2 69
#define NOTE_D2  73
#define NOTE_DS2 78
#define NOTE_E2  82
#define NOTE_F2  87
#define NOTE_FS2 93
#define NOTE_G2  98
#define NOTE_GS2 104
#define NOTE_A2  110
#define NOTE_AS2 117
#define NOTE_B2  123
#define NOTE_C3  131
#define NOTE_CS3 139
#define NOTE_D3  147
#define NOTE_DS3 156
#define NOTE_E3  165
#define NOTE_F3  175
#define NOTE_FS3 185
#define NOTE_G3  196
#define NOTE_GS3 208
#define NOTE_A3  220
#define NOTE_AS3 233
#define NOTE_B3  247
#define NOTE_C4  262
#define NOTE_CS4 277
#define NOTE_D4  294
#define NOTE_DS4 311
#define NOTE_E4  330
#define NOTE_F4  349
#define NOTE_FS4 370
#define NOTE_G4  392
#define NOTE_GS4 415
#define NOTE_A4  440
#define NOTE_AS4 466
#define NOTE_B4  494
#define NOTE_C5  523
#define NOTE_CS5 554
#define NOTE_D5  587
#define NOTE_DS5 622
#define NOTE_E5  659
#define NOTE_F5  698
#define NOTE_FS5 740
#define NOTE_G5  784
#define NOTE_GS5 831
#define NOTE_A5  880
#define NOTE_AS5 932
#define NOTE_B5  988
#define NOTE_C6  1047
#define NOTE_CS6 1109
#define NOTE_D6  1175
#define NOTE_DS6 1245
#define NOTE_E6  1319
#define NOTE_F6  1397
#define NOTE_FS6 1480
#define NOTE_G6  1568
#define NOTE_GS6 1661
#define NOTE_A6  1760
#define NOTE_AS6 1865
#define NOTE_B6  1976
#define NOTE_C7  2093
#define NOTE_CS7 2217
#define NOTE_D7  2349
#define NOTE_DS7 2489
#define NOTE_E7  2637
#define NOTE_F7  2794
#define NOTE_FS7 2960
#define NOTE_G7  3136
#define NOTE_GS7 3322
#define NOTE_A7  3520
#define NOTE_AS7 3729
#define NOTE_B7  3951
#define NOTE_C8  4186
#define NOTE_CS8 4435
#define NOTE_D8  4699
#define NOTE_DS8 4978
#define REST      0


// change this to make the song slower or faster
int tempo = 180;


// notes of the moledy followed by the duration.
// a 4 means a quarter note, 8 an eighteenth , 16 sixteenth, so on
// !!negative numbers are used to represent dotted notes,
// so -4 means a dotted quarter note, that is, a quarter plus an eighteenth!!
int melody[] = {

  // Nokia Ringtone 
  // Score available at https://musescore.com/user/29944637/scores/5266155
  
  NOTE_E5, 8, NOTE_D5, 8, NOTE_FS4, 4, NOTE_GS4, 4, 
  NOTE_CS5, 8, NOTE_B4, 8, NOTE_D4, 4, NOTE_E4, 4, 
  NOTE_B4, 8, NOTE_A4, 8, NOTE_CS4, 4, NOTE_E4, 4,
  NOTE_A4, 2, 
};

// sizeof gives the number of bytes, each int value is composed of two bytes (16 bits)
// there are two values per note (pitch and duration), so for each note there are four bytes
int notes = sizeof(melody) / sizeof(melody[0]) / 2;

// this calculates the duration of a whole note in ms
int wholenote = (60000 * 4) / tempo;

int divider = 0, noteDuration = 0;

// NOKIA TUNE ====================================


#include <ArduinoJson.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <RBDdimmer.h>

/* ================= PIN ================= */
#define RELAY_PIN    26
#define ZC_PIN       27 // Nhận tín hiệu Zero Crossing (AC = 0V)
#define PWM_PIN      14 // Xuất xung điều khiển triac
#define DHT11_PIN    17
#define BUZZER_PIN   19
#define CDS_PIN      34

/* ================= OBJECT ================= */
DHT dht11(DHT11_PIN, DHT11);
LiquidCrystal_I2C lcd(0x27, 16, 2);
dimmerLamp acd(PWM_PIN, ZC_PIN); // Tạo object điều khiển dimmer

WiFiClient espClient;
PubSubClient client(espClient);



/* ================= WIFI / MQTT ================= */
const char* ssid = "IOT";
const char* password = "kkkkkkkkk";

const char* mqtt_server    = "broker.hivemq.com";
const char* mqtt_pub_topic = "smartbulb/sensor/ESP32_001";
const char* mqtt_sub_topic = "smartbulb/control/ESP32_001";

/* ================= STATE (SHARED) ================= */
volatile int targetPower = 30; // Độ sáng mong muốn (0–100%)
volatile bool systemReady = false;

/* ================= CDS FILTER ================= */
#define CDS_SAMPLES 8
#define POWER_HYSTERESIS 2 // Ngưỡng chống rung: Chênh lệch < 2% → không thay đổi, Tránh dimmer giật liên tục

int cdsBuf[CDS_SAMPLES];
int cdsIndex = 0;
bool cdsFilled = false;

/* ---------- SHARED BETWEEN THREADS ---------- */
volatile int g_luxPercent = 0;     // 0–100 (%)
volatile bool g_luxUpdated = false;
volatile int light_status = HIGH;

/* ================= CDS READ ================= */
int readCDSSmoothed() {
  cdsBuf[cdsIndex++] = analogRead(CDS_PIN);
  if (cdsIndex >= CDS_SAMPLES) {
    cdsIndex = 0;
    cdsFilled = true;
  }

  int sum = 0;
  int count = cdsFilled ? CDS_SAMPLES : cdsIndex;
  for (int i = 0; i < count; i++) sum += cdsBuf[i];
  return sum / count;
}

/* ================= MQTT CALLBACK ================= */
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Topic: ");
  Serial.println(topic);

  Serial.print("Payload: ");

  // Convert payload to string
  char msg[length + 1];
  memcpy(msg, payload, length);
  msg[length] = '\0';   // null-terminate

  Serial.println(msg);

  // Allocate JSON document
  DynamicJsonDocument doc(512);

  // Parse JSON
  DeserializationError error = deserializeJson(doc, msg);

  if (error) {
    Serial.print("JSON parse failed: ");
    Serial.println(error.c_str());
    return;
  }

  // Access fields
  const char* power_status = doc["power"];
  Serial.println(power_status);

  if (power_status && strcmp(power_status, "ON") == 0) {
    light_status = LOW;
  } else if (power_status && strcmp(power_status, "OFF") == 0) {
    light_status = HIGH;
  }

  const char* action = doc["action"];
  if (action && strcmp(action, "BUZZER") == 0) {
    for (int thisNote = 0; thisNote < notes * 2; thisNote = thisNote + 2) {

      // calculates the duration of each note
      divider = melody[thisNote + 1];
      if (divider > 0) {
        // regular note, just proceed
        noteDuration = (wholenote) / divider;
      } else if (divider < 0) {
        // dotted notes are represented with negative durations!!
        noteDuration = (wholenote) / abs(divider);
        noteDuration *= 1.5; // increases the duration in half for dotted notes
      }

      // we only play the note for 90% of the duration, leaving 10% as a pause
      tone(BUZZER_PIN, melody[thisNote], noteDuration * 0.9);

      // Wait for the specief duration before playing the next note.
      delay(noteDuration);

      // stop the waveform generation before the next note.
      noTone(BUZZER_PIN);
    }
  }

  // iterate over the notes of the melody.
  // Remember, the array is twice the number of notes (notes + durations)
  
}

/* ================= MQTT RECONNECT ================= */
void reconnect() {
  while (!client.connected()) {
    Serial.println("Connecting to MQTT...");
    if (client.connect("ESP32-FLOW1")) {
      Serial.println("MQTT connected");
      client.subscribe(mqtt_sub_topic);
      Serial.print("Subscribed to: ");
      Serial.println(mqtt_sub_topic);
    } else {
      Serial.print("Failed, rc=");
      Serial.println(client.state());
      vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
  }
}

/* ================= WIFI + MQTT TASK (CORE 0) ================= */
void WiFiTask(void *pv) {
  unsigned long lastEpoch = 0;
  // unsigned long lastLUX = 0;

  for (;;) {
    if (!client.connected()) reconnect();
    client.loop();

    if (millis() - lastEpoch >= 5000) {
      lastEpoch = millis();

      float humi = dht11.readHumidity();
      float temp = dht11.readTemperature();
      int lux = g_luxPercent;        // snapshot trước
      int sent_lux = map(lux, 0, 100, 0, 1023);

      if (!isnan(temp) && !isnan(humi) && temp > 1 && humi > 1){
        String json = "{";
        json += "\"amp\":" + String(1.5) + ",";
        json += "\"temp\":" + String(temp) + ",";
        json += "\"hum\":" + String(humi) + ",";
        json += "\"lux\":" + String(sent_lux);
        json += "}";

        client.publish(mqtt_pub_topic, json.c_str());
        Serial.println(json);

        lcd.setCursor(0, 0);
        lcd.print("Hum: " + String(humi) + "   ");
        lcd.setCursor(0, 1);
        lcd.print("Temp:" + String(temp) + "   ");

      }
      
    }
    

    vTaskDelay(10 / portTICK_PERIOD_MS);
  }
}

/* ================= SETUP ================= */
void setup() {
  Serial.begin(115200);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);  // OFF an toàn
  light_status = HIGH;            // sync state
  delay(300);
  pinMode(CDS_PIN, INPUT);

  /* LCD */
  lcd.init();
  lcd.backlight();
  lcd.print("Starting...");

  /* DHT */
  dht11.begin();

  /* ADC */
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  /* DIMMER */
  acd.begin(NORMAL_MODE, ON); // NORMAL_MODE: điều khiển pha chuẩn (phase control), ON bật dimmer ngay
  acd.setPower(30);   // giữ ổn định khi boot, 30% công suất, Tránh đèn bật max ngay khi boot

  /* WIFI */
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
  }

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  /* CREATE WIFI TASK */
  xTaskCreatePinnedToCore(
    WiFiTask,
    "WiFiTask",
    4096,
    NULL,
    1,
    NULL,
    0   // Core 0
  );

  lcd.clear();
  lcd.print("System Ready");

  systemReady = true;
}

/* ================= LOOP (CORE 1 – DIMMER ONLY) ================= */
void loop() {
  if (!systemReady) {
    digitalWrite(RELAY_PIN, HIGH); // luôn OFF khi chưa sẵn sàng
    return;
  }

  digitalWrite(RELAY_PIN, light_status);

  // delay(1000);
  // digitalWrite(RELAY_PIN, LOW);
  // delay(1000);

  static unsigned long lastCDSRead = 0;
  static unsigned long lastFadeUpdate = 0;
  static int currentPower = 30; // Độ sáng hiện tại đang áp dụng
  static int lastPower = -1;

  

  /* ---- READ CDS (CHẬM) ---- */
  if (millis() - lastCDSRead >= 500) {
    lastCDSRead = millis();

    int val = readCDSSmoothed();
    int newTarget = map(val, 0, 4095, 30, 100);
    newTarget = constrain(newTarget, 30, 100);

    if (abs(newTarget - targetPower) >= POWER_HYSTERESIS) {
      targetPower = newTarget;
    }
  }

  /* ---- FADE MƯỢT (NHANH, ỔN ĐỊNH) ---- */
  if (millis() - lastFadeUpdate >= 120) {
    lastFadeUpdate = millis();

    if (currentPower < targetPower) currentPower++;
    else if (currentPower > targetPower) currentPower--;

    if (currentPower != lastPower) {
      acd.setPower(currentPower); // DÒNG QUYẾT ĐỊNH ĐỘ SÁNG ĐÈN, Gửi công suất mới cho dimmer
      lastPower = currentPower; // Lưu trạng thái tránh gọi lặp

      /* 🔁 SHARE TO OTHER THREAD */
      g_luxPercent = currentPower; // Chia sẻ sang task khác, Gửi MQTT, Hiển thị web
    }
  }
}
