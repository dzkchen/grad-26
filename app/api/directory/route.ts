import { getDirectoryPage } from "@/lib/data/directory";
import { GoApiConnectionError, GoApiError } from "@/lib/go-client";

export async function GET(request: Request) {
  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;

  try {
    const page = await getDirectoryPage(cursor);
    return Response.json(page);
  } catch (e) {
    if (e instanceof GoApiError) {
      return Response.json(
        { error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    }
    if (e instanceof GoApiConnectionError) {
      return Response.json(
        { error: { code: "upstream_unavailable", message: e.message } },
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
