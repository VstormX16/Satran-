import processing.serial.*;

/*
  VOID-RECLAIMER
  Arduino -> Processing SERIAL FORMAT:
  X,Y,BUTTON
  BUTTON (D8, INPUT_PULLUP):
  0 = BASILI | 1 = BIRAKILMIŞ
*/

Serial arduinoPort;
int joyX = 512;
int joyY = 512;
int joyBtn = 1;

// --- SYSTEM STATE ---
final int AREA_BASE = 0;
final int AREA_MISSION = 1;
int currentArea = AREA_BASE;

Player player;
BaseRoom base;
MissionController mission;

// ---------------- SETUP ----------------
void setup() {
  String[] ports = Serial.list();
  for (int i = 0; i < ports.length; i++) {
    println(i + " : " + ports[i]);
  }

  size(1000, 800);
  rectMode(CENTER);
  noSmooth();

  try {
    if (ports.length > 0) {
      arduinoPort = new Serial(this, ports[ports.length - 1], 9600);
      arduinoPort.bufferUntil('\n');
      println("Connected to: " + ports[ports.length - 1]);
    }
  } catch (Exception e) {
    println("Arduino not found");
  }

  player = new Player();
  base = new BaseRoom();
  mission = new MissionController();
  delay(2000);
}

// ---------------- DRAW ----------------
void draw() {
  background(15);  

  if (currentArea == AREA_BASE) {
    base.update(player);
    base.display();
  } else {
    mission.update(player);
    mission.display();
  }

  player.update();
  player.display();
  drawUI();
  fill(255);
  textSize(14);
  text("X: " + joyX + "  Y: " + joyY + "  BTN: " + joyBtn, 20, height - 60);
}

// ---------------- SERIAL ----------------
void serialEvent(Serial p) {
  String raw = p.readStringUntil('\n');
  if (raw == null) return;

  raw = trim(raw);
  String[] parts = split(raw, ',');

  if (parts.length != 3) return;

  try {
    joyX   = Integer.parseInt(parts[0]);
    joyY   = Integer.parseInt(parts[1]);
    joyBtn = Integer.parseInt(parts[2]);
  } catch (Exception e) {
    // invalid data ignored
  }
}

// ---------------- PLAYER ----------------
class Player {
  PVector pos = new PVector(500, 400);
  float r = 15;
  int credits = 0;
  int scrap = 0;

  boolean action = false;
  boolean lastBtn = false;

  void update() {
    action = (joyBtn == 0 && !lastBtn);
    lastBtn = (joyBtn == 0);

    float mx = 0;
    float my = 0;
    float deadZone = 40;
    float speed = 3.8;

    if (abs(joyX - 512) > deadZone)
      mx = map(joyX, 0, 1023, -1, 1) * speed;
    if (abs(joyY - 512) > deadZone)
      my = -map(joyY, 0, 1023, -1, 1) * speed;

    pos.x += mx;
    pos.y += my;
    pos.x = constrain(pos.x, r, width - r);
    pos.y = constrain(pos.y, r, height - r);
  }

  void display() {
    stroke(255);
    strokeWeight(2);
    fill(0, 150, 255);
    ellipse(pos.x, pos.y, r * 2, r * 2);
  }
}

// ---------------- ROOM ----------------
class Room {
  ArrayList<Wall> walls = new ArrayList<Wall>();
  ArrayList<Door> doors = new ArrayList<Door>();
  ArrayList<Prop> props = new ArrayList<Prop>();
  ArrayList<Monster> monsters = new ArrayList<Monster>();
  String title;

  Room(String t) {
    title = t;

    walls.add(new Wall(width/2, 10, width, 20));
    walls.add(new Wall(width/2, height - 10, width, 20));
    walls.add(new Wall(10, height/2, 20, height));
    walls.add(new Wall(width - 10, height/2, 20, height));
  }

