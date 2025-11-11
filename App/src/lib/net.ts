export async function fetchWithTimeout(
  resource: RequestInfo | URL,
  options: RequestInit & { timeout?: number } = {},
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

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      ...init,
    });
    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const text = await response.text();
        if (text) {
          try {
            const json = JSON.parse(text);
            message = json?.error || json?.message || text || message;
          } catch {
            message = text || message;
          }
        }
      } catch (error) {
        console.error('Error parsing response:', error);
      }
      throw new Error(message);
    }

    if (response.status === 204) return undefined as unknown as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }
