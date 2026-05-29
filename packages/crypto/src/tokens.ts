// Cryptographically secure random tokens (invites, API keys, etc.).
export function randomToken(bytes = 32): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes))
  return Buffer.from(buf).toString('base64url')
}
