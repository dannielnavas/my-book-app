/**
 * Variables de entorno (Expo: EXPO_PUBLIC_* se expone al cliente).
 * Base URL de la API NestJS.
 */
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.10.21:3000/api";

/** GIPHY API Key para GIFs de celebración (opcional). Obtener en https://developers.giphy.com/ */
const GIPHY_API_KEY =
  process.env.EXPO_PUBLIC_GIPHY_API_KEY ?? "urxce8JpuiuglyL63NYH4awY0IEwAhBj";

function toInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

// Planes: IDs (según backend). Ajustable por env.
const FREE_PLAN_ID = toInt(process.env.EXPO_PUBLIC_FREE_PLAN_ID, 1);
const PREMIUM_PLAN_ID = toInt(process.env.EXPO_PUBLIC_PREMIUM_PLAN_ID, 2);
const LIFETIME_PLAN_ID = toInt(process.env.EXPO_PUBLIC_LIFETIME_PLAN_ID, 3);

// Límites del plan Free (en el frontend son "soft limits"; el backend debe validar).
const FREE_BOOK_LIMIT = toInt(process.env.EXPO_PUBLIC_FREE_BOOK_LIMIT, 100);
const FREE_MONTHLY_AI_LIMIT = toInt(
  process.env.EXPO_PUBLIC_FREE_MONTHLY_AI_LIMIT,
  5,
);

export const env = {
  API_URL,
  GIPHY_API_KEY,
  FREE_PLAN_ID,
  PREMIUM_PLAN_ID,
  LIFETIME_PLAN_ID,
  FREE_BOOK_LIMIT,
  FREE_MONTHLY_AI_LIMIT,
};
