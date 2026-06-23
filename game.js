(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.querySelector("#score");
  const highScoreEl = document.querySelector("#high-score");
  const overlay = document.querySelector("#overlay");
  const message = document.querySelector("#message");
  const submessage = document.querySelector("#submessage");

  const CELLS = 20;
  const CELL = canvas.width / CELLS;
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
  let timer = null;
  let state = "ready";
  let highScore = Number(localStorage.getItem("snake97-high-score") || 0);
  highScoreEl.textContent = formatScore(highScore);

  function formatScore(value) {
    return String(value).padStart(3, "0");
  }

  function reset() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    direction = directions.right;
    queuedDirection = directions.right;
    score = 0;
    scoreEl.textContent = "000";
    placeFood();
    draw();
  }

  function placeFood() {
    const openCells = [];
    for (let y = 0; y < CELLS; y += 1) {
      for (let x = 0; x < CELLS; x += 1) {
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
    const hitWall = head.x < 0 || head.x >= CELLS || head.y < 0 || head.y >= CELLS;
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

  function draw() {
    ctx.fillStyle = "#a9b77a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(39, 53, 30, .08)";
    for (let y = 0; y < CELLS; y += 1) {
      for (let x = 0; x < CELLS; x += 1) {
        if ((x + y) % 2 === 0) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }

    ctx.fillStyle = "#27351e";
    snake.forEach((part, index) => {
      const inset = index === 0 ? 1 : 2;
      ctx.fillRect(part.x * CELL + inset, part.y * CELL + inset, CELL - inset * 2, CELL - inset * 2);
    });

    ctx.fillRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6);
    ctx.fillStyle = "#a9b77a";
    ctx.fillRect(food.x * CELL + 6, food.y * CELL + 6, 3, 3);
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
  document.querySelectorAll("[data-direction]").forEach(button => {
    button.addEventListener("click", () => setDirection(directions[button.dataset.direction]));
  });

  reset();
})();
