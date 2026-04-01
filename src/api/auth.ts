import { fetchCsrf, apiFetch } from "./client";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  /** Linked chat.models.User (domain) when staff profile was created */
  chat_user?: { id: string; name: string; role: string };
};

export async function loginRequest(username: string, password: string): Promise<AuthUser> {
  await fetchCsrf();
  const r = await apiFetch("/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = (await r.json()) as { detail?: string; user?: AuthUser };
  if (!r.ok) {
    throw new Error(data.detail || "เข้าสู่ระบบไม่สำเร็จ");
  }
  if (!data.user) throw new Error("ตอบกลับไม่ถูกต้อง");
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  await apiFetch("/auth/logout/", { method: "POST" });
}

export async function meRequest(): Promise<{ authenticated: boolean; user?: AuthUser }> {
  const r = await apiFetch("/auth/me/");
  return r.json() as Promise<{ authenticated: boolean; user?: AuthUser }>;
}
