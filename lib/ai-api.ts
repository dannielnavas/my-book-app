import type { CrearRecomendacionDto } from "@/types/api";
import { api, ApiError } from "./api";

export async function createRecommendation(
  token: string,
  body: CrearRecomendacionDto,
): Promise<unknown> {
  return api("/ai/recommendations", { method: "POST", token, body });
}

export { ApiError };
