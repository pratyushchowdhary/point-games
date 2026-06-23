(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.querySelector("#score");
  const speedEl = document.querySelector("#speed");
  const highScoreEl = document.querySelector("#high-score");
  const overlay = document.querySelector("#overlay");
  const message = document.querySelector("#message");
  const submessage = document.querySelector("#submessage");
  const phone = document.querySelector(".phone");
  const screenLabel = document.querySelector("#screen-label");
  const screenMinus = document.querySelector("#screen-minus");
  const screenPlus = document.querySelector("#screen-plus");
  const originalModeButton = document.querySelector("#mode-original");
  const modernModeButton = document.querySelector("#mode-modern");

  const SCREEN_MODES = [
    { label: "NOKIA ORIGINAL · 1.5″", width: 84, height: 48 },
    { label: "CLASSIC PHONE · 3.5″", width: 105, height: 60 },
    { label: "STANDARD PHONE · 4.7″", width: 126, height: 72 },
    { label: "PLUS PHONE · 5.5″", width: 147, height: 84 },
    { label: "MODERN PHONE · 6.1″", width: 168, height: 96 },
    { label: "LARGE PHONE · 6.7″", width: 189, height: 108 },
    { label: "LAPTOP · FIT TO SCREEN", dynamic: true }
  ];
  const SNAKE_PIXEL_SIZE = 3;
  const DISPLAY_SCALE = 4;
  const START_SPEED = 150;
  const MODERN_START_KMH = 5;
  const directions = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
  };

  let snake;
  let food;
  let direction;
  let queuedDirection;
  let score;
  let touchStart = null;
  let gameMode = localStorage.getItem("snake97-game-mode") === "modern" ? "modern" : "original";
  let screenIndex = Math.min(
    SCREEN_MODES.length - 1,
    Math.max(0, Number(localStorage.getItem("snake97-screen-size") || 0))
  );
  let timer = null;
  let state = "ready";
  let highScore = readHighScore();
  highScoreEl.textContent = formatScore(highScore);

  function formatScore(value) {
    return String(value).padStart(3, "0");
  }

  function readHighScore() {
    const key = gameMode === "modern" ? "snake97-high-score-modern" : "snake97-high-score";
    return Number(localStorage.getItem(key) || 0);
  }

  function getSpeedKmh() {
    return MODERN_START_KMH + score;
  }

  function updateSpeedDisplay() {
    speedEl.textContent = gameMode === "modern" ? `${getSpeedKmh()}KM` : "LV1";
  }

  function reset() {
    const columns = getColumns();
    const rows = getRows();
    const startX = Math.floor(columns / 2);
    const startY = Math.floor(rows / 2);
    snake = [{ x: startX, y: startY }, { x: startX - 1, y: startY }, { x: startX - 2, y: startY }];
    direction = directions.right;
    queuedDirection = directions.right;
    score = 0;
    scoreEl.textContent = "000";
    updateSpeedDisplay();
    placeFood();
    draw();
  }

  function placeFood() {
    const openCells = [];
    for (let y = 0; y < getRows(); y += 1) {
      for (let x = 0; x < getColumns(); x += 1) {
        if (!snake.some(part => part.x === x && part.y === y)) openCells.push({ x, y });
      }
    }
    food = openCells[Math.floor(Math.random() * openCells.length)];
  }

  function start() {
    clearTimeout(timer);
    reset();
    state = "playing";
    overlay.classList.add("hidden");
    scheduleTick();
  }

  function scheduleTick() {
    const speed = gameMode === "modern"
      ? Math.max(55, Math.round(2000 / (5 + getSpeedKmh())))
      : START_SPEED;
    timer = setTimeout(tick, speed);
  }

  function tick() {
    direction = queuedDirection;
    let head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    };
    if (gameMode === "modern") {
      head = {
        x: (head.x + getColumns()) % getColumns(),
        y: (head.y + getRows()) % getRows()
      };
    }
    const ate = head.x === food.x && head.y === food.y;
    const bodyToCheck = ate ? snake : snake.slice(0, -1);
    const hitWall = gameMode === "original" && (
      head.x < 0 || head.x >= getColumns() || head.y < 0 || head.y >= getRows()
    );
    const hitSelf = bodyToCheck.some(part => part.x === head.x && part.y === head.y);

    if (hitWall || hitSelf) {
      endGame();
      return;
    }

    snake.unshift(head);
    if (ate) {
      score += gameMode === "modern" ? 1 : 10;
      scoreEl.textContent = formatScore(score);
      updateSpeedDisplay();
      placeFood();
      beep(620, 0.045);
    } else {
      snake.pop();
    }
    draw();
    scheduleTick();
  }

  function endGame() {
    state = "over";
    clearTimeout(timer);
    if (score > highScore) {
      highScore = score;
      const key = gameMode === "modern" ? "snake97-high-score-modern" : "snake97-high-score";
      localStorage.setItem(key, String(highScore));
      highScoreEl.textContent = formatScore(highScore);
    }
    message.textContent = "GAME OVER";
    submessage.textContent = `SCORE ${formatScore(score)} · PRESS START`;
    overlay.classList.remove("hidden");
    beep(150, 0.16);
  }

  function togglePause() {
    if (state === "playing") {
      state = "paused";
      clearTimeout(timer);
      message.textContent = "PAUSED";
      submessage.textContent = "SPACE TO CONTINUE";
      overlay.classList.remove("hidden");
    } else if (state === "paused") {
      state = "playing";
      overlay.classList.add("hidden");
      scheduleTick();
    }
  }

  function setDirection(next) {
    if (state !== "playing") return;
    if (next.x + direction.x === 0 && next.y + direction.y === 0) return;
    queuedDirection = next;
  }

  function getPixelSize() {
    return SNAKE_PIXEL_SIZE;
  }

  function getColumns() {
    return canvas.width / getPixelSize();
  }

  function getRows() {
    return canvas.height / getPixelSize();
  }

  function changeScreenSize(delta) {
    const nextIndex = Math.min(SCREEN_MODES.length - 1, Math.max(0, screenIndex + delta));
    if (nextIndex === screenIndex) return;
    screenIndex = nextIndex;
    localStorage.setItem("snake97-screen-size", String(screenIndex));
    applyScreenMode(true);
  }

  function changeGameMode(nextMode) {
    if (nextMode === gameMode) return;
    gameMode = nextMode;
    localStorage.setItem("snake97-game-mode", gameMode);
    highScore = readHighScore();
    highScoreEl.textContent = formatScore(highScore);
    clearTimeout(timer);
    state = "ready";
    updateModePicker();
    reset();
    message.textContent = gameMode === "modern" ? "MODERN MODE" : "ORIGINAL MODE";
    submessage.textContent = gameMode === "modern"
      ? "WRAP ON · 5 KM/H · PRESS START"
      : "WALLS ON · LEVEL 1 · PRESS START";
    overlay.classList.remove("hidden");
  }

  function updateModePicker() {
    originalModeButton.setAttribute("aria-pressed", String(gameMode === "original"));
    modernModeButton.setAttribute("aria-pressed", String(gameMode === "modern"));
  }

  function laptopDimensions() {
    const availableWidth = Math.max(336, window.innerWidth - 48);
    const availableHeight = Math.max(192, window.innerHeight - 210);
    const fittedWidth = Math.min(availableWidth, availableHeight * 7 / 4);
    const units = Math.max(10, Math.floor(fittedWidth / (DISPLAY_SCALE * 21)));
    return { width: units * 21, height: units * 12 };
  }

  function applyScreenMode(announce) {
    const mode = SCREEN_MODES[screenIndex];
    const dimensions = mode.dynamic ? laptopDimensions() : mode;
    clearTimeout(timer);
    state = "ready";
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    phone.style.setProperty("--playzone-width", `${dimensions.width * DISPLAY_SCALE}px`);
    phone.classList.toggle("expanded-mode", screenIndex !== 0);
    phone.classList.toggle("laptop-mode", Boolean(mode.dynamic));
    updateScreenPicker();
    reset();
    if (announce) {
      message.textContent = mode.label.split(" · ")[0];
      submessage.textContent = `${dimensions.width} × ${dimensions.height} PIXELS · PRESS START`;
      overlay.classList.remove("hidden");
    }
  }

  function updateScreenPicker() {
    screenLabel.textContent = SCREEN_MODES[screenIndex].label;
    screenMinus.disabled = screenIndex === 0;
    screenPlus.disabled = screenIndex === SCREEN_MODES.length - 1;
  }

  function draw() {
    const cell = getPixelSize();
    ctx.fillStyle = "#a9b77a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#27351e";
    snake.forEach((part, index) => {
      const inset = cell >= 6 ? 1 : 0;
      ctx.fillRect(part.x * cell + inset, part.y * cell + inset, cell - inset * 2, cell - inset * 2);
      if (index === 0 && cell >= 4) {
        ctx.fillStyle = "#a9b77a";
        ctx.fillRect(part.x * cell + cell - 2, part.y * cell + 1, 1, 1);
        ctx.fillStyle = "#27351e";
      }
    });

    const foodInset = cell >= 6 ? 1 : 0;
    ctx.fillRect(food.x * cell + foodInset, food.y * cell + foodInset, cell - foodInset * 2, cell - foodInset * 2);
  }

  function beep(frequency, duration) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audio = new AudioContext();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.035, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
      oscillator.addEventListener("ended", () => audio.close());
    } catch (_) { /* Audio is optional. */ }
  }

  const keyMap = {
    ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down",
    ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right"
  };

  document.addEventListener("keydown", event => {
    if (keyMap[event.key]) {
      event.preventDefault();
      setDirection(directions[keyMap[event.key]]);
    } else if (event.code === "Space") {
      event.preventDefault();
      togglePause();
    } else if (event.key === "Enter" && state !== "playing") {
      start();
    }
  });

  document.querySelector("#start").addEventListener("click", start);
  document.querySelector("#pause").addEventListener("click", togglePause);
  screenMinus.addEventListener("click", () => changeScreenSize(-1));
  screenPlus.addEventListener("click", () => changeScreenSize(1));
  originalModeButton.addEventListener("click", () => changeGameMode("original"));
  modernModeButton.addEventListener("click", () => changeGameMode("modern"));
  document.querySelectorAll("[data-direction]").forEach(button => {
    button.addEventListener("click", () => setDirection(directions[button.dataset.direction]));
  });

  canvas.addEventListener("touchstart", event => {
    const touch = event.changedTouches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });

  canvas.addEventListener("touchend", event => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 18) return;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDirection(deltaX > 0 ? directions.right : directions.left);
    } else {
      setDirection(deltaY > 0 ? directions.down : directions.up);
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (SCREEN_MODES[screenIndex].dynamic) applyScreenMode(false);
  });

  updateModePicker();
  applyScreenMode(false);
})();
