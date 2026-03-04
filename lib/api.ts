import { env } from "./env";

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface RequestConfig {
  method?: Method;
  body?: object;
  token?: string | null;
  searchParams?: Record<string, string | number>;
}

function buildUrl(
  path: string,
  searchParams?: Record<string, string | number>,
): string {
  const base = env.API_URL.replace(/\/$/, "");
  const url = path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  if (!searchParams || Object.keys(searchParams).length === 0) return url;
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => params.set(k, String(v)));
  return `${url}?${params.toString()}`;
}

export async function api<T = unknown>(
  path: string,
  { method = "GET", body, token, searchParams }: RequestConfig = {},
): Promise<T> {
  const url = buildUrl(path, searchParams);
  console.log("url", url);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const options: RequestInit = { method, headers };
  if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  if (!res.ok) {
    let message = res.statusText || `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data.message)
        message = Array.isArray(data.message)
          ? data.message.join(", ")
          : String(data.message);
      else if (data.error) message = String(data.error);
    } catch {
      // ignore
    }
    if (!message || String(message).trim() === "") {
      message =
        res.status === 404
          ? "No encontrado"
          : `Error del servidor (${res.status})`;
    }
    throw new ApiError(res.status, message);
  }
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return undefined as T;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
