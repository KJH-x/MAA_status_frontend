(function () {
  const config = window.DASHBOARD_CONFIG || {};
  const state = {
    lastGoodData: null,
    lastFetchAt: 0,
    lastRenderedLastUpdate: 0,
    refreshTimerId: null,
    theme: "dark",
    locale: "zh-CN",
    progressLabelsMode: "auto"
  };

  const I18N = {
    "zh-CN": {
      heroEyebrow: "MAA OneBot Adapter",
      heroTitle: "运行仪表盘",
      heroSubtitle: "运行状态、执行进度与系统遥测",
      mainKicker: "核心运行态",
      mainTitle: "执行状态",
      currentUserLabel: "当前用户",
      nextUserLabel: "下一用户",
      progressKicker: "任务进度",
      controllerLabel: "控制器",
      maaStatusLabel: "MAA 状态",
      connectionLabel: "连接",
      pollingLabel: "拉取状态",
      errorLabel: "错误",
      telemetryKicker: "系统监控",
      telemetryTitle: "遥测",
      cpuLabel: "CPU",
      cpuNote: "处理器占用",
      gpuLabel: "GPU",
      gpuNote: "图形占用",
      memoryLabel: "内存",
      sourceLabel: "来源：{value}",
      pending: "等待中",
      none: "无",
      currentUserDone: "全部完成",
      currentUserNoteRunning: "当前执行账号 / Session",
      currentUserNoteCompleted: "本轮任务已全部完成",
      nextUserNoteCompleted: "已全部完成",
      nextUserNoteNotStarted: "下一位待执行",
      nextUserNoteFailed: "执行失败后停止",
      nextUserNoteStopped: "已手动停止",
      nextUserNoteRunning: "即将执行",
      progressPlaceholder: "暂无执行配置",
      progressTrackAria: "悬浮或点击以查看配置名称",
      pollInitializing: "初始化中",
      pollUpdated: "已更新",
      pollFetchFailed: "拉取失败",
      pollFetchFailedDetail: "拉取失败：{message}",
      statusConnecting: "连接中",
      statusOnline: "在线",
      statusOffline: "离线",
      statusUnavailable: "不可用",
      lastUpdatePrefix: "上次更新：",
      lastUpdateLabel: "上次更新：{value}",
      timeJustNow: "刚刚",
      timeSecondsSuffix: "秒前",
      timeMinutesSuffix: "分钟前",
      timeHoursSuffix: "小时前",
      timeDaysSuffix: "天前",
      timeSecondsAgo: "{count}秒前",
      timeMinutesAgo: "{count}分钟前",
      timeHoursAgo: "{count}小时前",
      timeDaysAgo: "{count}天前",
      themeLight: "浅色",
      themeDark: "深色",
      themeLightAria: "切换到浅色主题",
      themeDarkAria: "切换到深色主题"
    },
    en: {
      heroEyebrow: "MAA OneBot Adapter",
      heroTitle: "Runtime Dashboard",
      heroSubtitle: "Runtime status, execution progress, and system telemetry",
      mainKicker: "Main Runtime",
      mainTitle: "Execution Status",
      currentUserLabel: "Current User",
      nextUserLabel: "Next User",
      progressKicker: "Task Progress",
      controllerLabel: "Controller",
      maaStatusLabel: "MAA Status",
      connectionLabel: "Connection",
      pollingLabel: "Polling",
      errorLabel: "Error",
      telemetryKicker: "System Monitor",
      telemetryTitle: "Telemetry",
      cpuLabel: "CPU",
      cpuNote: "Processor Usage",
      gpuLabel: "GPU",
      gpuNote: "Graphics Usage",
      memoryLabel: "Memory",
      sourceLabel: "Source: {value}",
      pending: "pending",
      none: "None",
      currentUserDone: "All Complete",
      currentUserNoteRunning: "Current account / session",
      currentUserNoteCompleted: "This run has fully completed",
      nextUserNoteCompleted: "All completed",
      nextUserNoteNotStarted: "Next in queue",
      nextUserNoteFailed: "Stopped after failure",
      nextUserNoteStopped: "Stopped manually",
      nextUserNoteRunning: "Up next",
      progressPlaceholder: "No queued configs",
      progressTrackAria: "Hover or click to show config names",
      pollInitializing: "Initializing",
      pollUpdated: "Updated",
      pollFetchFailed: "Fetch failed",
      pollFetchFailedDetail: "Fetch failed: {message}",
      statusConnecting: "Connecting",
      statusOnline: "Online",
      statusOffline: "Offline",
      statusUnavailable: "Unavailable",
      lastUpdatePrefix: "Last update: ",
      lastUpdateLabel: "Last update: {value}",
      timeJustNow: "just now",
      timeSecondsSuffix: "s ago",
      timeMinutesSuffix: "m ago",
      timeHoursSuffix: "h ago",
      timeDaysSuffix: "d ago",
      timeSecondsAgo: "{count}s ago",
      timeMinutesAgo: "{count}m ago",
      timeHoursAgo: "{count}h ago",
      timeDaysAgo: "{count}d ago",
      themeLight: "Light",
      themeDark: "Dark",
      themeLightAria: "Switch to light theme",
      themeDarkAria: "Switch to dark theme"
    },
    "zh-TW": {
      heroEyebrow: "MAA OneBot Adapter",
      heroTitle: "執行儀表板",
      heroSubtitle: "執行狀態、進度與系統遙測",
      mainKicker: "核心執行態",
      mainTitle: "執行狀態",
      currentUserLabel: "目前使用者",
      nextUserLabel: "下一位使用者",
      progressKicker: "任務進度",
      controllerLabel: "控制器",
      maaStatusLabel: "MAA 狀態",
      connectionLabel: "連線",
      pollingLabel: "輪詢狀態",
      errorLabel: "錯誤",
      telemetryKicker: "系統監控",
      telemetryTitle: "遙測",
      cpuLabel: "CPU",
      cpuNote: "處理器使用率",
      gpuLabel: "GPU",
      gpuNote: "圖形使用率",
      memoryLabel: "記憶體",
      sourceLabel: "來源：{value}",
      pending: "等待中",
      none: "無",
      currentUserDone: "全部完成",
      currentUserNoteRunning: "目前執行帳號 / Session",
      currentUserNoteCompleted: "本輪任務已全部完成",
      nextUserNoteCompleted: "已全部完成",
      nextUserNoteNotStarted: "下一位待執行",
      nextUserNoteFailed: "失敗後停止",
      nextUserNoteStopped: "已手動停止",
      nextUserNoteRunning: "即將執行",
      progressPlaceholder: "暫無執行設定",
      progressTrackAria: "懸浮或點擊以顯示設定名稱",
      pollInitializing: "初始化中",
      pollUpdated: "已更新",
      pollFetchFailed: "取得失敗",
      pollFetchFailedDetail: "取得失敗：{message}",
      statusConnecting: "連線中",
      statusOnline: "在線",
      statusOffline: "離線",
      statusUnavailable: "不可用",
      lastUpdatePrefix: "上次更新：",
      lastUpdateLabel: "上次更新：{value}",
      timeJustNow: "剛剛",
      timeSecondsSuffix: "秒前",
      timeMinutesSuffix: "分鐘前",
      timeHoursSuffix: "小時前",
      timeDaysSuffix: "天前",
      timeSecondsAgo: "{count}秒前",
      timeMinutesAgo: "{count}分鐘前",
      timeHoursAgo: "{count}小時前",
      timeDaysAgo: "{count}天前",
      themeLight: "淺色",
      themeDark: "深色",
      themeLightAria: "切換到淺色主題",
      themeDarkAria: "切換到深色主題"
    },
    ja: {
      heroEyebrow: "MAA OneBot Adapter",
      heroTitle: "ランタイムダッシュボード",
      heroSubtitle: "実行状態、進行状況、システムテレメトリ",
      mainKicker: "メインランタイム",
      mainTitle: "実行ステータス",
      currentUserLabel: "現在のユーザー",
      nextUserLabel: "次のユーザー",
      progressKicker: "進行状況",
      controllerLabel: "コントローラー",
      maaStatusLabel: "MAA ステータス",
      connectionLabel: "接続",
      pollingLabel: "取得状態",
      errorLabel: "エラー",
      telemetryKicker: "システムモニター",
      telemetryTitle: "テレメトリ",
      cpuLabel: "CPU",
      cpuNote: "プロセッサ使用率",
      gpuLabel: "GPU",
      gpuNote: "グラフィックス使用率",
      memoryLabel: "メモリ",
      sourceLabel: "ソース: {value}",
      pending: "待機中",
      none: "なし",
      currentUserDone: "すべて完了",
      currentUserNoteRunning: "現在実行中のアカウント / セッション",
      currentUserNoteCompleted: "今回の実行はすべて完了しました",
      nextUserNoteCompleted: "すべて完了",
      nextUserNoteNotStarted: "次に実行予定",
      nextUserNoteFailed: "失敗後に停止",
      nextUserNoteStopped: "手動で停止",
      nextUserNoteRunning: "次に実行",
      progressPlaceholder: "実行予定の設定はありません",
      progressTrackAria: "ホバーまたはクリックで設定名を表示",
      pollInitializing: "初期化中",
      pollUpdated: "更新済み",
      pollFetchFailed: "取得失敗",
      pollFetchFailedDetail: "取得失敗: {message}",
      statusConnecting: "接続中",
      statusOnline: "オンライン",
      statusOffline: "オフライン",
      statusUnavailable: "利用不可",
      lastUpdatePrefix: "最終更新: ",
      lastUpdateLabel: "最終更新: {value}",
      timeJustNow: "たった今",
      timeSecondsSuffix: "秒前",
      timeMinutesSuffix: "分前",
      timeHoursSuffix: "時間前",
      timeDaysSuffix: "日前",
      timeSecondsAgo: "{count}秒前",
      timeMinutesAgo: "{count}分前",
      timeHoursAgo: "{count}時間前",
      timeDaysAgo: "{count}日前",
      themeLight: "ライト",
      themeDark: "ダーク",
      themeLightAria: "ライトテーマに切り替え",
      themeDarkAria: "ダークテーマに切り替え"
    }
  };

  const els = {
    refreshBar: document.getElementById("refresh-bar"),
    connectionBadge: document.getElementById("connection-badge"),
    sourceLabel: document.getElementById("source-label"),
    lastUpdateChip: document.getElementById("last-update-chip"),
    heroEyebrow: document.getElementById("hero-eyebrow"),
    heroTitle: document.getElementById("hero-title"),
    heroSubtitle: document.getElementById("hero-subtitle"),
    mainKicker: document.getElementById("main-kicker"),
    mainTitle: document.getElementById("main-title"),
    currentUserLabel: document.getElementById("current-user-label"),
    nextUserLabel: document.getElementById("next-user-label"),
    progressKicker: document.getElementById("progress-kicker"),
    controllerState: document.getElementById("controller-state"),
    controllerStateCompact: document.getElementById("controller-state-compact"),
    controllerLabel: document.getElementById("controller-label"),
    controllerLabelCompact: document.getElementById("controller-label-compact"),
    maaStatus: document.getElementById("maa-status"),
    maaStatusCompact: document.getElementById("maa-status-compact"),
    maaStatusLabel: document.getElementById("maa-status-label"),
    maaLabelCompact: document.getElementById("maa-label-compact"),
    userCard: document.getElementById("user-card"),
    currentUserPane: document.getElementById("current-user-pane"),
    nextUserPane: document.getElementById("next-user-pane"),
    currentUser: document.getElementById("current-user"),
    currentUserNote: document.getElementById("current-user-note"),
    nextUser: document.getElementById("next-user"),
    nextUserNote: document.getElementById("next-user-note"),
    progressText: document.getElementById("progress-text"),
    progressPercent: document.getElementById("progress-percent"),
    progressTrack: document.getElementById("progress-track"),
    progressBar: document.getElementById("progress-bar"),
    progressSegments: document.getElementById("progress-segments"),
    progressMarker: document.getElementById("progress-marker"),
    lastUpdate: document.getElementById("last-update"),
    connectionText: document.getElementById("connection-text"),
    connectionTextCompact: document.getElementById("connection-text-compact"),
    connectionLabel: document.getElementById("connection-label"),
    connectionLabelCompact: document.getElementById("connection-label-compact"),
    pollStatus: document.getElementById("poll-status"),
    pollStatusCompact: document.getElementById("poll-status-compact"),
    pollingLabel: document.getElementById("polling-label"),
    pollingLabelCompact: document.getElementById("polling-label-compact"),
    errorText: document.getElementById("error-text"),
    errorTextCompact: document.getElementById("error-text-compact"),
    errorLabel: document.getElementById("error-label"),
    errorLabelCompact: document.getElementById("error-label-compact"),
    themeToggle: document.getElementById("theme-toggle"),
    telemetryKicker: document.getElementById("telemetry-kicker"),
    telemetryTitle: document.getElementById("telemetry-title"),
    cpuLabel: document.getElementById("cpu-label"),
    cpuNote: document.getElementById("cpu-note"),
    gpuLabel: document.getElementById("gpu-label"),
    gpuNote: document.getElementById("gpu-note"),
    memoryLabel: document.getElementById("memory-label"),
    cpuValue: document.getElementById("cpu-value"),
    gpuValue: document.getElementById("gpu-value"),
    memValue: document.getElementById("mem-value"),
    memDetail: document.getElementById("mem-detail")
  };

  function detectLocale() {
    const languages = Array.isArray(window.navigator.languages) && window.navigator.languages.length
      ? window.navigator.languages
      : [window.navigator.language || "en"];

    for (let index = 0; index < languages.length; index += 1) {
      const raw = String(languages[index] || "").toLowerCase();
      if (raw.startsWith("zh-tw") || raw.startsWith("zh-hk") || raw.startsWith("zh-mo")) {
        return "zh-TW";
      }
      if (raw.startsWith("zh")) {
        return "zh-CN";
      }
      if (raw.startsWith("ja")) {
        return "ja";
      }
      if (raw.startsWith("en")) {
        return "en";
      }
    }

    return "en";
  }

  function t(key, vars) {
    const localePack = I18N[state.locale] || I18N.en;
    const fallbackPack = I18N.en;
    let template = localePack[key];
    if (template == null) {
      template = fallbackPack[key];
    }
    if (template == null) {
      return key;
    }
    if (!vars) {
      return template;
    }
    return String(template).replace(/\{(\w+)\}/g, function (_, name) {
      return vars[name] == null ? "" : String(vars[name]);
    });
  }

  function setTextContent(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function applyLocalization() {
    document.documentElement.lang = state.locale;

    setTextContent(els.heroEyebrow, t("heroEyebrow"));
    setTextContent(els.heroTitle, t("heroTitle"));
    setTextContent(els.heroSubtitle, t("heroSubtitle"));
    setTextContent(els.mainKicker, t("mainKicker"));
    setTextContent(els.mainTitle, t("mainTitle"));
    setTextContent(els.currentUserLabel, t("currentUserLabel"));
    setTextContent(els.nextUserLabel, t("nextUserLabel"));
    setTextContent(els.progressKicker, t("progressKicker"));
    setTextContent(els.controllerLabel, t("controllerLabel"));
    setTextContent(els.controllerLabelCompact, t("controllerLabel"));
    setTextContent(els.maaStatusLabel, t("maaStatusLabel"));
    setTextContent(els.maaLabelCompact, "MAA");
    setTextContent(els.connectionLabel, t("connectionLabel"));
    setTextContent(els.connectionLabelCompact, t("connectionLabel"));
    setTextContent(els.pollingLabel, t("pollingLabel"));
    setTextContent(els.pollingLabelCompact, t("pollingLabel"));
    setTextContent(els.errorLabel, t("errorLabel"));
    setTextContent(els.errorLabelCompact, t("errorLabel"));
    setTextContent(els.telemetryKicker, t("telemetryKicker"));
    setTextContent(els.telemetryTitle, t("telemetryTitle"));
    setTextContent(els.cpuLabel, t("cpuLabel"));
    setTextContent(els.cpuNote, t("cpuNote"));
    setTextContent(els.gpuLabel, t("gpuLabel"));
    setTextContent(els.gpuNote, t("gpuNote"));
    setTextContent(els.memoryLabel, t("memoryLabel"));

    if (els.progressTrack) {
      els.progressTrack.setAttribute("aria-label", t("progressTrackAria"));
    }

    setTextContent(els.sourceLabel, t("sourceLabel", { value: t("pending") }));
    if (!state.lastGoodData) {
      setBadge("neutral", t("statusConnecting"));
      setTextContent(els.pollStatus, t("pollInitializing"));
      setTextContent(els.pollStatusCompact, t("pollInitializing"));
      setTextContent(els.currentUserNote, t("currentUserNoteRunning"));
      setTextContent(els.nextUserNote, t("nextUserNoteRunning"));
      setTextContent(els.errorText, t("none"));
      setTextContent(els.errorTextCompact, t("none"));
    }
    updateLastUpdateDisplay(state.lastRenderedLastUpdate);
    applyTheme(state.theme);
  }

  function withCacheBust(url) {
    const u = new URL(url, window.location.href);
    u.searchParams.set("t", String(Date.now()));
    return u.toString();
  }

  function formatAbsoluteDate(seconds) {
    if (!seconds) {
      return "-";
    }
    return new Date(seconds * 1000).toLocaleString();
  }

  function getRelativeTimeParts(seconds) {
    if (!seconds) {
      return { text: "-" };
    }

    const ageSeconds = Math.max(0, Math.floor(Date.now() / 1000 - Number(seconds)));
    if (ageSeconds < 5) {
      return { text: t("timeJustNow") };
    }
    if (ageSeconds < 60) {
      return { count: ageSeconds, suffix: t("timeSecondsSuffix") };
    }
    if (ageSeconds < 3600) {
      return { count: Math.floor(ageSeconds / 60), suffix: t("timeMinutesSuffix") };
    }
    if (ageSeconds < 86400) {
      return { count: Math.floor(ageSeconds / 3600), suffix: t("timeHoursSuffix") };
    }
    return { count: Math.floor(ageSeconds / 86400), suffix: t("timeDaysSuffix") };
  }

  function formatRelativeDate(seconds) {
    const parts = getRelativeTimeParts(seconds);
    if (parts.count == null) {
      return parts.text;
    }
    return String(parts.count) + parts.suffix;
  }

  function renderLastUpdateElement(element, parts, absoluteText, plainLabel) {
    if (!element) {
      return;
    }

    element.replaceChildren();
    element.appendChild(document.createTextNode(t("lastUpdatePrefix")));

    if (parts.count == null) {
      element.appendChild(document.createTextNode(parts.text));
    } else {
      const count = document.createElement("span");
      count.className = "last-update-count";
      count.textContent = String(parts.count);
      element.appendChild(count);
      element.appendChild(document.createTextNode(parts.suffix));
    }

    element.title = absoluteText !== "-" ? absoluteText : "";
    element.setAttribute("aria-label", plainLabel);
  }

  function updateLastUpdateDisplay(seconds) {
    const parts = getRelativeTimeParts(seconds);
    const relativeText = parts.count == null ? parts.text : String(parts.count) + parts.suffix;
    const absoluteText = formatAbsoluteDate(seconds);
    const label = t("lastUpdateLabel", { value: relativeText });

    renderLastUpdateElement(els.lastUpdate, parts, absoluteText, label);
    renderLastUpdateElement(els.lastUpdateChip, parts, absoluteText, label);
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

  function getExecutionConfigs(data) {
    if (Array.isArray(data.execution_configs) && data.execution_configs.length) {
      return data.execution_configs
        .map(function (item) {
          return String(item || "").trim();
        })
        .filter(Boolean);
    }

    const totalSteps = Math.max(0, Number(data.total_steps || 0));
    return Array.from({ length: totalSteps }, function (_, index) {
      return "Step " + String(index + 1);
    });
  }

  function getDisplayNextUser(data, executionConfigs) {
    const rawNextUser = String(data.next_user || "").trim();
    if (rawNextUser) {
      return rawNextUser;
    }

    const currentUser = String(data.current_user || "").trim();
    const progressPhase = String(data.progress_phase || "").trim();
    const step = Number(data.step || 0);
    const totalSteps = Number(data.total_steps || 0);

    if (progressPhase === "not_started") {
      return executionConfigs[0] || "-";
    }

    if (progressPhase === "running" && currentUser && totalSteps > 0 && step >= totalSteps) {
      return currentUser;
    }

    return "-";
  }

  function getDisplayCurrentUser(data) {
    const progressPhase = String(data.progress_phase || "").trim();
    if (progressPhase === "completed") {
      return t("currentUserDone");
    }
    return String(data.current_user || "").trim() || "-";
  }

  function getCurrentUserNote(data) {
    const progressPhase = String(data.progress_phase || "").trim();
    if (progressPhase === "completed") {
      return t("currentUserNoteCompleted");
    }
    return t("currentUserNoteRunning");
  }

  function getNextUserNote(data) {
    const progressPhase = String(data.progress_phase || "").trim();
    if (progressPhase === "completed") {
      return t("nextUserNoteCompleted");
    }
    if (progressPhase === "not_started") {
      return t("nextUserNoteNotStarted");
    }
    if (progressPhase === "failed") {
      return t("nextUserNoteFailed");
    }
    if (progressPhase === "stopped") {
      return t("nextUserNoteStopped");
    }
    return t("nextUserNoteRunning");
  }

  function updateUserCardState(data, displayNextUser) {
    if (!els.userCard || !els.nextUserPane) {
      return;
    }

    const progressPhase = String(data.progress_phase || "").trim();
    const isCompleted = progressPhase === "completed";
    const hasVisibleNextUser = Boolean(String(displayNextUser || "").trim() && displayNextUser !== "-");

    els.userCard.classList.toggle("is-completed", isCompleted);
    els.userCard.classList.toggle("has-next-user", !isCompleted && hasVisibleNextUser);
    els.nextUserPane.setAttribute("aria-hidden", isCompleted ? "true" : "false");
  }

  function renderProgressTimeline(executionConfigs, progressPercent) {
    if (!els.progressTrack || !els.progressSegments || !els.progressBar || !els.progressMarker) {
      return;
    }

    const hasConfigs = executionConfigs.length > 0;
    const labels = hasConfigs ? executionConfigs : [t("progressPlaceholder")];
    const segmentCount = labels.length;
    const clampedPercent = Math.max(0, Math.min(100, Number(progressPercent || 0)));

    els.progressTrack.style.setProperty("--segment-count", String(segmentCount));
    els.progressTrack.classList.toggle("is-placeholder", !hasConfigs);
    els.progressSegments.replaceChildren();

    labels.forEach(function (label, index) {
      const segment = document.createElement("div");
      segment.className = "progress-segment";
      if (!hasConfigs) {
        segment.classList.add("is-placeholder");
      }
      if (index === 0) {
        segment.classList.add("is-first");
      }
      segment.title = label;

      const text = document.createElement("span");
      text.className = "progress-label";
      text.textContent = label;
      segment.appendChild(text);
      els.progressSegments.appendChild(segment);
    });

    els.progressBar.style.width = clampedPercent + "%";
    els.progressMarker.style.display = hasConfigs ? "block" : "none";
    els.progressMarker.style.left = clampedPercent + "%";
  }

  function setProgressLabelsMode(mode) {
    if (!els.progressTrack) {
      return;
    }

    state.progressLabelsMode = mode;
    els.progressTrack.classList.toggle("show-labels", mode === "show");
    els.progressTrack.classList.toggle("hide-labels", mode === "hide");
    els.progressTrack.setAttribute("aria-pressed", mode === "show" ? "true" : "false");
  }

  function toggleProgressLabels() {
    const nextMode = state.progressLabelsMode === "show" ? "hide" : "show";
    setProgressLabelsMode(nextMode);
  }

  function initProgressInteractions() {
    if (!els.progressTrack) {
      return;
    }

    els.progressTrack.addEventListener("click", function () {
      toggleProgressLabels();
    });

    els.progressTrack.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleProgressLabels();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setProgressLabelsMode("auto");
      }
    });

    setProgressLabelsMode("auto");
  }

  function renderStatus(data) {
    const online = Boolean(data.online);
    const telemetry = data.telemetry || {};
    const mem = telemetry.mem || {};
    const executionConfigs = getExecutionConfigs(data);

    if (online) {
      setBadge("ok", t("statusOnline"));
    } else if (data.last_update) {
      setBadge("warn", t("statusOffline"));
    } else {
      setBadge("error", t("statusOffline"));
    }

    els.sourceLabel.textContent = t("sourceLabel", { value: data.source || "-" });
    els.controllerState.textContent = data.controller_state || "-";
    if (els.controllerStateCompact) {
      els.controllerStateCompact.textContent = data.controller_state || "-";
    }
    els.maaStatus.textContent = data.maa_status || "-";
    if (els.maaStatusCompact) {
      els.maaStatusCompact.textContent = data.maa_status || "-";
    }
    els.currentUser.textContent = getDisplayCurrentUser(data);
    if (els.currentUserNote) {
      els.currentUserNote.textContent = getCurrentUserNote(data);
    }
    const displayNextUser = getDisplayNextUser(data, executionConfigs);
    els.nextUser.textContent = displayNextUser;
    if (els.nextUserNote) {
      els.nextUserNote.textContent = getNextUserNote(data);
    }
    updateUserCardState(data, displayNextUser);
    els.progressText.textContent = `${data.step || 0} / ${data.total_steps || 0}`;
    els.progressPercent.textContent = `${Number(data.progress_percent || 0).toFixed(0)}%`;
    renderProgressTimeline(executionConfigs, data.progress_percent);
    state.lastRenderedLastUpdate = Number(data.last_update || 0);
    updateLastUpdateDisplay(state.lastRenderedLastUpdate);

    els.connectionText.textContent = data.connection || "-";
    if (els.connectionTextCompact) {
      els.connectionTextCompact.textContent = data.connection || "-";
    }
    els.errorText.textContent = data.last_error || t("none");
    if (els.errorTextCompact) {
      els.errorTextCompact.textContent = data.last_error || t("none");
    }
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
      els.themeToggle.textContent = state.theme === "dark" ? t("themeLight") : t("themeDark");
      els.themeToggle.setAttribute("aria-label", state.theme === "dark" ? t("themeLightAria") : t("themeDarkAria"));
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
      updateLastUpdateDisplay(state.lastRenderedLastUpdate);
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
      els.pollStatus.textContent = t("pollUpdated");
      if (els.pollStatusCompact) {
        els.pollStatusCompact.textContent = t("pollUpdated");
      }
      renderStatus(data);
    } catch (error) {
      els.pollStatus.textContent = t("pollFetchFailedDetail", { message: error.message });
      if (els.pollStatusCompact) {
        els.pollStatusCompact.textContent = t("pollFetchFailed");
      }
      if (state.lastGoodData) {
        renderStatus(state.lastGoodData);
      }
      setBadge("error", t("statusUnavailable"));
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function startPolling() {
    fetchStatus();
    window.setInterval(fetchStatus, Number(config.pollIntervalMs || 5000));
  }

  state.locale = detectLocale();
  applyLocalization();
  initTheme();
  initProgressInteractions();
  startPolling();
})();
