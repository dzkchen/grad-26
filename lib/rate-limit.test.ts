import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIpFromHeaders, createRateLimiter } from "./rate-limit.ts";

test("allows requests within the configured limit", () => {
  const now = 1_000;
  const limiter = createRateLimiter(() => now);
  const config = { limit: 2, windowMs: 60_000 };

  assert.deepEqual(limiter.checkRateLimit("upload-url", "Alex@PDSB.NET", config), {
    allowed: true,
  });
  assert.deepEqual(limiter.checkRateLimit("upload-url", "alex@pdsb.net", config), {
    allowed: true,
  });
});

test("denies requests over the configured limit", () => {
  let now = 1_000;
  const limiter = createRateLimiter(() => now);
  const config = { limit: 1, windowMs: 60_000 };

  assert.deepEqual(limiter.checkRateLimit("submit-survey", "alex@pdsb.net", config), {
    allowed: true,
  });

  now = 31_000;
  assert.deepEqual(limiter.checkRateLimit("submit-survey", "alex@pdsb.net", config), {
    allowed: false,
    retryAfterSeconds: 30,
  });
});

test("resets a key after its window expires", () => {
  let now = 1_000;
  const limiter = createRateLimiter(() => now);
  const config = { limit: 1, windowMs: 10_000 };

  assert.deepEqual(limiter.checkRateLimit("admin", "admin@example.com", config), {
    allowed: true,
  });
  assert.equal(
    limiter.checkRateLimit("admin", "admin@example.com", config).allowed,
    false,
  );

  now = 11_000;
  assert.deepEqual(limiter.checkRateLimit("admin", "admin@example.com", config), {
    allowed: true,
  });
});

test("keeps separate buckets and keys independent", () => {
  const limiter = createRateLimiter(() => 1_000);
  const config = { limit: 1, windowMs: 60_000 };

  assert.deepEqual(limiter.checkRateLimit("upload-url", "alex@pdsb.net", config), {
    allowed: true,
  });
  assert.deepEqual(limiter.checkRateLimit("survey", "alex@pdsb.net", config), {
    allowed: true,
  });
  assert.deepEqual(limiter.checkRateLimit("upload-url", "jamie@pdsb.net", config), {
    allowed: true,
  });
  assert.equal(
    limiter.checkRateLimit("upload-url", "alex@pdsb.net", config).allowed,
    false,
  );
});

test("clientIpFromHeaders uses forwarded-for, then real-ip, then fallback", () => {
  assert.equal(
    clientIpFromHeaders(
      new Headers({
        "x-forwarded-for": "203.0.113.10, 198.51.100.20",
        "x-real-ip": "198.51.100.30",
      }),
    ),
    "203.0.113.10",
  );
  assert.equal(
    clientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.30" })),
    "198.51.100.30",
  );
  assert.equal(clientIpFromHeaders(new Headers()), "unknown");
});
