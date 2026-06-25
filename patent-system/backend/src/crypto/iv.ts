import { randomBytes } from 'crypto';

const IV_LENGTH = 12; // 96-bit IV for AES-256-GCM

export function generateIV(): Buffer {
  return randomBytes(IV_LENGTH);
}
