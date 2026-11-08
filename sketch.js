
let balls = [];
let waves = [];
let selectedBall = null;
let dragStart = null;
let dragEnd = null;

const friction = 0.992;
const elasticity = 0.85;
const power = 0.065;

function setup() {
  createCanvas(800, 520);
  
  let positions = [
    [150, 260], [410, 180], [520, 260],
    [410, 340], [620, 150], [630, 380]
  ];

  let colors = [
    "#D98EAB", "#8DAEB8", "#E6BD8B",
    "#A6B9A1", "#B4A4CC", "#D8A7A0"
  ];

  for (let i = 0; i < positions.length; i++) {
    balls.push(new Ball(
      positions[i][0],
      positions[i][1],
      1 + i * 0.5,
      colors[i]
    ));
  }
}

function draw() {
  background("#F7F5F0");

  showWaves();

  // 구체의 움직임 계산
  for (let ball of balls) {
    ball.applyFriction();
    ball.update();
    ball.edges();
  }

  // 구체 사이의 충돌
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      collide(balls[i], balls[j]);
    }
  }

  // 궤적과 구체 그리기
  for (let ball of balls) {
    ball.showTrail();
    ball.show();
  }

  // 마우스로 당기는 힘 표시
  if (selectedBall && dragEnd) {
    stroke("#A66D82");
    strokeWeight(2);
    line(
      selectedBall.pos.x,
      selectedBall.pos.y,
      dragEnd.x,
      dragEnd.y
    );

    let force = p5.Vector.sub(
      selectedBall.pos,
      dragEnd
    );

    force.limit(150);

    let strength = map(force.mag(), 0, 150, 0, 1);
    let arrowColor = lerpColor(
      color("#D98EAB"),
      color("#7A4057"),
      strength
    );
    let arrowEnd = p5.Vector.add(selectedBall.pos, force);

    stroke(arrowColor);
    strokeWeight(3);
    line(
      selectedBall.pos.x,
      selectedBall.pos.y,
      arrowEnd.x,
      arrowEnd.y
    );

    // 힘의 방향을 보여 주는 화살촉
    push();
    translate(arrowEnd.x, arrowEnd.y);
    rotate(force.heading());
    line(0, 0, -10, -5);
    line(0, 0, -10, 5);
    pop();

    noStroke();
    fill(arrowColor);
    textAlign(LEFT, CENTER);
    textSize(12);
    text(
      "Force: " + (force.mag() * power).toFixed(2),
      arrowEnd.x + 10,
      arrowEnd.y
    );
    textAlign(LEFT, BASELINE);
  }

  noStroke();
  fill("#555555");
  textSize(15);
  text("TRACES OF FORCE", 24, 32);

  textSize(12);
  text("Drag a circle and release to apply force", 24, 52);
  text("Press R to reset", 24, 70);
}

class Ball {
  constructor(x, y, mass, col) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);

    this.mass = mass;
    this.r = mass * 8;
    this.col = col;
    this.trail = [];
  }

  applyForce(force) {
    let f = force.copy();
    f.div(this.mass);
    this.acc.add(f);
  }

  applyFriction() {
    if (this.vel.mag() > 0.01) {
      let f = this.vel.copy();
      f.mult(-1);
      f.setMag(0.015 * this.mass);
      this.applyForce(f);
    }
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.vel.mult(friction);

    if (this.vel.mag() < 0.02) {
      this.vel.mult(0);
    }

    if (this.vel.mag() > 0.05) {
      this.trail.push(this.pos.copy());
    }

    if (this.trail.length > 120) {
      this.trail.shift();
    }
  }

  edges() {
    if (this.pos.x < this.r) {
      this.pos.x = this.r;
      this.vel.x *= -elasticity;
    }

    if (this.pos.x > width - this.r) {
      this.pos.x = width - this.r;
      this.vel.x *= -elasticity;
    }

    if (this.pos.y < this.r) {
      this.pos.y = this.r;
      this.vel.y *= -elasticity;
    }

    if (this.pos.y > height - this.r) {
      this.pos.y = height - this.r;
      this.vel.y *= -elasticity;
    }
  }

  showTrail() {
    noFill();

    for (let i = 1; i < this.trail.length; i++) {
      let alpha = map(i, 1, this.trail.length, 5, 120);

      let c = color(this.col);
      c.setAlpha(alpha);

      stroke(c);
      strokeWeight(1.5);

      line(
        this.trail[i - 1].x,
        this.trail[i - 1].y,
        this.trail[i].x,
        this.trail[i].y
      );
    }
  }

  show() {
    noStroke();
    fill(this.col);
    circle(this.pos.x, this.pos.y, this.r * 2);

    fill(255, 255, 255, 90);
    circle(
      this.pos.x - this.r * 0.25,
      this.pos.y - this.r * 0.25,
      this.r * 0.6
    );

    fill("#555555");
    textAlign(CENTER, CENTER);
    textSize(11);
    text(this.mass, this.pos.x, this.pos.y);
    textAlign(LEFT, BASELINE);
  }
}

