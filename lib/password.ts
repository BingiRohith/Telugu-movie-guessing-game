export type PasswordRecord = { algorithm: 'PBKDF2-SHA256'; iterations: number; salt: string; digest: string };
const ITERATIONS = 600000;
function hex(bytes: ArrayBuffer | Uint8Array) { return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join(''); }

async function derive(password: string, salt: string, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bytes = Uint8Array.from(salt.match(/../g)!, part => parseInt(part, 16));
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: bytes, iterations }, key, 256));
}
export function validPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 10 && password.length <= 128 && new TextEncoder().encode(password).length <= 512;
}
export async function hashPassword(password: string): Promise<PasswordRecord> {
  const salt = hex(crypto.getRandomValues(new Uint8Array(32)));
  return { algorithm: 'PBKDF2-SHA256', iterations: ITERATIONS, salt, digest: await derive(password, salt, ITERATIONS) };
}
export async function verifyPassword(password: string, record: PasswordRecord) {
  const digest = await derive(password, record.salt, record.iterations);
  let difference = digest.length ^ record.digest.length;
  for (let index = 0; index < 64; index++) difference |= digest.charCodeAt(index) ^ record.digest.charCodeAt(index);
  return difference === 0;
}
// Unknown usernames perform the same KDF work as a real login.
export async function dummyPasswordCheck(password: string) {
  await verifyPassword(password, { algorithm: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: '00'.repeat(32), digest: '00'.repeat(32) });
}
