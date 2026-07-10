/* Persistent drifting network used by Education/Experience/Projects: nodes
   live on screen the whole time and brighten near the cursor. */
function createAmbientNetwork(canvas, stage, config) {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return { destroy: function () {} };

  var ctx = canvas.getContext("2d");
  var cfg = Object.assign({
    density: 24000,
    maxCount: 55,
    connectDistance: 130,
    wakeRadius: 110,
    baseNodeAlpha: 0.35,
    baseLineAlpha: 0.12,
    chargeDecay: 0.965,
    driftSpeed: 0.12,
    rings: true,
    magnetic: false,
    magneticTargets: [],
    fullPage: false
  }, config || {});

  var nodes = [], rings = [];
  var mouse = { x: -9999, y: -9999 };
  var rafId = null;
  var running = true;

  function accent() {
    return getComputedStyle(document.documentElement).getPropertyValue("--network-color").trim() || "#4169e1";
  }
  function width() { return cfg.fullPage ? window.innerWidth : stage.clientWidth; }
  function height() { return cfg.fullPage ? window.innerHeight : stage.clientHeight; }

  function resize() {
    canvas.width = width();
    canvas.height = height();
    buildNodes();
  }
  function buildNodes() {
    var count = Math.min(cfg.maxCount, Math.floor((canvas.width * canvas.height) / cfg.density));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * cfg.driftSpeed,
        vy: (Math.random() - 0.5) * cfg.driftSpeed,
        charge: 0
      });
    }
  }
  resize();
  window.addEventListener("resize", resize);

  function onMouseMove(e) {
    if (cfg.fullPage) {
      mouse.x = e.clientX; mouse.y = e.clientY;
    } else {
      var rect = stage.getBoundingClientRect();
      mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    }
  }
  var moveTarget = cfg.fullPage ? window : stage;
  moveTarget.addEventListener("mousemove", onMouseMove);

  function loop() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var now = performance.now();
    var color = accent();

    nodes.forEach(function (n) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
      if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

      var d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
      var wasCharged = n.charge > 0.5;
      if (d < cfg.wakeRadius) n.charge = Math.max(n.charge, 1 - d / cfg.wakeRadius);
      if (cfg.rings && !wasCharged && n.charge > 0.5) rings.push({ x: n.x, y: n.y, born: now });
      n.charge *= cfg.chargeDecay;
    });

    if (cfg.magnetic) {
      cfg.magneticTargets.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var originRect = cfg.fullPage ? { left: 0, top: 0 } : stage.getBoundingClientRect();
        var cx = r.left - originRect.left + r.width / 2;
        var cy = r.top - originRect.top + r.height / 2;
        var near = nodes.some(function (n) { return n.charge > 0.4 && Math.hypot(n.x - cx, n.y - cy) < 100; });
        el.classList.toggle("is-charged", near);
      });
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var a = nodes[i], b = nodes[j];
        var dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < cfg.connectDistance) {
          var charge = Math.max(a.charge, b.charge);
          ctx.globalAlpha = (cfg.baseLineAlpha + charge * 0.5) * (1 - dist / cfg.connectDistance);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = color;
    nodes.forEach(function (n) {
      var radius = 1.6 + n.charge * 2.4;
      ctx.globalAlpha = Math.min(cfg.baseNodeAlpha + n.charge * 0.65, 1);
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fill();
      if (n.charge > 0.3) {
        ctx.globalAlpha = n.charge * 0.35;
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius + 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    if (cfg.rings) {
      rings = rings.filter(function (r) { return now - r.born < 500; });
      ctx.strokeStyle = color;
      rings.forEach(function (r) {
        var age = (now - r.born) / 500;
        ctx.globalAlpha = Math.max(1 - age, 0) * 0.6;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3 + age * 18, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  return {
    destroy: function () {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      moveTarget.removeEventListener("mousemove", onMouseMove);
    }
  };
}
