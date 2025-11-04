export async function fetchWithTimeout(
  resource: RequestInfo | URL,
  options: (RequestInit & { timeout?: number }) = {}
) {
  const { timeout = 5000, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(resource, { ...rest, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}