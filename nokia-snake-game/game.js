(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.querySelector("#score");
  const highScoreEl = document.querySelector("#high-score");
  const overlay = document.querySelector("#overlay");
  const message = document.querySelector("#message");
  const submessage = document.querySelector("#submessage");
  const pixelLabel = document.querySelector("#pixel-label");
  const pixelMinus = document.querySelector("#pixel-minus");
  const pixelPlus = document.querySelector("#pixel-plus");

  const PIXEL_SIZES = [
    { label: "NOKIA ORIGINAL", size: 3 },
    { label: "BIG", size: 4 },
    { label: "BIGGER", size: 6 },
    { label: "BIGGEST", size: 12 }
  ];
  const START_SPEED = 150;
  const MIN_SPEED = 65;
  const directions = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
  };

  let snake;
  let food;
  let direction;
  let queuedDirection;
  let score;
  let pixelIndex = Math.min(
    PIXEL_SIZES.length - 1,
    Math.max(0, Number(localStorage.getItem("snake97-pixel-size") || 0))
  );
  let timer = null;
  let state = "ready";
  let highScore = Number(localStorage.getItem("snake97-high-score") || 0);
  highScoreEl.textContent = formatScore(highScore);

  function formatScore(value) {
    return String(value).padStart(3, "0");
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
    const speed = Math.max(MIN_SPEED, START_SPEED - score * 3);
    timer = setTimeout(tick, speed);
  }

  function tick() {
    direction = queuedDirection;
    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    };
    const ate = head.x === food.x && head.y === food.y;
    const bodyToCheck = ate ? snake : snake.slice(0, -1);
    const hitWall = head.x < 0 || head.x >= getColumns() || head.y < 0 || head.y >= getRows();
    const hitSelf = bodyToCheck.some(part => part.x === head.x && part.y === head.y);

    if (hitWall || hitSelf) {
      endGame();
      return;
    }

    snake.unshift(head);
    if (ate) {
      score += 10;
      scoreEl.textContent = formatScore(score);
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
      localStorage.setItem("snake97-high-score", String(highScore));
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
    return PIXEL_SIZES[pixelIndex].size;
  }

  function getColumns() {
    return canvas.width / getPixelSize();
  }

  function getRows() {
    return canvas.height / getPixelSize();
  }

  function changePixelSize(delta) {
    const nextIndex = Math.min(PIXEL_SIZES.length - 1, Math.max(0, pixelIndex + delta));
    if (nextIndex === pixelIndex) return;
    pixelIndex = nextIndex;
    localStorage.setItem("snake97-pixel-size", String(pixelIndex));
    clearTimeout(timer);
    state = "ready";
    updatePixelPicker();
    reset();
    message.textContent = PIXEL_SIZES[pixelIndex].label;
    submessage.textContent = `${getColumns()} × ${getRows()} BLOCKS · PRESS START`;
    overlay.classList.remove("hidden");
  }

  function updatePixelPicker() {
    pixelLabel.textContent = PIXEL_SIZES[pixelIndex].label;
    pixelMinus.disabled = pixelIndex === 0;
    pixelPlus.disabled = pixelIndex === PIXEL_SIZES.length - 1;
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
  pixelMinus.addEventListener("click", () => changePixelSize(-1));
  pixelPlus.addEventListener("click", () => changePixelSize(1));
  document.querySelectorAll("[data-direction]").forEach(button => {
    button.addEventListener("click", () => setDirection(directions[button.dataset.direction]));
  });

  updatePixelPicker();
  reset();
})();
