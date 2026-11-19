import { api } from "@/lib/api-client";
import type { Admin } from "@/types";

export const authService = {
  login: async (input: { email: string; password: string }) =>
    (await api.post<{ admin: Admin }>("/auth/login", input)).data.admin,
  logout: async () => {
    await api.post("/auth/logout");
  },
  me: async (signal?: AbortSignal) => (await api.get<{ admin: Admin }>("/auth/me", undefined, signal)).data.admin,
};
