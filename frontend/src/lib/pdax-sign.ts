import { createHmac } from "node:crypto";

/**
 * Returns the PDAX request signature as a base64 HMAC-SHA256 digest.
 *
 * Canonical string format:
 *   `${timestamp}${method.toUpperCase()}${path}${body}`
 *
 * `path` must include the leading slash and query string when present. `body`
 * must be the exact request body string, or an empty string for requests
 * without a body.
 *
 * TODO(verify-staging): verify this canonical format against official PDAX
 * staging keys before enabling live exchange operations.
 */
export function signRequest(
  secret: string,
  method: string,
  path: string,
  body: string,
  timestamp: string,
): string {
  const canonical = `${timestamp}${method.toUpperCase()}${path}${body}`;
  return createHmac("sha256", secret).update(canonical).digest("base64");
}
