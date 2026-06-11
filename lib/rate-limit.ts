export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

type Entry = {
  count: number;
  resetAt: number;
};

const PRUNE_INTERVAL_MS = 60_000;

function normalizePart(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : "unknown";
}

function retryAfterSeconds(resetAt: number, now: number): number {
  return Math.max(1, Math.ceil((resetAt - now) / 1000));
}

export function createRateLimiter(now: () => number = Date.now) {
  const entries = new Map<string, Entry>();
  let nextPruneAt = now() + PRUNE_INTERVAL_MS;

  function pruneExpired(current: number) {
    if (current < nextPruneAt) return;
    for (const [key, entry] of entries) {
      if (entry.resetAt <= current) entries.delete(key);
    }
    nextPruneAt = current + PRUNE_INTERVAL_MS;
  }

  function checkRateLimit(
    bucket: string,
    key: string,
    config: RateLimitConfig,
  ): RateLimitResult {
    if (config.limit < 1) {
      throw new RangeError("rate limit must be at least 1");
    }
    if (config.windowMs < 1) {
      throw new RangeError("rate limit window must be at least 1ms");
    }

    const current = now();
    pruneExpired(current);

    const compositeKey = `${normalizePart(bucket)}\0${normalizePart(key)}`;
    const entry = entries.get(compositeKey);
    if (!entry || entry.resetAt <= current) {
      entries.set(compositeKey, {
        count: 1,
        resetAt: current + config.windowMs,
      });
      return { allowed: true };
    }

    if (entry.count >= config.limit) {
      return {
        allowed: false,
        retryAfterSeconds: retryAfterSeconds(entry.resetAt, current),
      };
    }

    entry.count += 1;
    return { allowed: true };
  }

  return { checkRateLimit };
}

const globalLimiter = createRateLimiter();

export function checkRateLimit(
  bucket: string,
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  return globalLimiter.checkRateLimit(bucket, key, config);
}

export function clientIpFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();
  if (forwardedIp) return forwardedIp;

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}
