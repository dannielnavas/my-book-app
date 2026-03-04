import type { AuthLoginResponse } from "@/types/api";
import { api, ApiError } from "./api";

export async function register(
  nombre: string,
  email: string,
  password: string,
): Promise<AuthLoginResponse> {
  return api<AuthLoginResponse>("/auth/register", {
    method: "POST",
    body: { name: nombre, email, password },
  });
}

export async function login(
  email: string,
  password: string,
): Promise<AuthLoginResponse> {
  return api<AuthLoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function loginGoogle(idToken: string): Promise<AuthLoginResponse> {
  return api<AuthLoginResponse>("/auth/google", {
    method: "POST",
    body: { idToken },
  });
}

export { ApiError };
