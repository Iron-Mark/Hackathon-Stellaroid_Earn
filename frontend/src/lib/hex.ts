// Dependency-free hex helpers, safe in both server and client bundles.

/** Encode raw bytes as lowercase hex. */
export function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

/** True when the value is a 64-char hex string (a 32-byte hash). */
export function isHex64(value: string): boolean {
  return /^[0-9a-f]{64}$/i.test(value.trim());
}
