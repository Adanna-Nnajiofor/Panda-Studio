function resolveBackendApiBase(): string {
  const base = (
    process.env.INTERNAL_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:5000/api"
  ).replace(/\/$/, "");

  return base.endsWith("/api") ? base : `${base}/api`;
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
