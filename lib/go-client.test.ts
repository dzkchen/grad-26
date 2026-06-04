import { test } from "node:test";
import assert from "node:assert/strict";
import {
  goClient,
  GoApiError,
  sanitizeGoErrorMessage,
  signRequest,
} from "./go-client.ts";

// Fixture pinned against the Go middleware test in api/internal/auth/hmac_test.go.
// If either side regenerates the fixture, the other must be updated to match.
const SECRET = "test-secret-do-not-use-in-prod";

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

test("signRequest matches fixture for POST with JSON body", () => {
  const sig = signRequest(
    SECRET,
    "1740000000",
    "POST",
    "/survey",
    JSON.stringify({ hello: "world" }),
  );
  assert.equal(
    sig,
    "eed7eb1588bf34c4c5130b34610f815dae7cd4987e78d846170a1e11d0302aab",
  );
});

test("signRequest matches fixture for GET with empty body and query string", () => {
  const sig = signRequest(SECRET, "1740000000", "GET", "/directory?limit=24", "");
  assert.equal(
    sig,
    "b241dd37b3b9a0b063665e82214d6ba0f1dc38d16411cb2408509c8873a2ba4c",
  );
});

test("GoApiError message is sanitized and details hold upstream JSON message", async () => {
  const originalFetch = globalThis.fetch;
  const originalGoApiUrl = process.env.GO_API_URL;
  const originalSecret = process.env.INTERNAL_API_SECRET;
  const originalConsoleError = console.error;
  process.env.GO_API_URL = "https://go-api.example";
  process.env.INTERNAL_API_SECRET = SECRET;
  console.error = () => {};

  const upstreamMessage = "<pre>debug stack from upstream</pre>";
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        error: { code: "internal_error", message: upstreamMessage },
      }),
      { status: 500 },
    );

  try {
    await assert.rejects(
      goClient.get("/survey"),
      (error) =>
        error instanceof GoApiError &&
        error.code === "internal_error" &&
        error.status === 500 &&
        error.message === sanitizeGoErrorMessage("internal_error", 500) &&
        error.details === upstreamMessage,
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv("GO_API_URL", originalGoApiUrl);
    restoreEnv("INTERNAL_API_SECRET", originalSecret);
    console.error = originalConsoleError;
  }
});

test("GoApiError message is sanitized and details hold upstream non-JSON body", async () => {
  const originalFetch = globalThis.fetch;
  const originalGoApiUrl = process.env.GO_API_URL;
  const originalSecret = process.env.INTERNAL_API_SECRET;
  const originalConsoleError = console.error;
  process.env.GO_API_URL = "https://go-api.example";
  process.env.INTERNAL_API_SECRET = SECRET;
  console.error = () => {};

  const upstreamBody = "<html><body>debug dump</body></html>";
  globalThis.fetch = async () => new Response(upstreamBody, { status: 502 });

  try {
    await assert.rejects(
      goClient.get("/directory"),
      (error) =>
        error instanceof GoApiError &&
        error.code === "non_json_response" &&
        error.status === 502 &&
        error.message === sanitizeGoErrorMessage("non_json_response", 502) &&
        error.details === upstreamBody,
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv("GO_API_URL", originalGoApiUrl);
    restoreEnv("INTERNAL_API_SECRET", originalSecret);
    console.error = originalConsoleError;
  }
});
