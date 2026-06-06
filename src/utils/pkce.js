/**
 * Generates a random string to be used as a code verifier for PKCE.
 * 
 * @returns {string} The code verifier.
 */
export const generateCodeVerifier = () => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = window.crypto.getRandomValues(new Uint8Array(64));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

/**
 * SHA-256 hashes a string.
 * 
 * @param {string} plain 
 * @returns {Promise<ArrayBuffer>} The hashed bytes.
 */
const sha256 = (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

/**
 * Base64url encodes an array buffer.
 * 
 * @param {ArrayBuffer} buffer 
 * @returns {string} The base64url encoded string.
 */
const base64urlencode = (buffer) => {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Generates the PKCE code challenge from a verifier.
 * 
 * @param {string} verifier 
 * @returns {Promise<string>} The code challenge.
 */
export const generateCodeChallenge = async (verifier) => {
  const hashed = await sha256(verifier);
  return base64urlencode(hashed);
};
