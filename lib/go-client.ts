import { createHash, createHmac } from "node:crypto";

export class GoApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: string;
  constructor(code: string, status: number, details?: string) {
    super(sanitizeGoErrorMessage(code, status));
    this.name = "GoApiError";
    this.code = code;
    this.status = status;
    this.details = details;
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

export function sanitizeGoErrorMessage(code: string, status: number): string {
  switch (code) {
    case "invalid_content_type":
      return "Use a JPEG, PNG, or WebP image.";
    case "invalid_photo":
      return "The uploaded photo could not be used. Upload a new photo and try again.";
    case "invalid_request":
      return "The request was invalid. Check the submitted data and try again.";
    case "invalid_size":
      return "Photo must be between 1 byte and 5 MB.";
    case "unauthorized":
      return "You need to sign in before trying again.";
    case "forbidden":
      return "You do not have permission to perform this action.";
    case "conflict":
      return "This survey has already been submitted.";
    case "not_found":
      return "The requested item was not found.";
    case "invalid_response":
    case "non_json_response":
      return "The API returned an invalid response. Try again shortly.";
    case "internal_error":
      return "The API could not complete the request. Try again shortly.";
    default:
      if (status === 404) return "The requested item was not found.";
      if (status >= 500) return "The API could not complete the request. Try again shortly.";
      if (status >= 400) return "The request could not be completed. Check the input and try again.";
      return "The API request could not be completed. Try again shortly.";
  }
}

export function toPublicMessage(error: unknown): string {
  if (error instanceof GoApiError) return error.message;
  if (error instanceof GoApiConnectionError) {
    return "The API is unavailable right now. Try again shortly.";
  }
  return "Something went wrong. Try again shortly.";
}

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
    const code = err?.code ?? "non_json_response";
    const upstreamMessage =
      typeof err?.message === "string" ? compactBody(err.message) || undefined : undefined;
    if (upstreamMessage) {
      console.error(
        `[go-client] ${method} ${path} -> ${res.status} ${code}:`,
        upstreamMessage,
      );
      throw new GoApiError(code, res.status, upstreamMessage);
    }
    const rawDetails = compactBody(text) || undefined;
    if (rawDetails) {
      console.error(
        `[go-client] ${method} ${path} -> ${res.status} non-JSON body:`,
        rawDetails,
      );
    }
    throw new GoApiError(
      code,
      res.status,
      rawDetails,
    );
  }

  if (text.length > 0 && parsed === undefined) {
    const rawDetails = compactBody(text) || undefined;
    console.error(
      `[go-client] ${method} ${path} -> ${res.status} unexpected non-JSON body:`,
      rawDetails,
    );
    throw new GoApiError(
      "invalid_response",
      res.status,
      rawDetails,
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
