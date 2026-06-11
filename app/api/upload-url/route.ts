import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  goClient,
  GoApiConnectionError,
  GoApiError,
  toPublicMessage,
} from "@/lib/go-client";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_URL_LIMIT = { limit: 4, windowMs: 60_000 };

const BodySchema = z.object({
  content_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  content_length: z.number().int().min(1).max(MAX_BYTES),
});

type UploadURLResponse = {
  url: string;
  key: string;
  expires_at: string;
};

export async function POST(request: Request) {
  const user = await requireUser();

  if (!user.email) {
    return Response.json(
      { error: { code: "unauthorized", message: "user has no email" } },
      { status: 401 },
    );
  }

  const rateLimit = checkRateLimit("upload-url", user.email, UPLOAD_URL_LIMIT);
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

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json(
      { error: { code: "invalid_request", message: "malformed JSON body" } },
      { status: 400 },
    );
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "invalid_request", message: parsed.error.message } },
      { status: 400 },
    );
  }

  try {
    const data = await goClient.post<UploadURLResponse>(
      "/upload/url",
      parsed.data,
      { callerEmail: user.email },
    );
    return Response.json(data);
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
    console.error("[/api/upload-url] go call failed:", e);
    return Response.json(
      { error: { code: "internal_error", message: "upstream call failed" } },
      { status: 500 },
    );
  }
}
