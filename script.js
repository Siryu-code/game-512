(function () {
  "use strict";

  var ALL_TARGETS = [
    8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768,
  ];
  var MAX_TARGET_BY_SIZE = { 4: 512, 6: 8192, 8: 32768 };
  var MIN_SWIPE_DISTANCE = 30; // piksel minimum agar dianggap swipe/drag

  var game = {
    size: 4,
    target: 128,
    board: [],
    score: 0,
    status: "setup",
  };

  var sizeSelect = document.getElementById("size-select");
  var targetSelect = document.getElementById("target-select");
  var startBtn = document.getElementById("start-btn");
  var resetBtn = document.getElementById("reset-btn");
  var difficultyBtn = document.getElementById("difficulty-btn");
  var gameSection = document.getElementById("game-section");
  var boardEl = document.getElementById("board");
  var targetInfo = document.getElementById("target-info");
  var scoreInfo = document.getElementById("score-info");
  var statusEl = document.getElementById("status");

  function getAllowedTargets(size) {
    var result = [];
    var i;
    for (i = 0; i < ALL_TARGETS.length; i++) {
      if (ALL_TARGETS[i] <= MAX_TARGET_BY_SIZE[size]) {
        result.push(ALL_TARGETS[i]);
      }
    }
    return result;
  }

  function fillTargetOptions() {
    var size = parseInt(sizeSelect.value, 10);
    var previous = parseInt(targetSelect.value, 10);
    var allowed = getAllowedTargets(size);
    var keepPrevious = false;
    var i, option;

    targetSelect.options.length = 0;

    for (i = 0; i < allowed.length; i++) {
      option = document.createElement("option");
      option.value = allowed[i];
      option.textContent = allowed[i];
      targetSelect.appendChild(option);
      if (allowed[i] === previous) {
        keepPrevious = true;
      }
    }

    targetSelect.value = keepPrevious ? previous : allowed[allowed.length - 1];
  }

  function setSettingsLocked(locked) {
    sizeSelect.disabled = locked;
    targetSelect.disabled = locked;
    startBtn.disabled = locked;
  }

  function createEmptyBoard(size) {
    var board = [];
    var r, c, row;
    for (r = 0; r < size; r++) {
      row = [];
      for (c = 0; c < size; c++) {
        row.push(0);
      }
      board.push(row);
    }
    return board;
  }

  function initGame(size, target) {
    game.size = size;
    game.target = target;
    game.board = createEmptyBoard(size);
    game.score = 0;
    game.status = "playing";

    spawnTile();
    spawnTile();
    render();
  }

  function startGame() {
    var size = parseInt(sizeSelect.value, 10);
    var target = parseInt(targetSelect.value, 10);

    setSettingsLocked(true);
    gameSection.classList.remove("hidden");
    initGame(size, target);
  }

  function resetGame() {
    initGame(game.size, game.target);
  }

  function backToSettings() {
    game.status = "setup";
    game.board = [];
    game.score = 0;
    boardEl.innerHTML = "";
    statusEl.className = "status hidden";
    statusEl.textContent = "";
    gameSection.classList.add("hidden");
    setSettingsLocked(false);
  }

  function getEmptyCells(board) {
    var cells = [];
    var r, c;
    for (r = 0; r < board.length; r++) {
      for (c = 0; c < board.length; c++) {
        if (board[r][c] === 0) {
          cells.push({ r: r, c: c });
        }
      }
    }
    return cells;
  }

  function spawnTile() {
    var empty = getEmptyCells(game.board);
    var pick;
    if (empty.length === 0) {
      return;
    }
    pick = empty[Math.floor(Math.random() * empty.length)];
    game.board[pick.r][pick.c] = Math.random() < 0.9 ? 2 : 4;
  }

  function slideLine(line) {
    var tiles = [];
    var result = [];
    var gained = 0;
    var i = 0;
    var merged;

    for (i = 0; i < line.length; i++) {
      if (line[i] !== 0) {
        tiles.push(line[i]);
      }
    }

    i = 0;
    while (i < tiles.length) {
      if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
        merged = tiles[i] * 2;
        result.push(merged);
        gained += merged;
        i += 2;
      } else {
        result.push(tiles[i]);
        i += 1;
      }
    }

    while (result.length < line.length) {
      result.push(0);
    }

    return { line: result, score: gained };
  }

  function getCellPosition(direction, index, k, size) {
    if (direction === "left") {
      return { r: index, c: k };
    }
    if (direction === "right") {
      return { r: index, c: size - 1 - k };
    }
    if (direction === "up") {
      return { r: k, c: index };
    }
    return { r: size - 1 - k, c: index }; // down
  }

  function readLine(board, direction, index) {
    var size = board.length;
    var line = [];
    var k, pos;
    for (k = 0; k < size; k++) {
      pos = getCellPosition(direction, index, k, size);
      line.push(board[pos.r][pos.c]);
    }
    return line;
  }

  function writeLine(board, direction, index, line) {
    var size = board.length;
    var k, pos;
    for (k = 0; k < size; k++) {
      pos = getCellPosition(direction, index, k, size);
      board[pos.r][pos.c] = line[k];
    }
  }

  function linesAreEqual(a, b) {
    var i;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  function moveBoard(direction) {
    var size = game.size;
    var moved = false;
    var index, oldLine, result;

    for (index = 0; index < size; index++) {
      oldLine = readLine(game.board, direction, index);
      result = slideLine(oldLine);

      if (!linesAreEqual(oldLine, result.line)) {
        moved = true;
        writeLine(game.board, direction, index, result.line);
      }
      game.score += result.score;
    }

    return moved;
  }

  function getMaxTile(board) {
    var max = 0;
    var r, c;
    for (r = 0; r < board.length; r++) {
      for (c = 0; c < board.length; c++) {
        if (board[r][c] > max) {
          max = board[r][c];
        }
      }
    }
    return max;
  }

  function hasAvailableMove(board) {
    var size = board.length;
    var r, c, value;

    for (r = 0; r < size; r++) {
      for (c = 0; c < size; c++) {
        value = board[r][c];
        if (value === 0) {
          return true;
        }
        if (c + 1 < size && board[r][c + 1] === value) {
          return true;
        }
        if (r + 1 < size && board[r + 1][c] === value) {
          return true;
        }
      }
    }
    return false;
  }

  function updateGameStatus() {
    if (getMaxTile(game.board) >= game.target) {
      game.status = "won";
    } else if (!hasAvailableMove(game.board)) {
      game.status = "lost";
    }
  }

  function handleMove(direction) {
    var moved;

    if (game.status !== "playing") {
      return;
    }

    moved = moveBoard(direction);
    if (!moved) {
      return;
    }

    spawnTile();
    updateGameStatus();
    render();
  }

  function getTileClass(value) {
    if (value === 0) {
      return "tile-empty";
    }
    if (value <= 2048) {
      return "tile-" + value;
    }
    return "tile-high";
  }

  function getFontFactor(value) {
    var digits = String(value).length;
    if (digits <= 2) {
      return 0.45;
    }
    if (digits === 3) {
      return 0.38;
    }
    if (digits === 4) {
      return 0.3;
    }
    return 0.25;
  }

  function renderStatus() {
    if (game.status === "won") {
      statusEl.textContent =
        "Selamat! Kamu menang! Target " + game.target + " tercapai.";
      statusEl.className = "status status-win";
    } else if (game.status === "lost") {
      statusEl.textContent = "Kamu kalah. Tidak ada langkah yang tersisa.";
      statusEl.className = "status status-lose";
    } else {
      statusEl.textContent = "";
      statusEl.className = "status hidden";
    }
  }

  function render() {
    var size = game.size;
    var cellSize, r, c, value, tile;

    boardEl.innerHTML = "";
    boardEl.className = "board board-" + size;
    boardEl.style.gridTemplateColumns = "repeat(" + size + ", 1fr)";
    boardEl.style.gridTemplateRows = "repeat(" + size + ", 1fr)";

    cellSize = boardEl.clientWidth / size;

    for (r = 0; r < size; r++) {
      for (c = 0; c < size; c++) {
        value = game.board[r][c];
        tile = document.createElement("div");
        tile.className = "tile " + getTileClass(value);
        if (value !== 0) {
          tile.textContent = value;
          tile.style.fontSize =
            Math.floor(cellSize * getFontFactor(value)) + "px";
        }
        boardEl.appendChild(tile);
      }
    }

    targetInfo.textContent = game.target;
    scoreInfo.textContent = game.score;
    renderStatus();
  }

  var touchStart = null;
  var mouseStart = null;
  var lastTouchTime = 0;

  function handleGesture(startX, startY, endX, endY) {
    var dx = endX - startX;
    var dy = endY - startY;
    var absX = Math.abs(dx);
    var absY = Math.abs(dy);

    if (Math.max(absX, absY) < MIN_SWIPE_DISTANCE) {
      return;
    }

    if (absX > absY) {
      handleMove(dx > 0 ? "right" : "left");
    } else {
      handleMove(dy > 0 ? "down" : "up");
    }
  }

  function setupTouchControls() {
    boardEl.addEventListener(
      "touchstart",
      function (e) {
        var t;
        if (e.touches.length !== 1) {
          touchStart = null;
          return;
        }
        t = e.touches[0];
        touchStart = { x: t.clientX, y: t.clientY };
      },
      false,
    );

    boardEl.addEventListener(
      "touchmove",
      function (e) {
        if (touchStart) {
          e.preventDefault();
        }
      },
      false,
    );

    boardEl.addEventListener(
      "touchend",
      function (e) {
        var t, start;
        if (!touchStart) {
          return;
        }
        t = e.changedTouches[0];
        start = touchStart;
        touchStart = null;
        lastTouchTime = new Date().getTime();
        handleGesture(start.x, start.y, t.clientX, t.clientY);
        e.preventDefault();
      },
      false,
    );

    boardEl.addEventListener(
      "touchcancel",
      function () {
        touchStart = null;
      },
      false,
    );
  }

  function setupMouseControls() {
    boardEl.addEventListener(
      "mousedown",
      function (e) {
        if (new Date().getTime() - lastTouchTime < 800) {
          return;
        }
        if (e.button !== 0) {
          return;
        }
        mouseStart = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      },
      false,
    );

    document.addEventListener(
      "mouseup",
      function (e) {
        var start;
        if (!mouseStart) {
          return;
        }
        start = mouseStart;
        mouseStart = null;
        handleGesture(start.x, start.y, e.clientX, e.clientY);
      },
      false,
    );
  }

  function setupKeyboardControls() {
    document.addEventListener(
      "keydown",
      function (e) {
        var direction = null;

        if (e.keyCode === 87) {
          direction = "up";
        } // W
        else if (e.keyCode === 65) {
          direction = "left";
        } // A
        else if (e.keyCode === 83) {
          direction = "down";
        } // S
        else if (e.keyCode === 68) {
          direction = "right";
        } // D

        if (direction !== null && game.status === "playing") {
          e.preventDefault();
          handleMove(direction);
        }
      },
      false,
    );
  }

  function setupUIControls() {
    sizeSelect.addEventListener("change", fillTargetOptions, false);
    startBtn.addEventListener("click", startGame, false);
    resetBtn.addEventListener("click", resetGame, false);
    difficultyBtn.addEventListener("click", backToSettings, false);

    window.addEventListener(
      "resize",
      function () {
        if (game.status !== "setup") {
          render();
        }
      },
      false,
    );
  }

  setupUIControls();
  setupTouchControls();
  setupMouseControls();
  setupKeyboardControls();
})();
