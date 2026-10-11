(function () {
  var SIZE = 4;
  var TARGETS = [128, 256, 512, 1024, 2048];
  var target = 2048;
  var playing = false,
    busy = false,
    won = false,
    continued = false;
  var grid = [],
    tiles = [];

  var boardEl = document.getElementById("board");
  var chipsEl = document.getElementById("chips");
  var targetEl = document.getElementById("target");
  var startBtn = document.getElementById("startBtn");
  var restartBtn = document.getElementById("restartBtn");
  var overlay = document.getElementById("overlay");
  var ovTitle = document.getElementById("ovTitle");
  var ovContinue = document.getElementById("ovContinue");
  var ovRestart = document.getElementById("ovRestart");

  function pct(i) {
    return 2 + 24.5 * i + "%";
  }
  function place(el, r, c) {
    el.style.left = pct(c);
    el.style.top = pct(r);
  }
  function cls(v) {
    return "tile " + (v <= 2048 ? "t" + v : "tbig");
  }

  function buildCells() {
    var r, c, d;
    for (r = 0; r < SIZE; r++) {
      for (c = 0; c < SIZE; c++) {
        d = document.createElement("div");
        d.className = "cell";
        place(d, r, c);
        boardEl.insertBefore(d, overlay);
      }
    }
  }

  function buildChips() {
    var i, b;
    for (i = 0; i < TARGETS.length; i++) {
      b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (TARGETS[i] === target ? " sel" : "");
      b.textContent = TARGETS[i];
      b.setAttribute("data-v", TARGETS[i]);
      chipsEl.appendChild(b);
    }
  }

  chipsEl.addEventListener("click", function (e) {
    var v = e.target.getAttribute && e.target.getAttribute("data-v");
    if (!v || playing) return;
    target = parseInt(v, 10);
    var kids = chipsEl.children,
      i;
    for (i = 0; i < kids.length; i++) {
      kids[i].className =
        "chip" + (kids[i].getAttribute("data-v") === v ? " sel" : "");
    }
  });

  function emptyGrid() {
    var g = [],
      r,
      c;
    for (r = 0; r < SIZE; r++) {
      g[r] = [];
      for (c = 0; c < SIZE; c++) g[r][c] = null;
    }
    return g;
  }

  function addTile(r, c, v) {
    var el = document.createElement("div");
    el.className = cls(v) + " new";
    el.textContent = v;
    place(el, r, c);
    boardEl.insertBefore(el, overlay);
    var t = { r: r, c: c, v: v, el: el, merged: false };
    grid[r][c] = t;
    tiles.push(t);
    return t;
  }

  function spawn() {
    var free = [],
      r,
      c;
    for (r = 0; r < SIZE; r++)
      for (c = 0; c < SIZE; c++) if (!grid[r][c]) free.push([r, c]);
    if (!free.length) return;
    var p = free[Math.floor(Math.random() * free.length)];
    addTile(p[0], p[1], Math.random() < 0.9 ? 2 : 4);
  }

  function canMove() {
    var r, c, v;
    for (r = 0; r < SIZE; r++) {
      for (c = 0; c < SIZE; c++) {
        if (!grid[r][c]) return true;
        v = grid[r][c].v;
        if (c < SIZE - 1 && grid[r][c + 1] && grid[r][c + 1].v === v)
          return true;
        if (r < SIZE - 1 && grid[r + 1][c] && grid[r + 1][c].v === v)
          return true;
      }
    }
    return false;
  }

  function showOverlay(title, canContinue) {
    ovTitle.textContent = title;
    ovContinue.style.display = canContinue ? "" : "none";
    overlay.className = "overlay show";
  }

  function clearTiles() {
    var i;
    for (i = 0; i < tiles.length; i++) {
      if (tiles[i].el.parentNode)
        tiles[i].el.parentNode.removeChild(tiles[i].el);
    }
    tiles = [];
    grid = emptyGrid();
  }

  function setIdle() {
    playing = false;
    busy = false;
    won = false;
    continued = false;
    clearTiles();
    overlay.className = "overlay";
    boardEl.className = "board dim";
    targetEl.className = "target";
    startBtn.disabled = false;
    restartBtn.disabled = true;
  }

  function start() {
    if (playing) return;
    clearTiles();
    playing = true;
    won = false;
    continued = false;
    boardEl.className = "board";
    targetEl.className = "target off";
    startBtn.disabled = true;
    restartBtn.disabled = false;
    spawn();
    spawn();
  }

  var VEC = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] };

  function move(dir) {
    if (!playing || busy) return;
    var dr = VEC[dir][0],
      dc = VEC[dir][1];
    var rs = [0, 1, 2, 3],
      cs = [0, 1, 2, 3];
    if (dr === 1) rs.reverse();
    if (dc === 1) cs.reverse();
    var moved = false,
      removed = [],
      grown = [],
      reached = false;
    var i, j, t, nr, nc, other;

    for (i = 0; i < rs.length; i++) {
      for (j = 0; j < cs.length; j++) {
        t = grid[rs[i]][cs[j]];
        if (!t) continue;
        nr = t.r;
        nc = t.c;
        while (
          nr + dr >= 0 &&
          nr + dr < SIZE &&
          nc + dc >= 0 &&
          nc + dc < SIZE &&
          !grid[nr + dr][nc + dc]
        ) {
          nr += dr;
          nc += dc;
        }
        var fr = nr + dr,
          fc = nc + dc;
        other =
          fr >= 0 && fr < SIZE && fc >= 0 && fc < SIZE ? grid[fr][fc] : null;
        if (other && other.v === t.v && !other.merged) {
          grid[t.r][t.c] = null;
          other.merged = true;
          other.v *= 2;
          if (other.v >= target) reached = true;
          t.r = fr;
          t.c = fc;
          place(t.el, fr, fc);
          removed.push(t);
          grown.push(other);
          moved = true;
        } else if (nr !== t.r || nc !== t.c) {
          grid[t.r][t.c] = null;
          grid[nr][nc] = t;
          t.r = nr;
          t.c = nc;
          place(t.el, nr, nc);
          moved = true;
        }
      }
    }
    if (!moved) return;
    busy = true;

    setTimeout(function () {
      var k, idx;
      for (k = 0; k < removed.length; k++) {
        if (removed[k].el.parentNode)
          removed[k].el.parentNode.removeChild(removed[k].el);
        idx = tiles.indexOf(removed[k]);
        if (idx > -1) tiles.splice(idx, 1);
      }
      for (k = 0; k < grown.length; k++) {
        grown[k].el.textContent = grown[k].v;
        grown[k].el.className = cls(grown[k].v) + " pop";
      }
      for (k = 0; k < tiles.length; k++) tiles[k].merged = false;
      spawn();
      busy = false;
      if (reached && !continued && !won) {
        won = true;
        showOverlay("Kamu menang! \uD83C\uDF89", true);
        busy = true;
      } else if (!canMove()) {
        showOverlay("Permainan selesai", false);
        busy = true;
      }
    }, 130);
  }

  var KEYS = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    a: "left",
    d: "right",
    w: "up",
    s: "down",
    A: "left",
    D: "right",
    W: "up",
    S: "down",
  };

  document.addEventListener("keydown", function (e) {
    var dir = KEYS[e.key];
    if (!dir || !playing) return;
    e.preventDefault();
    move(dir);
  });

  var sx = 0,
    sy = 0,
    tracking = false;
  boardEl.addEventListener(
    "touchstart",
    function (e) {
      if (!playing || e.touches.length !== 1) return;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      tracking = true;
    },
    { passive: true },
  );
  boardEl.addEventListener(
    "touchend",
    function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx,
        dy = t.clientY - sy;
      var ax = Math.abs(dx),
        ay = Math.abs(dy);
      if (Math.max(ax, ay) < 24) return;
      if (ax > ay) move(dx > 0 ? "right" : "left");
      else move(dy > 0 ? "down" : "up");
    },
    { passive: true },
  );

  startBtn.addEventListener("click", start);
  restartBtn.addEventListener("click", setIdle);
  ovRestart.addEventListener("click", setIdle);
  ovContinue.addEventListener("click", function () {
    continued = true;
    busy = false;
    overlay.className = "overlay";
    if (!canMove()) showOverlay("Permainan selesai", false);
  });

  grid = emptyGrid();
  buildCells();
  buildChips();
})();
