import { isRole, type Role } from "./roles";

function resolveApiBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  const root = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (root) return `${root}/api`;

  return "http://localhost:5000/api";
}

export const API_BASE_URL = resolveApiBaseUrl();

export const AUTH_STORAGE_KEYS = {
  token: "panda-studio-token",
  user: "panda-studio-user",
  legacyToken: "token",
  legacyUser: "user",
} as const;

export type ApiUser = {
  _id?: string;
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: Role | string;
  avatar?: string;
  phone?: string;
  company?: string;
  availability?: string;
  messaging?: boolean;
  scheduling?: boolean;
  payroll?: boolean;
  [key: string]: unknown;
};

export type NormalizedAuthSession = {
  token: string;
  user: ApiUser;
};

function safeWindowStorageRead(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWindowStorageWrite(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

function safeWindowStorageRemove(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage failures
  }
}

export function getStoredToken(): string | null {
  return (
    safeWindowStorageRead(AUTH_STORAGE_KEYS.token) ??
    safeWindowStorageRead(AUTH_STORAGE_KEYS.legacyToken)
  );
}

export function getStoredUser(): ApiUser | null {
  const raw =
    safeWindowStorageRead(AUTH_STORAGE_KEYS.user) ??
    safeWindowStorageRead(AUTH_STORAGE_KEYS.legacyUser);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiUser;
  } catch {
    return null;
  }
}

export function setStoredSession(session: NormalizedAuthSession) {
  if (typeof window === "undefined") return;
  safeWindowStorageWrite(AUTH_STORAGE_KEYS.token, session.token);
  safeWindowStorageWrite(AUTH_STORAGE_KEYS.user, JSON.stringify(session.user));
  safeWindowStorageRemove(AUTH_STORAGE_KEYS.legacyToken);
  safeWindowStorageRemove(AUTH_STORAGE_KEYS.legacyUser);
}

export function clearStoredSession() {
  safeWindowStorageRemove(AUTH_STORAGE_KEYS.token);
  safeWindowStorageRemove(AUTH_STORAGE_KEYS.user);
  safeWindowStorageRemove(AUTH_STORAGE_KEYS.legacyToken);
  safeWindowStorageRemove(AUTH_STORAGE_KEYS.legacyUser);
}

function pickAuthPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const data = payload as Record<string, unknown>;

  if (data.user && typeof data.user === "object")
    return data.user as Record<string, unknown>;
  if (data.result && typeof data.result === "object")
    return data.result as Record<string, unknown>;

  if (data.data && typeof data.data === "object") {
    const nested = data.data as Record<string, unknown>;
    if (nested.user && typeof nested.user === "object")
      return nested.user as Record<string, unknown>;
    if (nested.result && typeof nested.result === "object")
      return nested.result as Record<string, unknown>;
    return nested;
  }

  return data;
}

function normalizeUser(payload: unknown): ApiUser | null {
  const data = pickAuthPayload(payload);
  const candidate =
    data.user && typeof data.user === "object"
      ? (data.user as Record<string, unknown>)
      : data;

  const rawRole = candidate.role;

  const role =
    typeof rawRole === "string" && isRole(rawRole) ? rawRole : undefined;

  const id =
    typeof candidate._id === "string"
      ? candidate._id
      : typeof candidate.id === "string"
        ? candidate.id
        : undefined;

  const firstName =
    typeof candidate.firstName === "string" ? candidate.firstName : undefined;
  const lastName =
    typeof candidate.lastName === "string" ? candidate.lastName : undefined;

  const name =
    typeof candidate.name === "string"
      ? candidate.name
      : typeof candidate.fullName === "string"
        ? candidate.fullName
        : typeof candidate.displayName === "string"
          ? candidate.displayName
          : firstName || lastName
            ? [firstName, lastName].filter(Boolean).join(" ")
            : typeof candidate.username === "string"
              ? candidate.username
              : undefined;

  const email =
    typeof candidate.email === "string" ? candidate.email : undefined;

  if (!id && !name && !email && !role) return null;

  return {
    ...candidate,
    ...(id ? { _id: id } : {}),
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
    ...(role ? { role } : {}),
  } as ApiUser;
}

export function extractAuthSession(
  payload: unknown,
): NormalizedAuthSession | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const nested =
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : null;
  const token =
    typeof data.token === "string"
      ? data.token
      : typeof data.accessToken === "string"
        ? data.accessToken
        : typeof data.access_token === "string"
          ? data.access_token
          : typeof data.jwt === "string"
            ? data.jwt
            : nested && typeof nested.token === "string"
              ? nested.token
              : nested && typeof nested.accessToken === "string"
                ? nested.accessToken
                : nested && typeof nested.access_token === "string"
                  ? nested.access_token
                  : undefined;

  const user = normalizeUser(payload);
  if (!token || !user) return null;

  return { token, user };
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  const token = getStoredToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (
    init.body &&
    !headers.has("Content-Type") &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  // CSRF defence: custom header that cross-origin requests cannot set
  headers.set("X-Requested-With", "XMLHttpRequest");

  const url = input.startsWith("http")
    ? input
    : `${API_BASE_URL}${input.startsWith("/") ? input : `/${input}`}`;
  return fetch(url, {
    ...init,
    headers,
  });
}

export async function apiUpload<T>(
  input: string,
  formData: FormData,
  init: RequestInit = {},
): Promise<T> {
  const response = await apiFetch(input, {
    ...init,
    method: "POST",
    body: formData,
  });
  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as T) : ({} as T);
  if (!response.ok) {
    const message =
      typeof parsed === "object" &&
      parsed &&
      "message" in parsed &&
      typeof (parsed as Record<string, unknown>).message === "string"
        ? ((parsed as Record<string, unknown>).message as string)
        : `Upload failed with status ${response.status}`;
    throw new Error(message);
  }
  return parsed;
}

export async function apiJson<T>(
  input: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await apiFetch(input, init);
  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as T) : ({} as T);

  if (!response.ok) {
    const message =
      typeof parsed === "object" &&
      parsed &&
      "message" in parsed &&
      typeof (parsed as Record<string, unknown>).message === "string"
        ? ((parsed as Record<string, unknown>).message as string)
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return parsed;
}
