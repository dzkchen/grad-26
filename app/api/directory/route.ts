import { getDirectoryPage } from "@/lib/data/directory";
import { GoApiConnectionError, GoApiError, toPublicMessage } from "@/lib/go-client";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

const DIRECTORY_LIMIT = { limit: 60, windowMs: 60_000 };

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(
    "directory",
    clientIpFromHeaders(request.headers),
    DIRECTORY_LIMIT,
  );
  if (!rateLimit.allowed) {
    return Response.json(
      {
        error: {
          code: "rate_limited",
          message: "Too many requests. Try again shortly.",
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;

  try {
    const page = await getDirectoryPage(cursor);
    return Response.json(page);
  } catch (e) {
    if (e instanceof GoApiError) {
      return Response.json(
        { error: { code: e.code, message: toPublicMessage(e) } },
        { status: e.status },
      );
    }
    if (e instanceof GoApiConnectionError) {
      return Response.json(
        { error: { code: "upstream_unavailable", message: toPublicMessage(e) } },
        { status: 502 },
      );
    }
    console.error("[/api/directory] failed:", e);
    return Response.json(
      { error: { code: "internal_error", message: "upstream call failed" } },
      { status: 500 },
    );
  }
}
