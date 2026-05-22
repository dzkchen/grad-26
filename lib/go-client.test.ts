import { test } from "node:test";
import assert from "node:assert/strict";
import { signRequest } from "./go-client.ts";

// Fixture pinned against the Go middleware test in api/internal/auth/hmac_test.go.
// If either side regenerates the fixture, the other must be updated to match.
const SECRET = "test-secret-do-not-use-in-prod";

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
