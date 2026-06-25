import { createCipheriv } from 'crypto';
import { generateIV } from './iv';
import { zeroize } from './zeroize';

const ALGORITHM = 'aes-256-gcm';

export interface EncryptResult {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

/**
 * Encrypts plaintext using AES-256-GCM with the provided runtime key.
 * The key is expected to be zeroed by the caller after this function returns.
 */
export function encrypt(plaintext: Buffer, runtimeKey: Buffer): EncryptResult {
  const iv = generateIV();
  const cipher = createCipheriv(ALGORITHM, runtimeKey, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return { ciphertext, iv, authTag };
}
