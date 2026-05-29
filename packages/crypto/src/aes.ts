// AES-256-GCM field-level encryption. CANONICAL location (#12:
// security code is a versioned package). apps/web/lib/encrypt.ts
// re-exports this — do not reintroduce a local copy.
//
// Stored format: {iv_hex}:{ciphertext_hex}
// Swap getKey() for AWS KMS when scaling to enterprise.
//
// Uses Uint8Array (not Node Buffer) at the Web Crypto boundary:
// Buffer<ArrayBufferLike> is not a valid BufferSource under strict
// lib types, and it keeps this runnable on edge runtimes too.
//
// ⚠️ KNOWN GAP (see SCAFFOLD-NOTES.md / review finding, NOT yet fixed):
//   - No AAD: ciphertext is not bound to its column/row context.
//   - No key id / rotation: a single static ENCRYPTION_KEY.
//   Fix before storing real encrypted PII. Tracked as a follow-up.

const ALGORITHM = 'AES-GCM'
const IV_LENGTH  = 12 // bytes (GCM standard)

// Return type pinned to Uint8Array<ArrayBuffer> (not the default
// ArrayBufferLike): TS 5.7+ made Uint8Array generic and Web Crypto's
// BufferSource requires an ArrayBuffer-backed view, not a possibly
// SharedArrayBuffer-backed one.
function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  if (hex.length === 0 || hex.length % 2 !== 0) {
    throw new Error('invalid hex string')
  }
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function bytesToHex(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += b.toString(16).padStart(2, '0')
  return s
}

async function getKey(): Promise<CryptoKey> {
  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex) throw new Error('ENCRYPTION_KEY is not set')
  return crypto.subtle.importKey(
    'raw', hexToBytes(keyHex), { name: ALGORITHM }, false, ['encrypt', 'decrypt']
  )
}

export async function encrypt(plaintext: string): Promise<string> {
  const key    = await getKey()
  const iv     = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const data   = new Uint8Array(new TextEncoder().encode(plaintext))
  const cipher = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, data)
  return `${bytesToHex(iv)}:${bytesToHex(new Uint8Array(cipher))}`
}

export async function decrypt(stored: string): Promise<string> {
  const parts = stored.split(':')
  if (parts.length !== 2) throw new Error('invalid ciphertext format')
  const [ivHex, cipherHex] = parts as [string, string]
  const key   = await getKey()
  const plain = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: hexToBytes(ivHex) },
    key,
    hexToBytes(cipherHex)
  )
  return new TextDecoder().decode(plain)
}
