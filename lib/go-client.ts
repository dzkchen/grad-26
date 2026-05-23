import { createHash, createHmac } from "node:crypto";

export class GoApiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "GoApiError";
    this.code = code;
    this.status = status;
  }
}

export class GoApiConnectionError extends Error {
  readonly url: string;

  constructor(url: string, cause: unknown) {
    super(`Could not reach Go API at ${url}`, { cause });
    this.name = "GoApiConnectionError";
    this.url = url;
  }
}

export interface GoClientOpts {
  callerEmail?: string;
}

const EMPTY_BODY_SHA256 =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

export function signRequest(
  secret: string,
  timestamp: string,
  method: string,
  pathWithQuery: string,
  body: string,
): string {
  const bodyHash =
    body.length === 0
      ? EMPTY_BODY_SHA256
      : createHash("sha256").update(body).digest("hex");
  const canonical = `${timestamp}\n${method}\n${pathWithQuery}\n${bodyHash}`;
  return createHmac("sha256", secret).update(canonical).digest("hex");
}

function buildPath(path: string, query?: Record<string, string | number | undefined>): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function buildURL(base: string, path: string): string {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function parseJSON(text: string): unknown {
  if (text.length === 0) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function compactBody(text: string): string {
  return text.trim().replace(/\s+/g, " ").slice(0, 240);
}

async function request<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body: unknown,
  opts?: GoClientOpts,
): Promise<T> {
  const base = process.env.GO_API_URL;
  const secret = process.env.INTERNAL_API_SECRET;
  if (!base) throw new Error("GO_API_URL is not set");
  if (!secret) throw new Error("INTERNAL_API_SECRET is not set");

  const bodyString = body === undefined ? "" : JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signRequest(secret, timestamp, method, path, bodyString);

  const headers: Record<string, string> = {
    "X-Internal-Timestamp": timestamp,
    "X-Internal-Signature": signature,
  };
  if (bodyString.length > 0) headers["Content-Type"] = "application/json";
  if (opts?.callerEmail) headers["X-Caller-Email"] = opts.callerEmail.toLowerCase();

  const url = buildURL(base, path);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: bodyString.length > 0 ? bodyString : undefined,
      cache: "no-store",
    });
  } catch (e) {
    throw new GoApiConnectionError(url, e);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const parsed = parseJSON(text);

  if (!res.ok) {
    const err = (parsed as { error?: { code?: string; message?: string } })?.error;
    const fallbackMessage = compactBody(text);
    throw new GoApiError(
      err?.code ?? "non_json_response",
      err?.message ??
        (fallbackMessage
          ? `Go API ${method} ${path} returned ${res.status}: ${fallbackMessage}`
          : `Go API ${method} ${path} returned ${res.status}`),
      res.status,
    );
  }

  if (text.length > 0 && parsed === undefined) {
    throw new GoApiError(
      "invalid_response",
      `Go API ${method} ${path} returned non-JSON response: ${compactBody(text)}`,
      res.status,
    );
  }

  return parsed as T;
}

export const goClient = {
  get<T>(path: string, query?: Record<string, string | number | undefined>, opts?: GoClientOpts): Promise<T> {
    return request<T>("GET", buildPath(path, query), undefined, opts);
  },
  post<T>(path: string, body: unknown, opts?: GoClientOpts): Promise<T> {
    return request<T>("POST", path, body, opts);
  },
  delete<T>(path: string, opts?: GoClientOpts): Promise<T> {
    return request<T>("DELETE", path, undefined, opts);
  },
};
