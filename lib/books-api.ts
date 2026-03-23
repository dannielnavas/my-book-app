import type {
  UpdatePagesDto,
  CreateBookDto,
  Book,
  ResultadoBusqueda,
  UpdateBookDto,
} from "@/types/api";
import { api, ApiError } from "./api";
import { env } from "./env";

function buildApiUrl(path: string): string {
  const base = env.API_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export async function searchBooks(
  token: string,
  opts: { q?: string; isbn?: string; limit?: number },
): Promise<ResultadoBusqueda[]> {
  const params: Record<string, string | number> = {};
  if (opts.q) params.q = opts.q;
  if (opts.isbn) params.isbn = opts.isbn;
  if (opts.limit != null) params.limit = Math.min(20, Math.max(1, opts.limit));
  const res = await api<
    ResultadoBusqueda[] | { results?: ResultadoBusqueda[] }
  >("/books/search", { token, searchParams: params });
  if (Array.isArray(res)) return res;
  return (res as { results?: ResultadoBusqueda[] }).results ?? [];
}

export async function getBooks(token: string): Promise<Book[]> {
  const raw = await api<unknown>("/books", { token });
  const arr = Array.isArray(raw) ? raw : [];
  return arr as Book[];
}

export async function getBook(token: string, libroId: number): Promise<Book> {
  const res = await api<Record<string, unknown>>(`/books/${libroId}`, {
    token,
  });
  const raw =
    res && typeof res === "object" && (res.data ?? res.book ?? res)
      ? ((res.data ?? res.book ?? res) as Record<string, unknown>)
      : res;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ApiError(404, "Libro no encontrado");
  }
  return raw as unknown as Book;
}

export async function createBook(
  token: string,
  body: CreateBookDto,
): Promise<Book> {
  console.log("body", body);
  const raw = await api<Record<string, unknown>>("/books", {
    method: "POST",
    token,
    body,
  });
  return raw as unknown as Book;
}

export async function updateBook(
  token: string,
  libroId: number,
  body: UpdateBookDto,
): Promise<Book> {
  const raw = await api<Record<string, unknown>>(`/books/${libroId}`, {
    method: "PATCH",
    token,
    body,
  });
  return raw as unknown as Book;
}

export async function updateBookPages(
  token: string,
  libroId: number,
  body: UpdatePagesDto,
): Promise<{ book: Book; xpEarned: number; levelUp: boolean; newLevel: number }> {
  const raw = await api<{ book: Record<string, unknown>; xpEarned: number; levelUp: boolean; newLevel: number }>(`/books/${libroId}/pages`, {
    method: "PATCH",
    token,
    body,
  });
  return {
    book: raw.book as unknown as Book,
    xpEarned: raw.xpEarned,
    levelUp: raw.levelUp,
    newLevel: raw.newLevel,
  };
}

export async function deleteBook(
  token: string,
  libroId: number,
): Promise<void> {
  await api(`/books/${libroId}`, { method: "DELETE", token });
}

interface UploadCoverRawResponse {
  imageUrl?: string;
  imagenUrl?: string;
  book?: Record<string, unknown>;
  data?: {
    imageUrl?: string;
    imagenUrl?: string;
    book?: Record<string, unknown>;
  };
}

export async function uploadBookCover(
  token: string,
  libroId: number,
  fileUri: string,
  fileName?: string,
  mimeType?: string,
): Promise<{ imageUrl: string; book: Book | null }> {
  const url = buildApiUrl(`/books/${libroId}/cover`);

  const form = new FormData();
  form.append("file", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uri: fileUri,
    name: fileName ?? `cover-${libroId}.jpg`,
    type: mimeType ?? "image/jpeg",
  } as any);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    let message = res.statusText || `Error ${res.status}`;
    try {
      const data = (await res.json()) as { message?: unknown; error?: unknown };
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

  const data = (await res.json()) as UploadCoverRawResponse;
  const rawImageUrl =
    data.imageUrl ??
    data.imagenUrl ??
    data.data?.imageUrl ??
    data.data?.imagenUrl;
  const rawBook = data.book ?? data.data?.book ?? null;

  if (!rawImageUrl) {
    throw new ApiError(500, "Respuesta inválida al subir la portada");
  }

  const book = rawBook ? (rawBook as unknown as Book) : null;
  return { imageUrl: rawImageUrl, book };
}

export { ApiError };
