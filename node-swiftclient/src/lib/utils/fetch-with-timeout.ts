/**
 * Fetch with a timeout using native fetch and AbortController, with retry support.
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds (default: 15000ms)
 * @param retries - Number of retry attempts (default: 3)
 * @returns A Promise that resolves with the Response or rejects on timeout/error
 */
export async function fetchWithTimeout(
  url: string | RequestInfo,
  options: RequestInit = {},
  timeout = 30000,
  retries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);

      const isLastAttempt = attempt === retries;
      const isAbortError = (error as Error).name === 'AbortError';

      if (isLastAttempt) {
        if (isAbortError) {
          throw new Error(
            `Request to ${
              typeof url === 'string' ? url : url.url
            } timed out after ${timeout} ms (after ${retries + 1} attempts)`
          );
        }
        throw error;
      }

      // Optionally wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Should never reach here
  throw new Error('Unexpected error in fetchWithTimeout');
}