// 구체 사이의 충돌 계산
function collide(a, b) {
  let direction = p5.Vector.sub(b.pos, a.pos);
  let distance = direction.mag();
  let minimum = a.r + b.r;

  if (distance >= minimum) return;

  if (distance === 0) {
    direction.set(1, 0);
    distance = 0.0001;
  }

  direction.normalize();

  // 겹친 구체 분리
  let overlap = minimum - distance;
  let totalMass = a.mass + b.mass;

  a.pos.sub(
    p5.Vector.mult(
      direction,
      overlap * b.mass / totalMass
    )
  );

  b.pos.add(
    p5.Vector.mult(
      direction,
      overlap * a.mass / totalMass
    )
  );

  // 충돌 방향의 상대 속도
  let relative = p5.Vector.sub(b.vel, a.vel);
  let speed = relative.dot(direction);

  if (speed >= 0) return;

  // 운동량에 따른 충격량
  let impulse = -(1 + elasticity) * speed;
  impulse /= (1 / a.mass + 1 / b.mass);

  let impulseVector = direction.copy().mult(impulse);

  // 충격량이 클수록 더 크고 선명한 파동 생성
  let impact = abs(impulse);
  waves.push({
    pos: p5.Vector.add(a.pos, b.pos).mult(0.5),
    radius: 2,
    maxRadius: 18 + impact * 12,
    alpha: constrain(45 + impact * 45, 45, 210),
    growth: 1.5 + impact * 0.25,
    weight: 1.5 + impact * 0.15,
    col: a.col
  });

  a.vel.sub(
    impulseVector.copy().div(a.mass)
  );

  b.vel.add(
    impulseVector.copy().div(b.mass)
  );
}

function showWaves() {
  noFill();

  for (let i = waves.length - 1; i >= 0; i--) {
    let wave = waves[i];

    wave.radius += wave.growth;
    wave.alpha *= 0.94;

    let c = color(wave.col);
    c.setAlpha(wave.alpha);
    stroke(c);
    strokeWeight(wave.weight);
    circle(wave.pos.x, wave.pos.y, wave.radius * 2);

    if (wave.radius > wave.maxRadius || wave.alpha < 2) {
      waves.splice(i, 1);
    }
  }
}

// 마우스로 당기기 시작
function mousePressed() {
  for (let ball of [...balls].reverse()) {
    if (
      dist(mouseX, mouseY, ball.pos.x, ball.pos.y)
      < ball.r
    ) {
      selectedBall = ball;
      dragStart = createVector(mouseX, mouseY);
      dragEnd = dragStart.copy();
      break;
    }
  }
}

// 드래그 방향 저장
function mouseDragged() {
  if (selectedBall) {
    dragEnd = createVector(mouseX, mouseY);
  }
}

// 마우스를 놓으면 힘 적용
function mouseReleased() {
  if (selectedBall && dragEnd) {
    let force = p5.Vector.sub(
      selectedBall.pos,
      dragEnd
    );

    force.limit(150);
    force.mult(power);

    selectedBall.applyForce(force);
  }

  selectedBall = null;
  dragStart = null;
  dragEnd = null;
}

// 초기화
function keyPressed() {
  if (key === "r" || key === "R") {
    balls = [];
    waves = [];
    selectedBall = null;
    setupBalls();
  }
}

function setupBalls() {
  let positions = [
    [150, 260], [410, 180], [520, 260],
    [410, 340], [620, 150], [630, 380]
  ];

  let colors = [
    "#D98EAB", "#8DAEB8", "#E6BD8B",
    "#A6B9A1", "#B4A4CC", "#D8A7A0"
  ];

  for (let i = 0; i < positions.length; i++) {
    balls.push(new Ball(
      positions[i][0],
      positions[i][1],
      1 + i * 0.5,
      colors[i]
    ));
  }
}
