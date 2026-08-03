const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeMaaDeskPayload } = require("../status-model.js");

function payload(overrides = {}) {
  return {
    phase: "idle",
    currentAccount: null,
    nextAccount: "synthetic-next",
    progressPercent: 0,
    runList: [{ id: "synthetic-next", status: "pending", locked: false, elapsedSeconds: null }],
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
  assert.equal(data.progress_percent, 100);
});