  void update(Player p) {
    for (Wall w : walls) w.collide(p);
    for (int i = props.size() - 1; i >= 0; i--) {
      Prop pr = props.get(i);
      if (dist(p.pos.x, p.pos.y, pr.x, pr.y) < 45 && p.action) {
        p.scrap += pr.val;
        props.remove(i);
      }
    }
    for (Monster m : monsters) m.update(p);
  }

  void display() {
    fill(25, 28, 32);
    noStroke();
    rect(width/2, height/2, width, height);

    for (Wall w : walls) w.display();
    for (Door d : doors) d.display();
    for (Prop pr : props) pr.display();
    for (Monster m : monsters) m.display();

    fill(255, 150);
    textSize(18);
    textAlign(LEFT);
    text(title, 30, height - 30);
  }
}

// ---------------- BASE ROOM ----------------
class BaseRoom extends Room {
  BaseRoom() {
    super("H.S.S. RECLAIMER - COMMAND DECK");

    walls.add(new Wall(200, 400, 20, 600));
    doors.add(new Door(width - 40, height/2, "DEPLOY"));
  }

  void update(Player p) {
    super.update(p);
    if (dist(p.pos.x, p.pos.y, 500, 400) < 60 && p.scrap > 0) {
      p.credits += p.scrap;
      p.scrap = 0;
    }
    if (dist(p.pos.x, p.pos.y, width - 40, height/2) < 50 && p.action) {
      currentArea = AREA_MISSION;
      mission.currentRoomIndex = 0;
      p.pos.set(80, height/2);
    }
  }

  void display() {
    super.display();
    fill(0, 255, 150);
    rect(500, 400, 70, 70);
    fill(255);
    textAlign(CENTER);
    text("REVENUE CONSOLE", 500, 350);
  }
}

// ---------------- MONSTER ----------------
class Monster {
  PVector pos;
  float r = 20;
  float speed = 1.5;

  Monster(float x, float y) {
    pos = new PVector(x, y);
  }

  void update(Player p) {
    PVector dir = PVector.sub(p.pos, pos);
    if (dir.mag() > 0) {
      dir.normalize();
      dir.mult(speed);
      pos.add(dir);
    }
  }

  void display() {
    fill(255, 0, 0);
    ellipse(pos.x, pos.y, r * 2, r * 2);
  }
}

// ---------------- MISSION ----------------
class MissionController {
  ArrayList<Room> rooms = new ArrayList<Room>();
  int currentRoomIndex = 0;

  MissionController() {
    // ROOM 0
    Room r1 = new Room("FACILITY: AIRLOCK ENTRANCE");
    r1.walls.add(new Wall(width/2, 250, 400, 30));
    r1.doors.add(new Door(width - 40, height/2, "NEXT"));
    r1.doors.add(new Door(40, height/2, "RETURN"));
    r1.monsters.add(new Monster(400, 300));
    rooms.add(r1);

    // ROOM 1
    Room r2 = new Room("FACILITY: STORAGE BAY B");
    r2.walls.add(new Wall(300, 250, 40, 300));
    r2.walls.add(new Wall(700, 550, 40, 300));
    r2.props.add(new Prop(350, 200, 75));
    r2.props.add(new Prop(750, 600, 110));
    r2.doors.add(new Door(40, height/2, "PREV"));
    r2.doors.add(new Door(width/2, height - 40, "LAB"));
    r2.monsters.add(new Monster(500, 400));
    rooms.add(r2);

    // ROOM 2
    Room r3 = new Room("FACILITY: BIO-RESEARCH LAB");
    r3.walls.add(new Wall(500, 400, 250, 250));
    r3.props.add(new Prop(500, 240, 250));
    r3.doors.add(new Door(width/2, 40, "EXIT LAB"));
    r3.monsters.add(new Monster(450, 450));
    r3.monsters.add(new Monster(550, 350));
    rooms.add(r3);

    // ROOM 3 (NEW)
    Room r4 = new Room("FACILITY: SECURITY HALL");
    r4.walls.add(new Wall(200, 200, 400, 30));
    r4.props.add(new Prop(500, 300, 50));
    r4.doors.add(new Door(40, height/2, "PREV"));
    r4.doors.add(new Door(width/2, height - 40, "NEXT"));
    r4.monsters.add(new Monster(300, 300));
    rooms.add(r4);

    // ROOM 4 (NEW)
    Room r5 = new Room("FACILITY: CONTROL ROOM");
    r5.walls.add(new Wall(600, 200, 400, 30));
    r5.props.add(new Prop(600, 250, 100));
    r5.doors.add(new Door(width/2, 40, "PREV"));
    r5.doors.add(new Door(width - 40, height/2, "EXIT"));
    r5.monsters.add(new Monster(700, 400));
    r5.monsters.add(new Monster(650, 350));
    rooms.add(r5);
  }

