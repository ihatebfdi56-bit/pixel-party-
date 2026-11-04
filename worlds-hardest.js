const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const levelLabel = document.getElementById("levelLabel");
const deathsLabel = document.getElementById("deathsLabel");
const shieldLabel = document.getElementById("shieldLabel");
const timerLabel = document.getElementById("timerLabel");
const runTimerLabel = document.getElementById("runTimerLabel");
const winRewardLabel = document.getElementById("winRewardLabel");
const finalTimeLabel = document.getElementById("finalTimeLabel");
const restartBtn = document.getElementById("restartBtn");
const winOverlay = document.getElementById("winOverlay");
const winRestartBtn = document.getElementById("winRestartBtn");

const LEVEL_TIME_LIMIT = 22;
const basePlayerSpeed = 180;
const sessionPowerups = {
  initialized: false,
  initializing: false,
  shield: false,
  slowEnemies: false,
  speedBoost: false,
  goalAssist: false,
  timeBoost: false,
};

const keys = new Set();
const player = {
  x: 36,
  y: 36,
  size: 18,
  speed: basePlayerSpeed,
};

const state = {
  levels: createLevels(),
  levelIndex: 0,
  deaths: 0,
  collected: new Set(),
  shieldReady: false,
  levelCleared: false,
  gameWon: false,
  rewardGranted: false,
  levelEndsAt: 0,
  runStartAt: 0,
  lastTime: 0,
};

function initSessionPowerups() {
  if (sessionPowerups.initialized) return;
  sessionPowerups.initializing = true;
  sessionPowerups.shield = PixelParty.consumeUpgrade("whgShield").ok;
  sessionPowerups.slowEnemies = PixelParty.consumeUpgrade("whgSlowEnemies").ok;
  sessionPowerups.speedBoost = PixelParty.consumeUpgrade("whgSpeedBoost").ok;
  sessionPowerups.goalAssist = PixelParty.consumeUpgrade("whgGoalAssist").ok;
  sessionPowerups.timeBoost = PixelParty.consumeUpgrade("whgTimeBoost").ok;
  sessionPowerups.initializing = false;
  sessionPowerups.initialized = true;
}

