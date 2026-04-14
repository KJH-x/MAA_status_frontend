(function () {
  const config = window.DASHBOARD_CONFIG || {};
  const state = {
    lastGoodData: null,
    lastFetchAt: 0,
    refreshTimerId: null,
    theme: "dark"
  };

  const els = {
    refreshBar: document.getElementById("refresh-bar"),
    connectionBadge: document.getElementById("connection-badge"),
    sourceLabel: document.getElementById("source-label"),
    lastUpdateChip: document.getElementById("last-update-chip"),
    controllerState: document.getElementById("controller-state"),
    maaStatus: document.getElementById("maa-status"),
    currentUser: document.getElementById("current-user"),
    nextUser: document.getElementById("next-user"),
    progressText: document.getElementById("progress-text"),
    progressPercent: document.getElementById("progress-percent"),
    progressBar: document.getElementById("progress-bar"),
    lastUpdate: document.getElementById("last-update"),
    connectionText: document.getElementById("connection-text"),
    pollStatus: document.getElementById("poll-status"),
    errorText: document.getElementById("error-text"),
    themeToggle: document.getElementById("theme-toggle"),
    cpuValue: document.getElementById("cpu-value"),
    gpuValue: document.getElementById("gpu-value"),
    memValue: document.getElementById("mem-value"),
    memDetail: document.getElementById("mem-detail"),
    discCanvas: document.getElementById("disc-canvas"),
    discStatus: document.getElementById("disc-status")
  };

  function withCacheBust(url) {
    const u = new URL(url, window.location.href);
    u.searchParams.set("t", String(Date.now()));
    return u.toString();
  }

  function formatDate(seconds) {
    if (!seconds) {
      return "-";
    }
    return new Date(seconds * 1000).toLocaleString();
  }

  function isStale(data) {
    if (!data || !data.last_update) {
      return true;
    }
    const age = Date.now() / 1000 - Number(data.last_update);
    return age > Number(config.staleThresholdSec || 30);
  }

  function setBadge(kind, text) {
    els.connectionBadge.className = "badge";
    if (kind === "ok") {
      els.connectionBadge.classList.add("badge-ok");
    } else if (kind === "warn") {
      els.connectionBadge.classList.add("badge-warn");
    } else if (kind === "error") {
      els.connectionBadge.classList.add("badge-error");
    } else {
      els.connectionBadge.classList.add("badge-neutral");
    }
    els.connectionBadge.textContent = text;
  }

  function renderStatus(data) {
    const stale = isStale(data);
    const online = Boolean(data.online) && !stale;
    const telemetry = data.telemetry || {};
    const mem = telemetry.mem || {};

    if (online) {
      setBadge("ok", "Online");
    } else if (data.last_update) {
      setBadge("warn", "Stale");
    } else {
      setBadge("error", "Offline");
    }

    els.sourceLabel.textContent = `source: ${data.source || "-"}`;
    els.controllerState.textContent = data.controller_state || "-";
    els.maaStatus.textContent = data.maa_status || "-";
    els.currentUser.textContent = data.current_user || "-";
    els.nextUser.textContent = data.next_user || "-";
    els.progressText.textContent = `${data.step || 0} / ${data.total_steps || 0}`;
    els.progressPercent.textContent = `${Number(data.progress_percent || 0).toFixed(0)}%`;
    els.progressBar.style.width = `${Math.max(0, Math.min(100, Number(data.progress_percent || 0)))}%`;
    els.lastUpdate.textContent = `Last update: ${formatDate(data.last_update)}`;
    els.lastUpdateChip.textContent = `Last update: ${formatDate(data.last_update)}`;
    els.connectionText.textContent = data.connection || "-";
    els.errorText.textContent = data.last_error || "None";
    renderRing(document.querySelector(".cpu-ring"), els.cpuValue, telemetry.cpu, "%");
    renderRing(document.querySelector(".gpu-ring"), els.gpuValue, telemetry.gpu, "%");
    renderRing(document.querySelector(".mem-ring"), els.memValue, mem.percent, "%");
    els.memDetail.textContent = `${Number(mem.used_gb || 0).toFixed(1)} / ${Number(mem.total_gb || 0).toFixed(1)} GB`;
  }

  function renderRing(shell, valueEl, rawValue, suffix) {
    if (!shell || !valueEl) {
      return;
    }
    const value = Math.max(0, Math.min(100, Number(rawValue || 0)));
    shell.style.setProperty("--pct", String(value));
    valueEl.textContent = `${value.toFixed(0)}${suffix}`;
  }

  function applyTheme(theme) {
    state.theme = theme === "light" ? "light" : "dark";
    document.body.setAttribute("data-theme", state.theme);
    if (els.themeToggle) {
      els.themeToggle.textContent = state.theme === "dark" ? "☀️ Light" : "🌙 Dark";
      els.themeToggle.setAttribute("aria-label", state.theme === "dark" ? "切换到浅色主题" : "切换到深色主题");
    }
  }

  function initTheme() {
    const persisted = window.localStorage.getItem("dashboard-theme");
    applyTheme(persisted || "dark");
    if (els.themeToggle) {
      els.themeToggle.addEventListener("click", function () {
        const nextTheme = state.theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
        window.localStorage.setItem("dashboard-theme", nextTheme);
      });
    }
  }

  function startRefreshCountdown() {
    if (state.refreshTimerId) {
      window.cancelAnimationFrame(state.refreshTimerId);
    }

    const interval = Number(config.pollIntervalMs || 5000);
    const tick = function () {
      const elapsed = Date.now() - state.lastFetchAt;
      const remainingRatio = Math.max(0, 1 - elapsed / interval);
      if (els.refreshBar) {
        els.refreshBar.style.width = `${remainingRatio * 100}%`;
      }
      state.refreshTimerId = window.requestAnimationFrame(tick);
    };

    state.refreshTimerId = window.requestAnimationFrame(tick);
  }

  async function fetchStatus() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), Number(config.requestTimeoutMs || 5000));
    state.lastFetchAt = Date.now();
    startRefreshCountdown();

    try {
      const response = await fetch(withCacheBust(config.statusUrl), {
        method: "GET",
        cache: "no-store",
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      state.lastGoodData = data;
      els.pollStatus.textContent = "Updated";
      renderStatus(data);
    } catch (error) {
      els.pollStatus.textContent = `Fetch failed: ${error.message}`;
      if (state.lastGoodData) {
        renderStatus(state.lastGoodData);
      } else {
        setBadge("error", "Unavailable");
      }
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function startPolling() {
    fetchStatus();
    window.setInterval(fetchStatus, Number(config.pollIntervalMs || 5000));
  }

  function setDiscStatus(text) {
    if (els.discStatus) {
      els.discStatus.textContent = text;
    }
  }

  function initCanvasDiscFallback() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setDiscStatus("Canvas fallback unavailable in this browser.");
      return;
    }

    els.discCanvas.innerHTML = "";
    els.discCanvas.appendChild(canvas);

    const target = { x: 0.5, y: 0.5, hover: 0 };
    const smooth = { x: 0.5, y: 0.5, hover: 0, vx: 0, vy: 0, ripple: 0 };

    function resizeCanvas() {
      const rect = els.discCanvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function onPointerMove(event) {
      const rect = canvas.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width;
      const ny = (event.clientY - rect.top) / rect.height;
      const dx = nx - 0.5;
      const dy = ny - 0.5;
      const radius = Math.sqrt(dx * dx + dy * dy);
      if (radius <= 0.5) {
        target.x = nx;
        target.y = ny;
        target.hover = 1;
      } else {
        target.hover = 0;
      }
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", function () {
      target.hover = 0;
    });

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    setDiscStatus("Interactive disc active (Canvas fallback mode).");

    let last = performance.now();
    function draw(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const ease = 1.0 - Math.exp(-dt * 12.0);

      const prevX = smooth.x;
      const prevY = smooth.y;
      smooth.x += (target.x - smooth.x) * ease;
      smooth.y += (target.y - smooth.y) * ease;
      smooth.hover += (target.hover - smooth.hover) * ease;
      smooth.vx += ((smooth.x - prevX) / Math.max(dt, 1e-3) - smooth.vx) * (1.0 - Math.exp(-dt * 10.0));
      smooth.vy += ((smooth.y - prevY) / Math.max(dt, 1e-3) - smooth.vy) * (1.0 - Math.exp(-dt * 10.0));
      smooth.ripple += Math.sqrt(smooth.vx * smooth.vx + smooth.vy * smooth.vy) * dt;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const r = Math.min(w, h) * 0.44;
      const px = smooth.x * w;
      const py = smooth.y * h;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      const base = ctx.createRadialGradient(cx, cy, r * 0.08, cx, cy, r);
      base.addColorStop(0, "rgba(72,130,236,0.18)");
      base.addColorStop(0.55, "rgba(19,40,70,0.92)");
      base.addColorStop(1, "rgba(8,17,28,0.98)");
      ctx.fillStyle = base;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      const sink = ctx.createRadialGradient(px, py, r * 0.2, px, py, r * 1.2);
      sink.addColorStop(0, `rgba(1,10,20,${0.25 * smooth.hover})`);
      sink.addColorStop(1, "rgba(1,10,20,0)");
      ctx.fillStyle = sink;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      const lift = ctx.createRadialGradient(px, py, 0, px, py, r * 0.78);
      lift.addColorStop(0, `rgba(150,210,255,${0.42 * smooth.hover})`);
      lift.addColorStop(0.45, `rgba(87,165,255,${0.18 * smooth.hover})`);
      lift.addColorStop(1, "rgba(50,110,220,0)");
      ctx.fillStyle = lift;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      ctx.strokeStyle = `rgba(135,185,255,${0.22 + 0.18 * smooth.hover})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(px, py, r * (0.18 + (Math.sin(smooth.ripple * 0.25) + 1.0) * 0.05), 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      ctx.strokeStyle = "rgba(154,191,255,0.4)";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      window.requestAnimationFrame(draw);
    }

    window.requestAnimationFrame(draw);
  }

  async function initEndfieldDisc() {
    if (!els.discCanvas) {
      return;
    }

    if (!window.THREE) {
      initCanvasDiscFallback();
      return;
    }

    const vertexRes = await fetch("./shaders/disc.vert.glsl");
    const fragmentRes = await fetch("./shaders/disc.frag.glsl");
    if (!vertexRes.ok || !fragmentRes.ok) {
      initCanvasDiscFallback();
      return;
    }
    const vertexShader = await vertexRes.text();
    const fragmentShader = await fragmentRes.text();

    const scene = new window.THREE.Scene();
    scene.background = null;

    const camera = new window.THREE.PerspectiveCamera(42, 1, 0.1, 20);
    camera.position.set(0, 0, 2.35);

    const renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    els.discCanvas.innerHTML = "";
    els.discCanvas.appendChild(renderer.domElement);

    const uniforms = {
      uTime: { value: 0 },
      uCursor: { value: new window.THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
      uFalloff: { value: 20.0 },
      uAmplitude: { value: 0.16 },
      uSinkStrength: { value: 0.045 },
      uRippleStrength: { value: 0.03 },
      uCursorVelocity: { value: 0 }
    };

    const geometry = new window.THREE.CircleGeometry(1, 240);
    const material = new window.THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true
    });

    const discMesh = new window.THREE.Mesh(geometry, material);
    scene.add(discMesh);

    const raycaster = new window.THREE.Raycaster();
    const ndc = new window.THREE.Vector2(0, 0);
    const targetCursor = new window.THREE.Vector2(0.5, 0.5);
    const smoothCursor = new window.THREE.Vector2(0.5, 0.5);
    const previousCursor = new window.THREE.Vector2(0.5, 0.5);
    let targetHover = 0;

    function resizeRenderer() {
      const width = els.discCanvas.clientWidth;
      const height = els.discCanvas.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function updateCursorFromPointer(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObject(discMesh, false)[0];
      if (hit && hit.uv) {
        targetCursor.copy(hit.uv);
        targetHover = 1;
      } else {
        targetHover = 0;
      }
    }

    renderer.domElement.addEventListener("pointermove", updateCursorFromPointer);
    renderer.domElement.addEventListener("pointerleave", function () {
      targetHover = 0;
    });

    window.addEventListener("resize", resizeRenderer);
    resizeRenderer();
    setDiscStatus("Interactive shader deformation active.");

    const clock = new window.THREE.Clock();
    function animate() {
      const delta = Math.min(clock.getDelta(), 0.05);
      uniforms.uTime.value += delta;

      smoothCursor.lerp(targetCursor, 1.0 - Math.exp(-delta * 14.0));
      const velocity = smoothCursor.distanceTo(previousCursor) / Math.max(delta, 1e-3);
      previousCursor.copy(smoothCursor);

      uniforms.uCursor.value.copy(smoothCursor);
      uniforms.uCursorVelocity.value += (velocity - uniforms.uCursorVelocity.value) * (1.0 - Math.exp(-delta * 10.0));
      uniforms.uHover.value += (targetHover - uniforms.uHover.value) * (1.0 - Math.exp(-delta * 12.0));

      renderer.render(scene, camera);
      window.requestAnimationFrame(animate);
    }

    animate();
  }

  initTheme();
  startPolling();
  initEndfieldDisc().catch(function (error) {
    setDiscStatus(`Disc shader initialization failed: ${error.message}`);
  });
})();