  void update(Player p) {
    Room cur = rooms.get(currentRoomIndex);
    cur.update(p);

    for (Door d : cur.doors) {
      if (dist(p.pos.x, p.pos.y, d.x, d.y) < 50 && p.action) {
        if (d.label.equals("RETURN")) {
          currentArea = AREA_BASE;
          p.pos.set(width - 120, height/2);
        } else if (d.label.equals("NEXT")) {
          currentRoomIndex++;
          p.pos.set(120, height/2);
        } else if (d.label.equals("PREV")) {
          currentRoomIndex--;
          p.pos.set(width - 120, height/2);
        } else if (d.label.equals("LAB")) {
          currentRoomIndex = 2;
          p.pos.set(width/2, 100);
        } else if (d.label.equals("EXIT LAB")) {
          currentRoomIndex = 1;
          p.pos.set(width/2, height - 100);
        } else if (d.label.equals("EXIT")) {
          currentArea = AREA_BASE;
          p.pos.set(500, 400);
        }
        break;
      }
    }
  }

  void display() {
    rooms.get(currentRoomIndex).display();
  }
}

// ---------------- OBJECTS ----------------
class Wall {
  float x, y, w, h;
  Wall(float X, float Y, float W, float H) {
    x = X; y = Y; w = W; h = H;
  }

  void display() {
    fill(60, 65, 70);
    noStroke();
    rect(x, y, w, h);
  }

  void collide(Player p) {
    float hw = w / 2 + p.r;
    float hh = h / 2 + p.r;

    if (abs(p.pos.x - x) < hw && abs(p.pos.y - y) < hh) {
      float dx = p.pos.x - x;
      float dy = p.pos.y - y;
      if (abs(dx / hw) > abs(dy / hh))
        p.pos.x = x + (dx > 0 ? hw : -hw);
      else
        p.pos.y = y + (dy > 0 ? hh : -hh);
    }
  }
}

class Door {
  float x, y;
  String label;
  Door(float X, float Y, String L) { x = X; y = Y; label = L; }

  void display() {
    fill(180, 40, 40);
    rect(x, y,
      (x == 40 || x == width - 40) ? 20 : 80,
      (y == 40 || y == height - 40) ? 20 : 80
    );
    fill(255);
    textAlign(CENTER);
    text(label, x, y - 50);
  }
}

class Prop {
  float x, y;
  int val;
  Prop(float X, float Y, int V) { x = X; y = Y; val = V; }
  void display() {
    fill(255, 215, 0);
    stroke(200, 150, 0);
    rect(x, y, 30, 30);
  }
}

// ---------------- UI ----------------
void drawUI() {
  fill(0, 180);
  noStroke();
  rect(width/2, 45, width, 90);

  fill(255);
  textSize(22);
  textAlign(LEFT);
  text("CREDITS: $" + player.credits, 40, 45);
  text("HOLDING: $" + player.scrap, 350, 45);
}
