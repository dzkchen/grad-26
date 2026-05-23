import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { goClient, GoApiError } from "@/lib/go-client";

const MAX_BYTES = 5 * 1024 * 1024;

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

  if (!user.email) {
    return Response.json(
      { error: { code: "unauthorized", message: "user has no email" } },
      { status: 401 },
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
        { error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    }
    console.error("[/api/upload-url] go call failed:", e);
    const message =
      process.env.NODE_ENV === "development"
        ? `go call failed: ${e instanceof Error ? e.message : String(e)}`
        : "upstream call failed";
    return Response.json(
      { error: { code: "internal_error", message } },
      { status: 500 },
    );
  }
}
