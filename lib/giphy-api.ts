/**
 * Cliente mínimo para GIPHY API (GIFs de celebración).
 * Docs: https://developers.giphy.com/docs/
 * Las llamadas deben hacerse desde el cliente (no proxy).
 */
import { env } from "./env";

const GIPHY_BASE = "https://api.giphy.com/v1";

interface GiphyImageRendition {
  url?: string;
  width?: string;
  height?: string;
  mp4?: string;
  webp?: string;
}

interface GiphyGif {
  id: string;
  title?: string;
  images?: {
    fixed_height?: GiphyImageRendition;
    fixed_width?: GiphyImageRendition;
    downsized_medium?: GiphyImageRendition;
    original?: GiphyImageRendition;
  };
}

interface GiphySearchResponse {
  data?: GiphyGif[];
  meta?: { status: number; msg?: string };
}

const lastGifIdByQuery = new Map<string, string>();

function pickGifUrl(gif: GiphyGif): string | null {
  if (!gif?.images) return null;
  const img =
    gif.images.fixed_height ??
    gif.images.fixed_width ??
    gif.images.downsized_medium ??
    gif.images.original;
  if (!img) return null;
  const url = img.webp ?? img.mp4 ?? img.url;
  return url ?? null;
}

async function searchGif(
  query: string,
  opts?: { limit?: number },
): Promise<{ url: string; title?: string } | null> {
  const key = env.GIPHY_API_KEY?.trim();
  if (!key) return null;
  const limit = Math.max(1, Math.min(50, opts?.limit ?? 25));
  try {
    const params = new URLSearchParams({
      api_key: key,
      q: query,
      limit: String(limit),
      rating: "g",
      lang: "es",
    });
    const res = await fetch(`${GIPHY_BASE}/gifs/search?${params.toString()}`);
    const json = (await res.json()) as GiphySearchResponse;
    const data = json.data ?? [];
    if (data.length === 0) return null;

    // Selección aleatoria, evitando repetir el mismo GIF consecutivamente por query.
    const lastId = lastGifIdByQuery.get(query);
    let pick = data[Math.floor(Math.random() * data.length)];
    if (data.length > 1 && lastId && pick?.id === lastId) {
      for (let i = 0; i < 4; i++) {
        const next = data[Math.floor(Math.random() * data.length)];
        if (next?.id && next.id !== lastId) {
          pick = next;
          break;
        }
      }
    }

    const gif = pick;
    const url = gif ? pickGifUrl(gif) : null;
    if (!url) return null;
    if (gif?.id) lastGifIdByQuery.set(query, gif.id);
    return { url, title: gif?.title ?? undefined };
  } catch {
    return null;
  }
}

/**
 * GIF de éxito/celebración tipo "yes!", para mostrar al actualizar páginas.
 * Búsqueda: yes success celebration.
 */
export async function getSuccessCelebrationGif(gifQuery: string): Promise<{
  url: string;
  title?: string;
} | null> {
  return searchGif(`${gifQuery}`);
}

/**
 * GIF de motivación lectura (para el bloque "Sigue así").
 * Si no hay API key configurada, devuelve null.
 */
export async function getCelebrationGif(): Promise<{
  url: string;
  title?: string;
} | null> {
  const result = await searchGif("reading celebration book");
  if (!result) return null;
  return { url: result.url, title: result.title };
}
