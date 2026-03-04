import type { Usuario } from "@/types/api";
import { api, ApiError } from "./api";

export async function getMe(token: string): Promise<Usuario> {
  return api<Usuario>("/users/me", { token });
}

export async function updateMe(
  token: string,
  body: { name?: string },
): Promise<Usuario> {
  return api<Usuario>("/users/me", { method: "PATCH", token, body });
}

export { ApiError };
