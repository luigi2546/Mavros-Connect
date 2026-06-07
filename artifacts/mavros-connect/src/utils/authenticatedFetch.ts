/**
 * Authenticated fetch utility that automatically includes JWT token
 * Stores token in localStorage under 'mavros_access_token'
 */

export async function authenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const token = localStorage.getItem("mavros_access_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.headers) {
    if (typeof options.headers === "object" && !Array.isArray(options.headers)) {
      Object.assign(headers, options.headers);
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
