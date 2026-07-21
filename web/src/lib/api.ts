// Thin fetch wrapper. Admin key (prototype auth) lives in localStorage.
const ADMIN_KEY = "mundo_admin_key";

export function getAdminKey() {
  return localStorage.getItem(ADMIN_KEY) ?? "";
}
export function setAdminKey(k: string) {
  localStorage.setItem(ADMIN_KEY, k);
}

async function req<T>(method: string, path: string, body?: unknown, admin = false): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (admin) headers["x-admin-key"] = getAdminKey();
  const res = await fetch(path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error ?? `Erro ${res.status}`);
  return data as T;
}

export const api = {
  get: <T>(p: string) => req<T>("GET", p),
  post: <T>(p: string, b?: unknown) => req<T>("POST", p, b),
  // admin
  aGet: <T>(p: string) => req<T>("GET", p, undefined, true),
  aPost: <T>(p: string, b?: unknown) => req<T>("POST", p, b, true),
  aPatch: <T>(p: string, b?: unknown) => req<T>("PATCH", p, b, true),
  aPut: <T>(p: string, b?: unknown) => req<T>("PUT", p, b, true),
  aDel: <T>(p: string) => req<T>("DELETE", p, undefined, true),
};
