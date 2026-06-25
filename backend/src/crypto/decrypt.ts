import { createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Decrypts ciphertext using AES-256-GCM.
 * Throws if the authentication tag is invalid (tampered ciphertext).
 * The key is expected to be zeroed by the caller after this function returns.
 */
export function decrypt(
  ciphertext: Buffer,
  iv: Buffer,
  authTag: Buffer,
  runtimeKey: Buffer
): Buffer {
  const decipher = createDecipheriv(ALGORITHM, runtimeKey, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);

  return plaintext;
}
