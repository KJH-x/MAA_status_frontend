import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../functions/api/status.js", import.meta.url),
  "utf8"
);
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { onRequestGet } = await import(moduleUrl);

test("status proxy forwards cache-busting query and disables response caching", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl;
  let requestedOptions;
  globalThis.fetch = async (url, options) => {
    requestedUrl = String(url);
    requestedOptions = options;
    return new Response('{"phase":"idle"}', {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  try {
    const response = await onRequestGet({
      request: new Request("https://maa.nslc.top/api/status?verify=123")
    });
    assert.equal(
      requestedUrl,
      "https://r2.nsapi.top/latest/status.json?verify=123"
    );
    assert.equal(requestedOptions.cf.cacheTtl, 0);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store, max-age=0");
    assert.deepEqual(await response.json(), { phase: "idle" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("status proxy converts transport failure into a cache-free 502", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("synthetic failure");
  };

  try {
    const response = await onRequestGet({
      request: new Request("https://maa.nslc.top/api/status")
    });
    assert.equal(response.status, 502);
    assert.equal(response.headers.get("Cache-Control"), "no-store, max-age=0");
    assert.deepEqual(await response.json(), { error: "status upstream unavailable" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
