import * as SecureStore from "expo-secure-store";

function getMonthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function aiMonthlyKey(userId: number, monthKey = getMonthKey()): string {
  return `milibro_ai_monthly_count:${userId}:${monthKey}`;
}

export async function getMonthlyAiCount(userId: number): Promise<number> {
  const raw = await SecureStore.getItemAsync(aiMonthlyKey(userId));
  const n = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(n) ? n : 0;
}

export async function incrementMonthlyAiCount(userId: number): Promise<number> {
  const current = await getMonthlyAiCount(userId);
  const next = current + 1;
  await SecureStore.setItemAsync(aiMonthlyKey(userId), String(next));
  return next;
}

