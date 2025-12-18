/**
 * Validates and retrieves the DigiUsher authentication token from environment variables.
 * @throws {Error} If DIGIUSHER_TOKEN environment variable is not set
 * @returns {string} The bearer token
 */
export function getAuthToken(): string {
  if (!process.env.DIGIUSHER_TOKEN) {
    throw new Error("DIGIUSHER_TOKEN environment variable is required.");
  }
  return process.env.DIGIUSHER_TOKEN;
}

/**
 * Creates authentication headers for DigiUsher API requests.
 * @param includeContentType - Whether to include Content-Type: application/json header
 * @returns {Record<string, string>} Headers object with Authorization and optionally Content-Type
 */
export function getAuthHeaders(includeContentType: boolean = false): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`
  };

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}
