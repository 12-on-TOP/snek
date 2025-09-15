let foods = [];
let snakes = [];
let distancing = 3;
let aMain = 1;
let translateX = 0;
let translateY = 0;
let sped = 0;
let gameX = 2000;
let gameY = 2000;
let offX = gameX + 100;
let offY = gameY + 100;

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 1; i <= 10; i++) {
    snakes.push(new Snake(random(gameX), random(gameY)));
  }
  for (let i = 0; i <= 100; i++) {
    foods.push(new Food(random(gameX), random(gameY), random(1, 5), 0));
  }
  snakes[0].main = 1;
}

function draw() {
  background(220);
  text(`Your Length: ${snakes[0].s.length}`, 10, 20);
  push();
  if (aMain) {
    translateX = width / 2 - snakes[0].s[0].x;
    translateY = height / 2 - snakes[0].s[0].y;
  }
  translate(translateX, translateY);
  push();
  stroke(255, 0, 0);
  line(0, 0, gameX, 0);
  line(gameX, 0, gameX, gameY);
  line(gameX, gameY, 0, gameY);
  line(0, gameY, 0, 0);
  pop();
  for (let i of foods) {
    i.display();
  }
  for (let i of snakes) {
    i.display();
  }
  pop();
}

class SnakeSegment {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
  }

  display() {
    fill("red");
    stroke(0);
    circle(this.x, this.y, this.size);
  }
}

class Food {
  constructor(x, y, s, d) {
    this.x = x;
    this.y = y;
    this.s = s;
    this.d = d;
    this.consumed = false;
  }

  display() {
    fill(this.d ? "blue" : "green");
    noStroke();
    circle(this.x, this.y, 10 + this.s);

    if (this.consumed) return;

    for (let i of snakes) {
      if (i.s.length > 0 && dist(this.x, this.y, i.s[0].x, i.s[0].y) < 20) {
        this.consumed = true;
        this.grow(i, this.d ? 1 : this.s);
      }
    }
  }

  grow(snake, amount) {
    let tail = snake.s[snake.s.length - 1];
    for (let i = 0; i < amount; i++) {
      snake.s.push(new SnakeSegment(tail.x, tail.y, 20));
    }

    if (this.d) {
      foods.splice(foods.indexOf(this), 1);
    } else {
      this.x = random(gameX);
      this.y = random(gameY);
      this.consumed = false;
    }
  }
}

class Snake {
  constructor(x, y) {
    this.scrambled = 0;
    this.s = [new SnakeSegment(x, y, 20)];
    this.trail = [];
    this.speed = 2;
    this.decay = 0;
    this.def = 0;
    this.main = 0;
  }

  display() {
    if (this.scrambled || this.s.length === 0) return;

    let head = this.s[0];

    if (head.x >= gameX || head.x <= 0 || head.y >= gameY || head.y <= 0) {
      this.gehtscrambled();
      return;
    }

    if (this.main) {
      let worldMouseX = mouseX - (width / 2 - head.x);
      let worldMouseY = mouseY - (height / 2 - head.y);
      let dx = worldMouseX - head.x;
      let dy = worldMouseY - head.y;
      let distToMouse = sqrt(dx * dx + dy * dy);

      if (distToMouse) {
        head.x += (dx / distToMouse) * this.speed;
        head.y += (dy / distToMouse) * this.speed;
      }
    } else if (foods.length > 0) {
      const closestFood = foods.reduce((a, b) => {
        let da = dist(a.x, a.y, head.x, head.y) - (a.d ? 50 : 0);
        let db = dist(b.x, b.y, head.x, head.y) - (b.d ? 50 : 0);
        return da < db ? a : b;
      });
      let angle = atan2(closestFood.y - head.y, closestFood.x - head.x);
      head.x += cos(angle) * this.speed;
      head.y += sin(angle) * this.speed;
    }

    this.trail.unshift({ x: head.x, y: head.y });
    if (this.trail.length > this.s.length * 5) this.trail.pop();

    let segmentGap = 8;
    for (let i = 1; i < this.s.length; i++) {
      let distSoFar = 0,
        found = false;
      for (let t = 1; t < this.trail.length; t++) {
        let stepLen = dist(
          this.trail[t - 1].x,
          this.trail[t - 1].y,
          this.trail[t].x,
          this.trail[t].y
        );
        distSoFar += stepLen;
        if (distSoFar >= segmentGap * i) {
          let overshoot = distSoFar - segmentGap * i;
          let ratio = 1 - overshoot / stepLen;
          this.s[i].x = lerp(this.trail[t - 1].x, this.trail[t].x, ratio);
          this.s[i].y = lerp(this.trail[t - 1].y, this.trail[t].y, ratio);
          found = true;
          break;
        }
      }
      if (!found) {
        this.s[i].x = this.s[0].x;
        this.s[i].y = this.s[0].y;
      }
    }

    if (this.decay && this.s.length > 1) {
      this.def++;
      if (this.def % 50 === 0) {
        let tail = this.s.pop();
        foods.push(new Food(tail.x, tail.y, 1, 0));
      }
    } else {
      this.def = 0;
    }

    for (let i = this.s.length - 1; i >= 0; i--) {
      this.s[i].display();
    }

    for (let other of snakes) {
      if (other === this) continue;
      for (let seg of other.s) {
        if (dist(head.x, head.y, seg.x, seg.y) < 20) {
          this.gehtscrambled();
          return;
        }
      }
    }
  }

  gehtscrambled() {
    const deadSegments = [...this.s];
    this.s = [];
    for (let k of deadSegments) {
      foods.push(new Food(k.x, k.y, 20, 1));
    }
    snakes = snakes.filter((snake) => snake !== this);
    if (this.main) {
      this.scrambled = 1;
      this.main = 0;
      aMain = 0;
    } else if (snakes.length < 10) {
      snakes.push(new Snake(100 + random() * 1000, random() * 1000));
    }
  }
}

function keyPressed() {
  if (key === "ArrowUp" || key === " " || key === "w") {
    if (snakes[0].main) {
      snakes[0].speed = 5;
      snakes[0].decay = snakes[0].s.length > 1 ? 1 : 0;
    }
  }
}

function keyReleased() {
  if (key === "ArrowUp" || key === " " || key === "w") {
    if (snakes[0].main) {
      resetSpeed();
    }
  }
}

function resetSpeed() {
  snakes[0].speed = 2;
  snakes[0].decay = 0;
  snakes[0].def = 0;
}
