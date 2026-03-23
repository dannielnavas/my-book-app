import type {
  AiBooksAskBody,
  AiBooksReadingPlanBody,
  AiBooksRecommendationsBody,
  AiBooksSimilarBody,
  AiBooksSummaryBody,
  CrearRecomendacionDto,
} from "@/types/api";
import { api, ApiError } from "./api";

/** Flujo histórico: guardar recomendación manual (contrato sin cambios). */
export async function createRecommendation(
  token: string,
  body: CrearRecomendacionDto,
): Promise<unknown> {
  return api("/ai/recommendations", { method: "POST", token, body });
}

export async function postAiBooksRecommendations(
  token: string,
  body?: AiBooksRecommendationsBody,
): Promise<unknown> {
  return api("/ai/books/recommendations", {
    method: "POST",
    token,
    body: body ?? {},
  });
}

export async function postAiBooksSummary(
  token: string,
  body: AiBooksSummaryBody,
): Promise<unknown> {
  return api("/ai/books/summary", { method: "POST", token, body });
}

export async function postAiBooksSimilar(
  token: string,
  body: AiBooksSimilarBody,
): Promise<unknown> {
  return api("/ai/books/similar", { method: "POST", token, body });
}

export async function postAiBooksReadingPlan(
  token: string,
  body: AiBooksReadingPlanBody,
): Promise<unknown> {
  return api("/ai/books/reading-plan", { method: "POST", token, body });
}

export async function postAiBooksAsk(
  token: string,
  body: AiBooksAskBody,
): Promise<unknown> {
  return api("/ai/books/ask", { method: "POST", token, body });
}

export { ApiError };
