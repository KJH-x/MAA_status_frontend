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
    memDetail: document.getElementById("mem-detail")
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

  initTheme();
  startPolling();
})();
