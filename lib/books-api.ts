import type {
    ActualizarPaginasDto,
    CreateBookDto,
    Libro,
    ResultadoBusqueda,
    UpdateBookDto,
} from "@/types/api";
import { api, ApiError } from "./api";

/** Normaliza un libro devuelto por la API (puede venir en español o camelCase) */
function normalizeLibro(raw: Record<string, unknown>): Libro {
  return {
    libroId: Number(raw.bookId ?? raw.id ?? 0),
    titulo: String(raw.titulo ?? raw.title ?? ""),
    autor:
      raw.autor != null
        ? String(raw.autor)
        : raw.author != null
          ? String(raw.author)
          : null,
    isbn: raw.isbn != null ? String(raw.isbn) : null,
    descripcion:
      raw.descripcion != null
        ? String(raw.descripcion)
        : raw.description != null
          ? String(raw.description)
          : null,
    imagenUrl:
      raw.imagenUrl != null
        ? String(raw.imagenUrl)
        : raw.imageUrl != null
          ? String(raw.imageUrl)
          : null,
    genero:
      raw.genero != null
        ? String(raw.genero)
        : raw.genre != null
          ? String(raw.genre)
          : null,
    paginasTotales:
      raw.paginasTotales != null
        ? Number(raw.paginasTotales)
        : raw.totalPages != null
          ? Number(raw.totalPages)
          : null,
    paginasLeidas:
      raw.paginasLeidas != null
        ? Number(raw.paginasLeidas)
        : raw.pagesRead != null
          ? Number(raw.pagesRead)
          : null,
    estadoLectura: String(
      raw.estadoLectura ?? raw.readingStatus ?? "pendiente",
    ) as Libro["estadoLectura"],
    esAdquirido: Boolean(raw.esAdquirido ?? raw.isOwned ?? true),
    estaPrestado:
      raw.estaPrestado != null
        ? Boolean(raw.estaPrestado)
        : raw.isBorrowed != null
          ? Boolean(raw.isBorrowed)
          : undefined,
    prestadoA:
      raw.prestadoA != null
        ? String(raw.prestadoA)
        : raw.borrowedToName != null
          ? String(raw.borrowedToName)
          : null,
    prestadoEn:
      raw.prestadoEn != null
        ? String(raw.prestadoEn)
        : raw.borrowedAt != null
          ? String(raw.borrowedAt)
          : null,
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
    usuarioId: Number(raw.usuarioId ?? raw.userId ?? 0),
  };
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

export async function getBooks(token: string): Promise<Libro[]> {
  const raw = await api<unknown>("/books", { token });
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((item) => normalizeLibro(item as Record<string, unknown>));
}

export async function getBook(token: string, libroId: number): Promise<Libro> {
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
  try {
    return normalizeLibro(raw);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Datos del libro no válidos";
    throw new ApiError(500, msg);
  }
}

export async function createBook(
  token: string,
  body: CreateBookDto,
): Promise<Libro> {
  console.log("body", body);
  const raw = await api<Record<string, unknown>>("/books", {
    method: "POST",
    token,
    body,
  });
  return normalizeLibro(raw);
}

export async function updateBook(
  token: string,
  libroId: number,
  body: UpdateBookDto,
): Promise<Libro> {
  const raw = await api<Record<string, unknown>>(`/books/${libroId}`, {
    method: "PATCH",
    token,
    body,
  });
  return normalizeLibro(raw);
}

export async function updateBookPages(
  token: string,
  libroId: number,
  body: ActualizarPaginasDto,
): Promise<Libro> {
  const raw = await api<Record<string, unknown>>(`/books/${libroId}/pages`, {
    method: "PATCH",
    token,
    body,
  });
  return normalizeLibro(raw);
}

export async function deleteBook(
  token: string,
  libroId: number,
): Promise<void> {
  await api(`/books/${libroId}`, { method: "DELETE", token });
}

export { ApiError };
