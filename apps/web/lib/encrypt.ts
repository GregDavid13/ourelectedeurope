// Re-export only. Canonical implementation lives in @gregdavid13/crypto
// (#12 — security code is a versioned package; the old framework
// duplicated this file's body in packages/crypto AND here). Do not
// reintroduce a local copy. Known AAD/rotation gap is documented at
// packages/crypto/src/aes.ts and SCAFFOLD-NOTES.md.
export { encrypt, decrypt } from '@gregdavid13/crypto'
