/**
 * Tipos alineados con la API del backend (nombres en español donde aplica).
 */

export type EstadoLectura = "pendiente" | "en_lectura" | "leido";

export interface Usuario {
  id: number;
  name: string;
  email: string;
  xpPoints?: number;
  level?: number;
  readingStreakDays?: number;
  lastReadAt?: string | null;
  planId?: number | null;
}

export interface Libro {
  libroId: number;
  titulo: string;
  autor?: string | null;
  isbn?: string | null;
  descripcion?: string | null;
  imagenUrl?: string | null;
  genero?: string | null;
  paginasTotales?: number | null;
  paginasLeidas?: number | null;
  estadoLectura: EstadoLectura;
  esAdquirido: boolean;
  estaPrestado?: boolean;
  prestadoA?: string | null;
  prestadoEn?: string | null;
  createdAt: string;
  updatedAt: string;
  usuarioId: number;
}

/** Resultado de búsqueda externa (Google Books, Open Library) */
export interface ResultadoBusqueda {
  title: string;
  isbn?: string | null;
  author?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  genre?: string | null;
  totalPages?: number | null;
  source?: string;
  externalId?: string | null;
}

/** Body para POST /api/books */
export interface CreateBookDto {
  title: string;
  author?: string;
  isbn?: string;
  description?: string;
  imageUrl?: string;
  genre?: string;
  totalPages?: number;
  isOwned?: boolean;
}

/** Body para PATCH /api/books/:id */
export interface UpdateBookDto {
  title?: string;
  author?: string;
  isbn?: string;
  description?: string;
  imageUrl?: string;
  genre?: string;
  totalPages?: number;
  pagesRead?: number;
  readingStatus?: EstadoLectura;
  isOwned?: boolean;
  isBorrowed?: boolean;
  borrowedToName?: string;
  borrowedAt?: string;
}

/** Body para PATCH /api/books/:id/paginas */
export interface ActualizarPaginasDto {
  pagesRead: number;
}

/** Body para POST /api/ai/recomendaciones */
export interface CrearRecomendacionDto {
  promptSent: string;
  aiResponseJson: Record<string, unknown>;
  aiModel: string;
}

export interface AuthLoginResponse {
  usuario: Usuario;
  accessToken: string;
}
