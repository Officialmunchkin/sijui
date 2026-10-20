// FAM VAULT — client-side cryptography for SECRET ALBUMS.
//
// The server never sees a password, a key, or a plaintext byte. Everything
// in this file happens in the browser, and the key object never leaves it.
//
//   password + salt --PBKDF2(100k, SHA-256)--> AES-GCM-256 key
//   file bytes      --AES-GCM(key, random 12-byte IV)--> ciphertext -> R2
//   file NAME       --AES-GCM(key, its OWN random IV)--> stored as iv2||ct2
//
// Why a second IV for the file name: AES-GCM must never encrypt two
// different messages with the same (key, IV) pair — doing so leaks the
// authentication key and lets an attacker forge tags. The name and the blob
// are two different messages, so each gets its own IV. For the name, the IV
// is stored alongside the ciphertext as iv2||ct2 in one base64 string.
//
// Why AES-GCM rather than CBC: GCM is authenticated. A wrong password does
// not produce garbled output — the auth tag check simply fails and
// crypto.subtle.decrypt throws. That is what makes a password VERIFIER
// unnecessary: the album's own contents answer "is this the right
// password?", and they do it without leaving anything in the database that
// an attacker could brute-force offline.
//
// The key is held in a module-level variable and is never written to
// localStorage, sessionStorage, a cookie, or IndexedDB. Closing the tab or
// logging out forgets it, which is why reopening an album asks for the
// password again.

const PBKDF2_ITERATIONS = 100000
const IV_BYTES = 12
const SALT_BYTES = 16

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/* ------------------------------------------------------------ BASE64 */
// Small values only (salt, IV, encrypted names). Large blobs stay as
// ArrayBuffers — base64-ing a 200MB video would triple it in memory.

export function bytesToB64(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

export function b64ToBytes(str) {
  const s = atob(str)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

/* ------------------------------------------------------------- RANDOM */

/** 16 random bytes, base64. Generated HERE so the browser is the only
 *  source of truth for the salt it will later need to re-derive the key. */
export function randomSaltB64() {
  return bytesToB64(crypto.getRandomValues(new Uint8Array(SALT_BYTES)))
}

/** Fresh 12-byte IV. Never reuse one with the same key. */
export function randomIv() {
  return crypto.getRandomValues(new Uint8Array(IV_BYTES))
}

/* --------------------------------------------------------------- KEY */

/**
 * PBKDF2-SHA256 (100k) -> AES-GCM-256.
 *
 * The result is marked NOT extractable, so even code running with full XSS
 * in this page cannot call crypto.subtle.exportKey() and read the raw bytes
 * out of the browser — it can only ask the key to encrypt or decrypt.
 */
export async function deriveKey(password, saltB64) {
  const base = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64ToBytes(saltB64), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/* ----------------------------------------------------- ENCRYPT/DECRYPT */

export async function encryptBytes(key, iv, data) {
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
}

export async function decryptBytes(key, iv, data) {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
}

/**
 * Encrypt a file name into one base64(iv2 || ciphertext) string.
 * The IV travels with the ciphertext — see the note at the top.
 */
export async function encryptFileName(key, name) {
  const iv = randomIv()
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(name))
  const joined = new Uint8Array(iv.length + ct.byteLength)
  joined.set(iv, 0)
  joined.set(new Uint8Array(ct), iv.length)
  return bytesToB64(joined)
}

/**
 * Decrypt a file name. Throws on a wrong key (the GCM auth tag fails) so
 * callers can tell "wrong password" apart from "this album has no names".
 */
export async function decryptFileName(key, value) {
  if (!value) return ''
  const all = b64ToBytes(value)
  const pt = await decryptBytes(key, all.slice(0, IV_BYTES), all.slice(IV_BYTES))
  return decoder.decode(pt)
}

/* ------------------------------------------------- IN-MEMORY KEY STORE */

// Deliberately a plain module variable. There is no persistence call in this
// block and there must not be one: the whole point is that the key dies with
// the tab.
let heldKey = null
let heldAlbumId = null

export function setSecretKey(albumId, key) {
  heldAlbumId = albumId
  heldKey = key
}

/** Returns the key only for the album it belongs to. */
export function getSecretKey(albumId) {
  return heldAlbumId === albumId ? heldKey : null
}

export function clearSecretKey() {
  heldAlbumId = null
  heldKey = null
}
