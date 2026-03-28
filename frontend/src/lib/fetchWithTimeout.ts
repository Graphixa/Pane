/** Abort the request if the server does not respond in time (avoids infinite hang when API/proxy is down). */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const id = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } catch (e) {
    const name = e instanceof Error ? e.name : ''
    if (name === 'AbortError') {
      throw new Error(
        `Request timed out after ${timeoutMs}ms. If you use the Vite dev server, start the API on port 8080 (e.g. cd backend && go run ./cmd/pane).`,
      )
    }
    throw e
  } finally {
    window.clearTimeout(id)
  }
}
