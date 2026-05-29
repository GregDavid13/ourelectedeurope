// Password hashing — Argon2id. STUB: wire to a real argon2 binding
// (e.g. `@node-rs/argon2`) in implementation. Supabase Auth hashes
// passwords itself; this is only for app-managed secrets (e.g. API
// keys) that you store yourself.
export async function hashSecret(_plaintext: string): Promise<string> {
  throw new Error('TODO: implement Argon2id hashing — see Master Framework Part 5')
}
export async function verifySecret(_plaintext: string, _hash: string): Promise<boolean> {
  throw new Error('TODO: implement Argon2id verify')
}
