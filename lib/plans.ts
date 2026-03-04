import type { Usuario } from "@/types/api";
import { env } from "@/lib/env";

export type PlanTier = "free" | "premium" | "lifetime";

export interface Entitlements {
  tier: PlanTier;
  planId: number | null;
  /** null = ilimitado */
  bookLimit: number | null;
  /** null = ilimitado */
  monthlyAiLimit: number | null;
  isPaid: boolean;
}

export function getEntitlements(
  user: Usuario | null | undefined,
): Entitlements {
  const planId = user?.planId ?? null;

  // Si el backend no envía planId todavía, lo tratamos como Free.
  if (planId == null || planId === env.FREE_PLAN_ID) {
    return {
      tier: "free",
      planId,
      bookLimit: env.FREE_BOOK_LIMIT,
      monthlyAiLimit: env.FREE_MONTHLY_AI_LIMIT,
      isPaid: false,
    };
  }

  if (planId === env.LIFETIME_PLAN_ID) {
    return {
      tier: "lifetime",
      planId,
      bookLimit: null,
      monthlyAiLimit: null,
      isPaid: true,
    };
  }

  if (planId === env.PREMIUM_PLAN_ID) {
    return {
      tier: "premium",
      planId,
      bookLimit: null,
      monthlyAiLimit: null,
      isPaid: true,
    };
  }

  // Fallback: no bloquear a un usuario que ya está pagando con un plan nuevo.
  return {
    tier: "premium",
    planId,
    bookLimit: null,
    monthlyAiLimit: null,
    isPaid: true,
  };
}

export function getPlanLabel(ent: Entitlements): string {
  if (ent.tier === "free") return "Free";
  if (ent.tier === "lifetime") return "De por vida";
  return "Premium";
}

