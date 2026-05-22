import { requireAdmin } from "@/lib/auth";
import { goClient, GoApiError } from "@/lib/go-client";

export async function GET() {
  await requireAdmin();
  try {
    const goResponse = await goClient.get<{ status: string }>("/health");
    return Response.json({ ok: true, goResponse });
  } catch (err) {
    if (err instanceof GoApiError) {
      return Response.json(
        { ok: false, error: { code: err.code, message: err.message, status: err.status } },
        { status: 502 },
      );
    }
    throw err;
  }
}
