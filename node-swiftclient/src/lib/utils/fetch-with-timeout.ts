/**
 * Fetch with a timeout using native fetch and AbortController
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds (default: 15000ms)
 * @returns A Promise that resolves with the Response or rejects on timeout/error
 */
export async function fetchWithTimeout(
  url: string | RequestInfo,
  options: RequestInit = {},
  timeout = 15000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error(
        `Request to ${
          typeof url === 'string' ? url : url.url
        } timed out after ${timeout} ms`
      );
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}
