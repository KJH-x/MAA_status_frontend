const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { formatMaaStatus, normalizeMaaDeskPayload } = require("../status-model.js");

function payload(overrides = {}) {
  return {
    phase: "idle",
    currentAccount: null,
    nextAccount: "synthetic-next",
    progressPercent: 0,
    runList: [{ id: "synthetic-next", status: "pending", locked: false, elapsedSeconds: null }],
    blocked: false,
    blockReasonCategory: null,
    telemetry: {
      cpu: { value: 1 },
      memory: { value: 2, percentage: 3, unit: "GB / 4GB" },
      gpu: { value: 5 }
    },
    updatedAt: 1_000,
    publishedAt: 10_000,
    stale: true,
    freshnessTtlSeconds: 4_500,
    ...overrides
  };
}

test("idle payload stays fresh through 4500 seconds and ignores legacy stale", () => {
  const data = normalizeMaaDeskPayload(payload(), { nowSeconds: 14_499 });

  assert.equal(data.transport_stale, false);
  assert.equal(data.freshness_ttl_seconds, 4_500);
  assert.equal(Object.hasOwn(data, "source_stale"), false);
  assert.equal(data.last_update, 10_000);
});

test("idle payload expires after 4500 seconds", () => {
  const data = normalizeMaaDeskPayload(payload(), { nowSeconds: 14_501 });
  assert.equal(data.transport_stale, true);
});

test("running payload uses its server-provided 32 second TTL", () => {
  const running = payload({ phase: "running", freshnessTtlSeconds: 32 });
  assert.equal(normalizeMaaDeskPayload(running, { nowSeconds: 10_032 }).transport_stale, false);
  assert.equal(normalizeMaaDeskPayload(running, { nowSeconds: 10_033 }).transport_stale, true);
});

test("missing TTL uses the configured fallback", () => {
  const raw = payload({ freshnessTtlSeconds: undefined });
  assert.equal(normalizeMaaDeskPayload(raw, {
    nowSeconds: 10_030,
    fallbackFreshnessTtlSeconds: 30
  }).transport_stale, false);
  assert.equal(normalizeMaaDeskPayload(raw, {
    nowSeconds: 10_031,
    fallbackFreshnessTtlSeconds: 30
  }).transport_stale, true);
});

test("missing or invalid publishedAt fails closed", () => {
  const missing = normalizeMaaDeskPayload(payload({ publishedAt: undefined }), { nowSeconds: 20_000 });
  const invalid = normalizeMaaDeskPayload(payload({ publishedAt: "not-a-time" }), { nowSeconds: 20_000 });

  assert.equal(missing.transport_stale, true);
  assert.equal(invalid.transport_stale, true);
  assert.equal(missing.last_update, 20_000);
});

test("legacy dashboard payload passes through unchanged", () => {
  const legacy = { controller_state: "Idle", last_update: 123 };
  assert.strictEqual(normalizeMaaDeskPayload(legacy, { nowSeconds: 456 }), legacy);
});

test("excluded accounts remain visible but do not affect execution progress", () => {
  const data = normalizeMaaDeskPayload(payload({
    phase: "running",
    progressPercent: undefined,
    runList: [
      { id: "not-selected", status: "excluded" },
      { id: "selected", status: "current" }
    ]
  }), { nowSeconds: 10_001 });

  assert.deepEqual(data.execution_configs, ["not-selected", "selected"]);
  assert.equal(data.total_steps, 1);
  assert.equal(data.step, 1);
  assert.equal(data.progress_percent, 0);
});

test("an all-excluded snapshot has a zero execution denominator", () => {
  const raw = payload({
    runList: [
      { id: "not-selected-a", status: "excluded", locked: true, elapsedSeconds: null },
      { id: "not-selected-b", status: "excluded", locked: true, elapsedSeconds: null }
    ]
  });
  delete raw.progressPercent;

  const data = normalizeMaaDeskPayload(raw, { nowSeconds: 10_001 });

  assert.deepEqual(data.execution_configs, ["not-selected-a", "not-selected-b"]);
  assert.equal(data.total_steps, 0);
  assert.equal(data.step, 0);
  assert.equal(data.progress_percent, 0);
});

test("a payload without runList keeps the executionConfigs compatibility fallback", () => {
  const raw = payload({
    runList: undefined,
    executionConfigs: ["legacy-a", "legacy-b"],
    progressPercent: undefined
  });

  const data = normalizeMaaDeskPayload(raw, { nowSeconds: 10_001 });

  assert.deepEqual(data.execution_configs, ["legacy-a", "legacy-b"]);
  assert.equal(data.total_steps, 2);
  assert.equal(data.progress_percent, 0);
});

test("blocked payload exposes only a closed public reason category", () => {
  const data = normalizeMaaDeskPayload(payload({
    phase: "stopped",
    blocked: true,
    blockReasonCategory: "persistence",
    blockReason: "failed at C:\\private\\temp_run.json",
    blockedPlan: { id: "must-not-be-forwarded" }
  }), { nowSeconds: 10_001 });

  assert.equal(data.controller_state, "Blocked");
  assert.equal(data.maa_status, "blocked");
  assert.equal(data.progress_phase, "failed");
  assert.equal(data.scheduler_blocked, true);
  assert.equal(data.block_reason_category, "persistence");
  assert.equal(formatMaaStatus(data), "blocked · persistence");
  assert.equal(Object.hasOwn(data, "blockReason"), false);
  assert.equal(Object.hasOwn(data, "blockedPlan"), false);
});

test("blocked payload rejects arbitrary reason categories", () => {
  const data = normalizeMaaDeskPayload(payload({
    blocked: true,
    blockReasonCategory: "C:\\private\\manifest.json"
  }), { nowSeconds: 10_001 });

  assert.equal(data.block_reason_category, "unknown");
  assert.equal(formatMaaStatus(data), "blocked · unknown");
});

test("active plan and pending plans normalize with whitelist-only fields", () => {
  const raw = payload({
    activePlan: {
      kind: "single_account",
      source: "manual",
      targetAccounts: ["synthetic-current"],
      withoutFight: true,
      hasTemporaryActStage: false,
      additionalRun: false,
      accountSnapshot: ["synthetic-hidden"],
      scheduleId: "must-not-leak",
      id: "must-not-leak"
    },
    pendingPlans: [
      {
        kind: "full_round",
        source: "cron",
        targetAccounts: ["synthetic-a", "synthetic-b"],
        withoutFight: true,
        hasTemporaryActStage: true,
        additionalRun: true,
        createdAt: "must-not-leak"
      }
    ]
  });

  const data = normalizeMaaDeskPayload(raw, { nowSeconds: 10_001 });

  assert.deepEqual(data.active_plan, {
    kind: "single_account",
    source: "manual",
    targetAccounts: ["synthetic-current"],
    withoutFight: true,
    hasTemporaryActStage: false,
    additionalRun: false
  });
  assert.deepEqual(data.pending_plans, [{
    position: 1,
    kind: "full_round",
    source: "cron",
    targetAccounts: ["synthetic-a", "synthetic-b"],
    withoutFight: true,
    hasTemporaryActStage: true,
    additionalRun: true
  }]);
  assert.equal(Object.hasOwn(data.active_plan, "accountSnapshot"), false);
  assert.equal(Object.hasOwn(data.active_plan, "scheduleId"), false);
  assert.equal(Object.hasOwn(data.active_plan, "id"), false);
  assert.equal(Object.hasOwn(data.pending_plans[0], "createdAt"), false);
});

test("run_list keeps per-account status locked and elapsed seconds", () => {
  const raw = payload({
    runList: [
      { id: "synthetic-alpha", status: "current", locked: true, elapsedSeconds: 125 },
      { id: "synthetic-beta", status: "pending", locked: false, elapsedSeconds: null }
    ]
  });

  const data = normalizeMaaDeskPayload(raw, { nowSeconds: 10_001 });

  assert.deepEqual(data.run_list, [
    { id: "synthetic-alpha", status: "current", locked: true, elapsedSeconds: 125 },
    { id: "synthetic-beta", status: "pending", locked: false, elapsedSeconds: null }
  ]);
});

test("missing plan summaries fall back to empty queue without leaking raw fields", () => {
  const data = normalizeMaaDeskPayload(payload(), { nowSeconds: 10_001 });

  assert.equal(data.active_plan, null);
  assert.deepEqual(data.pending_plans, []);
  assert.equal(data.queued_plan_count, 0);
});

test("checked-in fixture includes the sanitized blocked contract", () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "test_status.json"), "utf8"));
  const publishedAt = Date.parse(fixture.publishedAt) / 1000;
  const data = normalizeMaaDeskPayload(fixture, { nowSeconds: publishedAt + 1 });

  assert.equal(typeof fixture.blocked, "boolean");
  assert.equal(Object.hasOwn(fixture, "blockReasonCategory"), true);
  assert.equal(data.scheduler_blocked, false);
  assert.equal(data.block_reason_category, null);
  assert.deepEqual(data.execution_configs, ["synthetic-excluded", "synthetic-selected"]);
  assert.equal(data.total_steps, 1);
  assert.equal(data.progress_percent, 0);
  assert.deepEqual(data.active_plan, {
    kind: "single_account",
    source: "manual",
    targetAccounts: ["synthetic-selected"],
    withoutFight: false,
    hasTemporaryActStage: false,
    additionalRun: false
  });
  assert.equal(data.pending_plans.length, 1);
  assert.equal(data.pending_plans[0].position, 1);
  assert.deepEqual(data.pending_plans[0].targetAccounts, [
    "synthetic-pending-a",
    "synthetic-pending-b"
  ]);
});
