/**
 * Structured logger — never outputs keys, plaintext, ciphertext, IV,
 * auth tags, or shard values.
 */
export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    const entry = { level: 'INFO', time: new Date().toISOString(), msg, ...sanitize(meta) };
    console.log(JSON.stringify(entry));
  },
  error: (msg: string, meta?: Record<string, unknown>) => {
    const entry = { level: 'ERROR', time: new Date().toISOString(), msg, ...sanitize(meta) };
    console.error(JSON.stringify(entry));
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    const entry = { level: 'WARN', time: new Date().toISOString(), msg, ...sanitize(meta) };
    console.warn(JSON.stringify(entry));
  }
};

const FORBIDDEN_KEYS = new Set([
  'key', 'masterKey', 'derivedKey', 'seed', 'secret', 'password',
  'shard', 'plaintext', 'ciphertext', 'iv', 'authTag', 'nonce'
]);

function sanitize(meta?: Record<string, unknown>): Record<string, unknown> {
  if (!meta) return {};
  return Object.fromEntries(
    Object.entries(meta).filter(([k]) => !FORBIDDEN_KEYS.has(k.toLowerCase()))
  );
}
