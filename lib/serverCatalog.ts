function readApiBaseEnv(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.INTERNAL_API_BASE_URL ??
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL
  )?.trim();
}

function normalizeApiBase(base: string | undefined): string {
  const trimmed = base?.replace(/\/$/, "");
  if (!trimmed) return "";
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

function resolveBackendApiBase(): string {
  const configured = normalizeApiBase(readApiBaseEnv());
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    return "https://panda-studio.onrender.com/api";
  }

  return "http://localhost:5000/api";
}

export async function proxyCatalogGet(path: string) {
  const base = resolveBackendApiBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  return { ok: response.ok, status: response.status, payload };
}