function createLevels() {
  return [
    {
      name: "Warm Up",
      start: { x: 36, y: 36 },
      goal: { x: 640, y: 392, w: 48, h: 48 },
      coins: [
        { x: 188, y: 42, r: 6 },
        { x: 324, y: 286, r: 6 },
        { x: 582, y: 126, r: 6 },
      ],
      walls: [
        { x: 120, y: 0, w: 16, h: 340 },
        { x: 250, y: 140, w: 16, h: 340 },
        { x: 370, y: 0, w: 16, h: 300 },
        { x: 500, y: 180, w: 16, h: 300 },
      ],
      enemies: [
        { x: 190, y: 76, r: 9, axis: "y", min: 70, max: 300, speed: 160, dir: 1 },
        { x: 315, y: 330, r: 9, axis: "y", min: 120, max: 360, speed: 180, dir: -1 },
        { x: 445, y: 98, r: 9, axis: "y", min: 60, max: 330, speed: 170, dir: 1 },
        { x: 560, y: 300, r: 9, axis: "x", min: 540, max: 680, speed: 190, dir: 1 },
        { x: 560, y: 150, r: 9, axis: "x", min: 520, max: 680, speed: 205, dir: -1 },
        { x: 300, y: 210, r: 9, axis: "y", min: 60, max: 290, speed: 200, dir: 1 },
        { x: 90, y: 250, r: 9, axis: "x", min: 90, max: 360, speed: 195, dir: 1 },
        { x: 660, y: 88, r: 9, axis: "y", min: 60, max: 240, speed: 170, dir: -1 },
        { x: 232, y: 220, r: 9, axis: "x", min: 160, max: 340, speed: 185, dir: -1 },
        { x: 622, y: 260, r: 9, axis: "y", min: 100, max: 360, speed: 200, dir: 1 },
      ],
    },
    {
      name: "Switchback",
      start: { x: 36, y: 420 },
      goal: { x: 628, y: 28, w: 58, h: 58 },
      coins: [
        { x: 150, y: 96, r: 6 },
        { x: 424, y: 246, r: 6 },
        { x: 566, y: 394, r: 6 },
        { x: 300, y: 168, r: 6 },
      ],
      walls: [
        { x: 80, y: 60, w: 560, h: 16 },
        { x: 80, y: 210, w: 420, h: 16 },
        { x: 220, y: 360, w: 420, h: 16 },
        { x: 180, y: 60, w: 16, h: 110 },
        { x: 460, y: 210, w: 16, h: 110 },
        { x: 300, y: 110, w: 16, h: 115 },
        { x: 580, y: 260, w: 16, h: 115 },
      ],
      enemies: [
        { x: 120, y: 140, r: 9, axis: "x", min: 120, max: 620, speed: 205, dir: 1 },
        { x: 540, y: 140, r: 9, axis: "y", min: 80, max: 340, speed: 170, dir: -1 },
        { x: 320, y: 260, r: 9, axis: "x", min: 120, max: 500, speed: 250, dir: 1 },
        { x: 140, y: 410, r: 9, axis: "y", min: 260, max: 440, speed: 195, dir: -1 },
        { x: 460, y: 88, r: 9, axis: "x", min: 120, max: 620, speed: 225, dir: 1 },
        { x: 580, y: 320, r: 9, axis: "y", min: 110, max: 360, speed: 215, dir: 1 },
        { x: 250, y: 88, r: 9, axis: "x", min: 120, max: 560, speed: 220, dir: 1 },
        { x: 620, y: 408, r: 9, axis: "y", min: 260, max: 440, speed: 210, dir: -1 },
        { kind: "orbit", cx: 390, cy: 140, rx: 38, ry: 18, r: 9, speed: 5.0, phase: 0.2 },
        { x: 196, y: 292, r: 9, axis: "x", min: 140, max: 440, speed: 235, dir: 1 },
      ],
    },
    {
      name: "Pinch",
      start: { x: 36, y: 420 },
      goal: { x: 648, y: 36, w: 44, h: 44 },
      coins: [
        { x: 284, y: 174, r: 6 },
      ],
      walls: [
        { x: 80, y: 60, w: 560, h: 16 },
        { x: 80, y: 210, w: 480, h: 16 },
        { x: 160, y: 360, w: 480, h: 16 },
        { x: 160, y: 60, w: 16, h: 106 },
        { x: 300, y: 210, w: 16, h: 150 },
        { x: 440, y: 180, w: 16, h: 196 },
        { x: 580, y: 60, w: 16, h: 256 },
        { x: 580, y: 316, w: 16, h: 106 },
        { x: 220, y: 120, w: 16, h: 90 },
        { x: 360, y: 270, w: 16, h: 90 },
      ],
      enemies: [
        { x: 240, y: 160, r: 8, axis: "x", min: 90, max: 540, speed: 300, dir: 1 },
        { x: 380, y: 310, r: 8, axis: "x", min: 100, max: 520, speed: 330, dir: -1 },
        { x: 520, y: 155, r: 8, axis: "y", min: 78, max: 350, speed: 300, dir: 1 },
        { x: 650, y: 250, r: 8, axis: "y", min: 60, max: 420, speed: 310, dir: -1 },
        { kind: "orbit", cx: 300, cy: 160, rx: 26, ry: 20, r: 8, speed: 4.7, phase: 0.2 },
        { kind: "orbit", cx: 440, cy: 310, rx: 32, ry: 22, r: 8, speed: -4.9, phase: 1.4 },
        { kind: "orbit", cx: 580, cy: 160, rx: 22, ry: 30, r: 8, speed: 5.1, phase: 0.9 },
        { kind: "orbit", cx: 220, cy: 250, rx: 24, ry: 30, r: 8, speed: -4.8, phase: 2.0 },
        { kind: "orbit", cx: 390, cy: 250, rx: 60, ry: 16, r: 8, speed: 5.25, phase: 0.6 },
        { kind: "orbit", cx: 140, cy: 360, rx: 26, ry: 18, r: 8, speed: -5.0, phase: 1.7 },
        { kind: "orbit", cx: 610, cy: 90, rx: 18, ry: 18, r: 8, speed: 5.35, phase: 0.4 },
        { x: 260, y: 160, r: 8, axis: "y", min: 90, max: 340, speed: 305, dir: 1 },
        { x: 500, y: 250, r: 8, axis: "x", min: 300, max: 620, speed: 315, dir: -1 },
      ],
    },
    {
      name: "Crossfire",
      start: { x: 36, y: 220 },
      goal: { x: 650, y: 220, w: 46, h: 46 },
      coins: [
        { x: 182, y: 52, r: 6 },
        { x: 318, y: 428, r: 6 },
        { x: 462, y: 52, r: 6 },
        { x: 602, y: 428, r: 6 },
      ],
      walls: [
        { x: 120, y: 0, w: 16, h: 180 },
        { x: 120, y: 300, w: 16, h: 180 },
        { x: 240, y: 120, w: 16, h: 240 },
        { x: 360, y: 0, w: 16, h: 180 },
        { x: 360, y: 300, w: 16, h: 180 },
        { x: 500, y: 120, w: 16, h: 240 },
        { x: 620, y: 0, w: 16, h: 160 },
        { x: 620, y: 320, w: 16, h: 160 },
      ],
      enemies: [
        { x: 180, y: 90, r: 8, axis: "y", min: 36, max: 430, speed: 330, dir: 1 },
        { x: 300, y: 390, r: 8, axis: "y", min: 36, max: 430, speed: 350, dir: -1 },
        { x: 440, y: 90, r: 8, axis: "y", min: 36, max: 430, speed: 370, dir: 1 },
        { x: 585, y: 390, r: 8, axis: "x", min: 560, max: 690, speed: 370, dir: 1 },
        { kind: "orbit", cx: 585, cy: 240, rx: 42, ry: 70, r: 8, speed: 4.7, phase: 0.4 },
        { kind: "orbit", cx: 180, cy: 240, rx: 30, ry: 74, r: 8, speed: -4.4, phase: 2.1 },
        { kind: "orbit", cx: 350, cy: 240, rx: 48, ry: 22, r: 8, speed: 4.9, phase: 1.0 },
        { kind: "orbit", cx: 470, cy: 160, rx: 28, ry: 20, r: 8, speed: -5.05, phase: 0.8 },
      ],
    },
    {
      name: "Final Run",
      start: { x: 36, y: 36 },
      goal: { x: 650, y: 392, w: 46, h: 46 },
      coins: [
        { x: 154, y: 68, r: 6 },
        { x: 282, y: 170, r: 6 },
        { x: 412, y: 298, r: 6 },
        { x: 552, y: 424, r: 6 },
      ],
      walls: [
        { x: 96, y: 48, w: 540, h: 16 },
        { x: 96, y: 198, w: 470, h: 16 },
        { x: 166, y: 348, w: 470, h: 16 },
        { x: 166, y: 48, w: 16, h: 116 },
        { x: 306, y: 198, w: 16, h: 116 },
        { x: 446, y: 348, w: 16, h: 116 },
        { x: 586, y: 48, w: 16, h: 266 },
      ],
      enemies: [
        { x: 220, y: 116, r: 8, axis: "x", min: 120, max: 540, speed: 360, dir: 1 },
        { x: 360, y: 266, r: 8, axis: "x", min: 140, max: 520, speed: 390, dir: -1 },
        { x: 500, y: 416, r: 8, axis: "x", min: 170, max: 560, speed: 410, dir: 1 },
        { kind: "orbit", cx: 270, cy: 116, rx: 24, ry: 20, r: 8, speed: 5.05, phase: 0.1 },
        { kind: "orbit", cx: 410, cy: 266, rx: 28, ry: 22, r: 8, speed: -5.1, phase: 1.3 },
        { kind: "orbit", cx: 550, cy: 416, rx: 22, ry: 22, r: 8, speed: 5.2, phase: 2.2 },
        { kind: "orbit", cx: 600, cy: 220, rx: 18, ry: 64, r: 8, speed: -4.9, phase: 0.6 },
        { kind: "orbit", cx: 150, cy: 220, rx: 16, ry: 58, r: 8, speed: 4.95, phase: 1.1 },
        { x: 250, y: 68, r: 8, axis: "x", min: 160, max: 550, speed: 420, dir: 1 },
        { x: 430, y: 378, r: 8, axis: "x", min: 180, max: 620, speed: 440, dir: -1 },
        { x: 320, y: 236, r: 8, axis: "y", min: 120, max: 360, speed: 385, dir: 1 },
        { kind: "orbit", cx: 210, cy: 316, rx: 26, ry: 18, r: 8, speed: 5.4, phase: 0.7 },
      ],
    },
  ];
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleRectHit(circle, rect) {
  const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function currentLevel() {
  return state.levels[state.levelIndex];
}

function setTimer() {
  const limit = LEVEL_TIME_LIMIT + (sessionPowerups.timeBoost ? 10 : 0);
  state.levelEndsAt = performance.now() + limit * 1000;
  timerLabel.textContent = String(limit);
}

function formatRunTime(ms) {
  const totalTenths = Math.max(0, Math.floor(ms / 100));
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function updateRunTimer(now) {
  if (!state.runStartAt) {
    runTimerLabel.textContent = "0:00.0";
    return;
  }
  runTimerLabel.textContent = formatRunTime(now - state.runStartAt);
}

function syncShieldLabel() {
  shieldLabel.textContent = state.shieldReady ? "Ready" : "None";
}

function applyWorldPowerups() {
  player.speed = basePlayerSpeed + (sessionPowerups.speedBoost ? 40 : 0);
}

function getGoalBounds(level) {
  const goal = level.goal;
  const scale = sessionPowerups.goalAssist ? 1.22 : 1;
  const width = Math.min(canvas.width, goal.w * scale);
  const height = Math.min(canvas.height, goal.h * scale);
  return {
    x: goal.x - (width - goal.w) / 2,
    y: goal.y - (height - goal.h) / 2,
    w: width,
    h: height,
  };
}

function startLevel(index, options = {}) {
  initSessionPowerups();
  if (options.resetRun) {
    state.runStartAt = performance.now();
  } else if (!state.runStartAt) {
    state.runStartAt = performance.now();
  }
  state.levelIndex = index;
  state.levelCleared = false;
  state.gameWon = false;
  state.collected = new Set();
  state.shieldReady = options.keepShield ? state.shieldReady : sessionPowerups.shield;
  player.x = currentLevel().start.x;
  player.y = currentLevel().start.y;
  player.speed = basePlayerSpeed;
  setTimer();
  applyWorldPowerups();
  syncShieldLabel();
  levelLabel.textContent = String(index + 1);
  winOverlay.hidden = true;
  if (options.resetDeaths) {
    state.deaths = 0;
    deathsLabel.textContent = "0";
  }
}

function restartCurrentLevel(options = {}) {
  startLevel(state.levelIndex, options);
}

function restartToLevelOne() {
  startLevel(0);
}

function updateEnemies(level, dt, timeSeconds) {
  const enemyScale = sessionPowerups.slowEnemies ? 0.86 : 1.18;
  for (const enemy of level.enemies) {
    if (enemy.kind === "orbit") {
      const angle = timeSeconds * enemy.speed * enemyScale + enemy.phase;
      enemy.x = enemy.cx + Math.cos(angle) * enemy.rx;
      enemy.y = enemy.cy + Math.sin(angle) * enemy.ry;
      continue;
    }

    const step = enemy.speed * enemyScale * dt * (enemy.dir || 1);
    if (enemy.axis === "x") {
      enemy.x += step;
      if (enemy.x < enemy.min + enemy.r) {
        enemy.x = enemy.min + enemy.r;
        enemy.dir = 1;
      } else if (enemy.x > enemy.max - enemy.r) {
        enemy.x = enemy.max - enemy.r;
        enemy.dir = -1;
      }
      continue;
    }

    enemy.y += step;
    if (enemy.y < enemy.min + enemy.r) {
      enemy.y = enemy.min + enemy.r;
      enemy.dir = 1;
    } else if (enemy.y > enemy.max - enemy.r) {
      enemy.y = enemy.max - enemy.r;
      enemy.dir = -1;
    }
  }
}

function drawBackground(level) {
  ctx.fillStyle = "#a8a8ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cell = 24;
  for (let y = 0; y < canvas.height; y += cell) {
    for (let x = 0; x < canvas.width; x += cell) {
      ctx.fillStyle = ((x / cell + y / cell) % 2 === 0) ? "#fbfbff" : "#e9e8ff";
      ctx.fillRect(x, y, cell, cell);
    }
  }

  const goal = getGoalBounds(level);
  ctx.fillStyle = "rgba(86, 240, 165, 0.24)";
  ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
  ctx.strokeStyle = "#56f0a5";
  ctx.lineWidth = 3;
  ctx.strokeRect(goal.x + 1.5, goal.y + 1.5, goal.w - 3, goal.h - 3);

  ctx.fillStyle = "#000";
  for (const wall of level.walls) {
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  }
}

function drawCoins(level) {
  for (const coin of level.coins || []) {
    const key = `${coin.x},${coin.y}`;
    if (state.collected.has(key)) continue;
    ctx.beginPath();
    ctx.fillStyle = "#ffd84d";
    ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";
    ctx.stroke();
  }
}

function drawEnemies(level) {
  for (const enemy of level.enemies) {
    const radius = enemy.r || 8;
    ctx.beginPath();
    ctx.fillStyle = "#4f8dff";
    ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.fillStyle = "#ff445f";
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#000";
  ctx.strokeRect(player.x + 1, player.y + 1, player.size - 2, player.size - 2);
}

function clampPlayer(nextX, nextY, level) {
  let x = Math.max(0, Math.min(canvas.width - player.size, nextX));
  let y = Math.max(0, Math.min(canvas.height - player.size, nextY));

  const horizontalBox = { x, y: player.y, w: player.size, h: player.size };
  for (const wall of level.walls) {
    if (rectsOverlap(horizontalBox, wall)) {
      x = player.x;
      break;
    }
  }

  const verticalBox = { x, y, w: player.size, h: player.size };
  for (const wall of level.walls) {
    if (rectsOverlap(verticalBox, wall)) {
      y = player.y;
      break;
    }
  }

  const finalBox = { x, y, w: player.size, h: player.size };
  for (const wall of level.walls) {
    if (rectsOverlap(finalBox, wall)) {
      return { x: player.x, y: player.y };
    }
  }

  return { x, y };
}

function handleMovement(dt, level) {
  let dx = 0;
  let dy = 0;
  if (keys.has("arrowleft") || keys.has("a")) dx -= player.speed * dt;
  if (keys.has("arrowright") || keys.has("d")) dx += player.speed * dt;
  if (keys.has("arrowup") || keys.has("w")) dy -= player.speed * dt;
  if (keys.has("arrowdown") || keys.has("s")) dy += player.speed * dt;

  if (dx !== 0 || dy !== 0) {
    const moved = clampPlayer(player.x + dx, player.y + dy, level);
    player.x = moved.x;
    player.y = moved.y;
  }
}

function collectCoins(level) {
  for (const coin of level.coins || []) {
    const key = `${coin.x},${coin.y}`;
    if (state.collected.has(key)) continue;
    const centerX = player.x + player.size / 2;
    const centerY = player.y + player.size / 2;
    const dx = centerX - coin.x;
    const dy = centerY - coin.y;
    const reach = coin.r + player.size / 2;
    if (dx * dx + dy * dy <= reach * reach) {
      state.collected.add(key);
    }
  }
}

function checkHazards(level) {
  const box = { x: player.x, y: player.y, w: player.size, h: player.size };

  for (const enemy of level.enemies) {
    const hit = enemy.kind === "orbit"
      ? circleRectHit({ x: enemy.x, y: enemy.y, r: enemy.r || 8 }, box)
      : circleRectHit({ x: enemy.x, y: enemy.y, r: enemy.r || 8 }, box);

    if (hit) {
      if (state.shieldReady) {
        state.shieldReady = false;
        syncShieldLabel();
        restartCurrentLevel({ keepShield: true });
        return true;
      }

      state.deaths += 1;
      deathsLabel.textContent = String(state.deaths);
      restartCurrentLevel();
      return true;
    }
  }

  return false;
}

function checkGoal(level) {
  const box = { x: player.x, y: player.y, w: player.size, h: player.size };
  const hasAllCoins = !level.coins || level.coins.every((coin) => state.collected.has(`${coin.x},${coin.y}`));
  return hasAllCoins && rectsOverlap(box, getGoalBounds(level));
}

function completeLevel() {
  if (state.levelIndex < state.levels.length - 1) {
    PixelParty.addCredits(1);
    startLevel(state.levelIndex + 1);
    return;
  }

  if (!state.rewardGranted) {
    const elapsedMs = performance.now() - (state.runStartAt || performance.now());
    const reward = Math.max(1, Math.min(50, 50 - Math.floor(elapsedMs / 30000)));
    PixelParty.addCredits(reward);
    if (winRewardLabel) {
      winRewardLabel.textContent = `+${reward} credits`;
    }
    if (finalTimeLabel) {
      finalTimeLabel.textContent = `Final Time: ${formatRunTime(elapsedMs)}`;
    }
    state.rewardGranted = true;
  }

  state.gameWon = true;
  winOverlay.hidden = false;
}

function updateTimer(now) {
  const remaining = Math.max(0, Math.ceil((state.levelEndsAt - now) / 1000));
  timerLabel.textContent = String(remaining);
  if (remaining <= 0 && !state.gameWon) {
    restartToLevelOne();
  }
}

function drawFrame(level) {
  drawBackground(level);
  drawCoins(level);
  drawEnemies(level);
  drawPlayer();
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.font = "bold 20px Trebuchet MS, sans-serif";
  ctx.fillText(level.name, 18, 28);
}

function loop(time) {
  const level = currentLevel();
  const dt = Math.min(0.033, (time - (state.lastTime || time)) / 1000);
  state.lastTime = time;

  updateRunTimer(time);
  updateTimer(time);

  if (!state.gameWon) {
    updateEnemies(level, dt, time / 1000);
    handleMovement(dt, level);
    collectCoins(level);
    if (!checkHazards(level) && !state.gameWon && checkGoal(level)) {
      completeLevel();
    }
  }

  drawFrame(level);
  requestAnimationFrame(loop);
}

function resetRun() {
  state.deaths = 0;
  deathsLabel.textContent = "0";
  state.rewardGranted = false;
  state.gameWon = false;
  winOverlay.hidden = true;
  state.runStartAt = performance.now();
  if (winRewardLabel) {
    winRewardLabel.textContent = "+9 credits";
  }
  if (finalTimeLabel) {
    finalTimeLabel.textContent = "Final Time: 0:00.0";
  }
  startLevel(0, { resetDeaths: true, resetRun: true });
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);
  if (key === "r") {
    restartCurrentLevel();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

document.querySelectorAll("[data-dir]").forEach((button) => {
  button.addEventListener("click", () => {
    const dir = button.getAttribute("data-dir");
    const key = dir === "up" ? "arrowup" : dir === "down" ? "arrowdown" : dir === "left" ? "arrowleft" : "arrowright";
    keys.add(key);
    setTimeout(() => keys.delete(key), 120);
  });
});

restartBtn.addEventListener("click", resetRun);
winRestartBtn.addEventListener("click", resetRun);
window.addEventListener("pixel-party-updated", (event) => {
  if (sessionPowerups.initializing) return;
  if (["whgShield", "whgSlowEnemies", "whgSpeedBoost", "whgGoalAssist", "whgTimeBoost"].includes(event?.detail?.id) && event?.detail?.type !== "consume") {
    sessionPowerups.initialized = false;
  }
  applyWorldPowerups();
  if (event?.detail?.id === "whgShield") {
    state.shieldReady = sessionPowerups.shield;
    syncShieldLabel();
  }
});

deathsLabel.textContent = "0";
applyWorldPowerups();
startLevel(0, { resetDeaths: true, resetRun: true });
requestAnimationFrame(loop);
