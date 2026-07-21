(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.MAA_STATUS_MODEL = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function isPlainObject(value) {
    return value != null && typeof value === "object" && !Array.isArray(value);
  }

  function hasLegacyDashboardShape(raw) {
    if (!isPlainObject(raw)) {
      return false;
    }

    return raw.current_user !== undefined ||
      raw.controller_state !== undefined ||
      raw.total_steps !== undefined ||
      raw.progress_percent !== undefined ||
      raw.execution_configs !== undefined ||
      raw.last_update !== undefined;
  }

  function getConfigLabel(item) {
    if (typeof item === "string" || typeof item === "number") {
      return String(item).trim();
    }
    if (!isPlainObject(item)) {
      return "";
    }

    return String(
      item.id ??
      item.name ??
      item.account ??
      item.user ??
      item.label ??
      ""
    ).trim();
  }

  function parseTimestampSeconds(value) {
    if (value == null || value === "") {
      return null;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      if (value > 1e12) {
        return value / 1000;
      }
      return value > 0 ? value : null;
    }

    var numericValue = Number(value);
    if (Number.isFinite(numericValue) && String(value).trim() !== "") {
      return parseTimestampSeconds(numericValue);
    }

    var parsedMs = Date.parse(String(value));
    return Number.isFinite(parsedMs) ? parsedMs / 1000 : null;
  }

  function getLatestTimestampSeconds(values, fallback) {
    var timestamps = values
      .map(parseTimestampSeconds)
      .filter(function (value) {
        return Number.isFinite(value) && value > 0;
      });
    return timestamps.length ? Math.max.apply(null, timestamps) : fallback;
  }

  function normalizeMaaDeskPayload(raw, options) {
    if (hasLegacyDashboardShape(raw)) {
      return raw;
    }
    if (!isPlainObject(raw)) {
      throw new TypeError("status payload must be an object");
    }

    options = options || {};
    var nowSeconds = Number(options.nowSeconds);
    if (!Number.isFinite(nowSeconds) || nowSeconds <= 0) {
      nowSeconds = Date.now() / 1000;
    }
    var fallbackFreshnessTtl = Number(options.fallbackFreshnessTtlSeconds);
    if (!Number.isFinite(fallbackFreshnessTtl) || fallbackFreshnessTtl <= 0) {
      fallbackFreshnessTtl = 30;
    }

    var rawList = Array.isArray(raw.runList) ? raw.runList : [];
    var configs = rawList.map(getConfigLabel).filter(Boolean);
    if (!configs.length && Array.isArray(raw.executionConfigs) && raw.executionConfigs.length) {
      configs = raw.executionConfigs.map(getConfigLabel).filter(Boolean);
    }

    var completedCount = rawList.filter(function (item) { return item && item.status === "completed"; }).length;
    var skippedCount = rawList.filter(function (item) { return item && item.status === "skipped"; }).length;
    var currentIdx = rawList.findIndex(function (item) { return item && item.status === "current"; });
    var total = configs.length;
    var step = currentIdx >= 0 ? currentIdx + 1 : completedCount + skippedCount;
    var phaseMap = {
      idle: { cs: "Idle", pp: completedCount > 0 ? "completed" : "not_started" },
      running: { cs: "Running", pp: step > 0 ? "running" : "not_started" },
      paused: { cs: "Running", pp: step > 0 ? "running" : "not_started" },
      stopped: { cs: "Idle", pp: "stopped" },
      failed: { cs: "Failed", pp: "failed" },
      completed: { cs: "Idle", pp: "completed" }
    };
    var phase = phaseMap[raw.phase] || { cs: raw.phase, pp: raw.phase };
    var telemetry = raw.telemetry || {};
    var memory = telemetry.memory || {};
    var publishedAt = parseTimestampSeconds(raw.publishedAt);
    var lastUpdate = Number.isFinite(publishedAt) && publishedAt > 0
      ? publishedAt
      : getLatestTimestampSeconds([raw.lastUpdatedAt, raw.lastUpdate], nowSeconds);
    var freshnessTtl = Number(raw.freshnessTtlSeconds);
    if (!Number.isFinite(freshnessTtl) || freshnessTtl <= 0) {
      freshnessTtl = fallbackFreshnessTtl;
    }
    var transportStale = !(Number.isFinite(publishedAt) && publishedAt > 0) ||
      nowSeconds - publishedAt > freshnessTtl;
    var progressPercent = raw.progressPercent != null
      ? Number(raw.progressPercent)
      : (total > 0 ? step / total * 100 : 0);

    return {
      source: "MAA_Desk",
      controller_state: phase.cs,
      maa_status: raw.phase,
      current_user: raw.currentAccount || raw.currentUser || "",
      next_user: raw.nextAccount || raw.nextUser || "",
      step: step,
      total_steps: total,
      progress_percent: Number.isFinite(progressPercent) ? progressPercent : 0,
      execution_configs: configs,
      progress_phase: phase.pp,
      connection: raw.connection || raw.connectionState || "Connected",
      last_update: lastUpdate,
      last_error: raw.lastError || null,
      transport_stale: transportStale,
      freshness_ttl_seconds: freshnessTtl,
      telemetry: {
        cpu: telemetry.cpu && telemetry.cpu.value != null ? telemetry.cpu.value : (typeof telemetry.cpu === "number" ? telemetry.cpu : 0),
        gpu: telemetry.gpu && telemetry.gpu.value != null ? telemetry.gpu.value : (typeof telemetry.gpu === "number" ? telemetry.gpu : 0),
        mem: {
          percent: memory.percentage != null ? memory.percentage : (typeof memory.percent === "number" ? memory.percent : (memory.value || 0)),
          used_gb: memory.value != null ? memory.value : (typeof memory.usedGb === "number" ? memory.usedGb : 0),
          total_gb: typeof memory.totalGb === "number" ? memory.totalGb : (parseFloat(String(memory.unit || "").split("/")[1]) || 0)
        }
      }
    };
  }

  return {
    normalizeMaaDeskPayload: normalizeMaaDeskPayload,
    parseTimestampSeconds: parseTimestampSeconds
  };
});
