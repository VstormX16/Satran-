#include <Wire.h>
#include <hd44780.h>
#include <hd44780ioClass/hd44780_I2Cexp.h>

hd44780_I2Cexp lcd;

// ===== AYARLAR =====
String yazi = "Ya Allah,Ya Rahman,Ya Rahim,Ya Kavi,Ya Kadir";
const int joyX = A0;
const int maxTekrar = 70;

// joystick esikleri
const int SAG_ESIK = 850;
const int SOL_ESIK = 200;
const int ORTA_MIN = 450;
const int ORTA_MAX = 570;

// zamanlar
const unsigned long debounceSure = 300;
const unsigned long kaymaSure = 900;

// ===== DEGISKENLER =====
int sayac = 0;
bool sagKilidi = false;
bool solKilidi = false;
unsigned long sonIslem = 0;

int pos = 0;
unsigned long sonKayma = 0;

void setup() {
  lcd.begin(16, 2);
  lcd.backlight();
  lcd.clear();

  lcd.setCursor(10, 1);
  lcd.print("0/70");
}

void loop() {
  unsigned long simdi = millis();

  // ===== YAZI KAYDIR =====
  if (simdi - sonKayma > kaymaSure) {
    lcd.setCursor(0, 0);
    lcd.print("                ");
    lcd.setCursor(0, 0);
    lcd.print(yazi.substring(pos, min(pos + 16, yazi.length())));

    pos++;
    if (pos > yazi.length() - 16) pos = 0;

    sonKayma = simdi;
  }

  // ===== JOYSTICK OKU =====
  int x = analogRead(joyX);

  // SAG = +1
  if (x > SAG_ESIK && !sagKilidi && sayac < maxTekrar &&
      (simdi - sonIslem > debounceSure)) {

    sayac++;
    sagKilidi = true;
    solKilidi = false;
    sonIslem = simdi;

    lcd.setCursor(10, 1);
    lcd.print("     ");
    lcd.setCursor(10, 1);
    lcd.print(sayac);
    lcd.print("/70");
  }

  // SOL = SIFIRLA
  if (x < SOL_ESIK && !solKilidi &&
      (simdi - sonIslem > debounceSure)) {

    sayac = 0;
    solKilidi = true;
    sagKilidi = false;
    sonIslem = simdi;

    lcd.setCursor(10, 1);
    lcd.print("     ");
    lcd.setCursor(10, 1);
    lcd.print("0/70");
  }

  // ORTA = KILITLERI AC
  if (x > ORTA_MIN && x < ORTA_MAX) {
    sagKilidi = false;
    solKilidi = false;
  }
}
